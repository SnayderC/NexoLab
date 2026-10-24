# Guía: del Figma al código en VS Code

> Pasos concretos para convertir el prototipo aprobado de Figma en el frontend de NexoLab.
> Complementa a `docs/CONTEXTO_DESARROLLO.md`, que tiene las reglas completas del proyecto.

## La idea general

La IA de VS Code (GitHub Copilot) puede **leer tus frames de Figma** a través del servidor MCP de Figma y proponer el código de cada pantalla. Pero el código generado es un **punto de partida**, no el resultado final. Tú decides la estructura, los componentes y los datos; la IA acelera el trabajo repetitivo.

Por eso el orden es:

1. Preparar el Figma.
2. Crear el proyecto y la base (tokens, componentes, layout) **con criterio propio**.
3. Conectar Figma con VS Code.
4. Generar cada pantalla con la IA, **dentro de esa base**, y revisarla.

---

## Paso 1 · Preparar el Figma (10 minutos)

- [ ] En la página **06 · Perfil**, quita los interruptores "Ver como técnico" y "Simular error de carga" de los frames 6.0 y 6.4. Si la IA los ve, intentará programarlos.
- [ ] Borra o renombra el frame **6.2 "Éxito"**, que es igual al formulario vacío.
- [ ] Verifica que puedes abrir el archivo con la misma cuenta de Figma que vas a conectar en VS Code.

**Referencia oficial:** usa las páginas **01 a 06** (frames editables y aprobados). La página 00 (capa de código de Figma Make) tiene datos y atajos de prueba; no la uses como fuente.

---

## Paso 2 · Instalar lo necesario

- [ ] **Node.js 22 LTS** o superior (Vite 8 exige 20.19+ o 22.12+). Verifica con `node --version`.
- [ ] **Git** y una cuenta de **GitHub**.
- [ ] **VS Code** con estas extensiones:
  - GitHub Copilot y GitHub Copilot Chat
  - ESLint
  - Tailwind CSS IntelliSense
  - Python y Pylance (para el backend)
  - Docker (opcional)
- [ ] **GitHub Copilot activo en tu cuenta.** Es obligatorio para usar el servidor de Figma en VS Code. Copilot tiene un plan gratuito con límites; si verificas tu cuenta de estudiante en GitHub Education, normalmente obtienes Copilot Pro sin costo (confírmalo en tu cuenta).

---

## Paso 3 · Crear el repositorio y el frontend

1. Descomprime `nexolab_fase1.zip` (la base del backend) en una carpeta `nexolab`.
2. Crea dentro la carpeta `docs/` y copia ahí:
   - `NEXOLAB_CONTEXTO_DESARROLLO.md` → renómbralo a `CONTEXTO_DESARROLLO.md`
   - `NEXOLAB_BD_v4.dbml`
   - `PROMPT_FIGMA_MAKE_NEXOLAB.md`
3. Abre la carpeta `nexolab` en VS Code y, en la terminal (`` Ctrl + ` ``):

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install tailwindcss @tailwindcss/vite
npm install react-router lucide-react
npm run dev
```

Abre la dirección que muestra la terminal (normalmente http://localhost:5173). Si ves la página de ejemplo de Vite, funciona.

> Instala las demás librerías (TanStack Query, React Hook Form, Zod, Recharts) **cuando las necesites**, no antes. Así sabes para qué está cada una.

4. Configura Tailwind en `frontend/vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

> Si la plantilla de Vite generó un `vite.config.ts` con otro plugin de React, conserva ese y solo agrega `tailwindcss()`.

5. Reemplaza todo el contenido de `frontend/src/index.css` por los **tokens del sistema de diseño**:

```css
@import "tailwindcss";

@theme {
  /* Tipografía */
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;

  /* Marca */
  --color-primary: #3B82F6;
  --color-primary-hover: #1E40AF;
  --color-accent: #7C3AED;

  /* Texto y superficies */
  --color-text: #1F2937;
  --color-text-muted: #6B7280;
  --color-border: #D1D5DB;
  --color-background: #F3F4F6;
  --color-surface: #FFFFFF;

  /* Estados */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-danger: #EF4444;
  --color-danger-soft: #FEE2E2;

  /* Riesgo (iguales a cat_risk_levels.color_hex) */
  --color-risk-high: #EF4444;
  --color-risk-medium: #F59E0B;
  --color-risk-low: #10B981;

  /* Formas */
  --radius-card: 8px;
}

body {
  @apply bg-background text-text font-sans;
}
```

Con esto, en el código se escribe `bg-primary`, `text-risk-high` o `border-border`, y **nunca** un color hexadecimal suelto. Si mañana cambia un color, se cambia en un solo lugar.

6. Agrega la fuente Inter en `frontend/index.html`, dentro de `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

7. Crea las carpetas de `src/` según la sección 6 del documento de contexto: `app/`, `components/ui/`, `components/layout/`, `features/`, `types/`, `mocks/` y `lib/`.

8. Sube todo a GitHub (repositorio **privado**):

```bash
cd ..
git init
git add .
git commit -m "chore: estructura inicial con backend y frontend"
```

Antes del commit, revisa con `git status` que **no aparezca ningún archivo `.env`**.

---

## Paso 4 · Darle contexto a Copilot

Crea el archivo `.github/copilot-instructions.md` en la raíz del repositorio. Copilot lo lee automáticamente en cada conversación:

```markdown
# Instrucciones del proyecto NexoLab

- Lee docs/CONTEXTO_DESARROLLO.md antes de proponer cambios. Es la fuente de verdad.
- Código en inglés; textos visibles para el usuario en español (Ecuador).
- Frontend: React 19 + TypeScript + Vite + Tailwind 4. Usa solo los tokens de src/index.css; nunca colores hexadecimales en componentes.
- Estructura por módulos en src/features/<módulo>/{pages,components,api.ts}. Componentes genéricos en src/components/ui.
- Los datos nunca se escriben dentro de un componente: vienen de api.ts (por ahora lee src/mocks).
- Los tipos en src/types usan snake_case, igual que la base de datos.
- No instales dependencias nuevas sin preguntar.
- No programes los interruptores de demostración del prototipo ("Ver como técnico", "Simular error de carga").
- Antes de crear o modificar varios archivos, muestra primero el plan.
```

---

## Paso 5 · Conectar Figma con VS Code

1. En VS Code presiona `Ctrl + Shift + P` y busca **MCP: Add Server**.
2. Elige **HTTP**.
3. Pega la dirección del servidor remoto de Figma: `https://mcp.figma.com/mcp` y presiona Enter.
4. Cuando te pida un identificador, escribe `figma`.
5. Se abrirá el navegador para **autorizar con tu cuenta de Figma**. Acepta.
6. Abre el chat de Copilot y cambia a **modo Agent**.
7. Escribe `#get_design_context`. Si aparece la herramienta, la conexión funciona. Si no aparece, reinicia VS Code.

> Si ves errores de "límite de uso", es una restricción de tu plan de Figma. El plan de Educación debería darte más margen.

---

## Paso 6 · Construir la base antes de las pantallas

No empieces por el dashboard. Primero lo que se repite en todas las pantallas, en este orden:

### 6.1 Tipos y datos de demostración

Pídele a Copilot (modo Agent):

```
Lee docs/NEXOLAB_BD_v4.dbml y crea en src/types/models.ts las interfaces de TypeScript
para las tablas que usa el frontend (users, laboratories, device_types, devices,
components, incidents, risk_levels, device_risk_results y kmeans_centroids).
Usa los mismos nombres de campos (snake_case). No incluyas password_hash.
Muéstrame el archivo antes de crearlo.
```

Después:

```
Con los datos de la PARTE 3 de docs/PROMPT_FIGMA_MAKE_NEXOLAB.md, crea los datos de
demostración en src/mocks/, un archivo por entidad, tipados con src/types/models.ts.
Los datos deben ser exactamente los del documento y cuadrar entre sí
(142 equipos activos, 6/18/118 por riesgo, 7 incidencias abiertas).
```

Revisa a mano algunos números: por ejemplo, que `H103-PC-03` tenga 11 incidencias y esté en riesgo alto.

### 6.2 Patrón de acceso a datos

Cada módulo tiene un `api.ts`. Hoy devuelve los datos de demostración; en la fase 7 se cambia por la API real **sin tocar las pantallas**:

```ts
// src/features/incidents/api.ts
import type { Incident } from '../../types/models'
import { incidents } from '../../mocks/incidents'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getIncidents(): Promise<Incident[]> {
  await delay(300) // simula el tiempo de respuesta de la red
  return incidents
}
```

### 6.3 Componentes base y layout

Genera desde Figma, uno por uno, los componentes genéricos: botón, badge, campo de formulario, select, modal, tabla, toast, esqueleto de carga y estado vacío. Luego el **layout**: barra lateral (con variante técnico y administrador) y barra superior.

Para obtener el enlace de un elemento en Figma: selecciónalo → clic derecho → **Copiar/Pegar como** → **Copiar enlace a la selección**.

Configura el router con **todas las rutas** de la sección 12 del documento de contexto, aunque al principio muestren una página vacía. Sigue la guía de instalación oficial de React Router para la versión que instalaste.

**Terminado cuando:** puedes navegar entre todas las rutas con la barra lateral y la superior iguales al Figma.

---

## Paso 7 · Generar cada pantalla

### Orden recomendado

| # | Pantalla | Frames de Figma |
|---|---|---|
| 1 | Login | Página 01: 1.0 a 1.4 |
| 2 | Dashboard | Página 02: 2.0 a 2.5 |
| 3 | Lista de incidencias | Página 03, fila 1: 3.0 a 3.3 |
| 4 | Registrar incidencia | Página 03, fila 2: 3.4 a 3.7 |
| 5 | Cerrar incidencia (modal) | Página 03, fila 3: 3.8 a 3.11 |
| 6 | Historial del equipo | Página 04: 4.0 a 4.3 |
| 7 | Laboratorios | Página 05, fila 1 |
| 8 | Equipos | Página 05, fila 2 |
| 9 | Catálogo | Página 05, fila 3 |
| 10 | Usuarios y acceso restringido | Página 05, fila 4 |
| 11 | Mi perfil | Página 06 |

### Prompt para cada pantalla

Copia el enlace del **frame principal** (por ejemplo "2.0 Dashboard / Administrador") y usa esta plantilla en modo Agent:

```
Implementa la pantalla de este frame de Figma: <PEGA AQUÍ EL ENLACE>

Contexto: docs/CONTEXTO_DESARROLLO.md, secciones 7, 11 y 12.

Reglas:
- Ruta: <ruta>. Archivo: src/features/<módulo>/pages/<Nombre>Page.tsx.
- Reutiliza los componentes de src/components/ui y src/components/layout.
  Si falta uno genérico, créalo en components/ui. Si es propio del módulo, en features/<módulo>/components.
- Solo tokens de Tailwind de src/index.css. Nada de colores hexadecimales ni tamaños en píxeles sueltos.
- Los datos vienen de src/features/<módulo>/api.ts. No escribas datos dentro del componente.
- Tipos desde src/types/models.ts.
- Estados a implementar: <lista, por ejemplo: cargando, vacío, error de credenciales, cuenta desactivada>.
  Míralos en los frames <números de frames> del mismo archivo.
- Textos en español; código en inglés.
- No instales dependencias sin preguntarme.

Antes de escribir código, muéstrame el plan de archivos que vas a crear o modificar.
```

### Cómo revisar cada pantalla antes de seguir

- [ ] Se ve igual al frame de Figma (pon ambos lado a lado).
- [ ] Los datos coinciden con el prototipo (por ejemplo, "7 incidencias abiertas").
- [ ] Funcionan **todos** los estados del Figma: carga, vacío, error, validaciones.
- [ ] No hay colores hexadecimales ni datos escritos dentro del componente.
- [ ] Reutiliza los componentes existentes, sin duplicarlos.
- [ ] `npm run lint` y `npm run build` sin errores.
- [ ] Commit: `feat: pantalla de <nombre>`.

> Si el código generado usa posiciones absolutas o medidas fijas por todos lados (pasa con frames que vienen de Figma Make), pídele a Copilot que lo rehaga con Flexbox o Grid y los componentes del proyecto. Es normal tener que iterar.

---

## Paso 8 · Errores comunes

| Problema | Solución |
|---|---|
| Copilot no encuentra `get_design_context` | Verifica que estás en modo **Agent** y reinicia VS Code |
| Copilot "inventa" datos | Recuérdale que los datos salen de `api.ts` y `mocks/` |
| Cada pantalla crea su propio botón | Pídele que use `components/ui/Button` y borre los duplicados |
| Las clases como `bg-primary` no funcionan | Revisa que `index.css` tenga `@import "tailwindcss";` y el bloque `@theme`, y que `tailwindcss()` esté en `vite.config.ts` |
| Vite no arranca | Revisa la versión de Node (`node --version`): necesitas 20.19+ o 22.12+ |

---

## Resumen de lo que debes hacer tú

1. Limpiar el Figma (paso 1).
2. Instalar Node 22, VS Code, extensiones y activar Copilot (paso 2).
3. Crear el repositorio, el frontend con Vite, Tailwind y los tokens (paso 3).
4. Crear `.github/copilot-instructions.md` (paso 4).
5. Conectar el servidor MCP de Figma (paso 5).
6. Construir tipos, datos de demostración, componentes base, layout y rutas (paso 6).
7. Generar y revisar las pantallas una por una (paso 7).

Cuando termines el paso 6 o te trabes en cualquier punto, comparte el error o el código y lo revisamos juntos.
