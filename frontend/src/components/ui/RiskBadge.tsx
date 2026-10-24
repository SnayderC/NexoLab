import type { RiskLevelCode } from '../../types/catalog'
import Badge, { type BadgeTone } from './Badge'

type RiskBadgeProps = {
  level: RiskLevelCode
  // "short" muestra "Alto"; "long" muestra "Riesgo alto", como en la tabla de equipos.
  format?: 'short' | 'long'
}

const riskConfig: Record<RiskLevelCode, { tone: BadgeTone; short: string; long: string }> = {
  HIGH: { tone: 'risk-high', short: 'Alto', long: 'Riesgo alto' },
  MEDIUM: { tone: 'risk-medium', short: 'Medio', long: 'Riesgo medio' },
  LOW: { tone: 'risk-low', short: 'Bajo', long: 'Riesgo bajo' },
}

function RiskBadge({ level, format = 'short' }: RiskBadgeProps) {
  const config = riskConfig[level]

  return (
    <Badge tone={config.tone} withDot>
      {config[format]}
    </Badge>
  )
}

export default RiskBadge
