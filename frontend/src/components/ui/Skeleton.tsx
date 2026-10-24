// Bloque gris mientras carga. El tamaño lo da quien lo usa: <Skeleton className="h-3.5 w-32" />
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-skeleton ${className}`} aria-hidden />
}

export default Skeleton
