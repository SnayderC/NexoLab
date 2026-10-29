from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.db import models

from apps.core.models import BaseModel


class Role(BaseModel):
    """cat_roles: TECHNICIAN | ADMIN."""

    TECHNICIAN = 'TECHNICIAN'
    ADMIN = 'ADMIN'

    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=50)

    class Meta:
        db_table = 'cat_roles'

    def __str__(self):
        return self.name


class UserManager(BaseUserManager):
    def create_user(self, email, password, **fields):
        user = self.model(email=self.normalize_email(email).lower(), **fields)
        user.set_password(password)
        user.save(using=self._db)
        return user


class User(AbstractBaseUser):
    """mst_users. No hereda de BaseModel porque usa la base de usuario de Django;
    declara los mismos campos de control a mano (sección 7)."""

    role = models.ForeignKey(Role, on_delete=models.PROTECT, related_name='users')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.CharField(max_length=150, unique=True, help_text='Correo para iniciar sesión')
    # Nombres de columna del DBML para los campos que define AbstractBaseUser.
    password = models.CharField(max_length=128, db_column='password_hash')
    last_login = models.DateTimeField(null=True, blank=True, db_column='last_login_at')
    is_active = models.BooleanField(default=True, help_text='false = desactivado, no puede iniciar sesión')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    EMAIL_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        db_table = 'mst_users'

    def __str__(self):
        return f'{self.first_name} {self.last_name}'

    @property
    def is_admin(self) -> bool:
        return self.role.code == Role.ADMIN
