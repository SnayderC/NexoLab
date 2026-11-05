# NexoLab — Guion de la demostración

> **Para quién es:** para el autor, al presentar el sistema ante el tutor, las docentes o el tribunal.
> Duración aproximada: 15 minutos. Los ejemplos corresponden a los datos que carga `seed_demo` (D-42).
> Las explicaciones de cada término están en [GUIA_DEL_PROYECTO.md](GUIA_DEL_PROYECTO.md).

---

## Antes de presentar

1. Levanta el sistema y carga los datos limpios:
   ```bash
   docker compose --profile app up -d
   docker compose exec backend python manage.py seed_demo --reset
   ```
   (Sin Docker: `docker compose up -d`, `runserver` y `npm run dev`, como en el README.)
2. Abre http://localhost:5173 y entra una vez para confirmar que todo carga.
3. Ten a mano la contraseña de `DEMO_PASSWORD` (`backend/.env`). Usuarios:
   - `andrea.villacis@gmail.com`: administradora.
   - `carlos.mendoza@gmail.com`: técnico.
   - `luis.bravo@gmail.com`: técnico desactivado.

**Ten en cuenta:** el riesgo depende de la fecha real. Los "hace X días" crecen y, al recalcular, algún equipo
puede cambiar de nivel. Es el comportamiento esperado: el modelo se actualiza con el tiempo.

---

## 1. Introducción (1 minuto)

> "En los laboratorios de cómputo las fallas se reportan de forma informal y no se sabe qué equipos revisar
> primero. NexoLab registra cada incidencia y usa un modelo K-Means para clasificar los equipos en riesgo alto,
> medio y bajo. El caso de origen es el Bloque H: 10 laboratorios y más de 400 equipos."

## 2. Acceso y seguridad (2 minutos)

| Acción | Qué decir |
|---|---|
| Entrar con una contraseña incorrecta | "El mensaje es el mismo si el correo no existe: nadie puede averiguar qué correos están registrados (RN-01)." |
| Entrar como Luis con la contraseña correcta | "Un usuario desactivado no entra, pero su historial se conserva (RN-02)." |
| Entrar como **Carlos** | "Cada rol ve solo lo suyo: Carlos no tiene el menú de Administración." |

## 3. Dashboard (2 minutos)

> "Arriba están las incidencias abiertas, porque son lo urgente. Debajo, los equipos agrupados por el modelo.
> Todos los números se calculan con los datos guardados."

- Señala los indicadores: incidencias abiertas, tiempo promedio de atención y equipos en riesgo alto.
- Filtra por el laboratorio **H107** (el de 60 computadoras).
- Muestra una tarjeta de riesgo alto: incidencias, última falla y cada cuántos días falla.

## 4. Registrar y cerrar una incidencia (3 minutos), como Carlos

1. **Registrar incidencia:** laboratorio **H101**, equipo **H101-PC-05**, componente **Monitor**, prioridad **Alta**,
   descripción "El monitor se apagó y no vuelve a encender."
   > "El número lo asigna el sistema y quién la registró sale de la sesión (RN-14, RN-15). El panel de la derecha
   > muestra el riesgo y las últimas fallas del equipo."
2. En la lista aparece resaltada. Pulsa **Cerrar**: acción **Resuelto**, diagnóstico "Monitor quemado; se reemplazó
   por uno de repuesto."
   > "El tiempo de atención se calcula solo. Al cerrar, el modelo recalcula el riesgo de todos los equipos.
   > Fíjense que no uso 'Requiere reemplazo': esa acción retira la computadora completa; aquí solo se cambió el
   > monitor."

## 5. Historial de un equipo (2 minutos)

Abre **H107-PC-08** (desde el Dashboard o en `/equipos/H107-PC-08`).

> "Este equipo tiene 8 incidencias y falla cada 10 días. El gráfico muestra su evolución: de mayo a julio estaba
> en riesgo bajo porque aún no tenía historial suficiente; en agosto pasó a medio y desde septiembre está en alto.
> El sistema detectó que empezó a fallar seguido."

## 6. El modelo K-Means (3 minutos), como Andrea

Cierra sesión y entra como **Andrea**. En el Dashboard, pulsa **Recalcular ahora**.

> "K-Means agrupa los equipos por tres datos: cuántas veces fallaron, hace cuánto y cada cuánto. Al inicio, un
> laboratorio no tiene historial, así que el modelo aprende de un dataset real de Kaggle: 2 519 incidencias de
> equipos de TI. Cuando el laboratorio llega a 30 equipos con historial propio, aprende de sus propios datos. En
> este ejemplo pasó a fines de julio. Cada cálculo queda guardado con sus métricas, así se puede auditar."

Si preguntan por la calidad: la silueta mide qué tan separados están los grupos (de −1 a 1). La del modelo de
Kaggle es 0,52 y la de los datos propios ronda 0,39.

## 7. Administración (2 minutos)

| Acción | Qué decir |
|---|---|
| Laboratorios → **Desactivar H107** | "No se puede: tiene incidencias abiertas (RN-10)." |
| Equipos → **Nuevo equipo** con el código `H101PC31`, y luego `H101-PC-31` | "El código debe seguir el formato y empezar con el laboratorio y el tipo elegidos (RN-11, D-21). Un equipo nuevo entra en riesgo bajo." |
| Catálogo → seleccionar un tipo y **Guardar** | "Solo los tipos seleccionados entran a los formularios y al modelo; al guardar se recalcula el riesgo (RN-07, RN-08)." |
| Usuarios → desactivar a Andrea | "Nadie puede desactivar su propia cuenta (RN-05)." |
| Incidencias → abrir una → **Anular incidencia** | "Si se registró por error, se anula: no se borra, pero deja de contar para el riesgo (RN-22)." |

## 8. Reportes (1 minuto)

Abre **Reportes** y cambia el periodo a mayo–octubre.

> "Aquí se ve qué laboratorio y qué componente fallan más, cuánto tarda cada técnico y los diez equipos con más
> incidencias, con su riesgo actual."

## 9. Cierre (30 segundos)

> "NexoLab reemplaza el registro informal por un sistema con reglas, guarda el historial completo y usa
> inteligencia artificial para decir qué equipos atender primero. El sistema tiene 90 pruebas automáticas y cada
> decisión está documentada."

---

## Preguntas frecuentes

**¿Los datos son reales?**
El inventario sigue la descripción del Bloque H; las incidencias son simuladas para la demostración. El modelo y
los cálculos son reales.

**¿Por qué los números no coinciden con el Figma?**
El Figma es la referencia del diseño. Los números se calculan con los datos guardados y el modelo real.

**¿Por qué K-Means?**
No hay datos etiquetados de "este equipo falló gravemente", que es lo que necesitan otros modelos. K-Means encuentra
los grupos solo con los datos, y sus resultados se explican con números simples: fallas, días y frecuencia.

**¿Por qué un equipo que no falla hace meses puede estar en riesgo alto?**
El modelo pesa las tres variables a la vez. Un equipo con muchas fallas acumuladas puede quedar en el grupo alto
aunque su última falla sea antigua; al pasar el tiempo sin fallas, baja de nivel en los siguientes cálculos.

**¿Por qué 30 equipos para dejar de usar Kaggle?**
Con pocos equipos los grupos no son confiables (unos 10 por grupo es un mínimo práctico). Es configurable, porque el
sistema sirve para laboratorios de distintos tamaños (D-33).

**¿Qué pasa si se registra algo por error?**
El administrador lo anula. No se borra: queda como evidencia, pero no cuenta (RN-22).

**¿Cómo saben que funciona?**
Hay 90 pruebas automáticas del backend, y cada ejecución del modelo guarda sus métricas y los datos que usó.

---

## Si algo falla durante la presentación

| Problema | Solución |
|---|---|
| La página no carga | `docker compose --profile app ps`: los tres servicios deben decir "Up". Si no, `docker compose --profile app up -d` |
| "No se pudo iniciar sesión" | Revisa que el backend esté corriendo: `docker compose logs backend` |
| Los datos quedaron desordenados | `docker compose exec backend python manage.py seed_demo --reset` |
