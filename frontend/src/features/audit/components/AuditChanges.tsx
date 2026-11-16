import type { AuditChange } from '../../../types/audit'

function show(value: AuditChange['before']) {
  if (value === null || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  return String(value)
}

// Lista de cambios de una entrada: "Puestos: 30 → 40". Al crear solo se muestra el valor nuevo.
function AuditChanges({ changes }: { changes: AuditChange[] }) {
  if (changes.length === 0) return <span className="text-text-muted">—</span>

  return (
    <ul className="flex flex-col gap-1">
      {changes.map((change) => (
        <li key={change.field}>
          <span className="text-text-muted">{change.label}:</span>{' '}
          {change.before === null ? (
            show(change.after)
          ) : (
            <>
              <span className="line-through decoration-text-muted">{show(change.before)}</span> →{' '}
              {show(change.after)}
            </>
          )}
        </li>
      ))}
    </ul>
  )
}

export default AuditChanges
