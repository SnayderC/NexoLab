import Skeleton from './Skeleton'

type TableSkeletonProps = {
  rows?: number
  columns?: number
  // Muestra la franja del título, como en "Incidencias abiertas" del dashboard.
  withTitle?: boolean
}

// Tabla gris mientras cargan los datos.
function TableSkeleton({ rows = 7, columns = 6, withTitle = false }: TableSkeletonProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface" aria-hidden>
      {withTitle && (
        <div className="flex h-14 items-center px-5">
          <Skeleton className="h-4 w-45" />
        </div>
      )}
      <div className="h-10 bg-background" />
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex h-12 items-center gap-8 border-t border-border-subtle px-5">
          {Array.from({ length: columns - 1 }, (_, column) => (
            <Skeleton key={column} className="h-3 flex-1" />
          ))}
          <Skeleton className="h-8 w-17.5" />
        </div>
      ))}
    </div>
  )
}

export default TableSkeleton
