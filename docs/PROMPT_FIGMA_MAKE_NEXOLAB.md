# PROMPT PARA FIGMA MAKE — NexoLab

> Copia todo el texto desde la línea "INICIO DEL PROMPT" hasta "FIN DEL PROMPT" y pégalo en Figma Make.
> Si la herramienta corta el texto o el resultado sale incompleto, usa las PARTES por separado (cada una empieza con "PARTE").

---

INICIO DEL PROMPT

Crea un prototipo web interactivo, en español, de **NexoLab**: un sistema de gestión de incidencias técnicas para los laboratorios de cómputo del Bloque H de una universidad. Además del registro de incidencias, el sistema agrupa los equipos por nivel de riesgo de falla (alto, medio, bajo) usando un modelo K-Means, y lo muestra en un dashboard.

Debe verse y comportarse como una aplicación real en funcionamiento: navegación entre pantallas, menús desplegables que funcionan, filtros que filtran, ventanas modales que abren y cierran, validaciones visibles y mensajes de confirmación.

## PARTE 1 — REGLAS OBLIGATORIAS

1. Todo el texto visible está en español (Ecuador). Fechas en formato dd/mm/aaaa y hora de 24 h (ej. 17/10/2026 09:15).
2. **No inventes campos.** Cada dato que se muestre debe salir de la lista de datos de la PARTE 3. No agregues columnas, filtros ni funciones que no estén descritas aquí.
3. **No uses textos de relleno** (lorem ipsum, "Usuario 1", "Equipo X", "123"). Usa exclusivamente los datos de ejemplo de la PARTE 3.
4. **Los datos deben ser coherentes entre pantallas.** Si el equipo H103-PC-03 está en riesgo alto en el dashboard, también debe aparecer en riesgo alto en su historial y en la lista de equipos. Los totales deben cuadrar.
5. Las opciones de los menús desplegables (laboratorios, tipos de equipo, componentes, acciones, roles) vienen de catálogos: muéstralas exactamente como están en la PARTE 3.
6. No hay pantalla de registro de usuarios ni de recuperación de contraseña. Los usuarios los crea el administrador.
7. Estilo profesional y limpio, tipo panel administrativo moderno. Diseño para escritorio de 1440 px de ancho, adaptable a tablet.

## PARTE 2 — SISTEMA DE DISEÑO

**Tipografía:** Inter. Títulos de página 24 px semibold; títulos de tarjeta 16 px semibold; texto 14 px; texto secundario 12 px.

**Colores:**
- Primario: #3B82F6 · hover: #1E40AF · acento: #7C3AED
- Botón principal: degradado de #3B82F6 a #7C3AED, texto blanco
- Texto principal: #1F2937 · texto secundario: #6B7280 · bordes: #D1D5DB · fondo de página: #F3F4F6 · tarjetas: #FFFFFF
- Éxito: #10B981 · advertencia: #F59E0B · error: #EF4444 (fondo de error #FEE2E2)

**Colores de riesgo (usar siempre los mismos):**
- Riesgo alto: #EF4444 (rojo)
- Riesgo medio: #F59E0B (amarillo/ámbar)
- Riesgo bajo: #10B981 (verde)

**Etiquetas (badges):**
- Prioridad: Alta (rojo), Media (ámbar), Baja (gris)
- Estado de incidencia: Abierta (azul), Cerrada (verde)
- Estado de equipo: Activo (verde), Retirado (gris)
- Método de clasificación: "Sin historial suficiente" (gris, con ícono de información)

**Componentes:** esquinas redondeadas 8 px, sombras suaves, íconos lineales (estilo Lucide). Tablas con encabezado fijo, filas de 48 px y paginación. Campos de formulario con etiqueta arriba, asterisco en obligatorios y mensaje de error en rojo debajo del campo.

**Estructura general (después del login):**
- Barra lateral izquierda fija con el logo "NexoLab" y el menú.
- Barra superior con el título de la página, la fecha actual y, a la derecha, el usuario conectado (nombre, rol) con menú desplegable: "Mi perfil" y "Cerrar sesión".

**Menú lateral:**
- Dashboard
- Incidencias
- Registrar incidencia
- Sección "Administración" (solo visible para el rol Administrador): Laboratorios, Equipos, Catálogo de equipos, Usuarios

Por defecto, el usuario conectado es **Andrea Villacís (Administradora)**. Agrega en el menú del usuario un interruptor de demostración "Ver como técnico" que cambia a **Carlos Mendoza (Técnico de soporte)** y oculta la sección Administración.

## PARTE 3 — DATOS DE EJEMPLO (usar exactamente estos)

### Usuarios
| Nombre | Correo | Rol | Estado | Último acceso |
|---|---|---|---|---|
| Andrea Villacís | andrea.villacis@gmail.com | Administrador | Activo | 17/10/2026 08:12 |
| Carlos Mendoza | carlos.mendoza@gmail.com | Técnico de soporte | Activo | 17/10/2026 07:58 |
| Luis Bravo | luis.bravo@gmail.com | Técnico de soporte | Inactivo | 02/08/2026 16:40 |

Carga de trabajo: Carlos Mendoza registró 168 incidencias y cerró 161. Luis Bravo registró 31 y cerró 31. Andrea Villacís registró 6 y cerró 6. Total: 205 incidencias (7 abiertas y 198 cerradas).

### Laboratorios (todos con responsable Carlos Mendoza, todos activos)
| Código | Nombre | Ubicación | Puestos | Equipos activos |
|---|---|---|---|---|
| H101 | Laboratorio 1 | Bloque H, planta baja | 10 | 28 (PC 10 · Monitor 10 · UPS 8) |
| H102 | Laboratorio 2 | Bloque H, planta baja | 10 | 30 (PC 10 · Monitor 10 · UPS 10) |
| H103 | Laboratorio de Redes | Bloque H, planta alta | 12 | 32 (PC 12 · Monitor 12 · UPS 8) |
| H104 | Laboratorio 4 | Bloque H, planta alta | 12 | 25 (Todo en uno 12 · UPS 12 · Televisor 1) |
| H105 | Laboratorio 5 | Bloque H, planta alta | 12 | 27 (Todo en uno 12 · UPS 12 · Televisor 3) |

Totales: **142 equipos activos** y **3 equipos retirados**.

### Catálogo de tipos de equipo (32 tipos; 5 activos)
Activos (usados en el Bloque H): PC de escritorio (PC), Monitor (MON), Todo en uno (AIO), UPS (UPS), Televisor (TV).
Inactivos: Laptop, Proyector, Impresora, Impresora multifunción, Escáner, Switch, Router, Punto de acceso inalámbrico, Servidor, Tablet, Pizarra digital, Cámara web, Parlantes, Micrófono, Disco duro externo, Almacenamiento en red (NAS), Firewall, Teléfono IP, Plotter, Lector de código de barras, Kiosco interactivo, Rack de comunicaciones, Cámara IP, Equipo de videoconferencia, Consola de audio, Cámara de documentos, Lector biométrico.

### Componentes afectados
PC, Monitor, Teclado, Mouse, UPS.

### Acciones al cerrar una incidencia
- Resuelto
- Requiere reemplazo (el equipo pasa automáticamente a estado Retirado)
- Derivado (enviado a taller externo; la incidencia se cierra)

### Prioridades
Alta, Media, Baja.

### Niveles de riesgo y acción recomendada
- Riesgo alto: "Revisar hoy"
- Riesgo medio: "Programar revisión esta semana"
- Riesgo bajo: "Monitoreo normal"

### Última ejecución del modelo de riesgo
- Ejecución n.º 27 · 17/10/2026 10:42 · Disparador: cierre de la incidencia INC-2026-0047
- Equipos analizados por K-Means: 45 (los demás no tienen historial suficiente)
- Duración: 0,3 s · Calidad de agrupamiento (silueta): 0,62 · Estado: Completada

### Resumen de riesgo (equipos activos)
- Riesgo alto: **6 equipos**
- Riesgo medio: **18 equipos**
- Riesgo bajo: **118 equipos** (21 clasificados por K-Means + 97 sin historial suficiente)
- Total: 142

### Perfil promedio de cada grupo
| Grupo | Incidencias promedio | Días desde la última falla | Falla cada (días) |
|---|---|---|---|
| Riesgo alto | 8,8 | 3 | 6 |
| Riesgo medio | 4,1 | 18 | 24 |
| Riesgo bajo | 2,3 | 64 | 71 |

### Equipos en riesgo alto
| Equipo | Tipo | Laboratorio | Ubicación | Incidencias | Última falla | Falla cada |
|---|---|---|---|---|---|---|
| H103-PC-03 | PC de escritorio | H103 | Fila 1, puesto 3 | 11 | hace 0 días | 5 días |
| H105-AIO-04 | Todo en uno | H105 | Fila 1, puesto 4 | 10 | hace 1 día | 5 días |
| H103-PC-07 | PC de escritorio | H103 | Fila 2, puesto 7 | 9 | hace 0 días | 6 días |
| H101-UPS-02 | UPS | H101 | Fila 1, puesto 2 | 8 | hace 1 día | 7 días |
| H102-PC-10 | PC de escritorio | H102 | Fila 3, puesto 10 | 8 | hace 2 días | 9 días |
| H103-MON-03 | Monitor | H103 | Fila 1, puesto 3 | 7 | hace 6 días | 8 días |

### Algunos equipos en riesgo medio
| Equipo | Tipo | Laboratorio | Incidencias | Última falla | Falla cada |
|---|---|---|---|---|---|
| H104-AIO-08 | Todo en uno | H104 | 5 | hace 2 días | 20 días |
| H101-PC-05 | PC de escritorio | H101 | 4 | hace 4 días | 22 días |
| H102-UPS-06 | UPS | H102 | 3 | hace 4 días | 28 días |
| H105-UPS-09 | UPS | H105 | 4 | hace 15 días | 25 días |

### Algunos equipos en riesgo bajo
| Equipo | Tipo | Laboratorio | Incidencias | Clasificación |
|---|---|---|---|---|
| H101-MON-07 | Monitor | H101 | 2 | K-Means (última falla hace 70 días, falla cada 68 días) |
| H102-MON-01 | Monitor | H102 | 1 | Sin historial suficiente |
| H104-TV-01 | Televisor | H104 | 0 | Sin historial suficiente |

### Equipos retirados
H103-PC-09 (retirado el 12/10/2026), H101-MON-04 (retirado el 21/09/2026), H105-UPS-01 (retirado el 05/09/2026).

### Incidencias abiertas (7)
| N.º | Equipo | Componente | Prioridad | Fecha de la falla | Registrada por |
|---|---|---|---|---|---|
| INC-2026-0048 | H103-PC-07 | Teclado | Alta | 17/10/2026 09:15 | Carlos Mendoza |
| INC-2026-0046 | H105-AIO-04 | PC | Alta | 16/10/2026 15:40 | Carlos Mendoza |
| INC-2026-0045 | H101-UPS-02 | UPS | Alta | 16/10/2026 11:05 | Carlos Mendoza |
| INC-2026-0044 | H102-PC-10 | Mouse | Media | 15/10/2026 10:30 | Carlos Mendoza |
| INC-2026-0043 | H104-AIO-08 | PC | Media | 15/10/2026 08:50 | Andrea Villacís |
| INC-2026-0040 | H101-PC-05 | Monitor | Baja | 13/10/2026 14:20 | Carlos Mendoza |
| INC-2026-0039 | H102-UPS-06 | UPS | Media | 13/10/2026 09:00 | Carlos Mendoza |

### Incidencias cerradas recientes
| N.º | Equipo | Componente | Prioridad | Falla | Cierre | Tiempo de atención | Acción | Diagnóstico | Cerrada por |
|---|---|---|---|---|---|---|---|---|---|
| INC-2026-0047 | H103-PC-03 | Mouse | Media | 17/10/2026 08:00 | 17/10/2026 08:25 | 25 min | Resuelto | Cable USB dañado; se reemplazó el mouse. | Carlos Mendoza |
| INC-2026-0042 | H103-PC-03 | PC | Alta | 14/10/2026 10:00 | 14/10/2026 12:10 | 2 h 10 min | Resuelto | Fuente de poder con conexión floja; se aseguró el conector. | Carlos Mendoza |
| INC-2026-0041 | H103-PC-09 | PC | Alta | 12/10/2026 08:30 | 12/10/2026 09:15 | 45 min | Requiere reemplazo | Placa madre dañada, sin reparación posible. | Carlos Mendoza |
| INC-2026-0038 | H105-AIO-04 | PC | Alta | 10/10/2026 13:00 | 10/10/2026 13:40 | 40 min | Derivado | Falla de placa; enviado a taller externo. | Carlos Mendoza |
| INC-2026-0035 | H103-PC-03 | Teclado | Baja | 08/10/2026 10:10 | 08/10/2026 10:20 | 10 min | Resuelto | Tecla atascada; limpieza del teclado. | Carlos Mendoza |

### Indicadores generales
- Incidencias abiertas: 7 (3 de prioridad alta)
- Tiempo promedio de atención (últimos 30 días): 48 min
- Equipos en riesgo alto: 6
- Equipos activos: 142

## PARTE 4 — PANTALLAS

### 1. Iniciar sesión
- Pantalla dividida: a la izquierda un panel con degradado (#3B82F6 → #7C3AED), el logo "NexoLab" y la frase "Gestión de incidencias y riesgo de equipos"; a la derecha el formulario.
- Campos: "Correo electrónico" y "Contraseña" (con botón de mostrar/ocultar).
- Botón "Iniciar sesión" (deshabilitado hasta llenar ambos campos; muestra indicador de carga al presionar).
- Debajo, texto: "¿Olvidaste tu contraseña? Contacta al administrador del sistema." (no es un enlace).
- Estados a mostrar: vacío, campo con foco, error de formato de correo ("Ingresa un correo válido"), error de credenciales con un único mensaje genérico ("Correo o contraseña incorrectos") y cuenta desactivada ("Tu cuenta está desactivada. Contacta al administrador.").
- Al iniciar sesión, navega al Dashboard.

### 2. Dashboard de riesgo
- Fila de 4 tarjetas con los indicadores generales.
- Franja informativa del modelo: "Riesgo actualizado el 17/10/2026 10:42 · 45 equipos analizados por K-Means · 97 sin historial suficiente". Para el administrador, un botón secundario "Recalcular ahora" que muestra un indicador de carga y luego un mensaje de éxito.
- Filtros: Laboratorio (Todos, H101…H105) y Tipo de equipo (solo los 5 tipos activos). Al filtrar, se actualizan las tres columnas.
- Tres columnas, una por nivel de riesgo, con su color, el número de equipos y la acción recomendada. Debajo del título de cada columna, en texto pequeño, el perfil promedio del grupo (ej. "Promedio: 8,8 incidencias · última falla hace 3 días · falla cada 6 días").
- Cada equipo se muestra como tarjeta: código, tipo, laboratorio, y sus 3 datos (incidencias, última falla, falla cada). Si su clasificación es "Sin historial suficiente", mostrar el badge gris en vez de los datos que no tiene. Al hacer clic, abre su Historial.
- La columna de riesgo bajo muestra solo los primeros equipos y un enlace "Ver los 118 equipos".
- Sección inferior "Incidencias abiertas": tabla con las 7 incidencias abiertas (n.º, equipo, componente, prioridad, tiempo transcurrido desde la falla, ej. "hace 2 h") y botón "Cerrar" en cada fila que abre el modal de cierre.
- Botón principal arriba a la derecha: "+ Registrar incidencia".

### 3. Registrar incidencia
- Dos columnas: formulario a la izquierda, ficha del equipo a la derecha.
- Campos del formulario:
  - Laboratorio* (desplegable con H101…H105)
  - Equipo* (desplegable deshabilitado hasta elegir laboratorio; al elegirlo, muestra solo los equipos activos de ese laboratorio, en formato "H103-PC-03 · PC de escritorio · Fila 1, puesto 3")
  - Componente afectado* (botones seleccionables: PC, Monitor, Teclado, Mouse, UPS)
  - Prioridad* (Alta, Media, Baja)
  - Fecha y hora de la falla* (por defecto, la fecha y hora actual; editable; no puede ser futura)
  - Descripción* (área de texto con contador "0/500"; mínimo 10 caracteres)
  - Texto de solo lectura: "Registrada por: [usuario conectado]"
- Botones: "Cancelar" (secundario) y "Registrar incidencia" (principal).
- Ficha del equipo (aparece al elegir equipo; antes muestra un estado vacío "Selecciona un equipo para ver su información"): código, tipo, laboratorio, ubicación, especificaciones ("Intel Core i5, 8 GB RAM"), estado, badge de riesgo actual con sus 3 datos, y sus últimas 3 incidencias.
- Validaciones visibles: campos obligatorios vacíos, descripción menor a 10 caracteres, fecha futura.
- Al guardar: mensaje de éxito "Incidencia INC-2026-0049 registrada" y regreso a la lista de incidencias.

### 4. Incidencias
- Pestañas: "Abiertas (7)", "Cerradas", "Todas".
- Filtros: buscar por número o código de equipo, Laboratorio, Prioridad y rango de fechas.
- Tabla: N.º, Equipo, Laboratorio, Componente, Prioridad, Estado, Fecha de la falla, Tiempo de atención (en abiertas: "Abierta hace 3 h"), Registrada por, Cerrada por, Acción.
- En filas abiertas, botón "Cerrar"; en cerradas, botón "Ver" que abre el detalle en modo lectura.
- Paginación al pie ("Mostrando 1–7 de 7").
- Estado vacío cuando un filtro no encuentra resultados: "No hay incidencias con estos filtros".

### 5. Historial del equipo
- Ruta de navegación: Equipos › H103-PC-03.
- Encabezado: código, tipo, laboratorio, ubicación, especificaciones, badge de estado (Activo) y botón "+ Registrar incidencia para este equipo".
- Tarjeta de riesgo actual: nivel (Riesgo alto), acción recomendada, sus 3 datos (11 incidencias, última falla hace 0 días, falla cada 5 días), método (K-Means) y fecha de cálculo.
- Gráfico pequeño "Evolución del riesgo": riesgo bajo en agosto, medio en septiembre, alto en octubre.
- Tabla de incidencias del equipo: n.º, fecha de la falla, componente, prioridad, estado, diagnóstico, acción, tiempo de atención, técnico. Usar las incidencias de H103-PC-03 de la PARTE 3.

### 6. Modal "Cerrar incidencia"
- Resumen de solo lectura: n.º, equipo, componente, prioridad, fecha de la falla y descripción.
- Diagnóstico* (área de texto, contador, mínimo 10 caracteres)
- Acción tomada* (opciones: Resuelto, Requiere reemplazo, Derivado)
- Si se elige "Requiere reemplazo", mostrar aviso ámbar: "El equipo [código] pasará a estado Retirado y dejará de incluirse en el cálculo de riesgo."
- Observaciones (opcional)
- Fecha y hora de cierre* (por defecto la actual; no puede ser anterior a la fecha de la falla)
- Vista previa calculada: "Tiempo de atención: 1 h 25 min"
- Texto de solo lectura: "Cerrada por: [usuario conectado]"
- Botones: "Cancelar" y "Cerrar incidencia".
- Al guardar: mensaje "Incidencia cerrada. Actualizando el riesgo de los equipos…" y luego "Riesgo actualizado".

### 7. Mi perfil
- Datos de solo lectura: nombre, correo, rol y último acceso.
- Formulario "Cambiar contraseña": contraseña actual*, nueva contraseña* (mínimo 8 caracteres, con indicador de requisitos) y confirmar contraseña*. Error si no coinciden.

### 8. Administración › Laboratorios
- Botón "+ Nuevo laboratorio".
- Tabla: Código, Nombre, Ubicación, Puestos, Responsable, Equipos activos (con el desglose por tipo en texto pequeño), Incidencias abiertas, Estado, Acciones (Editar, Desactivar).
- Modal crear/editar: Código* (no editable al editar), Nombre*, Ubicación (opcional, con ayuda "Ej.: Bloque H, planta alta"), Puestos de trabajo* (número), Técnico responsable (desplegable con técnicos activos; opcional), Activo (interruptor).
- Error de ejemplo: "Ya existe un laboratorio con el código H101".
- Al desactivar, pedir confirmación.

### 9. Administración › Equipos
- Botón "+ Nuevo equipo".
- Filtros: buscar por código, Laboratorio, Tipo (solo tipos activos), Estado (Activo/Retirado) y Riesgo.
- Tabla: Código, Tipo, Laboratorio, Ubicación física, Estado, Riesgo actual (badge), Incidencias, Acciones (Ver historial, Editar).
- Modal crear/editar: Código* (formato LAB-TIPO-NN, ej. H103-PC-13), Laboratorio*, Tipo de equipo* (solo los 5 tipos activos), Ubicación física (opcional, "Fila 2, puesto 5"), Especificaciones (opcional), Estado (solo al editar).
- Si al editar se cambia el estado a Retirado: pedir confirmación ("El equipo dejará de aparecer en los formularios y en el cálculo de riesgo").

### 10. Administración › Catálogo de equipos (pantalla clave)
- Título: "Catálogo de equipos". Subtítulo: "Selecciona los tipos de equipo que utiliza tu institución. Solo los tipos activos aparecen en los formularios y en el cálculo de riesgo."
- Indicador destacado: "Tipos activos: 5 de 32".
- Buscador, botones "Seleccionar todos" y "Desmarcar todos", y botón "+ Agregar tipo al catálogo" (modal con Código* y Nombre*).
- Cuadrícula de tarjetas con los 32 tipos: ícono, nombre, código, interruptor de activo y, si tiene equipos, "N equipos registrados". Las tarjetas activas se resaltan con borde azul.
- Si se intenta desactivar un tipo con equipos registrados (ej. UPS, 50 equipos), mostrar aviso: "Hay 50 equipos de este tipo. Dejarán de aparecer en los formularios y en el cálculo de riesgo."
- No se permite dejar 0 tipos activos: mensaje "Debe haber al menos un tipo de equipo activo".
- Barra inferior fija con los cambios pendientes ("2 cambios sin guardar"), botón "Descartar" y botón "Guardar configuración". Al guardar, confirmar: "Se recalculará el riesgo de los equipos. ¿Continuar?".

### 11. Administración › Usuarios
- Botón "+ Nuevo usuario".
- Tabla: Nombre, Correo, Rol, Estado, Último acceso, Laboratorios a cargo, Incidencias registradas, Incidencias cerradas, Acciones (Editar, Restablecer contraseña, Desactivar/Activar).
- Modal crear/editar: Nombres*, Apellidos*, Correo*, Rol* (Técnico de soporte, Administrador), Contraseña temporal* (solo al crear).
- "Restablecer contraseña" abre un modal para asignar una nueva contraseña temporal.
- El usuario conectado no puede desactivarse a sí mismo (botón deshabilitado con explicación).
- Error de ejemplo: "Ya existe un usuario con este correo".

## PARTE 5 — ESTADOS Y COMPORTAMIENTOS GLOBALES

- Mensajes emergentes (toast) arriba a la derecha: éxito (verde), error (rojo), información (azul). Se cierran solos a los 4 segundos.
- Diálogos de confirmación para acciones importantes (desactivar, retirar, guardar catálogo).
- Estados de carga con esqueletos grises en tablas y tarjetas.
- Estado vacío con ícono y texto en tablas sin resultados.
- Pantalla "Acceso restringido" si un técnico intenta entrar a una sección de Administración.
- Pantalla de error general: "No se pudo cargar la información. Intenta de nuevo." con botón "Reintentar".

FIN DEL PROMPT
