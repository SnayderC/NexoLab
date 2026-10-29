"""Pruebas de la API de laboratorios (Figma 5.0 a 5.3, RN-06 y RN-10). Ejecutar: python manage.py test"""

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.incidents.models import Component, Incident, IncidentStatus
from apps.users.models import Role, User

from .models import Device, DeviceStatus, DeviceType, Laboratory


class LaboratoryTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        technician_role = Role.objects.create(code=Role.TECHNICIAN, name='Técnico de soporte')
        admin_role = Role.objects.create(code=Role.ADMIN, name='Administrador')
        cls.admin = User.objects.create_user('andrea@test.ec', 'x', first_name='Andrea', last_name='Villacís',
                                             role=admin_role)
        cls.technician = User.objects.create_user('carlos@test.ec', 'x', first_name='Carlos', last_name='Mendoza',
                                                  role=technician_role)
        cls.inactive_technician = User.objects.create_user('luis@test.ec', 'x', first_name='Luis', last_name='Bravo',
                                                           role=technician_role, is_active=False)

        pc = DeviceType.objects.create(code='PC', name='PC de escritorio', is_selected=True)
        ups = DeviceType.objects.create(code='UPS', name='UPS', is_selected=True)
        active = DeviceStatus.objects.create(code=DeviceStatus.ACTIVE, name='Activo', is_included_in_kmeans=True)
        retired = DeviceStatus.objects.create(code=DeviceStatus.RETIRED, name='Retirado', is_included_in_kmeans=False)

        cls.h101 = Laboratory.objects.create(code='H101', name='Laboratorio 1', station_count=10,
                                             responsible_technician=cls.technician)
        cls.h102 = Laboratory.objects.create(code='H102', name='Laboratorio 2', station_count=10)
        pc01 = Device.objects.create(code='H101-PC-01', laboratory=cls.h101, device_type=pc, device_status=active)
        Device.objects.create(code='H101-PC-02', laboratory=cls.h101, device_type=pc, device_status=active)
        Device.objects.create(code='H101-UPS-01', laboratory=cls.h101, device_type=ups, device_status=active)
        Device.objects.create(code='H101-PC-03', laboratory=cls.h101, device_type=pc, device_status=retired)

        component = Component.objects.create(code='PC', name='PC')
        open_status = IncidentStatus.objects.create(code=IncidentStatus.OPEN, name='Abierta', is_final=False)
        incident = dict(device=pc01, component=component, incident_status=open_status, reported_by=cls.technician,
                        priority='HIGH', description='El equipo no enciende.', opened_at=timezone.now())
        Incident.objects.create(incident_number='INC-2026-0001', **incident)
        # Una incidencia anulada no cuenta (RN-22).
        Incident.objects.create(incident_number='INC-2026-0002', is_active=False, **incident)

    def payload(self, **changes):
        data = {'code': 'H106', 'name': 'Laboratorio 6', 'location': 'Bloque H, planta alta', 'station_count': 12,
                'responsible_technician_id': self.technician.id, 'is_active': True}
        return {**data, **changes}


class LaboratoryListTests(LaboratoryTestCase):
    def test_lista_con_conteos_y_composicion(self):
        self.client.force_authenticate(self.technician)
        response = self.client.get(reverse('laboratory-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        h101 = response.data[0]
        self.assertEqual(h101['code'], 'H101')
        self.assertEqual(h101['responsible_name'], 'Carlos Mendoza')
        self.assertEqual(h101['active_device_count'], 3)  # el retirado no cuenta
        self.assertEqual([(c['code'], c['count']) for c in h101['device_counts']], [('PC', 2), ('UPS', 1)])
        self.assertEqual(h101['open_incident_count'], 1)  # la anulada no cuenta
        self.assertEqual(response.data[1]['device_counts'], [])

    def test_sin_sesion_responde_403(self):
        self.assertEqual(self.client.get(reverse('laboratory-list')).status_code, status.HTTP_403_FORBIDDEN)


class LaboratoryWriteTests(LaboratoryTestCase):
    def setUp(self):
        self.client.force_authenticate(self.admin)

    def test_crear_laboratorio_normaliza_codigo(self):
        response = self.client.post(reverse('laboratory-list'), self.payload(code=' h106 ', location=''),
                                    format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['code'], 'H106')
        self.assertIsNone(response.data['location'])
        self.assertEqual(response.data['active_device_count'], 0)

    def test_codigo_duplicado_sin_distinguir_mayusculas(self):
        response = self.client.post(reverse('laboratory-list'), self.payload(code='h101'), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['code'], ['Ya existe un laboratorio con el código H101'])

    def test_al_editar_puede_conservar_su_propio_codigo(self):
        url = reverse('laboratory-detail', args=[self.h101.id])
        response = self.client.patch(url, self.payload(code='H101', name='Laboratorio de Redes'), format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Laboratorio de Redes')

    def test_puestos_debe_ser_mayor_a_cero(self):
        response = self.client.post(reverse('laboratory-list'), self.payload(station_count=0), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('station_count', response.data)

    def test_responsable_debe_ser_tecnico_activo(self):
        for user in (self.admin, self.inactive_technician):
            response = self.client.post(reverse('laboratory-list'),
                                        self.payload(responsible_technician_id=user.id), format='json')
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn('responsible_technician_id', response.data)

    def test_sin_responsable(self):
        response = self.client.post(reverse('laboratory-list'), self.payload(responsible_technician_id=None),
                                    format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data['responsible_name'])

    def test_rn06_tecnico_no_puede_crear_ni_editar(self):
        self.client.force_authenticate(self.technician)
        self.assertEqual(self.client.post(reverse('laboratory-list'), self.payload(), format='json').status_code,
                         status.HTTP_403_FORBIDDEN)
        url = reverse('laboratory-detail', args=[self.h102.id])
        self.assertEqual(self.client.patch(url, {'name': 'X'}, format='json').status_code,
                         status.HTTP_403_FORBIDDEN)
        url = reverse('laboratory-deactivate', args=[self.h102.id])
        self.assertEqual(self.client.post(url).status_code, status.HTTP_403_FORBIDDEN)


class LaboratoryActivationTests(LaboratoryTestCase):
    def setUp(self):
        self.client.force_authenticate(self.admin)

    def test_rn10_no_desactiva_con_incidencias_abiertas(self):
        response = self.client.post(reverse('laboratory-deactivate', args=[self.h101.id]))
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data['code'], 'has_open_incidents')
        self.assertEqual(response.data['open_incident_count'], 1)
        self.h101.refresh_from_db()
        self.assertTrue(self.h101.is_active)

    def test_rn10_tampoco_desde_el_formulario(self):
        url = reverse('laboratory-detail', args=[self.h101.id])
        response = self.client.patch(url, self.payload(code='H101', is_active=False), format='json')
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_desactivar_y_activar_sin_incidencias_abiertas(self):
        response = self.client.post(reverse('laboratory-deactivate', args=[self.h102.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_active'])
        response = self.client.post(reverse('laboratory-activate', args=[self.h102.id]))
        self.assertTrue(response.data['is_active'])

    def test_laboratorio_inexistente_responde_404(self):
        self.assertEqual(self.client.post(reverse('laboratory-deactivate', args=[999])).status_code,
                         status.HTTP_404_NOT_FOUND)
