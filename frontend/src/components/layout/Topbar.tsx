import { useMatches } from 'react-router'
import { formatDate } from '../../lib/formatDate'
import UserMenu from './UserMenu'

type RouteHandle = { title?: string }

function Topbar() {
  // El título lo declara cada ruta en app/router.tsx (handle.title).
  const matches = useMatches()
  const title = matches
    .map((match) => (match.handle as RouteHandle | undefined)?.title)
    .filter(Boolean)
    .at(-1)

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
