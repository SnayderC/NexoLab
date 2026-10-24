import type { Priority } from '../../types/incident'
import Badge, { type BadgeTone } from './Badge'

const priorityConfig: Record<Priority, { tone: BadgeTone; label: string }> = {
  HIGH: { tone: 'danger', label: 'Alta' },
  MEDIUM: { tone: 'warning', label: 'Media' },
  LOW: { tone: 'neutral', label: 'Baja' },
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const config = priorityConfig[priority]

  return <Badge tone={config.tone}>{config.label}</Badge>
}

export default PriorityBadge
