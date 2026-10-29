"""
Algoritmo de riesgo (sección 10): variables por equipo, K-Means con k = 3 y asignación de niveles.
No usa la base de datos; services.py lo alimenta y guarda los resultados.
"""

from dataclasses import dataclass
from datetime import datetime

import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import davies_bouldin_score, silhouette_score
from sklearn.preprocessing import StandardScaler

CLUSTER_COUNT = 3
MAX_ITERATIONS = 100
RANDOM_SEED = 42
# Veces que K-Means prueba centros iniciales distintos; se queda con la de menor inercia.
INITIALIZATIONS = 10
FEATURES = ['incident_count', 'days_since_last_failure', 'avg_failure_interval_days']
# Mínimo de incidencias para entrar al algoritmo (RN-23).
MIN_INCIDENTS = 2
# Orden de los niveles, del grupo de mayor riesgo al de menor.
LEVELS_BY_RISK = ['HIGH', 'MEDIUM', 'LOW']

SECONDS_PER_DAY = 86400


@dataclass
class Features:
    incident_count: int
    days_since_last_failure: float | None
    avg_failure_interval_days: float | None

    @property
    def has_history(self) -> bool:
        return self.incident_count >= MIN_INCIDENTS

    def as_row(self) -> list[float]:
        return [self.incident_count, self.days_since_last_failure, self.avg_failure_interval_days]


def compute_features(opened_at: list[datetime], now: datetime) -> Features:
    """Las 3 variables de un equipo a partir de las fechas de sus incidencias válidas."""
    if not opened_at:
        return Features(0, None, None)
    dates = sorted(opened_at)
    days_since = max((now - dates[-1]).total_seconds() / SECONDS_PER_DAY, 0)
    if len(dates) < 2:
        return Features(1, days_since, None)
    interval = (dates[-1] - dates[0]).total_seconds() / SECONDS_PER_DAY / (len(dates) - 1)
    return Features(len(dates), days_since, interval)


@dataclass
class Model:
    """Escalador y centroides ya entrenados. Se guarda en hst_kmeans_runs.parameters
    para clasificar después con el mismo modelo (to_dict / from_dict)."""

    mean: np.ndarray
    scale: np.ndarray
    centroids: np.ndarray  # en la escala estandarizada
    levels: list[str]  # nivel de cada grupo, por índice de grupo

    def scaled(self, rows) -> np.ndarray:
        return (np.asarray(rows, dtype=float) - self.mean) / self.scale

    def centroids_in_units(self) -> np.ndarray:
        """Centroides en las unidades originales (incidencias y días), para hst_kmeans_centroids."""
        return self.centroids * self.scale + self.mean

    def to_dict(self) -> dict:
        return {
            'scaler_mean': self.mean.tolist(),
            'scaler_scale': self.scale.tolist(),
            'centroids_scaled': self.centroids.tolist(),
            'levels': self.levels,
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'Model':
        return cls(
            mean=np.array(data['scaler_mean']),
            scale=np.array(data['scaler_scale']),
            centroids=np.array(data['centroids_scaled']),
            levels=list(data['levels']),
        )


@dataclass
class Clustering:
    labels: np.ndarray  # grupo de cada fila
    distances: np.ndarray  # distancia de cada fila a su centroide (escala estandarizada)
    inertia: float
    silhouette: float | None
    davies_bouldin: float | None
    iteration_count: int | None = None
    has_converged: bool | None = None


def assign_levels(centroids_scaled: np.ndarray) -> list[str]:
    """Paso 4: el grupo con más incidencias, la falla más reciente y fallas más seguidas es HIGH.
    Puntaje de cada centroide (variables estandarizadas): incidencias − días desde la última falla
    − intervalo promedio. El mayor puntaje es HIGH, el siguiente MEDIUM y el menor LOW."""
    scores = centroids_scaled[:, 0] - centroids_scaled[:, 1] - centroids_scaled[:, 2]
    levels = [''] * len(scores)
    for position, cluster in enumerate(np.argsort(-scores)):
        levels[cluster] = LEVELS_BY_RISK[position]
    return levels


def _metrics(scaled_rows: np.ndarray, labels: np.ndarray) -> tuple[float | None, float | None]:
    # Silueta y Davies-Bouldin necesitan al menos 2 grupos con datos y más filas que grupos.
    group_count = len(set(labels.tolist()))
    if group_count < 2 or group_count >= len(labels):
        return None, None
    return float(silhouette_score(scaled_rows, labels)), float(davies_bouldin_score(scaled_rows, labels))


def train(rows, seed: int = RANDOM_SEED) -> tuple[Model, Clustering]:
    """Paso 3: escala las 3 variables y ejecuta K-Means con semilla fija."""
    rows = np.asarray(rows, dtype=float)
    if len(rows) < CLUSTER_COUNT:
        raise ValueError(f'Se necesitan al menos {CLUSTER_COUNT} equipos con historial para formar los grupos')

    scaler = StandardScaler().fit(rows)
    scaled_rows = scaler.transform(rows)
    kmeans = KMeans(
        n_clusters=CLUSTER_COUNT, random_state=seed, n_init=INITIALIZATIONS, max_iter=MAX_ITERATIONS
    ).fit(scaled_rows)

    # Una variable constante tiene desviación 0; StandardScaler ya la deja en 1 para no dividir por 0.
    model = Model(scaler.mean_, scaler.scale_, kmeans.cluster_centers_, assign_levels(kmeans.cluster_centers_))
    labels = kmeans.labels_
    silhouette, davies_bouldin = _metrics(scaled_rows, labels)
    return model, Clustering(
        labels=labels,
        distances=np.linalg.norm(scaled_rows - kmeans.cluster_centers_[labels], axis=1),
        inertia=float(kmeans.inertia_),
        silhouette=silhouette,
        davies_bouldin=davies_bouldin,
        iteration_count=int(kmeans.n_iter_),
        # scikit-learn no informa la convergencia: si terminó antes del máximo, los grupos dejaron de cambiar.
        has_converged=bool(kmeans.n_iter_ < MAX_ITERATIONS),
    )


def classify(model: Model, rows) -> Clustering:
    """Asigna cada fila al centroide más cercano de un modelo ya entrenado (por ejemplo, el de Kaggle)."""
    rows = np.asarray(rows, dtype=float)
    if len(rows) == 0:
        return Clustering(np.array([], dtype=int), np.array([]), 0.0, None, None)
    scaled_rows = model.scaled(rows)
    all_distances = np.linalg.norm(scaled_rows[:, None, :] - model.centroids[None, :, :], axis=2)
    labels = all_distances.argmin(axis=1)
    distances = all_distances[np.arange(len(rows)), labels]
    silhouette, davies_bouldin = _metrics(scaled_rows, labels)
    return Clustering(labels, distances, float((distances**2).sum()), silhouette, davies_bouldin)
