"""Pruebas de autenticación, permisos y administración de usuarios (RN-01 a RN-06). Ejecutar: python manage.py test"""

from django.core.cache import cache
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.incidents.models import Component, Incident, IncidentStatus
from apps.infrastructure.models import Device, DeviceStatus, DeviceType, Laboratory

from .models import Role, User

PASSWORD = 'Laboratorio-2026'


class AuthTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.technician_role = Role.objects.create(code=Role.TECHNICIAN, name='Técnico de soporte')
        cls.admin_role = Role.objects.create(code=Role.ADMIN, name='Administrador')
        cls.admin = User.objects.create_user(
            'andrea.villacis@gmail.com', PASSWORD, first_name='Andrea', last_name='Villacís', role=cls.admin_role
        )
        cls.technician = User.objects.create_user(
            'carlos.mendoza@gmail.com', PASSWORD, first_name='Carlos', last_name='Mendoza', role=cls.technician_role
        )
        cls.inactive = User.objects.create_user(
            'luis.bravo@gmail.com', PASSWORD, first_name='Luis', last_name='Bravo',
            role=cls.technician_role, is_active=False,
        )

    def setUp(self):
        # Los intentos fallidos de login (RN-25) viven en la caché: cada prueba empieza sin ellos.
        cache.clear()

    def login(self, email, password=PASSWORD):
        return self.client.post(reverse('auth-login'), {'email': email, 'password': password}, format='json')


class LoginTests(AuthTestCase):
    def test_login_correcto_devuelve_usuario_con_rol(self):
        response = self.login('andrea.villacis@gmail.com')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'andrea.villacis@gmail.com')
        self.assertEqual(response.data['role']['code'], 'ADMIN')
        self.assertNotIn('password', response.data)
        self.assertNotIn('password_hash', response.data)

    def test_login_registra_ultimo_acceso(self):
        self.login('carlos.mendoza@gmail.com')
        self.technician.refresh_from_db()
        self.assertIsNotNone(self.technician.last_login)

    def test_correo_sin_distinguir_mayusculas(self):
        self.assertEqual(self.login('Andrea.Villacis@GMAIL.com').status_code, status.HTTP_200_OK)

    def test_rn01_mismo_mensaje_para_contrasena_incorrecta_y_correo_inexistente(self):
        wrong_password = self.login('andrea.villacis@gmail.com', 'otra-clave')
        unknown_email = self.login('nadie@gmail.com')
        self.assertEqual(wrong_password.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(unknown_email.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(wrong_password.data, unknown_email.data)
        self.assertEqual(wrong_password.data['detail'], 'Correo o contraseña incorrectos')

    def test_rn02_cuenta_desactivada_con_contrasena_correcta(self):
        response = self.login('luis.bravo@gmail.com')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['code'], 'account_disabled')

    def test_rn02_cuenta_desactivada_con_contrasena_incorrecta_no_revela_nada(self):
        response = self.login('luis.bravo@gmail.com', 'otra-clave')
        self.assertEqual(response.data['code'], 'invalid_credentials')

    def test_login_exige_token_csrf(self):
        client = APIClient(enforce_csrf_checks=True)
        response = client.post(
            reverse('auth-login'), {'email': 'andrea.villacis@gmail.com', 'password': PASSWORD}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_login_con_token_csrf(self):
        client = APIClient(enforce_csrf_checks=True)
        client.get(reverse('auth-csrf'))
        token = client.cookies['csrftoken'].value
        response = client.post(
            reverse('auth-login'),
            {'email': 'andrea.villacis@gmail.com', 'password': PASSWORD},
            format='json',
            HTTP_X_CSRFTOKEN=token,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class LoginAttemptTests(AuthTestCase):
    """RN-25 (D-46): 5 intentos fallidos bloquean el login 15 minutos."""

    def test_rn25_bloquea_tras_cinco_intentos_fallidos(self):
        for _ in range(5):
            self.assertEqual(self.login('andrea.villacis@gmail.com', 'otra-clave').status_code,
                             status.HTTP_400_BAD_REQUEST)
        # Bloqueado aunque ahora la contraseña sea correcta.
        response = self.login('andrea.villacis@gmail.com')
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(response.data['code'], 'too_many_attempts')
        self.assertIn('15 minutos', response.data['detail'])
        # Otra cuenta no se ve afectada.
        self.assertEqual(self.login('carlos.mendoza@gmail.com').status_code, status.HTTP_200_OK)

    def test_rn25_correo_inexistente_se_bloquea_igual(self):
        # RN-01: el bloqueo no revela si el correo existe.
        for _ in range(5):
            self.login('nadie@gmail.com')
        self.assertEqual(self.login('nadie@gmail.com').status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_rn25_un_login_correcto_reinicia_el_contador(self):
        for _ in range(4):
            self.login('andrea.villacis@gmail.com', 'otra-clave')
        self.assertEqual(self.login('andrea.villacis@gmail.com').status_code, status.HTTP_200_OK)
        for _ in range(4):
            self.login('andrea.villacis@gmail.com', 'otra-clave')
        self.assertEqual(self.login('andrea.villacis@gmail.com').status_code, status.HTTP_200_OK)


class SessionTests(AuthTestCase):
    def test_me_sin_sesion_es_rechazado(self):
        # D-47: 401 (no 403) para que el frontend lleve al login; sin la ventana de contraseña del navegador.
        response = self.client.get(reverse('auth-me'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response['WWW-Authenticate'], 'Session')

    def test_me_con_sesion(self):
        self.login('carlos.mendoza@gmail.com')
        response = self.client.get(reverse('auth-me'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['role']['code'], 'TECHNICIAN')

    def test_logout_cierra_la_sesion(self):
        self.login('carlos.mendoza@gmail.com')
        self.assertEqual(self.client.post(reverse('auth-logout')).status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(self.client.get(reverse('auth-me')).status_code, status.HTTP_401_UNAUTHORIZED)


class ChangePasswordTests(AuthTestCase):
    def change(self, current, new):
        return self.client.post(
            reverse('auth-change-password'),
            {'current_password': current, 'new_password': new},
            format='json',
        )

    def setUp(self):
        self.login('carlos.mendoza@gmail.com')

    def test_contrasena_actual_incorrecta(self):
        response = self.change('otra-clave', 'Nueva-Clave-2026')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('current_password', response.data)

    def test_rn04_rechaza_contrasena_corta_numerica_o_comun(self):
        for weak in ['abc', '12345678', 'password']:
            response = self.change(PASSWORD, weak)
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, weak)
            self.assertIn('new_password', response.data)

    def test_cambio_correcto_mantiene_la_sesion_y_permite_entrar_con_la_nueva(self):
        self.assertEqual(self.change(PASSWORD, 'Nueva-Clave-2026').status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(self.client.get(reverse('auth-me')).status_code, status.HTTP_200_OK)
        self.client.post(reverse('auth-logout'))
        self.assertEqual(
            self.login('carlos.mendoza@gmail.com', 'Nueva-Clave-2026').status_code, status.HTTP_200_OK
        )


class PermissionTests(AuthTestCase):
    def test_rn06_tecnico_recibe_403_en_administracion(self):
        self.login('carlos.mendoza@gmail.com')
        self.assertEqual(self.client.get(reverse('user-list')).status_code, status.HTTP_403_FORBIDDEN)

    def test_administrador_accede_a_administracion(self):
        self.login('andrea.villacis@gmail.com')
        response = self.client.get(reverse('user-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)


class UserAdministrationTests(AuthTestCase):
    """Administración de usuarios (Figma 5.15 a 5.18, RN-03 a RN-05)."""

    def setUp(self):
        self.client.force_authenticate(self.admin)

    def payload(self, **changes):
        data = {'first_name': 'María', 'last_name': 'Torres', 'email': 'maria.torres@gmail.com',
                'role_id': self.technician_role.id, 'temporary_password': 'Temporal-Lab-2026'}
        return {**data, **changes}

    def test_lista_con_laboratorios_y_carga_de_trabajo(self):
        lab = Laboratory.objects.create(code='H101', name='Lab 1', station_count=10,
                                        responsible_technician=self.technician)
        Laboratory.objects.create(code='H102', name='Lab 2', station_count=10, responsible_technician=self.technician,
                                  is_active=False)
        device = Device.objects.create(
            code='H101-PC-01', laboratory=lab,
            device_type=DeviceType.objects.create(code='PC', name='PC', is_selected=True),
            device_status=DeviceStatus.objects.create(code='ACTIVE', name='Activo', is_included_in_kmeans=True),
        )
        common = dict(device=device, component=Component.objects.create(code='PC', name='PC'),
                      incident_status=IncidentStatus.objects.create(code='OPEN', name='Abierta', is_final=False),
                      priority='LOW', description='Falla de prueba.', opened_at=timezone.now())
        Incident.objects.create(incident_number='INC-2026-0001', reported_by=self.technician,
                                closed_by=self.technician, **common)
        Incident.objects.create(incident_number='INC-2026-0002', reported_by=self.technician, **common)
        Incident.objects.create(incident_number='INC-2026-0003', reported_by=self.technician, is_active=False,
                                **common)

        carlos = self.client.get(reverse('user-list')).data[1]
        self.assertEqual(carlos['laboratory_codes'], ['H101'])  # el laboratorio inactivo no aparece
        self.assertEqual((carlos['registered_count'], carlos['closed_count']), (2, 1))  # la anulada no cuenta
        self.assertNotIn('password', carlos)

    def test_crear_usuario_normaliza_correo_y_guarda_hash(self):
        response = self.client.post(reverse('user-list'), self.payload(email=' Maria.Torres@GMAIL.com '),
                                    format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['email'], 'maria.torres@gmail.com')
        user = User.objects.get(email='maria.torres@gmail.com')
        self.assertNotEqual(user.password, 'Temporal-Lab-2026')
        self.client.force_authenticate(None)
        self.assertEqual(self.login('maria.torres@gmail.com', 'Temporal-Lab-2026').status_code, status.HTTP_200_OK)

    def test_correo_duplicado(self):
        response = self.client.post(reverse('user-list'), self.payload(email='CARLOS.mendoza@gmail.com'),
                                    format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['email'], ['Ya existe un usuario con este correo'])

    def test_rn04_contrasena_temporal_debil_o_parecida_al_usuario(self):
        for password in ('12345678', 'password', 'maria.torres'):
            response = self.client.post(reverse('user-list'), self.payload(temporary_password=password),
                                        format='json')
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, password)
            self.assertIn('temporary_password', response.data)

    def test_editar_usuario_sin_cambiar_contrasena(self):
        url = reverse('user-detail', args=[self.technician.id])
        response = self.client.patch(url, {'first_name': 'Carlos Andrés', 'email': 'carlos.mendoza@gmail.com',
                                           'role_id': self.technician_role.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'Carlos Andrés')
        response = self.client.patch(url, {'temporary_password': 'Otra-Clave-2026'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rn05_no_puede_desactivarse_a_si_mismo(self):
        response = self.client.post(reverse('user-deactivate', args=[self.admin.id]))
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data['code'], 'self_deactivation')

    def test_desactivar_y_activar_otro_usuario(self):
        response = self.client.post(reverse('user-deactivate', args=[self.technician.id]))
        self.assertFalse(response.data['is_active'])
        self.client.force_authenticate(None)
        self.assertEqual(self.login('carlos.mendoza@gmail.com').status_code, status.HTTP_403_FORBIDDEN)
        self.client.force_authenticate(self.admin)
        response = self.client.post(reverse('user-activate', args=[self.technician.id]))
        self.assertTrue(response.data['is_active'])

    def test_rn03_restablecer_contrasena(self):
        url = reverse('user-reset-password', args=[self.technician.id])
        self.assertEqual(self.client.post(url, {'new_password': '12345678'}, format='json').status_code,
                         status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.client.post(url, {'new_password': 'Nueva-Temporal-2026'}, format='json').status_code,
                         status.HTTP_204_NO_CONTENT)
        self.client.force_authenticate(None)
        self.assertEqual(self.login('carlos.mendoza@gmail.com', 'Nueva-Temporal-2026').status_code,
                         status.HTTP_200_OK)

    def test_rn06_tecnico_no_administra_usuarios(self):
        self.client.force_authenticate(self.technician)
        self.assertEqual(self.client.post(reverse('user-list'), self.payload(), format='json').status_code,
                         status.HTTP_403_FORBIDDEN)
        url = reverse('user-reset-password', args=[self.admin.id])
        self.assertEqual(self.client.post(url, {'new_password': 'Nueva-Temporal-2026'}, format='json').status_code,
                         status.HTTP_403_FORBIDDEN)
