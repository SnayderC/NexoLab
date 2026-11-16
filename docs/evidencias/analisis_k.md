# Análisis del número de grupos k (D-57) — 16/11/2026 10:51

Mismo preprocesamiento y parámetros que el modelo: `StandardScaler` y `KMeans(random_state=42, n_init=10)`.
Generado con `python manage.py analizar_k`.

## Kaggle (carga inicial): 142 equipos con 2 o más incidencias

| k | Inercia | Silueta | Davies-Bouldin | Grupo más pequeño |
|---|---|---|---|---|
| 2 | 260.6 | 0.532 | 0.860 | 24 equipos |
| 3 (elegido) | 164.9 | 0.522 | 0.745 | 19 equipos |
| 4 | 100.9 | 0.536 | 0.637 | 6 equipos |
| 5 | 70.1 | 0.470 | 0.670 | 6 equipos |
| 6 | 56.2 | 0.477 | 0.617 | 3 equipos |
| 7 | 46.3 | 0.393 | 0.706 | 3 equipos |
| 8 | 39.6 | 0.396 | 0.711 | 3 equipos |

- **Codo de la inercia:** k = 4.
- **Mejor silueta:** k = 4 (0.536); con k = 3 es 0.522.

## Datos propios: 73 equipos con 2 o más incidencias

| k | Inercia | Silueta | Davies-Bouldin | Grupo más pequeño |
|---|---|---|---|---|
| 2 | 140.6 | 0.408 | 0.967 | 15 equipos |
| 3 (elegido) | 85.9 | 0.395 | 0.907 | 14 equipos |
| 4 | 60.1 | 0.397 | 0.812 | 13 equipos |
| 5 | 45.5 | 0.442 | 0.733 | 7 equipos |
| 6 | 34.5 | 0.450 | 0.696 | 5 equipos |
| 7 | 26.7 | 0.461 | 0.705 | 5 equipos |
| 8 | 22.4 | 0.460 | 0.723 | 5 equipos |

- **Codo de la inercia:** k = 4.
- **Mejor silueta:** k = 7 (0.461); con k = 3 es 0.395.

## Gráficos

- `codo_kaggle.svg` y `codo_propios.svg`: inercia por k (método del codo).
- `silueta.svg`: silueta por k para los dos conjuntos.

## Lectura de los resultados (16/11/2026)

- **El codo matemático cae en k = 4** en los dos conjuntos, no en k = 3. Pero la mejora de calidad respecto de k = 3
  es mínima: con Kaggle, la silueta pasa de 0,522 a 0,536 (+0,014).
- **Con k ≥ 4 aparecen grupos muy pequeños** (6 equipos con Kaggle; 7 o menos con los datos propios desde k = 5), que
  son poco estables: un par de incidencias más cambia su composición.
- **Con los datos propios la silueta crece con k grande** (0,461 con k = 7) porque el modelo separa subgrupos muy
  pequeños, lo que no ayuda a decidir a quién atender.
- **k = 3 corresponde a tres niveles de acción** que el personal entiende y usa: revisar hoy (alto), programar
  revisión (medio) y monitoreo normal (bajo).

**Conclusión:** k = 3 no es el óptimo matemático estricto, pero tiene prácticamente la misma calidad que k = 4,
mantiene grupos de tamaño estable (19 y 14 equipos como mínimo) y se interpreta directamente como niveles de riesgo.
Por eso se mantiene. Si el historial crece mucho, conviene repetir este análisis (`python manage.py analizar_k`).

*Nota: al volver a ejecutar el comando, el archivo se reescribe y esta sección se pierde; está copiada en
`docs/DOCUMENTO_PARA_TESIS.md`, sección 9.3.*
