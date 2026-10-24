import type { RiskLevelCode } from '../../../types/catalog'

// Colores de cada nivel en las columnas y tarjetas del dashboard.
export const riskStyles: Record<RiskLevelCode, { bg: string; text: string; solid: string }> = {
  HIGH: { bg: 'bg-risk-high-bg', text: 'text-risk-high-text', solid: 'bg-risk-high' },
  MEDIUM: { bg: 'bg-risk-medium-bg', text: 'text-risk-medium-text', solid: 'bg-risk-medium' },
  LOW: { bg: 'bg-risk-low-bg', text: 'text-risk-low-text', solid: 'bg-risk-low' },
}

// Cuántas tarjetas muestra cada columna antes de "Ver los N equipos" (como en el Figma).
export const CARD_LIMIT: Record<RiskLevelCode, number> = {
  HIGH: 6,
  MEDIUM: 4,
  LOW: 3,
}
