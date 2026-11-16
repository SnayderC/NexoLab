"""Pruebas de la bitácora de cambios administrativos (D-52). Ejecutar: python manage.py test"""

import json

from django.urls import reverse
from rest_framework import status

from apps.incidents.models import Incident
from apps.infrastructure.models import Device, DeviceType, Laboratory
from apps.infrastructure.tests import LaboratoryTestCase
from apps.users.models import Role, User

from .models import AuditLog


class AuditLogTests(LaboratoryTestCase):
    def setUp(self):
        self.client.force_login(self.admin)

    def last(self):
        return AuditLog.objects.order_by('-id').first()

    def test_d52_usuarios_crear_editar_desactivar_y_restablecer(self):
        payload = {'first_name': 'Ana', 'last_name': 'Ruiz', 'email': 'ana@test.ec',
                   'role_id': Role.objects.get(code=Role.TECHNICIAN).id, 'temporary_password': 'Laboratorio-2026'}
        user_id = self.client.post(reverse('user-list'), payload, format='json').data['id']
        log = self.last()
        self.assertEqual((log.action, log.entity_type, log.entity_id, log.entity_label, log.user),
                         ('CREATE', 'USER', user_id, 'ana@test.ec', self.admin))
        self.assertEqual(log.changes['first_name'], [None, 'Ana'])
        self.assertEqual(log.changes['role'], [None, 'Técnico de soporte'])

        # Solo se anotan los campos que cambiaron.
        self.client.patch(reverse('user-detail', args=[user_id]), {'last_name': 'Ruiz Mora'}, format='json')
        self.assertEqual(self.last().changes, {'last_name': ['Ruiz', 'Ruiz Mora']})

        self.client.post(reverse('user-deactivate', args=[user_id]))
        self.assertEqual(self.last().action, 'DEACTIVATE')
        count = AuditLog.objects.count()
        self.client.post(reverse('user-deactivate', args=[user_id]))  # ya estaba desactivado: sin entrada nueva
        self.assertEqual(AuditLog.objects.count(), count)

        self.client.post(reverse('user-reset-password', args=[user_id]), {'new_password': 'Otra-Clave-2026'},
                         format='json')
        log = self.last()
        self.assertEqual((log.action, log.changes), ('RESET_PASSWORD', None))
        # La contraseña nunca llega a la bitácora.
        dump = json.dumps(list(AuditLog.objects.values('changes', 'entity_label')))
        self.assertNotIn('Laboratorio-2026', dump)
        self.assertNotIn('Otra-Clave-2026', dump)
        self.assertNotIn(User.objects.get(pk=user_id).password, dump)

    def test_d52_laboratorio_equipo_y_catalogo(self):
        lab_id = self.client.post(reverse('laboratory-list'), {'code': 'h110', 'name': 'Laboratorio 10',
                                                               'station_count': 30}, format='json').data['id']
        self.assertEqual((self.last().action, self.last().entity_label), ('CREATE', 'H110'))
        self.client.patch(reverse('laboratory-detail', args=[lab_id]), {'station_count': 40}, format='json')
        self.assertEqual(self.last().changes, {'station_count': [30, 40]})
        self.client.post(reverse('laboratory-deactivate', args=[lab_id]))
        self.assertEqual((self.last().action, self.last().entity_type), ('DEACTIVATE', 'LABORATORY'))

        pc = DeviceType.objects.get(code='PC')
        self.client.post(reverse('device-list'), {'code': 'H101-PC-09', 'laboratory_id': self.h101.id,
                                                  'device_type_id': pc.id}, format='json')
        log = self.last()
        self.assertEqual((log.action, log.entity_label), ('CREATE', 'H101-PC-09'))
        self.assertEqual(log.changes['laboratory'], [None, 'Laboratorio 1'])
        device = Device.objects.get(code='H101-PC-09')
        self.client.patch(reverse('device-detail', args=[device.id]), {'status': 'RETIRED'}, format='json')
        log = self.last()
        self.assertEqual((log.action, log.changes), ('RETIRE', {'device_status': ['Activo', 'Retirado']}))

        ups = DeviceType.objects.get(code='UPS')
        self.client.put(reverse('device-type-selection'), {'selected_ids': [pc.id]}, format='json')
        log = self.last()
        self.assertEqual(log.action, 'CATALOG_SELECTION')
        self.assertEqual(log.changes, {'added': [], 'removed': [ups.name]})

    def test_d52_anular_y_modo_tecnico(self):
        self.client.post(reverse('incident-void', args=['INC-2026-0001']))
        log = self.last()
        self.assertEqual((log.action, log.entity_type), ('VOID', 'INCIDENT'))
        self.assertEqual(log.entity_label, 'INC-2026-0001 (H101-PC-01)')
        self.assertFalse(Incident.objects.get(incident_number='INC-2026-0001').is_active)

        self.client.post(reverse('auth-technician-mode'), {'enabled': True}, format='json')
        self.assertEqual(self.last().action, 'TECHNICIAN_MODE_ON')
        count = AuditLog.objects.count()
        self.client.post(reverse('auth-technician-mode'), {'enabled': True}, format='json')  # ya estaba activo
        self.assertEqual(AuditLog.objects.count(), count)
        self.client.post(reverse('auth-technician-mode'), {'enabled': False}, format='json')
        self.assertEqual(self.last().action, 'TECHNICIAN_MODE_OFF')

    def test_d52_consulta_con_filtros_textos_y_permisos(self):
        self.client.post(reverse('laboratory-deactivate', args=[self.h102.id]))
        self.client.post(reverse('auth-technician-mode'), {'enabled': True}, format='json')

        data = self.client.get(reverse('audit-log-list')).data
        self.assertEqual(data['total'], 2)
        newest = data['items'][0]  # el más reciente primero
        self.assertEqual((newest['action_name'], newest['entity_type_name'], newest['user_name']),
                         ('Activó el modo técnico', 'Usuario', 'Andrea Villacís'))

        data = self.client.get(reverse('audit-log-list'), {'entity_type': 'LABORATORY'}).data
        self.assertEqual([(i['action_name'], i['entity_label']) for i in data['items']], [('Desactivó', 'H102')])

        self.client.force_login(self.technician)
        self.assertEqual(self.client.get(reverse('audit-log-list')).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Laboratory.objects.get(pk=self.h102.pk).is_active, False)
