import { Sparkles } from 'lucide-react'
import Skeleton from '../../../components/ui/Skeleton'
import { CARD_LIMIT } from '../../devices/components/riskStyles'

// Esqueletos del Figma "2.3 Dashboard / Cargando".

export function KpiRowSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex h-28 items-center gap-3 rounded-lg border border-border-subtle bg-surface p-5">
          <Skeleton className="size-11 rounded-lg" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function BannerSkeleton() {
  return (
    <div className="flex min-h-16 items-center gap-3 rounded-lg border border-info-border bg-info-bg px-4 py-3">
      <Sparkles className="size-5 shrink-0 text-primary" aria-hidden />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-2/5" />
      </div>
    </div>
  )
}

function DeviceCardSkeleton() {
  return (
    <div className="relative flex h-32 flex-col gap-2 overflow-hidden rounded-lg border border-border-subtle bg-surface p-3">
      <span className="absolute inset-y-0 left-0 w-1 bg-skeleton" aria-hidden />
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-5.5 w-13" />
      </div>
      <Skeleton className="h-3 w-45" />
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Skeleton className="h-8" />
        <Skeleton className="h-8" />
        <Skeleton className="h-8" />
      </div>
    </div>
  )
}

export function RiskColumnsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {Object.values(CARD_LIMIT).map((cardCount, column) => (
        <div key={column} className="flex flex-col gap-3 p-3">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-8 w-full" />
          </div>
          {Array.from({ length: cardCount }, (_, index) => (
            <DeviceCardSkeleton key={index} />
          ))}
        </div>
      ))}
    </div>
  )
}
