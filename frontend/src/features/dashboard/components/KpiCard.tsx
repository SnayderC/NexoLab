import type { LucideIcon } from 'lucide-react'

type KpiTone = 'danger' | 'info' | 'warning' | 'success'

type KpiCardProps = {
  icon: LucideIcon
  tone: KpiTone
  title: string
  value: string
  detail: string
}

const toneClasses: Record<KpiTone, string> = {
  danger: 'bg-risk-high-bg text-danger',
  info: 'bg-info-bg text-primary',
  warning: 'bg-risk-medium-bg text-warning',
  success: 'bg-success-bg text-success',
}

// Tarjeta de indicador global (fila superior del Figma 2.0).
function KpiCard({ icon: Icon, tone, title, value, detail }: KpiCardProps) {
  return (
    <div className="flex h-28 items-center gap-3 rounded-lg border border-border-subtle bg-surface p-5">
      <div className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
        <Icon className="size-6" aria-hidden />
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-xs leading-4 text-text-muted">{title}</p>
        <p className="text-2xl leading-7 font-semibold">{value}</p>
        <p className="text-xs leading-4 text-text-muted">{detail}</p>
      </div>
    </div>
  )
}

export default KpiCard
