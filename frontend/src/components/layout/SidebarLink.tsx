import type { LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router'

type SidebarLinkProps = {
  to: string
  label: string
  icon: LucideIcon
}

function SidebarLink({ to, label, icon: Icon }: SidebarLinkProps) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex h-10 items-center gap-3 rounded-lg px-3 ${
          isActive
            ? 'bg-nav-active-bg font-medium text-nav-active'
            : 'text-text-secondary hover:bg-background'
        }`
      }
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      {label}
    </NavLink>
  )
}

export default SidebarLink
