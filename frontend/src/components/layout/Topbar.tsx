import { useMatches } from 'react-router'
import Badge from '../ui/Badge'
import { formatDate } from '../../lib/formatDate'
import { useCurrentUser } from '../../features/auth/useCurrentUser'
import UserMenu from './UserMenu'

// adminOnly: administración. technicianWork: registrar incidencias (RN-24).
type RouteHandle = { title?: string; adminOnly?: boolean; technicianWork?: boolean }

function Topbar() {
  const { canAdminister, canOperateIncidents, isTechnicianMode } = useCurrentUser()
  // Cada ruta declara su título en app/router.tsx (handle.title). Las anidadas se unen con " › ",
  // como "Administración › Laboratorios".
  const handles = useMatches().map((match) => (match.handle as RouteHandle | undefined) ?? {})
  const isRestricted = handles.some(
    (handle) => (handle.adminOnly && !canAdminister) || (handle.technicianWork && !canOperateIncidents),
  )
  const title = isRestricted
    ? 'Acceso restringido'
    : handles
        .map((handle) => handle.title)
        .filter(Boolean)
        .join(' › ')

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border-subtle bg-surface px-8">
      <p className="text-lg font-semibold">{title}</p>
      <div className="flex items-center gap-6">
        {/* Recordatorio visible de que el administrador está trabajando como técnico (RN-24). */}
        {isTechnicianMode && (
          <Badge tone="info" withDot>
            Modo técnico
          </Badge>
        )}
        <span className="text-text-muted">{formatDate(new Date())}</span>
        <UserMenu />
      </div>
    </header>
  )
}

export default Topbar
