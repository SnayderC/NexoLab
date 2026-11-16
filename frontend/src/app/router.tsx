import { createBrowserRouter, Navigate } from 'react-router'
import AppLayout from '../components/layout/AppLayout'
import RequireAdmin from '../components/layout/RequireAdmin'
import RequireAuth from '../components/layout/RequireAuth'
import RequireTechnicianWork from '../components/layout/RequireTechnicianWork'
import LoginPage from '../features/auth/pages/LoginPage'
import DeviceTypeCatalogPage from '../features/catalog/pages/DeviceTypeCatalogPage'
import DashboardPage from '../features/dashboard/pages/DashboardPage'
import DeviceHistoryPage from '../features/devices/pages/DeviceHistoryPage'
import DeviceListPage from '../features/devices/pages/DeviceListPage'
import IncidentCreatePage from '../features/incidents/pages/IncidentCreatePage'
import IncidentListPage from '../features/incidents/pages/IncidentListPage'
import LaboratoryListPage from '../features/laboratories/pages/LaboratoryListPage'
import ProfilePage from '../features/profile/pages/ProfilePage'
import ReportsPage from '../features/reports/pages/ReportsPage'
import UserListPage from '../features/users/pages/UserListPage'

// Rutas de la sección 12 de docs/CONTEXTO_DESARROLLO.md.
// `handle.title` es el título que muestra la barra superior.
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage />, handle: { title: 'Dashboard' } },
      { path: 'incidencias', element: <IncidentListPage />, handle: { title: 'Incidencias' } },
      {
        path: 'incidencias/nueva',
        element: <RequireTechnicianWork />,
        handle: { title: 'Registrar incidencia', technicianWork: true },
        children: [{ index: true, element: <IncidentCreatePage /> }],
      },
      {
        path: 'equipos/:code',
        element: <DeviceHistoryPage />,
        handle: { title: 'Historial del equipo' },
      },
      { path: 'reportes', element: <ReportsPage />, handle: { title: 'Reportes' } },
      { path: 'perfil', element: <ProfilePage />, handle: { title: 'Mi perfil' } },
      {
        path: 'admin',
        element: <RequireAdmin />,
        handle: { title: 'Administración', adminOnly: true },
        children: [
          { index: true, element: <Navigate to="laboratorios" replace /> },
          {
            path: 'laboratorios',
            element: <LaboratoryListPage />,
            handle: { title: 'Laboratorios' },
          },
          { path: 'equipos', element: <DeviceListPage />, handle: { title: 'Equipos' } },
          {
            path: 'catalogo',
            element: <DeviceTypeCatalogPage />,
            handle: { title: 'Catálogo de equipos' },
          },
          { path: 'usuarios', element: <UserListPage />, handle: { title: 'Usuarios' } },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
