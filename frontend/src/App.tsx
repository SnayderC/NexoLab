// Pantalla temporal para comprobar los tokens de color de index.css.
// Se reemplazará por el router cuando empiece la fase de pantallas.

type Swatch = {
  token: string
  className: string
}

// Las clases van escritas completas para que Tailwind las detecte al compilar.
const mainColors: Swatch[] = [
  { token: 'primary', className: 'bg-primary' },
  { token: 'primary-hover', className: 'bg-primary-hover' },
  { token: 'accent', className: 'bg-accent' },
  { token: 'text', className: 'bg-text' },
  { token: 'text-muted', className: 'bg-text-muted' },
  { token: 'border', className: 'bg-border' },
  { token: 'background', className: 'bg-background' },
  { token: 'surface', className: 'bg-surface' },
  { token: 'success', className: 'bg-success' },
  { token: 'warning', className: 'bg-warning' },
  { token: 'danger', className: 'bg-danger' },
  { token: 'danger-bg', className: 'bg-danger-bg' },
]

const riskColors: Swatch[] = [
  { token: 'risk-high', className: 'bg-risk-high' },
  { token: 'risk-medium', className: 'bg-risk-medium' },
  { token: 'risk-low', className: 'bg-risk-low' },
]

function SwatchGrid({ title, swatches }: { title: string; swatches: Swatch[] }) {
  return (
    <section className="rounded-lg bg-surface p-6 shadow-sm">
      <h2 className="mb-4 text-base font-semibold">{title}</h2>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {swatches.map((swatch) => (
          <li key={swatch.token}>
            <div className={`h-16 rounded-lg border border-border ${swatch.className}`} />
            <p className="mt-2 text-xs text-text-muted">{swatch.token}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function App() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold">NexoLab — Tokens de diseño</h1>
        <p className="text-text-muted">Pantalla temporal para comprobar los colores.</p>
      </header>

      <SwatchGrid title="Colores principales" swatches={mainColors} />
      <SwatchGrid title="Colores de riesgo" swatches={riskColors} />

      <section className="rounded-lg bg-surface p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">Degradado y botón principal</h2>
        <button
          type="button"
          className="rounded-lg bg-linear-to-r from-primary to-accent px-4 py-2 font-medium text-surface"
        >
          Botón principal
        </button>
      </section>
    </main>
  )
}

export default App
