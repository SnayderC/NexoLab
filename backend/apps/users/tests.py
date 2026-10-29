"""Pruebas de autenticación y permisos (RN-01 a RN-06). Ejecutar: python manage.py test"""

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

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


class SessionTests(AuthTestCase):
    def test_me_sin_sesion_es_rechazado(self):
        response = self.client.get(reverse('auth-me'))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_me_con_sesion(self):
        self.login('carlos.mendoza@gmail.com')
        response = self.client.get(reverse('auth-me'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['role']['code'], 'TECHNICIAN')

    def test_logout_cierra_la_sesion(self):
        self.login('carlos.mendoza@gmail.com')
        self.assertEqual(self.client.post(reverse('auth-logout')).status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(self.client.get(reverse('auth-me')).status_code, status.HTTP_403_FORBIDDEN)


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
