import { ChartNoAxesCombined } from 'lucide-react'
import type { RiskLevelCode } from '../../../types/catalog'
import type { DeviceHistory } from '../api'
import { riskStyles } from './riskStyles'

// Gráfico de escalones del Figma 4.0, dibujado con SVG (decisión D-19, sin Recharts).
// Cada mes es un tramo horizontal a la altura de su nivel; el cambio de nivel es un tramo vertical.

const LEVELS: { code: RiskLevelCode; label: string }[] = [
  { code: 'HIGH', label: 'Riesgo alto' },
  { code: 'MEDIUM', label: 'Riesgo medio' },
  { code: 'LOW', label: 'Riesgo bajo' },
]

// Coordenadas internas del SVG (viewBox), no medidas de la página.
const WIDTH = 400
const HEIGHT = 156
const LEVEL_Y: Record<RiskLevelCode, number> = { HIGH: 20, MEDIUM: 78, LOW: 136 }

const strokeClasses: Record<RiskLevelCode, string> = {
  HIGH: 'stroke-risk-high',
  MEDIUM: 'stroke-risk-medium',
  LOW: 'stroke-risk-low',
}

const monthFormatter = new Intl.DateTimeFormat('es-EC', { month: 'long', timeZone: 'UTC' })
const shortMonthFormatter = new Intl.DateTimeFormat('es-EC', { month: 'short', timeZone: 'UTC' })
// Desde este número de meses, los nombres largos ("Septiembre") ya no caben debajo del gráfico.
const SHORT_LABELS_FROM = 6

function monthName(month: string, short = false): string {
  const name = (short ? shortMonthFormatter : monthFormatter).format(new Date(`${month}-01T00:00:00Z`))
  return name.charAt(0).toUpperCase() + name.slice(1)
}

type RiskEvolutionChartProps = {
  history: DeviceHistory['risk_history']
}

function RiskEvolutionChart({ history }: RiskEvolutionChartProps) {
  // Sin ningún cálculo por K-Means no hay evolución que mostrar (Figma 4.1).
  const hasData = history.some((point) => point.classification_method === 'KMEANS')
  const stepWidth = WIDTH / Math.max(history.length, 1)

  return (
    <section className="flex min-h-80 flex-col gap-5 rounded-lg border border-border-subtle bg-surface p-6">
      <h2 className="text-base font-semibold">Evolución del riesgo</h2>

      {!hasData ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <ChartNoAxesCombined className="size-8 text-text-muted" aria-hidden />
          <p className="max-w-87.5 leading-5.5 text-text-muted">
            Aún no hay suficiente información para mostrar la evolución del riesgo.
          </p>
        </div>
      ) : (
        <>
          <div className="relative h-39" role="img" aria-label={describe(history)}>
            {/* Niveles con su línea guía */}
            <div className="flex h-full flex-col justify-between py-2.5">
              {LEVELS.map((level) => (
                <div key={level.code} className="flex h-5 items-center gap-3">
                  <span className={`w-22.5 shrink-0 text-xs ${riskStyles[level.code].text}`}>{level.label}</span>
                  <span className="h-px flex-1 bg-border-subtle" />
                </div>
              ))}
            </div>
            {/* Escalones, a la derecha de las etiquetas */}
            <div className="absolute inset-y-0 right-0 left-25.5">
              <svg
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                preserveAspectRatio="none"
                className="size-full"
                aria-hidden
              >
                {history.map((point, index) => {
                  const y = LEVEL_Y[point.risk_level]
                  const x0 = index * stepWidth
                  const previous = history[index - 1]
                  return (
                    <g key={point.month} className={strokeClasses[point.risk_level]} strokeWidth={4}>
                      {previous && previous.risk_level !== point.risk_level && (
                        <line x1={x0} x2={x0} y1={LEVEL_Y[previous.risk_level]} y2={y} vectorEffect="non-scaling-stroke" />
                      )}
                      <line x1={x0} x2={x0 + stepWidth} y1={y} y2={y} vectorEffect="non-scaling-stroke" />
                    </g>
                  )
                })}
              </svg>
            </div>
          </div>

          <div className="flex gap-2 pl-25.5 text-text-muted">
            {history.map((point) => (
              <div key={point.month} className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="text-xs">{monthName(point.month, history.length >= SHORT_LABELS_FROM)}</p>
                {point.classification_method === 'INSUFFICIENT_HISTORY' && (
                  <p className="text-2xs">Sin historial suficiente</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

// Texto para lectores de pantalla: "Agosto: Riesgo bajo, Septiembre: Riesgo medio…".
function describe(history: DeviceHistory['risk_history']): string {
  return history
    .map((point) => `${monthName(point.month)}: ${LEVELS.find((l) => l.code === point.risk_level)!.label}`)
    .join(', ')
}

export default RiskEvolutionChart
