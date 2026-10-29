"""Pruebas de incidencias (RN-13 a RN-22, D-24) y del catálogo de tipos (RN-07 a RN-09). Ejecutar: python manage.py test"""

from datetime import timedelta

from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.infrastructure.models import Device, DeviceStatus, DeviceType, Laboratory
from apps.risk.models import KmeansRun, RiskLevel
from apps.users.models import Role, User

from .models import Component, Incident, IncidentStatus, ResolutionAction


class IncidentTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        technician_role = Role.objects.create(code=Role.TECHNICIAN, name='Técnico')
        admin_role = Role.objects.create(code=Role.ADMIN, name='Administrador')
        cls.admin = User.objects.create_user('andrea@test.ec', 'x', first_name='Andrea', last_name='V',
                                             role=admin_role)
        cls.technician = User.objects.create_user('carlos@test.ec', 'x', first_name='Carlos', last_name='Mendoza',
                                                  role=technician_role)
        for code, name in (('HIGH', 'Alto'), ('MEDIUM', 'Medio'), ('LOW', 'Bajo')):
            RiskLevel.objects.create(code=code, name=name)
        cls.open = IncidentStatus.objects.create(code='OPEN', name='Abierta', is_final=False)
        IncidentStatus.objects.create(code='CLOSED', name='Cerrada', is_final=True)
        cls.resolved = ResolutionAction.objects.create(code='RESOLVED', name='Resuelto')
        cls.replace = ResolutionAction.objects.create(code='REPLACEMENT_REQUIRED', name='Requiere reemplazo',
                                                      is_retirement_action=True)
        cls.pc_component = Component.objects.create(code='PC', name='PC')
        cls.other = Component.objects.create(code='OTHER', name='Otro')

        active = DeviceStatus.objects.create(code='ACTIVE', name='Activo', is_included_in_kmeans=True)
        retired = DeviceStatus.objects.create(code='RETIRED', name='Retirado', is_included_in_kmeans=False)
        cls.pc = DeviceType.objects.create(code='PC', name='PC de escritorio', is_selected=True)
        cls.printer = DeviceType.objects.create(code='IMP', name='Impresora', is_selected=False)
        cls.lab = Laboratory.objects.create(code='H101', name='Lab 1', station_count=10)
        cls.closed_lab = Laboratory.objects.create(code='H102', name='Lab 2', station_count=10, is_active=False)
        cls.device = Device.objects.create(code='H101-PC-01', laboratory=cls.lab, device_type=cls.pc,
                                           device_status=active)
        cls.retired = Device.objects.create(code='H101-PC-02', laboratory=cls.lab, device_type=cls.pc,
                                            device_status=retired)
        cls.unselected = Device.objects.create(code='H101-IMP-01', laboratory=cls.lab, device_type=cls.printer,
                                               device_status=active)
        cls.in_closed_lab = Device.objects.create(code='H102-PC-01', laboratory=cls.closed_lab, device_type=cls.pc,
                                                  device_status=active)

    def setUp(self):
        self.client.force_authenticate(self.technician)

    def payload(self, **changes):
        data = {'device_id': self.device.id, 'component_id': self.pc_component.id, 'priority': 'HIGH',
                'opened_at': (timezone.now() - timedelta(hours=2)).isoformat(),
                'description': 'El equipo no enciende.'}
        return {**data, **changes}

    def register(self, **changes):
        return self.client.post(reverse('incident-list'), self.payload(**changes), format='json')

    def close(self, number, **changes):
        data = {'resolution_action_id': self.resolved.id, 'diagnosis': 'Cable de poder suelto; se reconectó.',
                'notes': '', 'closed_at': timezone.now().isoformat()}
        return self.client.post(reverse('incident-close', args=[number]), {**data, **changes}, format='json')


class RegisterTests(IncidentTestCase):
    def test_registra_con_numero_correlativo_y_usuario_de_la_sesion(self):
        year = timezone.localdate().year
        first = self.register(reported_by_id=self.admin.id)  # RN-15: se ignora
        second = self.register()
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(first.data['incident_number'], f'INC-{year}-0001')  # RN-14
        self.assertEqual(second.data['incident_number'], f'INC-{year}-0002')
        self.assertEqual(first.data['status'], 'OPEN')
        self.assertEqual(first.data['reported_by_name'], 'Carlos Mendoza')

    def test_rn13_solo_equipos_que_admiten_incidencias(self):
        for device in (self.retired, self.unselected, self.in_closed_lab):
            response = self.register(device_id=device.id)
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, device.code)
            self.assertIn('device_id', response.data)

    def test_rn16_descripcion_y_fecha(self):
        self.assertIn('description', self.register(description='Corta').data)
        self.assertIn('description', self.register(description='x' * 501).data)
        future = (timezone.now() + timedelta(hours=1)).isoformat()
        self.assertIn('opened_at', self.register(opened_at=future).data)

    def test_d24_otro_pide_20_caracteres(self):
        response = self.register(component_id=self.other.id, description='Falla del sistema.')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response = self.register(component_id=self.other.id, description='El sistema operativo no inicia.')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_equipos_elegibles_para_el_formulario(self):
        response = self.client.get(reverse('device-eligible'), {'laboratory_id': self.lab.id})
        self.assertEqual([d['code'] for d in response.data], ['H101-PC-01'])
        response = self.client.get(reverse('device-eligible'), {'code': 'h101-pc-02'})  # retirado
        self.assertEqual(response.data, [])


class ListTests(IncidentTestCase):
    def test_lista_con_filtros_contadores_y_anuladas_fuera(self):
        open_number = self.register().data['incident_number']
        closed_number = self.register(priority='LOW').data['incident_number']
        self.close(closed_number)
        voided = self.register().data['incident_number']
        self.client.force_authenticate(self.admin)
        self.client.post(reverse('incident-void', args=[voided]))  # RN-22

        data = self.client.get(reverse('incident-list')).data
        self.assertEqual(data['counts'], {'OPEN': 1, 'CLOSED': 1, 'ALL': 2})
        self.assertEqual(data['total'], 2)
        data = self.client.get(reverse('incident-list'), {'status': 'OPEN'}).data
        self.assertEqual([i['incident_number'] for i in data['items']], [open_number])
        data = self.client.get(reverse('incident-list'), {'priority': 'LOW'}).data
        self.assertEqual([i['incident_number'] for i in data['items']], [closed_number])
        today = timezone.localdate().isoformat()
        self.assertEqual(self.client.get(reverse('incident-list'), {'from': today, 'to': today}).data['total'], 2)
        self.assertEqual(self.client.get(reverse('incident-detail', args=[voided])).status_code,
                         status.HTTP_404_NOT_FOUND)

    def test_rn06_solo_el_administrador_anula(self):
        number = self.register().data['incident_number']
        self.assertEqual(self.client.post(reverse('incident-void', args=[number])).status_code,
                         status.HTTP_403_FORBIDDEN)


class CloseTests(IncidentTestCase):
    def test_cierra_calcula_el_tiempo_y_usa_el_usuario_de_la_sesion(self):
        opened = timezone.now() - timedelta(minutes=95)
        number = self.register(opened_at=opened.isoformat()).data['incident_number']
        response = self.close(number, closed_at=(opened + timedelta(minutes=90)).isoformat())
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'CLOSED')
        self.assertEqual(response.data['resolution_time_minutes'], 90)  # RN-18
        self.assertEqual(response.data['closed_by_name'], 'Carlos Mendoza')
        self.assertIsNone(response.data['retired_device_code'])

    def test_rn17_validaciones_del_cierre(self):
        opened = timezone.now() - timedelta(hours=1)
        number = self.register(opened_at=opened.isoformat()).data['incident_number']
        self.assertIn('diagnosis', self.close(number, diagnosis='Corto').data)
        before = (opened - timedelta(minutes=5)).isoformat()
        self.assertIn('closed_at', self.close(number, closed_at=before).data)
        future = (timezone.now() + timedelta(hours=1)).isoformat()
        self.assertIn('closed_at', self.close(number, closed_at=future).data)

    def test_rn21_una_cerrada_no_se_vuelve_a_cerrar(self):
        number = self.register().data['incident_number']
        self.close(number)
        response = self.close(number)
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data['code'], 'incident_closed')

    def test_rn19_requiere_reemplazo_retira_el_equipo(self):
        number = self.register().data['incident_number']
        closed_at = timezone.now() - timedelta(minutes=1)
        response = self.close(number, resolution_action_id=self.replace.id, closed_at=closed_at.isoformat())
        self.assertEqual(response.data['retired_device_code'], 'H101-PC-01')
        self.device.refresh_from_db()
        self.assertEqual(self.device.device_status.code, 'RETIRED')
        self.assertEqual(self.device.retired_at, closed_at)

    def test_cerrar_recalcula_el_riesgo_y_un_fallo_no_deshace_el_cierre(self):
        number = self.register().data['incident_number']
        with self.captureOnCommitCallbacks(execute=True):
            self.close(number)
        run = KmeansRun.objects.get()
        self.assertEqual(run.trigger_type, 'INCIDENT_CLOSED')
        # Sin modelo inicial ni historial suficiente, el cálculo falla, pero la incidencia queda cerrada.
        self.assertEqual(run.run_status, 'FAILED')
        self.assertEqual(Incident.objects.get(incident_number=number).incident_status.code, 'CLOSED')

    @override_settings(RISK_MIN_OWN_HISTORY_DEVICES=3)
    def test_cerrar_con_historial_suficiente_actualiza_el_riesgo(self):
        for index in range(2, 5):
            device = Device.objects.create(code=f'H101-PC-1{index}', laboratory=self.lab, device_type=self.pc,
                                           device_status=self.device.device_status)
            for days in (2 * index, 10 * index):
                Incident.objects.create(
                    incident_number=f'INC-2000-{index}{days:03d}', device=device, component=self.pc_component,
                    incident_status=self.open, reported_by=self.technician, priority='LOW',
                    description='Falla de prueba.', opened_at=timezone.now() - timedelta(days=days),
                )
        number = self.register().data['incident_number']
        with self.captureOnCommitCallbacks(execute=True):
            self.close(number)
        run = KmeansRun.objects.get()
        self.assertEqual((run.run_status, run.incident.incident_number), ('COMPLETED', number))


class CatalogTests(IncidentTestCase):
    def setUp(self):
        self.client.force_authenticate(self.admin)

    def test_catalogos_para_los_formularios(self):
        data = self.client.get(reverse('catalogs')).data
        self.assertEqual([c['code'] for c in data['components']], ['PC', 'OTHER'])
        self.assertEqual(len(data['resolution_actions']), 2)
        self.assertEqual([r['code'] for r in data['roles']], ['TECHNICIAN', 'ADMIN'])

    def test_lista_de_tipos_con_equipos_activos(self):
        types = {t['code']: t for t in self.client.get(reverse('device-type-list')).data}
        self.assertEqual(types['PC']['active_device_count'], 2)  # el retirado no cuenta

    def test_rn09_tipo_nuevo_sin_seleccionar_y_d37_codigo(self):
        response = self.client.post(reverse('device-type-list'), {'code': ' prj ', 'name': 'Proyector'},
                                    format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual((response.data['code'], response.data['is_selected']), ('PRJ', False))
        for code in ('pc', 'P1', 'PROYECTOR'):
            response = self.client.post(reverse('device-type-list'), {'code': code, 'name': 'X'}, format='json')
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, code)

    def test_rn07_al_menos_un_tipo_y_rn08_recalcula(self):
        url = reverse('device-type-selection')
        response = self.client.put(url, {'selected_ids': []}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response = self.client.put(url, {'selected_ids': [self.printer.id]}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.pc.refresh_from_db()
        self.printer.refresh_from_db()
        self.assertEqual((self.pc.is_selected, self.printer.is_selected), (False, True))
        self.assertEqual(KmeansRun.objects.get().trigger_type, 'CATALOG_CHANGE')
        self.assertIsNotNone(response.data['risk_error'])  # sin modelo inicial, la selección igual se guarda

    def test_rn06_tecnico_no_cambia_el_catalogo(self):
        self.client.force_authenticate(self.technician)
        self.assertEqual(self.client.put(reverse('device-type-selection'), {'selected_ids': [self.pc.id]},
                                         format='json').status_code, status.HTTP_403_FORBIDDEN)
