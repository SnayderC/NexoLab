"""
Incidencias de demostración para seed_demo: las mismas 33 de frontend/src/mocks/incidents.ts
(7 abiertas y 26 cerradas, parte 3 de docs/PROMPT_FIGMA_MAKE_NEXOLAB.md y Figma 3.1).
El guion bajo del nombre evita que Django lo tome como un comando.
"""

from datetime import timedelta

from django.utils.dateparse import parse_datetime

ANDREA_ID = 1
CARLOS_ID = 2


def _open(id, device, component, priority, opened_at, description, reported_by=CARLOS_ID):
    return dict(id=id, device=device, component=component, priority=priority, opened_at=opened_at,
                description=description, reported_by=reported_by, closing=None)


def _closed(id, device, component, priority, opened_at, description, minutes, action, diagnosis,
            reported_by=CARLOS_ID, closed_by=CARLOS_ID):
    opened = parse_datetime(opened_at)
    return dict(id=id, device=device, component=component, priority=priority, opened_at=opened_at,
                description=description, reported_by=reported_by,
                closing=dict(closed_at=opened + timedelta(minutes=minutes), minutes=minutes, action=action,
                             diagnosis=diagnosis, closed_by=closed_by))


def _history(id, device, component, priority, opened_at, minutes, description, diagnosis):
    """Historial de H103-PC-03 y H103-PC-09 del Figma 4.0 y 4.2 (todas resueltas por Carlos)."""
    return _closed(id, device, component, priority, f'{opened_at}:00-05:00', description, minutes, 'RESOLVED',
                   diagnosis)


INCIDENTS = [
    # Abiertas
    _open(48, 'H103-PC-07', 'KEYBOARD', 'HIGH', '2026-10-17T09:15:00-05:00', 'Varias teclas no responden al presionarlas.'),
    _open(46, 'H105-AIO-04', 'PC', 'HIGH', '2026-10-16T15:40:00-05:00', 'El equipo se apaga solo durante la clase.'),
    _open(45, 'H101-UPS-02', 'UPS', 'HIGH', '2026-10-16T11:05:00-05:00', 'El UPS emite pitidos y no mantiene encendido el equipo.'),
    _open(44, 'H102-PC-10', 'MOUSE', 'MEDIUM', '2026-10-15T10:30:00-05:00', 'El puntero del mouse se mueve de forma errática.'),
    _open(43, 'H104-AIO-08', 'PC', 'MEDIUM', '2026-10-15T08:50:00-05:00', 'El equipo tarda varios minutos en iniciar.', reported_by=ANDREA_ID),
    _open(40, 'H101-PC-05', 'MONITOR', 'LOW', '2026-10-13T14:20:00-05:00', 'El monitor parpadea de vez en cuando.'),
    _open(39, 'H102-UPS-06', 'UPS', 'MEDIUM', '2026-10-13T09:00:00-05:00', 'La batería del UPS dura muy poco.'),
    # Cerradas
    _closed(47, 'H103-PC-03', 'MOUSE', 'MEDIUM', '2026-10-17T08:00:00-05:00', 'El mouse no responde al moverlo.',
            25, 'RESOLVED', 'Cable USB dañado; se reemplazó el mouse.'),
    _closed(42, 'H103-PC-03', 'PC', 'HIGH', '2026-10-14T10:00:00-05:00', 'El equipo no enciende.',
            130, 'RESOLVED', 'Fuente de poder con conexión floja; se aseguró el conector.'),
    _closed(41, 'H103-PC-09', 'PC', 'HIGH', '2026-10-12T08:30:00-05:00', 'El equipo no arranca y no muestra imagen.',
            45, 'REPLACEMENT_REQUIRED', 'Placa madre dañada, sin reparación posible.'),
    _closed(38, 'H105-AIO-04', 'PC', 'HIGH', '2026-10-10T13:00:00-05:00', 'La pantalla se queda en negro al iniciar.',
            40, 'REFERRED', 'Falla de placa; enviado a taller externo.'),
    _history(29, 'H103-PC-03', 'PC', 'HIGH', '2026-10-03T09:40', 35, 'El equipo no enciende.', 'No enciende; se reemplazó el cable de poder.'),
    _history(25, 'H103-PC-03', 'PC', 'MEDIUM', '2026-09-28T14:15', 65, 'El sistema operativo no carga.', 'El sistema operativo no carga; se reparó el arranque.'),
    _history(21, 'H103-PC-03', 'PC', 'HIGH', '2026-09-23T08:30', 100, 'El equipo se apaga por calor.', 'Sobrecalentamiento; limpieza interna y cambio de pasta térmica.'),
    _history(17, 'H103-PC-03', 'MOUSE', 'LOW', '2026-09-18T11:00', 10, 'El clic izquierdo no responde.', 'Falla el clic izquierdo; se reemplazó el mouse.'),
    _history(10, 'H103-PC-03', 'KEYBOARD', 'LOW', '2026-09-08T15:30', 20, 'Se derramó líquido sobre el teclado.', 'Teclado con líquido derramado; se reemplazó.'),
    _history(6, 'H103-PC-03', 'PC', 'HIGH', '2026-09-02T09:00', 45, 'El equipo no arranca el sistema.', 'No detecta el disco duro; se reconectó el cable SATA.'),
    _history(2, 'H103-PC-03', 'PC', 'MEDIUM', '2026-08-27T10:00', 30, 'El ventilador hace mucho ruido.', 'Ventilador ruidoso; limpieza del ventilador.'),
    _history(31, 'H103-PC-09', 'PC', 'HIGH', '2026-10-04T11:20', 90, 'El equipo se apaga de repente.', 'Apagados repentinos; se reemplazó la fuente de poder.'),
    _history(22, 'H103-PC-09', 'PC', 'MEDIUM', '2026-09-24T09:10', 40, 'El equipo no arranca.', 'No arranca; se reconectó la memoria RAM.'),
    _closed(14, 'H103-PC-03', 'PC', 'MEDIUM', '2026-09-13T10:20:00-05:00', 'El equipo se reinicia solo.',
            50, 'RESOLVED', 'Reinicios inesperados; se actualizaron los controladores.',
            reported_by=ANDREA_ID, closed_by=ANDREA_ID),
    # Equipos retirados del Figma 5.5: la última incidencia de cada uno terminó en "Requiere reemplazo".
    _closed(12, 'H101-MON-04', 'MONITOR', 'MEDIUM', '2026-09-04T08:40:00-05:00', 'La pantalla muestra líneas horizontales.',
            30, 'RESOLVED', 'Cable de video suelto; se reconectó.'),
    _closed(20, 'H101-MON-04', 'MONITOR', 'HIGH', '2026-09-21T09:00:00-05:00', 'El monitor no enciende.',
            60, 'REPLACEMENT_REQUIRED', 'Panel dañado; sin reparación posible.'),
    _closed(1, 'H105-UPS-01', 'UPS', 'LOW', '2026-08-20T10:00:00-05:00', 'El UPS emite un pitido constante.',
            15, 'RESOLVED', 'Alarma activada por sobrecarga; se redistribuyeron las conexiones.'),
    _closed(3, 'H105-UPS-01', 'UPS', 'MEDIUM', '2026-08-25T14:00:00-05:00', 'La batería dura pocos minutos.',
            25, 'RESOLVED', 'Batería descalibrada; se realizó un ciclo de carga.'),
    _closed(4, 'H105-UPS-01', 'UPS', 'HIGH', '2026-08-31T09:00:00-05:00', 'El UPS se apaga al cortar la energía.',
            40, 'RESOLVED', 'Fusible interno quemado; se reemplazó.'),
    _closed(5, 'H105-UPS-01', 'UPS', 'HIGH', '2026-09-05T10:30:00-05:00', 'El UPS no retiene carga.',
            60, 'REPLACEMENT_REQUIRED', 'Batería agotada; el equipo no admite reemplazo de batería.'),
    # Cerradas que aparecen en el Figma 3.1.
    _closed(37, 'H101-UPS-02', 'UPS', 'HIGH', '2026-10-09T14:00:00-05:00', 'El UPS se apaga al conectar el equipo.',
            50, 'RESOLVED', 'Conector de salida suelto; se ajustó la conexión.'),
    _closed(36, 'H102-PC-10', 'PC', 'MEDIUM', '2026-10-09T09:30:00-05:00', 'El equipo se congela al abrir varios programas.',
            45, 'RESOLVED', 'Memoria RAM mal asentada; se reinstaló el módulo.'),
    _closed(33, 'H105-AIO-04', 'PC', 'HIGH', '2026-10-06T08:20:00-05:00', 'El equipo no muestra imagen al encender.',
            70, 'RESOLVED', 'Cable interno de pantalla desconectado; se reconectó.'),
    _closed(34, 'H103-PC-07', 'MOUSE', 'LOW', '2026-10-07T11:00:00-05:00', 'El clic derecho del mouse no funciona.',
            10, 'RESOLVED', 'Mouse defectuoso; se reemplazó por uno nuevo.'),
    _closed(32, 'H104-AIO-08', 'KEYBOARD', 'LOW', '2026-10-05T15:00:00-05:00', 'El teclado escribe caracteres repetidos.',
            15, 'RESOLVED', 'Suciedad bajo las teclas; limpieza del teclado.',
            reported_by=ANDREA_ID, closed_by=ANDREA_ID),
    _closed(35, 'H103-PC-03', 'KEYBOARD', 'LOW', '2026-10-08T10:10:00-05:00', 'Una tecla del teclado está atascada.',
            10, 'RESOLVED', 'Tecla atascada; limpieza del teclado.'),
]
