import { Plus } from 'lucide-react'
import { useState } from 'react'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import ErrorState from '../../../components/ui/ErrorState'
import Table, { type TableColumn } from '../../../components/ui/Table'
import TableSkeleton from '../../../components/ui/TableSkeleton'
import { useToast } from '../../../components/ui/toast/useToast'
import { formatDate, formatTime } from '../../../lib/formatDate'
import { useCurrentUser } from '../../auth/useCurrentUser'
import type { UserListItem } from '../api'
import ResetPasswordModal from '../components/ResetPasswordModal'
import UserFormModal from '../components/UserFormModal'
import { useSetUserActive, useUsers } from '../useUsers'

type FormState = { open: false } | { open: true; user: UserListItem | null }

// Administración › Usuarios (Figma 5.15 a 5.18).
function UserListPage() {
  const { showToast } = useToast()
  const { user: currentUser } = useCurrentUser()
  const { data: users, isPending, isError, refetch } = useUsers()
  const setActive = useSetUserActive()
  const [form, setForm] = useState<FormState>({ open: false })
  const [resetTarget, setResetTarget] = useState<UserListItem | null>(null)
  const [toggleTarget, setToggleTarget] = useState<UserListItem | null>(null)

  function confirmToggle() {
    if (!toggleTarget) return
    const target = toggleTarget
    setToggleTarget(null)
    setActive.mutate(
      { id: target.id, isActive: !target.is_active, currentUserId: currentUser.id },
      {
        onSuccess: () =>
          showToast({
            message: `${target.first_name} ${target.last_name} ${target.is_active ? 'desactivado' : 'activado'}`,
          }),
        onError: () => showToast({ message: 'No se pudo cambiar el estado del usuario', tone: 'error' }),
      },
    )
  }

  const columns: TableColumn<UserListItem>[] = [
    { key: 'name', header: 'Nombre', className: 'w-25', render: (u) => `${u.first_name} ${u.last_name}` },
    { key: 'email', header: 'Correo', className: 'w-38', render: (u) => u.email },
    { key: 'role', header: 'Rol', className: 'w-25', render: (u) => u.role_name },
    {
      key: 'status',
      header: 'Estado',
      className: 'w-21',
      render: (u) => (u.is_active ? <Badge tone="success">Activo</Badge> : <Badge tone="neutral">Inactivo</Badge>),
    },
    {
      key: 'last_login',
      header: 'Último acceso',
      className: 'w-26',
      render: (u) =>
        u.last_login_at ? (
          <>
            {formatDate(u.last_login_at)}
            <br />
            {formatTime(u.last_login_at)}
          </>
        ) : (
          '—'
        ),
    },
    {
      key: 'labs',
      header: 'Laboratorios a cargo',
      className: 'w-26',
      render: (u) => (u.laboratory_codes.length ? u.laboratory_codes.join(', ') : '—'),
    },
    { key: 'registered', header: 'Incidencias registradas', className: 'w-23', render: (u) => u.registered_count },
    { key: 'closed', header: 'Incidencias cerradas', className: 'w-23', render: (u) => u.closed_count },
    {
      key: 'actions',
      header: 'Acciones',
      render: (u) => {
        const isSelf = u.id === currentUser.id
        return (
          <div className="flex flex-col items-start gap-2">
            <Button size="sm" onClick={() => setForm({ open: true, user: u })}>
              Editar
            </Button>
            <Button size="sm" className="w-full" onClick={() => setResetTarget(u)}>
              Restablecer contraseña
            </Button>
            {/* RN-05: un usuario no puede desactivarse a sí mismo. */}
            <Button size="sm" className="w-18" disabled={isSelf} onClick={() => setToggleTarget(u)}>
              {u.is_active ? 'Desactivar' : 'Activar'}
            </Button>
            {isSelf && <p className="text-2xs text-text-muted">No puedes desactivar tu propia cuenta</p>}
          </div>
        )
      },
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex h-10 items-center justify-between">
        <h1 className="text-2xl font-semibold">Usuarios</h1>
        <Button variant="primary" icon={Plus} onClick={() => setForm({ open: true, user: null })}>
          Nuevo usuario
        </Button>
      </div>

      {isError ? (
        <div className="rounded-lg border border-border-subtle bg-surface">
          <ErrorState title="No se pudieron cargar los usuarios" onRetry={() => refetch()} />
        </div>
      ) : isPending ? (
        <TableSkeleton rows={3} columns={9} />
      ) : (
        <Table
          caption="Usuarios"
          columns={columns}
          rows={users}
          getRowKey={(u) => u.id}
          footer={<p className="px-5 py-5 text-text-muted">{users.length} usuarios</p>}
        />
      )}

      {form.open && (
        <UserFormModal key={form.user?.id ?? 'new'} user={form.user} onClose={() => setForm({ open: false })} />
      )}
      {resetTarget && <ResetPasswordModal user={resetTarget} onClose={() => setResetTarget(null)} />}

      <ConfirmDialog
        open={toggleTarget !== null}
        onClose={() => setToggleTarget(null)}
        onConfirm={confirmToggle}
        title={toggleTarget?.is_active ? 'Desactivar usuario' : 'Activar usuario'}
        message={
          toggleTarget?.is_active
            ? `${toggleTarget.first_name} ${toggleTarget.last_name} no podrá iniciar sesión. Su historial se conserva.`
            : `${toggleTarget?.first_name ?? ''} ${toggleTarget?.last_name ?? ''} podrá volver a iniciar sesión.`
        }
        confirmLabel={toggleTarget?.is_active ? 'Desactivar' : 'Activar'}
        variant={toggleTarget?.is_active ? 'danger' : 'primary'}
      />
    </div>
  )
}

export default UserListPage
