import type { ReactNode } from 'react'

export type BadgeTone =
  | 'danger'
  | 'warning'
  | 'success'
  | 'info'
  | 'neutral'
  | 'risk-high'
  | 'risk-medium'
  | 'risk-low'

type BadgeProps = {
  tone: BadgeTone
  withDot?: boolean
  children: ReactNode
}

const toneClasses: Record<BadgeTone, string> = {
  danger: 'bg-danger-bg text-danger-text',
  warning: 'bg-warning-bg text-warning-text',
  success: 'bg-success-bg text-success-text',
  info: 'bg-info-bg text-info-text',
  neutral: 'bg-neutral-bg text-neutral-text',
  'risk-high': 'bg-risk-high-bg text-risk-high-text',
  'risk-medium': 'bg-risk-medium-bg text-risk-medium-text',
  'risk-low': 'bg-risk-low-bg text-risk-low-text',
}

const dotClasses: Record<BadgeTone, string> = {
  danger: 'bg-danger',
  warning: 'bg-warning',
  success: 'bg-success',
  info: 'bg-primary',
  neutral: 'bg-text-muted',
  'risk-high': 'bg-risk-high',
  'risk-medium': 'bg-risk-medium',
  'risk-low': 'bg-risk-low',
}

function Badge({ tone, withDot = false, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex h-5.5 items-center gap-1 rounded-full px-2 text-xs font-medium whitespace-nowrap ${toneClasses[tone]}`}
    >
      {withDot && <span className={`size-1.5 rounded-full ${dotClasses[tone]}`} aria-hidden />}
      {children}
    </span>
  )
}

export default Badge
