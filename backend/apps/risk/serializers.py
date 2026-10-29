from rest_framework import serializers

from .models import RiskLevel


class RiskLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = RiskLevel
        fields = ['id', 'code', 'name', 'recommended_action', 'color_hex', 'is_active', 'created_at', 'updated_at']
