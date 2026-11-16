import {
  Activity,
  ChartColumn,
  Building2,
  CirclePlus,
  History,
  ClipboardList,
  Layers,
  LayoutDashboard,
  Monitor,
  Users,
  X,
} from 'lucide-react'
import { useEffect } from 'react'
import { useCurrentUser } from '../../features/auth/useCurrentUser'
import SidebarLink from './SidebarLink'

// technicianWork: solo para el técnico o el administrador en modo técnico (RN-24).
const mainLinks = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/incidencias', label: 'Incidencias', icon: ClipboardList },
  { to: '/incidencias/nueva', label: 'Registrar incidencia', icon: CirclePlus, technicianWork: true },
  { to: '/reportes', label: 'Reportes', icon: ChartColumn },
]

const adminLinks = [
  { to: '/admin/laboratorios', label: 'Laboratorios', icon: Building2 },
  { to: '/admin/equipos', label: 'Equipos', icon: Monitor },
  { to: '/admin/catalogo', label: 'Catálogo de equipos', icon: Layers },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
  // D-52
  { to: '/admin/bitacora', label: 'Bitácora', icon: History },
]

type SidebarProps = {
  // Solo por debajo de 1280 px (tablet y laptops pequeñas): el menú desplegable está abierto.
  open: boolean
  onClose: () => void
}

function Sidebar({ open, onClose }: SidebarProps) {
  const { canAdminister, canOperateIncidents } = useCurrentUser()
  const visibleLinks = mainLinks.filter((link) => !link.technicianWork || canOperateIncidents)

  // Escape cierra el menú desplegable.
  useEffect(() => {
    if (!open) return
    const handleKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  return (
    <>
      {/* Fondo oscurecido detrás del menú desplegable (solo tablet). */}
      {open && <div className="fixed inset-0 z-20 bg-overlay xl:hidden" onClick={onClose} aria-hidden />}
      <aside
        id="menu-principal"
        className={`fixed inset-y-0 left-0 z-30 flex h-screen w-64 shrink-0 flex-col gap-5 overflow-y-auto border-r border-border-subtle bg-surface p-3 transition-transform motion-reduce:transition-none xl:sticky xl:top-0 xl:translate-x-0 ${
          open ? 'translate-x-0 shadow-modal' : 'max-xl:invisible -translate-x-full'
        }`}
      >
      <div className="flex h-10 items-center gap-3 px-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-linear-to-r from-primary to-accent text-surface">
          <Activity className="size-5.5" aria-hidden />
        </div>
        <span className="flex-1 text-lg font-semibold">NexoLab</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar menú"
          className="rounded-md text-text-muted hover:text-text xl:hidden"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>

      <nav className="flex flex-col gap-5" aria-label="Menú principal">
        <ul className="flex flex-col gap-1">
          {visibleLinks.map(({ to, label, icon }) => (
            <li key={to}>
              <SidebarLink to={to} label={label} icon={icon} />
            </li>
          ))}
        </ul>

        {canAdminister && (
          <div className="flex flex-col gap-2">
            <p className="px-3 text-2xs font-semibold uppercase text-text-muted">Administración</p>
            <ul className="flex flex-col gap-1">
              {adminLinks.map((link) => (
                <li key={link.to}>
                  <SidebarLink {...link} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>
      </aside>
    </>
  )
}

export default Sidebar
