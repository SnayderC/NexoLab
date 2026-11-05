"""
Inventario e historial de demostración del Bloque H para seed_demo (D-42).

- Inventario: 10 laboratorios (H101 a H109, con H106A y H106B). Cada uno tiene 30 computadoras (H107 tiene 60),
  una PC del docente, 1 o 2 aires acondicionados y 1 o 2 televisores. H103 y H104 tienen PCs gamer con un UPS
  por puesto; H105 tiene computadoras todo en uno. El monitor, el teclado y el mouse son parte de cada PC: si
  fallan, se registran como componente afectado de la PC (D-02).
- Historial: incidencias de mayo a octubre de 2026 (más unas abiertas a fines de octubre e inicios de noviembre)
  con patrones realistas: pocos equipos problemáticos, la mayoría con pocas fallas, los aires fallan más en los
  meses de calor y unos equipos se retiran con "Requiere reemplazo".

Todo se genera con una semilla fija: cada carga produce exactamente los mismos datos.
El guion bajo del nombre evita que Django lo tome como un comando.
"""

import random
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

TZ = ZoneInfo('America/Guayaquil')
SEED = 2026

ANDREA_ID, CARLOS_ID, LUIS_ID = 1, 2, 3
# Luis dejó de trabajar el 02/08/2026 (su cuenta está desactivada): antes de esa fecha también atendía.
LUIS_LAST_DAY = date(2026, 8, 2)

PERIOD_START = date(2026, 5, 4)
PERIOD_END = date(2026, 10, 30)
OPEN_START = date(2026, 10, 22)
OPEN_END = date(2026, 11, 4)

# ---------- Inventario ----------

# (código, nombre, ubicación, tipo de computadora, cantidad de PCs, aires, televisores)
LABORATORIES = [
    ('H101', 'Laboratorio H101', 'Bloque H, planta baja', 'PC', 30, 1, 1),
    ('H102', 'Laboratorio H102', 'Bloque H, planta baja', 'PC', 30, 2, 1),
    ('H103', 'Laboratorio H103', 'Bloque H, planta baja', 'GAMER', 30, 2, 2),
    ('H104', 'Laboratorio H104', 'Bloque H, planta baja', 'GAMER', 30, 2, 1),
    ('H105', 'Laboratorio H105', 'Bloque H, planta alta', 'AIO', 30, 1, 2),
    ('H106A', 'Laboratorio H106A', 'Bloque H, planta alta', 'PC', 30, 1, 1),
    ('H106B', 'Laboratorio H106B', 'Bloque H, planta alta', 'PC', 30, 1, 1),
    ('H107', 'Laboratorio H107', 'Bloque H, planta alta', 'PC', 60, 2, 2),
    ('H108', 'Laboratorio H108', 'Bloque H, planta alta', 'PC', 30, 2, 1),
    ('H109', 'Laboratorio H109', 'Bloque H, planta alta', 'PC', 30, 1, 2),
]

SPECIFICATIONS = {
    'PC': 'Intel Core i5, 8 GB RAM, SSD 256 GB; monitor 22", teclado y mouse USB',
    'GAMER': 'Intel Core i7, 16 GB RAM, NVIDIA RTX 3060, SSD 512 GB; monitor 24", teclado y mouse gamer',
    'AIO': 'Todo en uno Intel Core i5, 8 GB RAM, SSD 256 GB, pantalla 23,8"',
    'DOC': 'Intel Core i7, 16 GB RAM, SSD 512 GB; monitor 24"',
    'UPS': '1000 VA, 600 W',
    'TV': 'Smart TV 55" 4K, entrada HDMI',
    'AC': 'Split de 24 000 BTU',
}

# Equipos dados de baja con "Requiere reemplazo": ocupan un número después de los que siguen en uso.
RETIRED = {
    'H108-TV-02': datetime(2026, 7, 14, 10, 30, tzinfo=TZ),
    'H102-PC-31': datetime(2026, 8, 19, 9, 45, tzinfo=TZ),
    'H104-UPS-31': datetime(2026, 9, 23, 11, 15, tzinfo=TZ),
}

SEATS_PER_ROW = 6


@dataclass
class DemoDevice:
    code: str
    laboratory: str
    type_code: str  # código del tipo en el catálogo: PC, AIO, UPS, TV, AC, DOC
    kind: str  # perfil de fallas: PC, GAMER, AIO, DOC, UPS, TV, AC
    location: str
    specifications: str
    retired_at: datetime | None = None


def _seat(number):
    return f'Fila {(number - 1) // SEATS_PER_ROW + 1}, puesto {number}'


def build_inventory() -> list[DemoDevice]:
    devices = []
    for lab, _name, _location, kind, pc_count, ac_count, tv_count in LABORATORIES:
        type_code = 'AIO' if kind == 'AIO' else 'PC'

        def add(code_type, device_kind, number, location, spec_key):
            code = f'{lab}-{code_type}-{number:02d}'
            devices.append(DemoDevice(code, lab, code_type, device_kind, location, SPECIFICATIONS[spec_key],
                                      RETIRED.get(code)))

        for number in range(1, pc_count + 1):
            add(type_code, kind, number, _seat(number), kind)
            if kind == 'GAMER':  # un UPS por puesto
                add('UPS', 'UPS', number, _seat(number), 'UPS')
        add('DOC', 'DOC', 1, 'Escritorio del docente', 'DOC')
        for number in range(1, ac_count + 1):
            add('AC', 'AC', number, ['Pared posterior', 'Pared lateral izquierda'][number - 1], 'AC')
        for number in range(1, tv_count + 1):
            add('TV', 'TV', number, ['Pared frontal', 'Pared lateral derecha'][number - 1], 'TV')

    # Los retirados conservan su lugar en la numeración: van después de los que siguen en uso.
    for code in RETIRED:
        lab, code_type, number = code.rsplit('-', 2)
        kind = {'PC': 'PC', 'UPS': 'UPS', 'TV': 'TV'}[code_type]
        location = _seat(int(number)) if code_type != 'TV' else 'Pared frontal'
        devices.append(DemoDevice(code, lab, code_type, kind, location, SPECIFICATIONS[kind], RETIRED[code]))
    return devices


# ---------- Tipos de falla ----------

@dataclass
class FailureType:
    component: str
    priorities: tuple
    description: str
    diagnosis: str
    minutes: tuple  # rango del tiempo de atención
    action: str = 'RESOLVED'
    weight: int = 1


COMPUTER_FAILURES = [
    FailureType('PC', ('HIGH',), 'El equipo no enciende.', 'Fuente de poder dañada; se reemplazó.', (40, 120), weight=3),
    FailureType('PC', ('HIGH', 'MEDIUM'), 'El equipo se reinicia solo durante la clase.',
                'Sobrecalentamiento; limpieza interna y cambio de pasta térmica.', (45, 100), weight=3),
    FailureType('PC', ('MEDIUM',), 'El equipo tarda varios minutos en iniciar.',
                'Disco con sectores dañados; se reemplazó por un SSD y se restauró la imagen del laboratorio.',
                (60, 180), weight=3),
    FailureType('PC', ('MEDIUM',), 'No detecta el disco al arrancar.', 'Cable SATA flojo; se reconectó.', (20, 45)),
    FailureType('PC', ('LOW', 'MEDIUM'), 'El ventilador hace mucho ruido.', 'Ventilador sucio; limpieza y lubricación.',
                (15, 40)),
    FailureType('MONITOR', ('MEDIUM',), 'El monitor no da imagen.', 'Cable de video dañado; se reemplazó.', (10, 30),
                weight=2),
    FailureType('MONITOR', ('HIGH',), 'El monitor se apagó y no vuelve a encender.',
                'Monitor quemado; se reemplazó por uno de repuesto.', (30, 60)),
    FailureType('MONITOR', ('LOW',), 'La pantalla parpadea de vez en cuando.',
                'Se ajustó el cable de video y la frecuencia de actualización.', (10, 25)),
    FailureType('KEYBOARD', ('LOW',), 'Varias teclas no responden.', 'Teclado dañado; se reemplazó.', (5, 20), weight=2),
    FailureType('MOUSE', ('LOW',), 'El mouse no responde.', 'Mouse dañado; se reemplazó.', (5, 15), weight=2),
    FailureType('MOUSE', ('LOW',), 'El clic izquierdo del mouse falla.', 'Se reemplazó el mouse.', (5, 15)),
    FailureType('SOFTWARE', ('MEDIUM', 'HIGH'), 'El sistema operativo no carga.',
                'Arranque dañado; se reparó con la imagen de recuperación.', (40, 120), weight=3),
    FailureType('SOFTWARE', ('MEDIUM',), 'No abre el programa que se usa en la clase.',
                'Programa dañado; se reinstaló.', (20, 60), weight=2),
    FailureType('SOFTWARE', ('LOW',), 'Aparece un aviso de licencia vencida.', 'Se activó la licencia del sistema.',
                (10, 30)),
    FailureType('NETWORK', ('MEDIUM',), 'El equipo no tiene acceso a internet.',
                'Cable de red suelto en el puesto; se reconectó.', (10, 30), weight=2),
    FailureType('NETWORK', ('MEDIUM',), 'No se conecta a la red del laboratorio.',
                'Configuración de red incorrecta; se corrigió.', (15, 40)),
]

# Equipos problemáticos: fallan sobre todo de hardware y sistema operativo.
HARDWARE_FAILURES = [f for f in COMPUTER_FAILURES if f.component in ('PC', 'SOFTWARE') and f.weight >= 2]

GAMER_FAILURES = COMPUTER_FAILURES + [
    FailureType('PC', ('HIGH', 'MEDIUM'), 'La tarjeta de video muestra rayas y colores extraños.',
                'Controlador de video dañado; se reinstaló y se limpió la tarjeta.', (30, 90), weight=2),
]

# En un todo en uno el monitor es la pantalla del equipo.
AIO_FAILURES = [f for f in COMPUTER_FAILURES if f.component != 'MONITOR'] + [
    FailureType('MONITOR', ('MEDIUM',), 'La pantalla del equipo muestra líneas verticales.',
                'Cable interno de la pantalla flojo; se reconectó.', (40, 90), weight=2),
]

UPS_FAILURES = [
    FailureType('UPS', ('HIGH',), 'El UPS emite pitidos y no mantiene encendido el equipo.',
                'Batería agotada; se reemplazó.', (30, 60), weight=2),
    FailureType('UPS', ('MEDIUM',), 'La batería del UPS dura muy poco.',
                'Batería descalibrada; se realizó un ciclo de carga completo.', (20, 40), weight=2),
    FailureType('UPS', ('HIGH',), 'El UPS no enciende.', 'Fusible interno quemado; se reemplazó.', (30, 70)),
]

TV_FAILURES = [
    FailureType('OTHER', ('MEDIUM',), 'El televisor no recibe señal HDMI desde la PC del docente.',
                'Cable HDMI dañado; se reemplazó.', (15, 40), weight=3),
    FailureType('OTHER', ('LOW',), 'El televisor se apaga solo después de unos minutos de uso.',
                'Se desactivó el apagado automático en la configuración.', (10, 30), weight=2),
    FailureType('OTHER', ('HIGH',), 'El televisor no enciende y la luz de encendido parpadea.',
                'Fuente del televisor dañada; se envió al servicio técnico.', (60, 180), action='REFERRED'),
]

AC_FAILURES = [
    FailureType('OTHER', ('HIGH',), 'El aire acondicionado no enfría y el aula está muy caliente.',
                'Falta de gas refrigerante; el proveedor hizo la recarga.', (90, 240), action='REFERRED', weight=3),
    FailureType('OTHER', ('MEDIUM',), 'El aire acondicionado gotea agua sobre los puestos.',
                'Drenaje tapado; se limpió la manguera de desagüe.', (40, 90), weight=3),
    FailureType('OTHER', ('MEDIUM',), 'El aire acondicionado hace un ruido fuerte al encender.',
                'Filtros sucios y tornillos flojos; mantenimiento y ajuste.', (40, 100), weight=2),
    FailureType('OTHER', ('HIGH',), 'El aire acondicionado no enciende con el control.',
                'Tarjeta de control dañada; se envió al servicio técnico.', (60, 180), action='REFERRED'),
]

FAILURES_BY_KIND = {
    'PC': COMPUTER_FAILURES, 'DOC': COMPUTER_FAILURES, 'GAMER': GAMER_FAILURES, 'AIO': AIO_FAILURES,
    'UPS': UPS_FAILURES, 'TV': TV_FAILURES, 'AC': AC_FAILURES,
}

RETIREMENT_DIAGNOSIS = {
    'PC': 'Placa madre dañada; no tiene reparación.',
    'UPS': 'Batería e inversor dañados; el equipo no admite reparación.',
    'TV': 'Panel de la pantalla roto; la reparación cuesta más que un televisor nuevo.',
}

# Falla que termina en el retiro: "no enciende" en los tres casos.
RETIREMENT_FAILURE_INDEX = {'PC': 0, 'UPS': 2, 'TV': 2}

# Los aires fallan más en los meses de más calor (mayo y junio, y otra vez en octubre).
AC_MONTH_WEIGHTS = {5: 5, 6: 4, 7: 1, 8: 1, 9: 2, 10: 4}


# ---------- Generación ----------

@dataclass
class DemoIncident:
    device: str
    component: str
    priority: str
    opened_at: datetime
    description: str
    reported_by: int
    closing: dict | None = field(default=None)


def _workdays(start, end):
    days, day = [], start
    while day <= end:
        if day.weekday() < 5:
            days.append(day)
        day += timedelta(days=1)
    return days


class HistoryBuilder:
    def __init__(self, devices):
        self.rng = random.Random(SEED)
        self.devices = devices
        self.workdays = _workdays(PERIOD_START, PERIOD_END)
        self.incidents: list[DemoIncident] = []

    def _time(self, day):
        minute = self.rng.randint(7 * 60 + 30, 18 * 60)
        return datetime(day.year, day.month, day.day, minute // 60, minute % 60, tzinfo=TZ)

    def _people(self, day):
        """Quién registra y quién cierra: casi siempre Carlos; Andrea a veces; Luis solo hasta agosto."""
        staff = [CARLOS_ID] * 7 + [ANDREA_ID] * 2 + ([LUIS_ID] * 2 if day <= LUIS_LAST_DAY else [])
        return self.rng.choice(staff), self.rng.choice(staff)

    def _add(self, device, opened_at, failure, closed=True, action=None, diagnosis=None, minutes=None):
        reported_by, closed_by = self._people(opened_at.date())
        closing = None
        if closed:
            minutes = minutes or self.rng.randint(*failure.minutes)
            closing = {
                'closed_at': opened_at + timedelta(minutes=minutes),
                'minutes': minutes,
                'action': action or failure.action,
                'diagnosis': diagnosis or failure.diagnosis,
                'closed_by': closed_by,
            }
        self.incidents.append(DemoIncident(device.code, failure.component, self.rng.choice(failure.priorities),
                                           opened_at, failure.description, reported_by, closing))

    def _failure(self, kind, pool=None):
        pool = pool or FAILURES_BY_KIND[kind]
        return self.rng.choices(pool, weights=[f.weight for f in pool])[0]

    def _days(self, count, recent=False, month_weights=None, until=None):
        days = [d for d in self.workdays if until is None or d < until]
        if recent:  # concentradas en los últimos tres meses: fallas recientes y seguidas
            days = [d for d in days if d >= date(2026, 8, 1)]
        weights = [month_weights.get(d.month, 1) for d in days] if month_weights else None
        chosen = set()
        while len(chosen) < count:
            chosen.add(self.rng.choices(days, weights=weights)[0])
        return sorted(chosen)

    def build(self) -> list[DemoIncident]:
        active = [d for d in self.devices if d.retired_at is None]
        computers = [d for d in active if d.kind in ('PC', 'GAMER', 'AIO')]

        # 1. Unas 15 computadoras problemáticas: la mitad con fallas recientes y seguidas (riesgo alto),
        #    la otra mitad con fallas en los primeros meses que luego se corrigieron.
        problem = self.rng.sample([d for d in computers if d.laboratory == 'H107'], 4)
        for lab in ('H103', 'H104', 'H105'):
            problem += self.rng.sample([d for d in computers if d.laboratory == lab and d not in problem], 2)
        problem += self.rng.sample([d for d in computers if d not in problem], 5)
        for index, device in enumerate(problem):
            recent = index % 2 == 0
            pool = HARDWARE_FAILURES if device.kind != 'GAMER' else HARDWARE_FAILURES + GAMER_FAILURES[-1:]
            for day in self._days(self.rng.randint(4, 7), recent=recent,
                                  until=None if recent else date(2026, 8, 15)):
                self._add(device, self._time(day), self._failure(device.kind, pool))

        # 2. Unas 45 computadoras con 2 o 3 fallas y unas 55 con una sola.
        rest = [d for d in computers if d not in problem]
        self.rng.shuffle(rest)
        for device in rest[:45]:
            for day in self._days(self.rng.randint(2, 3)):
                self._add(device, self._time(day), self._failure(device.kind))
        for device in rest[45:100]:
            day = self._days(1)[0]
            self._add(device, self._time(day), self._failure(device.kind))

        # 3. UPS de los laboratorios gamer: 2 con varias fallas y 6 con una.
        ups = [d for d in active if d.kind == 'UPS']
        self.rng.shuffle(ups)
        for device in ups[:2]:
            for day in self._days(self.rng.randint(3, 4), recent=True):
                self._add(device, self._time(day), self._failure('UPS'))
        for device in ups[2:8]:
            self._add(device, self._time(self._days(1)[0]), self._failure('UPS'))

        # 4. Aires acondicionados: de 1 a 3 fallas cada uno, más en los meses de calor.
        for device in (d for d in active if d.kind == 'AC'):
            for day in self._days(self.rng.randint(1, 3), month_weights=AC_MONTH_WEIGHTS):
                self._add(device, self._time(day), self._failure('AC'))

        # 5. Televisores y PCs de docentes: pocas fallas.
        for kind, count in (('TV', 6), ('DOC', 6)):
            for device in self.rng.sample([d for d in active if d.kind == kind], count):
                self._add(device, self._time(self._days(1)[0]), self._failure(kind))

        # 6. Equipos retirados: 2 o 3 fallas y la última se cierra con "Requiere reemplazo" el día del retiro.
        for device in (d for d in self.devices if d.retired_at):
            for day in self._days(self.rng.randint(1, 2), until=device.retired_at.date() - timedelta(days=7)):
                self._add(device, self._time(day), self._failure(device.kind))
            minutes = self.rng.randint(30, 90)
            failure = FAILURES_BY_KIND[device.kind][RETIREMENT_FAILURE_INDEX[device.kind]]
            self._add(device, device.retired_at - timedelta(minutes=minutes), failure,
                      action='REPLACEMENT_REQUIRED', diagnosis=RETIREMENT_DIAGNOSIS[device.kind], minutes=minutes)

        # 7. Ocho incidencias abiertas, de los últimos días, en equipos distintos.
        recent_days = _workdays(OPEN_START, OPEN_END)
        candidates = [d for d in active if d.kind in ('PC', 'GAMER', 'AIO', 'UPS', 'AC')]
        for device in problem[::2][:4] + self.rng.sample([d for d in candidates if d not in problem], 4):
            kind = device.kind
            self._add(device, self._time(self.rng.choice(recent_days)), self._failure(kind), closed=False)

        return sorted(self.incidents, key=lambda incident: incident.opened_at)


def build_history(devices) -> list[DemoIncident]:
    return HistoryBuilder(devices).build()
