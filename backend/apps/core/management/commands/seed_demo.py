"""
Carga los datos de demostración (D-42).

Uso:  python manage.py seed_demo            (solo si la base está vacía)
      python manage.py seed_demo --reset    (borra los datos de NexoLab y los vuelve a cargar)

Carga los catálogos, los 3 usuarios del prototipo y el Bloque H de ejemplo (_demo_history.py): 10 laboratorios,
sus equipos y un historial de incidencias de mayo a octubre de 2026. Después calcula el riesgo: la carga inicial
con el dataset de Kaggle y un cálculo al cierre de cada mes, hasta el riesgo vigente de hoy.
La contraseña de los usuarios se lee de DEMO_PASSWORD (backend/.env); nunca está en el código.
"""

from datetime import datetime

import environ
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction
from django.db.models import F
from django.db.models.functions import Coalesce
from django.utils.dateparse import parse_datetime

from apps.incidents.models import Component, Incident, IncidentStatus, ResolutionAction
from apps.infrastructure.models import Device, DeviceStatus, DeviceType, Laboratory
from apps.risk.models import DeviceRiskResult, KmeansCentroid, KmeansRun, RiskLevel
from apps.risk.management.commands.recalculate_risk import describe_run
from apps.risk.services import RiskCalculationError, calculate_risk
from apps.users.models import Role, User

from ._demo_history import LABORATORIES, TZ, build_history, build_inventory

ROLES = [(1, 'TECHNICIAN', 'Técnico de soporte'), (2, 'ADMIN', 'Administrador')]

# Tipos con los códigos del Figma 5.9, más AC y DOC (D-42). Los seleccionados son los que usa el Bloque H.
DEVICE_TYPES = [
    ('PC', 'PC de escritorio', True), ('MON', 'Monitor', False), ('AIO', 'Todo en uno', True),
    ('UPS', 'UPS', True), ('TV', 'Televisor', True), ('LAP', 'Laptop', False),
    ('PRY', 'Proyector', False), ('IMP', 'Impresora', False), ('IMF', 'Impresora multifunción', False),
    ('ESC', 'Escáner', False), ('SWT', 'Switch', False), ('RTR', 'Router', False),
    ('APW', 'Punto de acceso inalámbrico', False), ('SRV', 'Servidor', False), ('TAB', 'Tablet', False),
    ('PZD', 'Pizarra digital', False), ('CAM', 'Cámara web', False), ('PAR', 'Parlantes', False),
    ('MIC', 'Micrófono', False), ('DDE', 'Disco duro externo', False),
    ('NAS', 'Almacenamiento en red (NAS)', False), ('FWL', 'Firewall', False), ('TIP', 'Teléfono IP', False),
    ('PLT', 'Plotter', False), ('LCB', 'Lector de código de barras', False), ('KIO', 'Kiosco interactivo', False),
    ('RCK', 'Rack de comunicaciones', False), ('CIP', 'Cámara IP', False),
    ('VDC', 'Equipo de videoconferencia', False), ('CAU', 'Consola de audio', False),
    ('CDO', 'Cámara de documentos', False), ('LBI', 'Lector biométrico', False),
    ('AC', 'Aire acondicionado', True), ('DOC', 'PC docente', True),
]

DEVICE_STATUSES = [(1, 'ACTIVE', 'Activo', True), (2, 'RETIRED', 'Retirado', False)]

# D-24: Software, Red / Internet y Otro, además de las piezas físicas.
COMPONENTS = [
    (1, 'PC', 'PC'), (2, 'MONITOR', 'Monitor'), (3, 'KEYBOARD', 'Teclado'), (4, 'MOUSE', 'Mouse'),
    (5, 'UPS', 'UPS'), (6, 'SOFTWARE', 'Software'), (7, 'NETWORK', 'Red / Internet'), (8, 'OTHER', 'Otro'),
]

INCIDENT_STATUSES = [(1, 'OPEN', 'Abierta', False), (2, 'CLOSED', 'Cerrada', True)]

RESOLUTION_ACTIONS = [
    (1, 'RESOLVED', 'Resuelto', False),
    (2, 'REPLACEMENT_REQUIRED', 'Requiere reemplazo', True),
    (3, 'REFERRED', 'Derivado', False),
]

RISK_LEVELS = [
    (1, 'HIGH', 'Riesgo alto', 'Revisar hoy', '#EF4444'),
    (2, 'MEDIUM', 'Riesgo medio', 'Programar revisión esta semana', '#F59E0B'),
    (3, 'LOW', 'Riesgo bajo', 'Monitoreo normal', '#10B981'),
]

# (id, rol, nombres, apellidos, correo, activo, último acceso)
USERS = [
    (1, 2, 'Andrea', 'Villacís', 'andrea.villacis@gmail.com', True, '2026-11-04T08:12:00-05:00'),
    (2, 1, 'Carlos', 'Mendoza', 'carlos.mendoza@gmail.com', True, '2026-11-04T07:58:00-05:00'),
    (3, 1, 'Luis', 'Bravo', 'luis.bravo@gmail.com', False, '2026-08-02T16:40:00-05:00'),
]
RESPONSIBLE_TECHNICIAN_ID = 2  # Carlos Mendoza

# Fecha en que se registró el inventario en el sistema, antes del historial de incidencias.
INVENTORY_DATE = datetime(2026, 4, 1, 8, 0, tzinfo=TZ)
# Ejecuciones del modelo: la carga inicial antes de las incidencias y un cálculo al cierre de cada mes,
# para que el historial de cada equipo muestre su evolución (D-42).
INITIAL_LOAD_AT = datetime(2026, 5, 1, 7, 0, tzinfo=TZ)
MONTHLY_RUNS = [datetime(2026, month, day, 19, 0, tzinfo=TZ)
                for month, day in ((5, 31), (6, 30), (7, 31), (8, 31), (9, 30), (10, 31))]


class Command(BaseCommand):
    help = 'Carga los datos de demostración de NexoLab (catálogos, usuarios, laboratorios, equipos e incidencias).'

    def add_arguments(self, parser):
        parser.add_argument('--reset', action='store_true', help='Borra los datos de NexoLab antes de cargar.')

    def handle(self, *args, **options):
        password = environ.Env().str('DEMO_PASSWORD', default='')
        if not password:
            raise CommandError('Define DEMO_PASSWORD en backend/.env antes de cargar los datos de demostración.')

        if Role.objects.exists() and not options['reset']:
            raise CommandError('La base ya tiene datos. Usa --reset para borrarlos y volver a cargarlos.')

        with transaction.atomic():
            if options['reset']:
                self._reset()
            self._seed(password)
            self._reset_sequences()

        self.stdout.write(self.style.SUCCESS(
            f'Datos cargados: {User.objects.count()} usuarios, {Laboratory.objects.count()} laboratorios, '
            f'{Device.objects.count()} equipos ({Device.objects.filter(retired_at__isnull=True).count()} activos), '
            f'{Incident.objects.count()} incidencias ({Incident.objects.filter(closed_at__isnull=True).count()} abiertas).'
        ))

        # Fuera de la transacción: si el cálculo falla, los datos quedan cargados y se puede repetir
        # con "python manage.py recalculate_risk --initial" y luego "python manage.py recalculate_risk".
        try:
            run = self._calculate_risk()
        except RiskCalculationError as error:
            self.stderr.write(self.style.WARNING(f'No se pudo calcular el riesgo: {error}'))
        else:
            self.stdout.write(self.style.SUCCESS(describe_run(run)))

    def _reset(self):
        # De las tablas hijas a las padres, por las llaves foráneas.
        for model in (DeviceRiskResult, KmeansCentroid, KmeansRun, Incident, Device, Laboratory, User,
                      Role, DeviceType, DeviceStatus, Component, IncidentStatus, ResolutionAction, RiskLevel):
            model.objects.all().delete()

    def _seed(self, password):
        Role.objects.bulk_create([Role(id=i, code=c, name=n) for i, c, n in ROLES])
        DeviceType.objects.bulk_create([
            DeviceType(id=i, code=c, name=n, is_selected=s) for i, (c, n, s) in enumerate(DEVICE_TYPES, start=1)
        ])
        DeviceStatus.objects.bulk_create([
            DeviceStatus(id=i, code=c, name=n, is_included_in_kmeans=k) for i, c, n, k in DEVICE_STATUSES
        ])
        Component.objects.bulk_create([Component(id=i, code=c, name=n) for i, c, n in COMPONENTS])
        IncidentStatus.objects.bulk_create([
            IncidentStatus(id=i, code=c, name=n, is_final=f) for i, c, n, f in INCIDENT_STATUSES
        ])
        ResolutionAction.objects.bulk_create([
            ResolutionAction(id=i, code=c, name=n, is_retirement_action=r) for i, c, n, r in RESOLUTION_ACTIONS
        ])
        RiskLevel.objects.bulk_create([
            RiskLevel(id=i, code=c, name=n, recommended_action=a, color_hex=h) for i, c, n, a, h in RISK_LEVELS
        ])

        for user_id, role_id, first, last, email, active, last_login in USERS:
            user = User(id=user_id, role_id=role_id, first_name=first, last_name=last, email=email,
                        is_active=active, last_login=parse_datetime(last_login))
            user.set_password(password)  # se guarda solo el hash (password_hash)
            user.save()

        Laboratory.objects.bulk_create([
            Laboratory(id=i, code=code, name=name, location=location, station_count=pcs,
                       responsible_technician_id=RESPONSIBLE_TECHNICIAN_ID)
            for i, (code, name, location, _kind, pcs, _ac, _tv) in enumerate(LABORATORIES, start=1)
        ])

        lab_ids = dict(Laboratory.objects.values_list('code', 'id'))
        type_ids = dict(DeviceType.objects.values_list('code', 'id'))
        inventory = build_inventory()
        Device.objects.bulk_create([
            Device(
                id=index,
                code=device.code,
                laboratory_id=lab_ids[device.laboratory],
                device_type_id=type_ids[device.type_code],
                device_status_id=2 if device.retired_at else 1,
                physical_location=device.location,
                specifications=device.specifications,
                retired_at=device.retired_at,
            )
            for index, device in enumerate(inventory, start=1)
        ])
        # El inventario se registró antes del historial de incidencias.
        Laboratory.objects.update(created_at=INVENTORY_DATE, updated_at=INVENTORY_DATE)
        Device.objects.update(created_at=INVENTORY_DATE, updated_at=Coalesce(F('retired_at'), INVENTORY_DATE))
        self._seed_incidents(inventory)

    def _seed_incidents(self, inventory):
        device_ids = dict(Device.objects.values_list('code', 'id'))
        component_ids = dict(Component.objects.values_list('code', 'id'))
        action_ids = dict(ResolutionAction.objects.values_list('code', 'id'))
        # Numeradas por fecha de la falla: INC-2026-0001 es la más antigua (RN-14).
        Incident.objects.bulk_create([
            Incident(
                id=number,
                incident_number=f'INC-2026-{number:04d}',
                device_id=device_ids[incident.device],
                component_id=component_ids[incident.component],
                incident_status_id=2 if closing else 1,
                resolution_action_id=action_ids[closing['action']] if closing else None,
                reported_by_id=incident.reported_by,
                closed_by_id=closing['closed_by'] if closing else None,
                priority=incident.priority,
                description=incident.description,
                diagnosis=closing['diagnosis'] if closing else None,
                opened_at=incident.opened_at,
                closed_at=closing['closed_at'] if closing else None,
                resolution_time_minutes=closing['minutes'] if closing else None,
            )
            for number, incident in enumerate(build_history(inventory), start=1)
            for closing in [incident.closing]
        ])
        # Las fechas de control siguen a las de la incidencia, no a la hora en que se cargó.
        Incident.objects.update(created_at=F('opened_at'), updated_at=Coalesce(F('closed_at'), F('opened_at')))

    def _calculate_risk(self):
        """Carga inicial (Kaggle), un cálculo al cierre de cada mes y el cálculo de hoy (riesgo vigente)."""
        runs = [(KmeansRun.TriggerType.INITIAL_LOAD, INITIAL_LOAD_AT)]
        runs += [(KmeansRun.TriggerType.MANUAL, moment) for moment in MONTHLY_RUNS]
        runs.append((KmeansRun.TriggerType.MANUAL, None))
        for trigger, moment in runs:
            run = calculate_risk(trigger, as_of=moment)
        return run

    def _reset_sequences(self):
        # Los ids se dieron a mano: la secuencia de cada tabla debe continuar desde el mayor.
        models = [Role, DeviceType, DeviceStatus, Component, IncidentStatus, ResolutionAction, RiskLevel,
                  User, Laboratory, Device, Incident]
        with connection.cursor() as cursor:
            for sql in connection.ops.sequence_reset_sql(self.style, models):
                cursor.execute(sql)
