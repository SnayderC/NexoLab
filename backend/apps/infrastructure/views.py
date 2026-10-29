from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.permissions import IsAdmin

from .models import Laboratory
from .selectors import device_counts_by_laboratory, laboratories_with_counts, open_incident_count
from .serializers import LaboratoryListSerializer, LaboratoryWriteSerializer

# RN-10
HAS_OPEN_INCIDENTS = 'No se puede desactivar: el laboratorio tiene incidencias abiertas'


def laboratory_response(laboratory_id, response_status=status.HTTP_200_OK):
    """Devuelve el laboratorio con los mismos campos que la lista."""
    laboratory = laboratories_with_counts().get(pk=laboratory_id)
    data = LaboratoryListSerializer(laboratory, context={'device_counts': device_counts_by_laboratory()}).data
    return Response(data, status=response_status)


def open_incidents_conflict(count):
    return Response(
        {'detail': HAS_OPEN_INCIDENTS, 'code': 'has_open_incidents', 'open_incident_count': count},
        status=status.HTTP_409_CONFLICT,
    )


class LaboratoryListView(APIView):
    """GET laboratories (con sesión) · POST laboratories (administrador)."""

    def get_permissions(self):
        return [IsAdmin()] if self.request.method == 'POST' else [IsAuthenticated()]

    def get(self, request):
        context = {'device_counts': device_counts_by_laboratory()}
        return Response(LaboratoryListSerializer(laboratories_with_counts(), many=True, context=context).data)

    def post(self, request):
        serializer = LaboratoryWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        laboratory = serializer.save()
        return laboratory_response(laboratory.pk, status.HTTP_201_CREATED)


class LaboratoryDetailView(APIView):
    """PATCH laboratories/{id} (administrador)."""

    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        laboratory = get_object_or_404(Laboratory, pk=pk)
        serializer = LaboratoryWriteSerializer(laboratory, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        # RN-10: tampoco se desactiva desde el formulario si tiene incidencias abiertas.
        if laboratory.is_active and serializer.validated_data.get('is_active') is False:
            count = open_incident_count(pk)
            if count:
                return open_incidents_conflict(count)

        serializer.save()
        return laboratory_response(pk)


class LaboratoryActivationView(APIView):
    """POST laboratories/{id}/activate · POST laboratories/{id}/deactivate (administrador)."""

    permission_classes = [IsAdmin]
    is_active = True

    def post(self, request, pk):
        laboratory = get_object_or_404(Laboratory, pk=pk)
        if not self.is_active:
            count = open_incident_count(pk)
            if count:
                return open_incidents_conflict(count)

        laboratory.is_active = self.is_active
        laboratory.save(update_fields=['is_active', 'updated_at'])
        return laboratory_response(pk)
