import Badge from '../../../components/ui/Badge'
import { formatDateTime } from '../../../lib/formatDate'
import { useCurrentUser } from '../../auth/useCurrentUser'
import ChangePasswordForm from '../components/ChangePasswordForm'

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <dt className="text-text-muted">{label}</dt>
      <dd className="col-span-3">{value}</dd>
    </div>
  )
}

// Mi perfil (Figma 6.0 administrador y 6.4 técnico).
function ProfilePage() {
  const { user } = useCurrentUser()
  const fullName = `${user.first_name} ${user.last_name}`

  return (
    <div className="grid max-w-326 grid-cols-1 items-start gap-4 lg:grid-cols-2">
      <section className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface p-5 shadow-menu">
        <h1 className="text-xs font-semibold">Mi perfil</h1>
        <div className="flex items-center gap-3">
          <span className="flex size-14 items-center justify-center rounded-full bg-linear-to-r from-primary to-accent text-lg font-medium text-surface">
            {user.first_name[0]}
            {user.last_name[0]}
          </span>
          <div className="flex flex-col items-start gap-0.5">
            <p className="text-xs font-semibold">{fullName}</p>
            <Badge tone="info">{user.role.name}</Badge>
          </div>
        </div>
        <dl className="flex flex-col gap-3 text-xs">
          <ProfileRow label="Nombre" value={fullName} />
          <ProfileRow label="Correo" value={user.email} />
          <ProfileRow label="Rol" value={user.role.name} />
          <ProfileRow label="Último acceso" value={user.last_login_at ? formatDateTime(user.last_login_at) : '—'} />
        </dl>
      </section>
      <ChangePasswordForm />
    </div>
  )
}

export default ProfilePage
