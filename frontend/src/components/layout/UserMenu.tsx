import { ChevronDown, LogOut, User as UserIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../../features/auth/useAuth'
import { useCurrentUser } from '../../features/auth/useCurrentUser'

function UserMenu() {
  const { user } = useCurrentUser()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Cierra el menú al hacer clic fuera o al presionar Escape.
  useEffect(() => {
    if (!isOpen) return

    function handleClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [isOpen])

  async function handleLogout() {
    setIsOpen(false)
    await logout()
    navigate('/login', { replace: true })
  }

  const initials = `${user.first_name[0]}${user.last_name[0]}`

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex items-center gap-3 rounded-lg text-left"
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-linear-to-r from-primary to-accent font-medium text-surface">
          {initials}
        </span>
        <span className="flex w-38 flex-col gap-0.5">
          <span className="font-medium">
            {user.first_name} {user.last_name}
          </span>
          <span className="text-xs text-text-muted">{user.role.name}</span>
        </span>
        <ChevronDown className="size-4 text-text-muted" aria-hidden />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-border-subtle bg-surface p-1 shadow-menu"
        >
          <Link
            to="/perfil"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-background"
          >
            <UserIcon className="size-4 text-text-muted" aria-hidden />
            Mi perfil
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-danger hover:bg-danger-bg"
          >
            <LogOut className="size-4" aria-hidden />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}

export default UserMenu
