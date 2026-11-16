"""Pruebas del modelo de riesgo K-Means (sección 10, RN-23). Ejecutar: python manage.py test"""

from datetime import timedelta
from unittest.mock import patch

import numpy as np
from django.conf import settings
from django.test import SimpleTestCase, TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.incidents.models import Component, Incident, IncidentStatus
from apps.infrastructure.models import Device, DeviceStatus, DeviceType, Laboratory
from apps.users.models import Role, User
from config.celery import app as celery_app

from . import kmeans
from .models import DeviceRiskResult, KmeansRun, RiskLevel
from .services import RiskCalculationError, calculate_risk
from .tasks import recalculate_risk_task, schedule_recalculation

Trigger = KmeansRun.TriggerType


class FeatureTests(SimpleTestCase):
    def setUp(self):
        self.now = timezone.now()

    def test_sin_incidencias(self):
        features = kmeans.compute_features([], self.now)
        self.assertEqual((features.incident_count, features.days_since_last_failure), (0, None))
        self.assertFalse(features.has_history)

    def test_una_incidencia_no_tiene_intervalo(self):
        features = kmeans.compute_features([self.now - timedelta(days=4)], self.now)
        self.assertEqual(features.incident_count, 1)
        self.assertAlmostEqual(features.days_since_last_failure, 4)
        self.assertIsNone(features.avg_failure_interval_days)
        self.assertFalse(features.has_history)

    def test_intervalo_promedio_entre_la_primera_y_la_ultima(self):
        dates = [self.now - timedelta(days=d) for d in (30, 2, 10)]  # sin ordenar a propósito
        features = kmeans.compute_features(dates, self.now)
        self.assertEqual(features.incident_count, 3)
        self.assertAlmostEqual(features.days_since_last_failure, 2)
        self.assertAlmostEqual(features.avg_failure_interval_days, 14)  # (30 − 2) / 2
        self.assertTrue(features.has_history)


class AlgorithmTests(SimpleTestCase):
    # Tres perfiles claros: muchas fallas recientes, intermedio y pocas fallas antiguas.
    ROWS = [[20, 2, 3], [18, 3, 4], [22, 1, 2], [6, 30, 20], [5, 35, 25], [7, 28, 18],
            [2, 150, 90], [2, 160, 100], [3, 140, 80]]

    def test_el_grupo_mas_riesgoso_es_high(self):
        self.assertEqual(kmeans.assign_levels(np.array([[-1, 1, 1], [2, -1, -1], [0, 0, 0]])),
                         ['LOW', 'HIGH', 'MEDIUM'])

    def test_entrena_y_asigna_niveles_por_perfil(self):
        model, clustering = kmeans.train(self.ROWS)
        levels = [model.levels[label] for label in clustering.labels]
        self.assertEqual(levels, ['HIGH'] * 3 + ['MEDIUM'] * 3 + ['LOW'] * 3)
        self.assertGreater(clustering.silhouette, 0.5)
        self.assertIsNotNone(clustering.davies_bouldin)

    def test_misma_semilla_mismo_resultado(self):
        first, second = kmeans.train(self.ROWS)[0], kmeans.train(self.ROWS)[0]
        np.testing.assert_array_equal(first.centroids, second.centroids)

    def test_clasificar_con_un_modelo_guardado(self):
        model, _ = kmeans.train(self.ROWS)
        restored = kmeans.Model.from_dict(model.to_dict())
        clustering = kmeans.classify(restored, [[25, 1, 2], [2, 200, 120]])
        self.assertEqual([restored.levels[label] for label in clustering.labels], ['HIGH', 'LOW'])

    def test_necesita_al_menos_tres_equipos(self):
        with self.assertRaises(ValueError):
            kmeans.train([[2, 1, 1], [3, 2, 2]])


class RiskDataMixin:
    """Un laboratorio con equipos de distintos perfiles y los catálogos que usa el cálculo."""

    @classmethod
    def setUpTestData(cls):
        for code, name in (('HIGH', 'Riesgo alto'), ('MEDIUM', 'Riesgo medio'), ('LOW', 'Riesgo bajo')):
            RiskLevel.objects.create(code=code, name=name)
        role = Role.objects.create(code=Role.ADMIN, name='Administrador')
        cls.admin = User.objects.create_user('admin@test.ec', 'x', first_name='A', last_name='B', role=role)
        technician_role = Role.objects.create(code=Role.TECHNICIAN, name='Técnico')
        cls.technician = User.objects.create_user('tec@test.ec', 'x', first_name='C', last_name='D',
                                                  role=technician_role)

        cls.active = DeviceStatus.objects.create(code='ACTIVE', name='Activo', is_included_in_kmeans=True)
        retired = DeviceStatus.objects.create(code='RETIRED', name='Retirado', is_included_in_kmeans=False)
        pc = DeviceType.objects.create(code='PC', name='PC', is_selected=True)
        printer = DeviceType.objects.create(code='IMP', name='Impresora', is_selected=False)
        lab = Laboratory.objects.create(code='H101', name='Lab', station_count=10)
        cls.component = Component.objects.create(code='PC', name='PC')
        cls.open_status = IncidentStatus.objects.create(code='OPEN', name='Abierta', is_final=False)

        now = timezone.now()
        # (código, días atrás de cada incidencia): 3 frecuentes, 3 intermedios, 3 esporádicos, 1 sin historial.
        profiles = [
            ('PC-01', [1, 3, 5, 7, 9, 11]), ('PC-02', [2, 4, 6, 8, 10]), ('PC-03', [1, 4, 7, 10, 13, 16]),
            ('PC-04', [30, 50, 70]), ('PC-05', [35, 60, 85]), ('PC-06', [25, 45, 65]),
            ('PC-07', [150, 250]), ('PC-08', [160, 260]), ('PC-09', [140, 240]),
            ('PC-10', [5]),
        ]
        cls.devices = {}
        for code, days in profiles:
            device = Device.objects.create(code=f'H101-{code}', laboratory=lab, device_type=pc,
                                           device_status=cls.active)
            cls.devices[code] = device
            for index, ago in enumerate(days):
                Incident.objects.create(
                    incident_number=f'INC-{code}-{index}', device=device, component=cls.component,
                    incident_status=cls.open_status, reported_by=cls.admin, priority='LOW',
                    description='Falla de prueba.', opened_at=now - timedelta(days=ago),
                )
        # No entran al cálculo: un equipo retirado y uno de un tipo no seleccionado (RN-07, RN-12).
        cls.retired = Device.objects.create(code='H101-PC-11', laboratory=lab, device_type=pc, device_status=retired)
        cls.printer = Device.objects.create(code='H101-IMP-01', laboratory=lab, device_type=printer,
                                            device_status=cls.active)

    def current(self, code):
        return DeviceRiskResult.objects.select_related('risk_level').get(device=self.devices[code], is_current=True)

    def keep_history_only_for(self, *codes):
        """Anula las incidencias de los demás equipos: así quedan menos equipos con historial que grupos."""
        Incident.objects.exclude(device__in=[self.devices[code] for code in codes]).update(is_active=False)


@override_settings(RISK_MIN_OWN_HISTORY_DEVICES=3)
class OwnHistoryRunTests(RiskDataMixin, TestCase):
    def test_calcula_con_historial_propio(self):
        run = calculate_risk(Trigger.MANUAL, triggered_by=self.admin)
        self.assertEqual(run.run_status, KmeansRun.RunStatus.COMPLETED)
        self.assertEqual(run.parameters['source']['type'], 'OWN_HISTORY')
        self.assertEqual(run.device_count, 10)  # sin el retirado ni la impresora
        self.assertEqual(run.parameters['kmeans_device_count'], 9)
        self.assertEqual(run.centroids.count(), 3)
        self.assertIsNotNone(run.silhouette_score)
        self.assertEqual(self.current('PC-01').risk_level.code, 'HIGH')
        self.assertEqual(self.current('PC-05').risk_level.code, 'MEDIUM')
        self.assertEqual(self.current('PC-08').risk_level.code, 'LOW')

    def test_rn23_historial_insuficiente_es_bajo_sin_centroide(self):
        calculate_risk(Trigger.MANUAL)
        result = self.current('PC-10')
        self.assertEqual(result.classification_method, DeviceRiskResult.ClassificationMethod.INSUFFICIENT_HISTORY)
        self.assertEqual(result.risk_level.code, 'LOW')
        self.assertIsNone(result.kmeans_centroid)
        self.assertEqual(result.incident_count, 1)

    def test_excluye_retirados_y_tipos_no_seleccionados(self):
        calculate_risk(Trigger.MANUAL)
        self.assertFalse(DeviceRiskResult.objects.filter(device__in=[self.retired, self.printer]).exists())

    def test_solo_el_ultimo_resultado_es_vigente(self):
        first = calculate_risk(Trigger.MANUAL)
        second = calculate_risk(Trigger.MANUAL)
        self.assertFalse(first.results.filter(is_current=True).exists())
        self.assertEqual(second.results.filter(is_current=True).count(), 10)

    def test_d42_calculo_en_una_fecha_pasada(self):
        # Como si fuera hace un año: ninguna falla había ocurrido todavía y todo queda en riesgo bajo por regla.
        as_of = timezone.now() - timedelta(days=365)
        run = calculate_risk(Trigger.INITIAL_LOAD, as_of=as_of)
        self.assertEqual(run.started_at, as_of)
        self.assertEqual(run.parameters['kmeans_device_count'], 0)
        self.assertEqual(self.current('PC-01').incident_count, 0)
        self.assertEqual(self.current('PC-01').calculated_at, as_of)

    def test_las_incidencias_anuladas_no_cuentan(self):
        Incident.objects.filter(device=self.devices['PC-07']).update(is_active=False)
        calculate_risk(Trigger.MANUAL)
        self.assertEqual(self.current('PC-07').incident_count, 0)


class KaggleModelRunTests(RiskDataMixin, TestCase):
    def test_sin_modelo_inicial_la_ejecucion_falla_y_no_cambia_el_riesgo(self):
        self.keep_history_only_for('PC-01', 'PC-02')
        with self.assertRaises(RiskCalculationError):
            calculate_risk(Trigger.MANUAL)
        run = KmeansRun.objects.get()
        self.assertEqual(run.run_status, KmeansRun.RunStatus.FAILED)
        self.assertIn('modelo inicial', run.error_message)
        self.assertFalse(DeviceRiskResult.objects.exists())

    def test_carga_inicial_con_kaggle_y_reuso_del_modelo(self):
        initial = calculate_risk(Trigger.INITIAL_LOAD)
        source = initial.parameters['source']
        self.assertEqual((source['type'], source['file']), ('KAGGLE', 'ITSM_data.csv'))
        self.assertEqual(len(source['sha256']), 64)
        self.assertGreater(source['training_device_count'], 100)
        self.assertGreater(initial.silhouette_score, 0)

        # Con menos equipos con historial que el mínimo (30 por defecto), se clasifica con el modelo de Kaggle (D-33).
        manual = calculate_risk(Trigger.MANUAL)
        self.assertEqual(manual.parameters['source'], {
            'type': 'KAGGLE_MODEL', 'model_run_id': initial.id, 'metrics_scope': 'ASSIGNMENT',
        })
        self.assertEqual(self.current('PC-01').risk_level.code, 'HIGH')


class RecalculateApiTests(RiskDataMixin, APITestCase):
    @override_settings(RISK_MIN_OWN_HISTORY_DEVICES=3)
    def test_administrador_recalcula(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post(reverse('risk-recalculate'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(sum(response.data['level_counts'].values()), 10)
        run = KmeansRun.objects.get(pk=response.data['kmeans_run_id'])
        self.assertEqual((run.trigger_type, run.triggered_by), (Trigger.MANUAL, self.admin))

    def test_error_de_calculo_responde_409(self):
        self.client.force_authenticate(self.admin)
        self.keep_history_only_for('PC-01')
        response = self.client.post(reverse('risk-recalculate'))  # 1 equipo con historial y sin modelo inicial
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data['code'], 'risk_failed')

    def test_rn06_tecnico_no_recalcula(self):
        self.client.force_authenticate(self.technician)
        self.assertEqual(self.client.post(reverse('risk-recalculate')).status_code, status.HTTP_403_FORBIDDEN)


@override_settings(RISK_MIN_OWN_HISTORY_DEVICES=3)
class DashboardSummaryTests(RiskDataMixin, APITestCase):
    def test_resumen_con_indicadores_grupos_e_incidencias_abiertas(self):
        self.client.force_authenticate(self.technician)
        empty = self.client.get(reverse('dashboard-summary')).data
        self.assertIsNone(empty['last_run'])  # todavía sin calcular

        calculate_risk(Trigger.MANUAL)
        data = self.client.get(reverse('dashboard-summary')).data
        self.assertEqual(data['indicators']['open_incident_count'], 33)
        self.assertEqual(data['indicators']['active_device_count'], 11)  # incluye la impresora activa
        self.assertIsNone(data['indicators']['avg_resolution_minutes'])  # ninguna cerrada
        self.assertEqual(data['last_run']['kmeans_device_count'], 9)
        self.assertEqual(data['last_run']['insufficient_history_count'], 1)
        groups = {group['risk_level']['code']: group for group in data['risk_groups']}
        self.assertEqual(groups['HIGH']['devices'][0]['device_code'], 'H101-PC-01')  # más incidencias primero
        self.assertIsNotNone(groups['HIGH']['profile'])
        self.assertEqual(sum(len(group['devices']) for group in groups.values()), 10)

    def test_filtros_cambian_grupos_pero_no_indicadores(self):
        calculate_risk(Trigger.MANUAL)
        self.client.force_authenticate(self.admin)
        other_type = DeviceType.objects.get(code='IMP').id
        data = self.client.get(reverse('dashboard-summary'), {'device_type_id': other_type}).data
        self.assertEqual(sum(len(group['devices']) for group in data['risk_groups']), 0)
        self.assertEqual(data['open_incidents'], [])
        self.assertEqual(data['indicators']['open_incident_count'], 33)


@override_settings(RISK_MIN_OWN_HISTORY_DEVICES=3)
class CeleryTaskTests(RiskDataMixin, TestCase):
    """D-55: K-Means en segundo plano con Celery y recálculo programado (RF11, RNF07)."""

    def test_d55_la_tarea_programada_registra_una_ejecucion_scheduled(self):
        run_id = recalculate_risk_task(trigger_type=Trigger.SCHEDULED)
        run = KmeansRun.objects.get(pk=run_id)
        self.assertEqual((run.trigger_type, run.run_status, run.triggered_by), ('SCHEDULED', 'COMPLETED', None))

    def test_d55_beat_programa_la_tarea_cada_15_minutos(self):
        entry = settings.CELERY_BEAT_SCHEDULE['recalcular-riesgo-programado']
        self.assertEqual(entry['schedule'], 15 * 60)
        self.assertEqual(entry['kwargs'], {'trigger_type': 'SCHEDULED'})
        self.assertIn(entry['task'], celery_app.tasks)

    def test_d55_un_error_del_modelo_queda_registrado_y_no_se_propaga(self):
        self.keep_history_only_for('PC-01')  # 1 equipo con historial y sin modelo inicial: el cálculo falla
        with self.settings(RISK_MIN_OWN_HISTORY_DEVICES=30):
            self.assertIsNone(recalculate_risk_task(trigger_type=Trigger.SCHEDULED, triggered_by_id=self.admin.id))
        run = KmeansRun.objects.get()
        self.assertEqual((run.run_status, run.triggered_by), ('FAILED', self.admin))
        self.assertTrue(run.error_message)

    def test_d55_se_encola_despues_de_confirmar_y_si_redis_falla_calcula_en_el_momento(self):
        with patch.object(recalculate_risk_task, 'delay', side_effect=ConnectionError('Redis no responde')):
            with self.captureOnCommitCallbacks(execute=True) as callbacks:
                schedule_recalculation(Trigger.DEVICE_CHANGE, triggered_by=self.admin)
                self.assertFalse(KmeansRun.objects.exists())  # nada antes de confirmar la transacción
        self.assertEqual(len(callbacks), 1)
        run = KmeansRun.objects.get()
        self.assertEqual((run.trigger_type, run.run_status), ('DEVICE_CHANGE', 'COMPLETED'))

    def test_d55_con_redis_disponible_solo_encola(self):
        with patch.object(recalculate_risk_task, 'delay') as delay:
            with self.captureOnCommitCallbacks(execute=True):
                schedule_recalculation(Trigger.INCIDENT_CLOSED, triggered_by=self.admin)
        delay.assert_called_once_with(trigger_type='INCIDENT_CLOSED', triggered_by_id=self.admin.id, incident_id=None)
        self.assertFalse(KmeansRun.objects.exists())  # el worker lo hará en segundo plano


class KAnalysisTests(SimpleTestCase):
    """D-57: el análisis del codo encuentra k cuando los grupos son claros."""

    def test_d57_con_tres_grupos_claros_el_codo_y_la_silueta_eligen_tres(self):
        from .management.commands.analizar_k import elbow, evaluate

        rng = np.random.default_rng(42)
        centers = [(2, 5, 60), (6, 60, 20), (12, 10, 5)]
        rows = np.vstack([rng.normal(center, 0.5, size=(20, 3)) for center in centers])
        results = evaluate(rows)
        self.assertEqual(elbow(results), 3)
        self.assertEqual(max(results, key=lambda r: r['silhouette'])['k'], 3)
