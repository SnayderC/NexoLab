import {
  Activity,
  ChartColumn,
  Building2,
  CirclePlus,
  ClipboardList,
  Layers,
  LayoutDashboard,
  Monitor,
  Users,
} from 'lucide-react'
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
]

function Sidebar() {
  const { canAdminister, canOperateIncidents } = useCurrentUser()
  const visibleLinks = mainLinks.filter((link) => !link.technicianWork || canOperateIncidents)

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col gap-5 overflow-y-auto border-r border-border-subtle bg-surface p-3">
      <div className="flex h-10 items-center gap-3 px-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-linear-to-r from-primary to-accent text-surface">
          <Activity className="size-5.5" aria-hidden />
        </div>
        <span className="text-lg font-semibold">NexoLab</span>
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
  )
}

export default Sidebar
