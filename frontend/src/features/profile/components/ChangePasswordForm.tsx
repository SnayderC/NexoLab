import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import Button from '../../../components/ui/Button'
import FormField from '../../../components/ui/FormField'
import PasswordInput from '../../../components/ui/PasswordInput'
import { useToast } from '../../../components/ui/toast/useToast'
import { changePassword, WrongCurrentPasswordError } from '../../auth/api'
import { newPasswordSchema } from '../../users/passwordSchema'

const MIN_LENGTH = 8

const changePasswordSchema = z
  .object({
    current: z.string().min(1, 'Ingresa tu contraseña actual'),
    next: z.string().min(MIN_LENGTH, 'La nueva contraseña debe tener al menos 8 caracteres').pipe(newPasswordSchema),
    confirmation: z.string(),
  })
  .refine((values) => values.next === values.confirmation, {
    path: ['confirmation'],
    message: 'Las contraseñas no coinciden',
  })

type ChangePasswordValues = z.infer<typeof changePasswordSchema>

function Requirement({ met, children }: { met: boolean; children: string }) {
  return (
    <li className={`flex items-center gap-2 text-xs ${met ? 'text-success-text' : 'text-text-muted'}`}>
      <Check className="size-3.5" aria-hidden />
      {children}
    </li>
  )
}

// Tarjeta "Cambiar contraseña" (Figma 6.0 a 6.3).
function ChangePasswordForm() {
  const { showToast } = useToast()
  const mutation = useMutation({
    mutationFn: ({ current, next }: ChangePasswordValues) =>
      changePassword({ current_password: current, new_password: next }),
  })
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current: '', next: '', confirmation: '' },
  })
  const [next, confirmation] = useWatch({ control, name: ['next', 'confirmation'] })

  function submit(values: ChangePasswordValues) {
    mutation.mutate(values, {
      onSuccess: () => {
        reset()
        showToast({ message: 'Contraseña actualizada' })
      },
      onError: (error) =>
        error instanceof WrongCurrentPasswordError
          ? setError('current', { message: 'La contraseña actual no es correcta' })
          : showToast({ message: 'No se pudo actualizar la contraseña', tone: 'error' }),
    })
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface p-5 shadow-menu"
    >
      <h2 className="text-xs font-semibold">Cambiar contraseña</h2>
      <FormField id="profile-current" label="Contraseña actual" required error={errors.current?.message}>
        <PasswordInput
          id="profile-current"
          autoComplete="current-password"
          invalid={Boolean(errors.current)}
          {...register('current')}
        />
      </FormField>
      <FormField id="profile-next" label="Nueva contraseña" required error={errors.next?.message}>
        <PasswordInput id="profile-next" autoComplete="new-password" invalid={Boolean(errors.next)} {...register('next')} />
      </FormField>
      <ul className="flex flex-col gap-1">
        <Requirement met={next.length >= MIN_LENGTH}>Mínimo 8 caracteres</Requirement>
        <Requirement met={next.length > 0 && next === confirmation}>Coincide con la confirmación</Requirement>
      </ul>
      <FormField id="profile-confirmation" label="Confirmar contraseña" required error={errors.confirmation?.message}>
        <PasswordInput
          id="profile-confirmation"
          autoComplete="new-password"
          invalid={Boolean(errors.confirmation)}
          {...register('confirmation')}
        />
      </FormField>
      <div>
        <Button type="submit" variant="primary" isLoading={mutation.isPending}>
          Actualizar contraseña
        </Button>
      </div>
    </form>
  )
}

export default ChangePasswordForm
