import { Menu } from 'lucide-react'
import { useMatches } from 'react-router'
import Badge from '../ui/Badge'
import { formatDate } from '../../lib/formatDate'
import { useCurrentUser } from '../../features/auth/useCurrentUser'
import UserMenu from './UserMenu'

// adminOnly: administración. technicianWork: registrar incidencias (RN-24).
type RouteHandle = { title?: string; adminOnly?: boolean; technicianWork?: boolean }

// onOpenMenu: abre el menú lateral desplegable en tablet (D-51).
function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
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
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-border-subtle bg-surface px-4 md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Abrir menú"
          aria-controls="menu-principal"
          className="rounded-md p-1 text-text-secondary hover:bg-background xl:hidden"
        >
          <Menu className="size-6" aria-hidden />
        </button>
        <p className="truncate text-lg font-semibold">{title}</p>
      </div>
      <div className="flex shrink-0 items-center gap-4 md:gap-6">
        {/* Recordatorio visible de que el administrador está trabajando como técnico (RN-24). */}
        {isTechnicianMode && (
          <Badge tone="info" withDot>
            Modo técnico
          </Badge>
        )}
        <span className="hidden text-text-muted xl:inline">{formatDate(new Date())}</span>
        <UserMenu />
      </div>
    </header>
  )
}

export default Topbar
