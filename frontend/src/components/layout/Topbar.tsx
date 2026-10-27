import { useMatches } from 'react-router'
import { formatDate } from '../../lib/formatDate'
import { useCurrentUser } from '../../features/auth/useCurrentUser'
import UserMenu from './UserMenu'

type RouteHandle = { title?: string; adminOnly?: boolean }

function Topbar() {
  const { isAdmin } = useCurrentUser()
  // Cada ruta declara su título en app/router.tsx (handle.title). Las anidadas se unen con " › ",
  // como "Administración › Laboratorios".
  const handles = useMatches().map((match) => (match.handle as RouteHandle | undefined) ?? {})
  const isRestricted = handles.some((handle) => handle.adminOnly) && !isAdmin
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
        <span className="text-text-muted">{formatDate(new Date())}</span>
        <UserMenu />
      </div>
    </header>
  )
}

export default Topbar
