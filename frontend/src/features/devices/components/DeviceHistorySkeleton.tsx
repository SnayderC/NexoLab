import Skeleton from '../../../components/ui/Skeleton'
import TableSkeleton from '../../../components/ui/TableSkeleton'

// Esqueletos del Figma "4.3 Historial / Cargando".
function DeviceHistorySkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-hidden>
      <div className="flex items-center gap-6 rounded-lg border border-border-subtle bg-surface p-6">
        <div className="flex flex-1 flex-col gap-3">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-3.5 w-64" />
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="h-3.5 w-52" />
        </div>
        <Skeleton className="h-10 w-90 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-5">
        {[0, 1].map((card) => (
          <div key={card} className="flex min-h-80 flex-col gap-5 rounded-lg border border-border-subtle bg-surface p-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-44 w-full rounded-lg" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
        ))}
      </div>
      <TableSkeleton rows={10} columns={9} withTitle />
    </div>
  )
}

export default DeviceHistorySkeleton
