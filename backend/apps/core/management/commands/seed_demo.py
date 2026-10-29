"""
Carga los datos de demostración (parte 3 de docs/PROMPT_FIGMA_MAKE_NEXOLAB.md).

Uso:  python manage.py seed_demo            (solo si la base está vacía)
      python manage.py seed_demo --reset    (borra los datos de NexoLab y los vuelve a cargar)

Carga catálogos, usuarios, laboratorios, equipos e incidencias con los mismos ids que usa el
frontend en src/mocks/, para que las pantallas que aún no se conectan a la API sigan coincidiendo.
Al final ejecuta la carga inicial del modelo K-Means (INITIAL_LOAD con el dataset de Kaggle), así el
riesgo de cada equipo sale de las incidencias guardadas.
La contraseña de los usuarios se lee de DEMO_PASSWORD (backend/.env); nunca está en el código.
"""

import environ
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction
from django.db.models import F
from django.db.models.functions import Coalesce
from django.utils.dateparse import parse_datetime

from apps.incidents.models import Component, Incident, IncidentStatus, ResolutionAction
from apps.infrastructure.models import Device, DeviceStatus, DeviceType, Laboratory
from apps.risk.models import DeviceRiskResult, KmeansCentroid, KmeansRun, RiskLevel
from apps.risk.services import RiskCalculationError, calculate_risk
from apps.users.models import Role, User

from ._demo_incidents import INCIDENTS

ROLES = [(1, 'TECHNICIAN', 'Técnico de soporte'), (2, 'ADMIN', 'Administrador')]

# 32 tipos con los códigos del Figma 5.9; solo los 5 del Bloque H están seleccionados (D-22).
DEVICE_TYPES = [
    ('PC', 'PC de escritorio', True), ('MON', 'Monitor', True), ('AIO', 'Todo en uno', True),
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
    (1, 2, 'Andrea', 'Villacís', 'andrea.villacis@gmail.com', True, '2026-10-17T08:12:00-05:00'),
    (2, 1, 'Carlos', 'Mendoza', 'carlos.mendoza@gmail.com', True, '2026-10-17T07:58:00-05:00'),
    (3, 1, 'Luis', 'Bravo', 'luis.bravo@gmail.com', False, '2026-08-02T16:40:00-05:00'),
]

# (id, código, nombre, ubicación, puestos, composición de equipos activos por tipo)
LABORATORIES = [
    (1, 'H101', 'Laboratorio 1', 'Bloque H, planta baja', 10, {'PC': 10, 'MON': 10, 'UPS': 8}),
    (2, 'H102', 'Laboratorio 2', 'Bloque H, planta baja', 10, {'PC': 10, 'MON': 10, 'UPS': 10}),
    (3, 'H103', 'Laboratorio de Redes', 'Bloque H, planta alta', 12, {'PC': 12, 'MON': 12, 'UPS': 8}),
    (4, 'H104', 'Laboratorio 4', 'Bloque H, planta alta', 12, {'AIO': 12, 'UPS': 12, 'TV': 1}),
    (5, 'H105', 'Laboratorio 5', 'Bloque H, planta alta', 12, {'AIO': 12, 'UPS': 12, 'TV': 3}),
]
RESPONSIBLE_TECHNICIAN_ID = 2  # Carlos Mendoza

# Equipos retirados y su fecha de retiro. Ocupan un número dentro de su laboratorio y tipo.
RETIRED_DEVICES = {
    'H103-PC-09': '2026-10-12T09:15:00-05:00',
    'H101-MON-04': '2026-09-21T10:00:00-05:00',
    'H105-UPS-01': '2026-09-05T11:30:00-05:00',
}

SPECIFICATIONS_BY_TYPE = {
    'PC': 'Intel Core i5, 8 GB RAM',
    'MON': 'Monitor 24" Full HD',
    'AIO': 'Intel Core i5, 8 GB RAM, pantalla 23,8"',
    'UPS': '1000 VA',
    'TV': 'Smart TV de 55 pulgadas',
}
SPECIFICATIONS_BY_DEVICE = {'H103-PC-09': 'Intel Core i3, 4 GB RAM'}


def physical_location(type_code: str, number: int) -> str:
    """Cuatro puestos por fila: 1–4 en la fila 1, 5–8 en la 2, 9–12 en la 3."""
    if type_code == 'TV':
        return 'Pared frontal del aula'
    return f'Fila {(number + 3) // 4}, puesto {number}'


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
        # con "python manage.py recalculate_risk --initial".
        try:
            run = calculate_risk(KmeansRun.TriggerType.INITIAL_LOAD)
        except RiskCalculationError as error:
            self.stderr.write(self.style.WARNING(f'No se pudo calcular el riesgo: {error}'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Riesgo calculado (ejecución {run.id}).'))

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
            Laboratory(id=i, code=c, name=n, location=loc, station_count=s,
                       responsible_technician_id=RESPONSIBLE_TECHNICIAN_ID)
            for i, c, n, loc, s, _ in LABORATORIES
        ])

        type_ids = {t.code: t.id for t in DeviceType.objects.all()}
        devices = []
        for lab_id, lab_code, *_, composition in LABORATORIES:
            for type_code, active_count in composition.items():
                prefix = f'{lab_code}-{type_code}-'
                retired_count = sum(1 for code in RETIRED_DEVICES if code.startswith(prefix))
                for number in range(1, active_count + retired_count + 1):
                    code = f'{prefix}{number:02d}'
                    retired_at = RETIRED_DEVICES.get(code)
                    devices.append(Device(
                        id=len(devices) + 1,
                        code=code,
                        laboratory_id=lab_id,
                        device_type_id=type_ids[type_code],
                        device_status_id=2 if retired_at else 1,
                        physical_location=physical_location(type_code, number),
                        specifications=SPECIFICATIONS_BY_DEVICE.get(code, SPECIFICATIONS_BY_TYPE[type_code]),
                        retired_at=parse_datetime(retired_at) if retired_at else None,
                    ))
        Device.objects.bulk_create(devices)
        self._seed_incidents()

    def _seed_incidents(self):
        device_ids = dict(Device.objects.values_list('code', 'id'))
        component_ids = dict(Component.objects.values_list('code', 'id'))
        action_ids = dict(ResolutionAction.objects.values_list('code', 'id'))
        Incident.objects.bulk_create([
            Incident(
                id=data['id'],
                incident_number=f"INC-2026-{data['id']:04d}",
                device_id=device_ids[data['device']],
                component_id=component_ids[data['component']],
                incident_status_id=2 if closing else 1,
                resolution_action_id=action_ids[closing['action']] if closing else None,
                reported_by_id=data['reported_by'],
                closed_by_id=closing['closed_by'] if closing else None,
                priority=data['priority'],
                description=data['description'],
                diagnosis=closing['diagnosis'] if closing else None,
                opened_at=parse_datetime(data['opened_at']),
                closed_at=closing['closed_at'] if closing else None,
                resolution_time_minutes=closing['minutes'] if closing else None,
            )
            for data in INCIDENTS
            for closing in [data['closing']]
        ])
        # Las fechas de control siguen a las de la incidencia, no a la hora en que se cargó.
        Incident.objects.update(created_at=F('opened_at'), updated_at=Coalesce(F('closed_at'), F('opened_at')))

    def _reset_sequences(self):
        # Los ids se dieron a mano: la secuencia de cada tabla debe continuar desde el mayor.
        models = [Role, DeviceType, DeviceStatus, Component, IncidentStatus, ResolutionAction, RiskLevel,
                  User, Laboratory, Device, Incident]
        with connection.cursor() as cursor:
            for sql in connection.ops.sequence_reset_sql(self.style, models):
                cursor.execute(sql)
