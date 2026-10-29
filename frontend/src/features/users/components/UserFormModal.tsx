import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import Button from '../../../components/ui/Button'
import FormField from '../../../components/ui/FormField'
import Input from '../../../components/ui/Input'
import Modal from '../../../components/ui/Modal'
import PasswordInput from '../../../components/ui/PasswordInput'
import Select from '../../../components/ui/Select'
import { useToast } from '../../../components/ui/toast/useToast'
import { DuplicateEmailError, getRoleOptions, InvalidUserPasswordError, type UserListItem } from '../api'
import { newPasswordSchema } from '../passwordSchema'
import { useSaveUser } from '../useUsers'

const FORM_ID = 'user-form'
const roleOptions = getRoleOptions()
// Un usuario nuevo es técnico por defecto (Figma 5.16).
const defaultRole = roleOptions.find((r) => r.label === 'Técnico de soporte')?.value ?? ''

function buildSchema(isNew: boolean) {
  return z.object({
    first_name: z.string().trim().min(1, 'Ingresa los nombres').max(100),
    last_name: z.string().trim().min(1, 'Ingresa los apellidos').max(100),
    email: z.email({ error: 'Ingresa un correo válido' }),
    role_id: z.string().min(1, 'Selecciona el rol'),
    password: isNew ? newPasswordSchema : z.string(),
  })
}

type UserFormValues = z.infer<ReturnType<typeof buildSchema>>

// Figma 5.16 "Nuevo usuario" y 5.17 "Correo duplicado". Sirve también para editar (sin contraseña).
function UserFormModal({ user, onClose }: { user: UserListItem | null; onClose: () => void }) {
  const { showToast } = useToast()
  const save = useSaveUser()
  const isNew = user === null
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(buildSchema(isNew)),
    defaultValues: {
      first_name: user?.first_name ?? '',
      last_name: user?.last_name ?? '',
      email: user?.email ?? '',
      role_id: user ? String(user.role_id) : defaultRole,
      password: '',
    },
  })

  function submit(values: UserFormValues) {
    save.mutate(
      {
        id: user?.id ?? null,
        input: {
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          role_id: Number(values.role_id),
        },
        password: values.password,
      },
      {
        onSuccess: () => {
          onClose()
          showToast({ message: isNew ? 'Usuario creado' : 'Usuario actualizado' })
        },
        onError: (error) => {
          if (error instanceof DuplicateEmailError) {
            setError('email', { message: error.message })
          } else if (error instanceof InvalidUserPasswordError) {
            // RN-04: mensajes de los validadores de Django (ej.: contraseña muy común).
            setError('password', { message: error.message })
          } else {
            showToast({ message: 'No se pudo guardar el usuario', tone: 'error' })
          }
        },
      },
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? 'Nuevo usuario' : `Editar usuario · ${user.first_name} ${user.last_name}`}
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" form={FORM_ID} variant="primary" isLoading={save.isPending}>
            {isNew ? 'Crear usuario' : 'Guardar'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-6">
          <FormField id="user-first-name" label="Nombres" error={errors.first_name?.message}>
            <Input id="user-first-name" invalid={Boolean(errors.first_name)} {...register('first_name')} />
          </FormField>
          <FormField id="user-last-name" label="Apellidos" error={errors.last_name?.message}>
            <Input id="user-last-name" invalid={Boolean(errors.last_name)} {...register('last_name')} />
          </FormField>
        </div>
        <FormField id="user-email" label="Correo" error={errors.email?.message}>
          <Input
            id="user-email"
            type="email"
            placeholder="nombre@gmail.com"
            invalid={Boolean(errors.email)}
            {...register('email')}
          />
        </FormField>
        <FormField id="user-role" label="Rol" error={errors.role_id?.message}>
          <Controller
            control={control}
            name="role_id"
            render={({ field }) => (
              <Select id="user-role" options={roleOptions} value={field.value || null} onChange={field.onChange} />
            )}
          />
        </FormField>
        {isNew && (
          <FormField
            id="user-password"
            label="Contraseña temporal"
            hint="Mínimo 8 caracteres"
            error={errors.password?.message}
          >
            <PasswordInput
              id="user-password"
              autoComplete="new-password"
              invalid={Boolean(errors.password)}
              {...register('password')}
            />
          </FormField>
        )}
      </form>
    </Modal>
  )
}

export default UserFormModal
