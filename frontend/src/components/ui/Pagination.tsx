import Button from './Button'

type PaginationProps = {
  page: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
}

type PageItem = number | 'ellipsis'

// Siempre muestra la primera y la última página, y tres alrededor de la actual:
// 1 2 3 … 15  ·  1 … 7 8 9 … 15  ·  1 … 13 14 15
function getPageItems(page: number, totalPages: number): PageItem[] {
  const windowStart = Math.max(1, Math.min(page - 1, totalPages - 2))
  const windowEnd = Math.min(totalPages, windowStart + 2)
  const pages = new Set([1, totalPages])
  for (let p = windowStart; p <= windowEnd; p++) pages.add(p)

  const sorted = [...pages].sort((a, b) => a - b)
  const items: PageItem[] = []
  sorted.forEach((p, index) => {
    const previous = sorted[index - 1]
    if (previous !== undefined && p - previous === 2) items.push(previous + 1)
    else if (previous !== undefined && p - previous > 2) items.push('ellipsis')
    items.push(p)
  })
  return items
}

const pageClasses = 'flex size-8 items-center justify-center rounded-lg border text-xs'

function Pagination({ page, pageSize, totalItems, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const firstItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const lastItem = Math.min(page * pageSize, totalItems)

  return (
    <div className="flex min-h-16 items-center justify-between px-5 py-3">
      <p className="text-text-muted">
        Mostrando {firstItem}–{lastItem} de {totalItems}
      </p>
      {/* Con una sola página solo se muestra el conteo (Figma 3.0). */}
      {totalPages > 1 && (
        <nav aria-label="Paginación" className="flex items-center gap-2">
          <Button size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            Anterior
          </Button>
          {getPageItems(page, totalPages).map((item, index) =>
            item === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className={`${pageClasses} border-border text-text-muted`}>
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                aria-current={item === page ? 'page' : undefined}
                onClick={() => onPageChange(item)}
                className={`${pageClasses} ${
                  item === page
                    ? 'border-primary bg-info-bg text-primary'
                    : 'border-border bg-surface text-text-muted hover:bg-background'
                }`}
              >
                {item}
              </button>
            ),
          )}
          <Button size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
            Siguiente
          </Button>
        </nav>
      )}
    </div>
  )
}

export default Pagination
