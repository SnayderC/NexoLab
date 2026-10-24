import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import Button from '../../../components/ui/Button'
import FormField from '../../../components/ui/FormField'
import Input from '../../../components/ui/Input'
import PasswordInput from '../../../components/ui/PasswordInput'
import { AuthError, type AuthErrorCode } from '../api'

const loginSchema = z.object({
  email: z.email({ error: 'Ingresa un correo válido' }),
  password: z.string().min(1),
})

type LoginValues = z.infer<typeof loginSchema>

// Mensajes de RN-01 y RN-02 (sección 9).
const authErrorMessages: Record<AuthErrorCode, string> = {
  INVALID_CREDENTIALS: 'Correo o contraseña incorrectos',
  ACCOUNT_DISABLED: 'Tu cuenta está desactivada. Contacta al administrador.',
}

type LoginFormProps = {
  onLogin: (email: string, password: string) => Promise<void>
}

function LoginForm({ onLogin }: LoginFormProps) {
  const [authError, setAuthError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  })
  // El botón se habilita cuando ambos campos tienen algo escrito.
  const [email, password] = useWatch({ control, name: ['email', 'password'] })

  async function onSubmit(values: LoginValues) {
    setAuthError(null)
    try {
      await onLogin(values.email, values.password)
    } catch (error) {
      setAuthError(
        error instanceof AuthError
          ? authErrorMessages[error.code]
          : 'No se pudo iniciar sesión. Inténtalo de nuevo.',
      )
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex w-96 flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl leading-8 font-semibold">Iniciar sesión</h1>
        <p className="leading-5 text-text-muted">Ingresa con tu correo y contraseña.</p>
      </div>

      {authError && (
        <div role="alert" className="rounded-lg bg-danger-bg p-3 leading-5 text-danger">
          {authError}
        </div>
      )}

      <FormField id="login-email" label="Correo electrónico" error={errors.email?.message}>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="correo@gmail.com"
          invalid={Boolean(errors.email)}
          aria-describedby="login-email-help"
          {...register('email')}
        />
      </FormField>

      <FormField id="login-password" label="Contraseña">
        <PasswordInput
          id="login-password"
          autoComplete="current-password"
          placeholder="••••••••"
          {...register('password')}
        />
      </FormField>

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={!email || !password}
        isLoading={isSubmitting}
      >
        {isSubmitting ? 'Iniciando sesión…' : 'Iniciar sesión'}
      </Button>

      <p className="text-center leading-5 text-text-muted">
        ¿Olvidaste tu contraseña? Contacta al administrador del sistema.
      </p>
    </form>
  )
}

export default LoginForm
