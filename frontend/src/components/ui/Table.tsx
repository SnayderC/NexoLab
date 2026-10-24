import type { ReactNode } from 'react'

export type TableColumn<T> = {
  key: string
  header: string
  // Clases extra para la celda: ancho, alineación, color del texto…
  className?: string
  render: (row: T) => ReactNode
}

type TableProps<T> = {
  columns: TableColumn<T>[]
  rows: T[]
  getRowKey: (row: T) => string | number
  // Descripción para lectores de pantalla. Si hay `title`, se usa el título.
  caption: string
  // Título visible sobre la tabla, como "Incidencias abiertas" en el dashboard.
  title?: string
  // default: cabecera de 56 px y 11 px (tablas de administración).
  // compact: cabecera de 40 px y 12 px (tabla del dashboard).
  variant?: 'default' | 'compact'
  emptyState?: ReactNode
  footer?: ReactNode
  // Clases extra para una fila, por ejemplo para resaltar la recién registrada.
  getRowClassName?: (row: T) => string
}

const headerClasses = {
  default: 'h-14 px-3 text-2xs',
  compact: 'h-10 px-5 text-xs',
}

// default: texto de 12 px y filas altas (lista de incidencias, administración).
// compact: texto de 14 px y filas de 48 px (dashboard).
const cellClasses = {
  default: 'px-3 py-4 text-xs leading-4.5',
  compact: 'h-12 px-5 py-2',
}

// Encabezado fijo bajo la barra superior (top-16) y pie opcional.
function Table<T>({
  columns,
  rows,
  getRowKey,
  caption,
  title,
  variant = 'default',
  emptyState,
  footer,
  getRowClassName,
}: TableProps<T>) {
  return (
    <div className="overflow-clip rounded-lg border border-border-subtle bg-surface">
      {title && (
        <div className="flex h-14 items-center px-5">
          <h2 className="text-base font-semibold">{title}</h2>
        </div>
      )}
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">{title ?? caption}</caption>
        {/* El fondo en thead tapa la costura de 1 px entre las celdas fijas. */}
        <thead className="bg-background">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`sticky top-16 z-1 bg-background font-medium text-text-muted uppercase ${headerClasses[variant]} ${column.className ?? ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && emptyState ? (
            <tr>
              <td colSpan={columns.length}>{emptyState}</td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={getRowKey(row)} className={`border-t border-border-subtle ${getRowClassName?.(row) ?? ''}`}>
                {columns.map((column) => (
                  <td key={column.key} className={`${cellClasses[variant]} ${column.className ?? ''}`}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {footer && <div className="border-t border-border-subtle">{footer}</div>}
    </div>
  )
}

export default Table
