export type BarRow = {
  key: string | number
  label: string
  count: number
  // Clase de color de la barra (token de Tailwind); por defecto el color primario.
  barClassName?: string
}

type BarListCardProps = {
  title: string
  rows: BarRow[]
}

// Tarjeta con barras horizontales: el largo de cada barra es proporcional al mayor valor.
function BarListCard({ title, rows }: BarListCardProps) {
  const max = Math.max(...rows.map((row) => row.count), 0)

  return (
    <section
      aria-label={title}
      className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface p-5"
    >
      <h2 className="text-base font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="py-4 text-center text-xs text-text-muted">Sin datos</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <li key={row.key} className="grid grid-cols-[8rem_1fr_2.5rem] items-center gap-3">
              <span className="truncate text-xs" title={row.label}>
                {row.label}
              </span>
              <div className="h-2.5 rounded-full bg-background">
                <div
                  className={`h-full rounded-full ${row.barClassName ?? 'bg-primary'}`}
                  style={{ width: max ? `${(row.count / max) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-right text-xs font-semibold">{row.count}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default BarListCard
