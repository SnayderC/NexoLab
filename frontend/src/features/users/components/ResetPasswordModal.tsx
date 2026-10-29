import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import Button from '../../../components/ui/Button'
import FormField from '../../../components/ui/FormField'
import Modal from '../../../components/ui/Modal'
import Notice from '../../../components/ui/Notice'
import PasswordInput from '../../../components/ui/PasswordInput'
import { useToast } from '../../../components/ui/toast/useToast'
import { InvalidUserPasswordError, type UserListItem } from '../api'
import { newPasswordSchema } from '../passwordSchema'
import { useResetPassword } from '../useUsers'

const FORM_ID = 'reset-password-form'

const resetSchema = z
  .object({ password: newPasswordSchema, confirmation: z.string() })
  .refine((values) => values.password === values.confirmation, {
    path: ['confirmation'],
    message: 'Las contraseñas no coinciden',
  })

type ResetValues = z.infer<typeof resetSchema>

// Figma "5.18 Usuarios / Restablecer contraseña" (RN-03).
function ResetPasswordModal({ user, onClose }: { user: UserListItem; onClose: () => void }) {
  const { showToast } = useToast()
  const reset = useResetPassword()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetValues>({ resolver: zodResolver(resetSchema), defaultValues: { password: '', confirmation: '' } })

  function submit(values: ResetValues) {
    reset.mutate(
      { id: user.id, password: values.password },
      {
        onSuccess: () => {
          onClose()
          showToast({ message: `Contraseña de ${user.first_name} ${user.last_name} restablecida` })
        },
        onError: (error) =>
          // RN-04: mensajes de los validadores de Django (ej.: parecida a los datos del usuario).
          error instanceof InvalidUserPasswordError
            ? setError('password', { message: error.message })
            : showToast({ message: 'No se pudo restablecer la contraseña', tone: 'error' }),
      },
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Restablecer contraseña"
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" form={FORM_ID} variant="primary" isLoading={reset.isPending}>
            Restablecer
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
        <div>
          <p className="font-semibold">
            {user.first_name} {user.last_name}
          </p>
          <p className="text-xs text-text-muted">{user.email}</p>
        </div>
        <FormField id="reset-password" label="Nueva contraseña temporal" error={errors.password?.message}>
          <PasswordInput
            id="reset-password"
            autoComplete="new-password"
            invalid={Boolean(errors.password)}
            {...register('password')}
          />
        </FormField>
        <FormField id="reset-confirmation" label="Confirmar contraseña" error={errors.confirmation?.message}>
          <PasswordInput
            id="reset-confirmation"
            autoComplete="new-password"
            invalid={Boolean(errors.confirmation)}
            {...register('confirmation')}
          />
        </FormField>
        <Notice>
          Comunica la nueva contraseña al usuario de forma segura y recomiéndale cambiarla desde Mi perfil.
        </Notice>
      </form>
    </Modal>
  )
}

export default ResetPasswordModal
