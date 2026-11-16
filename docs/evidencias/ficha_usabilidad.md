# Prueba de usabilidad de NexoLab (RNF06, CP33)

> **Para quién es:** para quien conduce la prueba (el "facilitador") con 5 participantes.
> **Meta de la tesis (RNF06):** al menos **4 de 5** participantes completan **sin ayuda** las tres tareas: registrar una
> incidencia, consultar el historial de un equipo y cerrar una solicitud.
> **Duración:** unos 15 minutos por participante.

---

## Antes de empezar (facilitador)

1. Levanta el sistema y deja los datos limpios:
   ```bash
   docker compose --profile app up -d
   docker compose exec backend python manage.py seed_demo --reset
   ```
   Repite el `seed_demo --reset` **entre participantes**, para que todos encuentren lo mismo.
2. Abre http://localhost:5173 en el navegador, **sin iniciar sesión**.
3. Ten a mano la contraseña de Carlos (`DEMO_PASSWORD` en `backend/.env`). El participante entra como técnico:
   `carlos.mendoza@gmail.com`.
4. Ten un cronómetro y esta ficha impresa (una por participante).

**Participantes:** idealmente personas parecidas a los usuarios reales, como técnicos o ayudantes de laboratorio,
o estudiantes de la carrera que no hayan visto el sistema.

## Reglas para el facilitador

- Lee la tarea en voz alta y entrégala escrita. **No expliques cómo hacerla.**
- Si el participante pregunta, responde "Haz lo que harías si estuvieras solo". Si se bloquea más de **2 minutos** o
  pide ayuda dos veces, puedes ayudar, pero la tarea se marca **"Con ayuda"**.
- Pide que piense en voz alta ("Ahora busco…") y anota dónde duda.
- Una tarea vale como **"Sin ayuda"** solo si se completa correctamente sin ninguna indicación.

---

## Tareas (se leen al participante)

**Tarea 0: entrar.** "Inicia sesión con el correo carlos.mendoza@gmail.com y esta contraseña." *(No se evalúa.)*

**Tarea 1: registrar una incidencia.**
> "En el laboratorio **H104**, el teclado del equipo **H104-PC-12** tiene varias teclas que no responden. Registra la
> incidencia con prioridad **Baja**."

Se completa cuando la incidencia aparece en la lista con equipo H104-PC-12, componente Teclado y prioridad Baja.

**Tarea 2: consultar el historial de un equipo.**
> "Busca el equipo **H107-PC-08** y dime **cuántas incidencias** tiene y **qué nivel de riesgo** tiene ahora."

Se completa cuando responde: **8 incidencias** y **riesgo alto**. *(Datos de `seed_demo` al 16/11/2026; confírmalos
en pantalla antes de empezar, porque el riesgo cambia con la fecha.)*

**Tarea 3: cerrar una solicitud.**
> "Ya se cambió el teclado del H104-PC-12 por uno de repuesto. **Cierra** esa incidencia."

Se completa cuando la incidencia queda **Cerrada**, con una solución aplicada coherente (por ejemplo, "Se reemplazó el
teclado") y el resultado **Resuelto**. Si elige "Requiere reemplazo", la tarea **no** se completa: ese resultado retira
el equipo entero.

---

## Ficha del participante

**Participante N.º:** ____ **Fecha:** ____/____/2026 **Perfil:** ☐ técnico ☐ estudiante ☐ docente ☐ otro: ______
**¿Usa sistemas de tickets o inventario?** ☐ sí ☐ no

| Tarea | Resultado | Tiempo | Errores o dudas observadas |
|---|---|---|---|
| 1. Registrar incidencia | ☐ Sin ayuda ☐ Con ayuda ☐ No completó | ___ min ___ s | |
| 2. Consultar historial | ☐ Sin ayuda ☐ Con ayuda ☐ No completó | ___ min ___ s | |
| 3. Cerrar solicitud | ☐ Sin ayuda ☐ Con ayuda ☐ No completó | ___ min ___ s | |

**¿Completó las 3 tareas sin ayuda?** ☐ Sí ☐ No

### Cuestionario SUS (al terminar las tareas)

El participante marca de **1** (totalmente en desacuerdo) a **5** (totalmente de acuerdo).

| # | Afirmación | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| 1 | Creo que me gustaría usar este sistema con frecuencia. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 2 | Encontré el sistema innecesariamente complejo. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 3 | Pensé que el sistema era fácil de usar. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 4 | Creo que necesitaría ayuda de una persona técnica para poder usar este sistema. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 5 | Encontré que las distintas funciones del sistema estaban bien integradas. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 6 | Pensé que había demasiadas inconsistencias en el sistema. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 7 | Imagino que la mayoría de las personas aprendería a usar este sistema muy rápido. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 8 | Encontré el sistema muy difícil de usar. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 9 | Me sentí muy seguro usando el sistema. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 10 | Necesité aprender muchas cosas antes de poder usar el sistema. | ☐ | ☐ | ☐ | ☐ | ☐ |

**Comentario libre:** ¿Qué fue lo más difícil? ¿Qué cambiarías?

______________________________________________________________________________

---

## Cómo calcular el puntaje SUS

Para cada participante:
1. En las afirmaciones **impares** (1, 3, 5, 7, 9): respuesta − 1.
2. En las **pares** (2, 4, 6, 8, 10): 5 − respuesta.
3. Suma los 10 valores y multiplica por **2,5**. El resultado va de 0 a 100.

Ejemplo: si las respuestas son 4, 2, 5, 1, 4, 2, 5, 1, 4, 2, los impares dan 3+4+3+4+3 = 17 y los pares 3+4+3+4+3 = 17.
Total 34 × 2,5 = **85**.

**Cómo se interpreta** (Bangor, Kortum y Miller, 2009; la media de muchos estudios es 68): por debajo de 50, no
aceptable; de 50 a 70, marginal; 70 o más, aceptable; 85 o más, excelente.

**Referencias para la tesis:**
- Brooke, J. (1996). SUS: A "quick and dirty" usability scale. En *Usability Evaluation in Industry* (pp. 189–194).
  Taylor & Francis.
- Bangor, A., Kortum, P., & Miller, J. (2009). Determining what individual SUS scores mean: Adding an adjective rating
  scale. *Journal of Usability Studies, 4*(3), 114–123.

---

## Resumen de resultados (para la tesis)

| Participante | Perfil | Tarea 1 | Tarea 2 | Tarea 3 | 3 sin ayuda | SUS |
|---|---|---|---|---|---|---|
| P1 | | | | | | |
| P2 | | | | | | |
| P3 | | | | | | |
| P4 | | | | | | |
| P5 | | | | | | |
| **Total** | | __ / 5 | __ / 5 | __ / 5 | **__ / 5** | **promedio __** |

**RNF06 se cumple** si en la columna "3 sin ayuda" hay **4 o más** "Sí".
Anota también los problemas que se repitan en los comentarios: son mejoras para el capítulo de recomendaciones.
