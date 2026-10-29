from django.db import models


class BaseModel(models.Model):
    """Campos de control de todas las tablas (sección 7): estado del registro y fechas."""

    is_active = models.BooleanField(default=True, help_text='Estado del registro. false = anulado.')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
