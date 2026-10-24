import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-90 flex-col items-center justify-center gap-5 px-6 py-10 text-center">
      <Icon className="size-10 text-text-muted" aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="text-base font-medium">{title}</p>
        {description && <p className="text-text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export default EmptyState
