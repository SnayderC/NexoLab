import { useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

// D-51: en escritorio (≥ 1280 px) el menú lateral está siempre visible. Por debajo (tablet, laptops pequeñas)
// se abre con el botón ☰ de la barra superior y se cierra al elegir una opción, al tocar fuera o con Escape.
function AppLayout() {
  const { pathname } = useLocation()
  // Se guarda en qué pantalla se abrió el menú: al cambiar de pantalla queda cerrado solo, sin un efecto extra.
  const [menuOpenedAt, setMenuOpenedAt] = useState<string | null>(null)
  const isMenuOpen = menuOpenedAt === pathname

  return (
    <div className="flex min-h-screen">
      <Sidebar open={isMenuOpen} onClose={() => setMenuOpenedAt(null)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMenu={() => setMenuOpenedAt(pathname)} />
        <main className="flex flex-1 flex-col p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
