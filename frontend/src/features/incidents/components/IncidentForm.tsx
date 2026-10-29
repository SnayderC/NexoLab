import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import Button from '../../../components/ui/Button'
import FormField from '../../../components/ui/FormField'
import Input from '../../../components/ui/Input'
import OptionGroup from '../../../components/ui/OptionGroup'
import Select from '../../../components/ui/Select'
import Textarea from '../../../components/ui/Textarea'
import { fromDateTimeInputValue, toDateTimeInputValue } from '../../../lib/formatDate'
import type { AffectedComponent } from '../../../types/catalog'
import type { Priority } from '../../../types/incident'
import { useCatalogs } from '../../catalog/useCatalog'
import type { LaboratoryOption } from '../../devices/api'
import { useDeviceOptions } from '../../devices/useDeviceOptions'
import type { CreateIncidentInput, EligibleDevice } from '../api'
import { useEligibleDevices } from '../useDeviceInfo'

const MAX_DESCRIPTION_LENGTH = 500
// Si el componente es "Otro", la descripción debe explicar mejor qué falló (D-24).
const MIN_OTHER_DESCRIPTION_LENGTH = 20

const priorityOptions: { value: Priority; label: string }[] = [
  { value: 'HIGH', label: 'Alta' },
  { value: 'MEDIUM', label: 'Media' },
  { value: 'LOW', label: 'Baja' },
]

// RN-16: descripción de 10 a 500 caracteres y fecha de la falla no futura. El backend vuelve a validarlo.
const buildIncidentSchema = (otherComponentId: string) =>
  z
  .object({
  laboratory_id: z.string().min(1, 'Selecciona un laboratorio'),
  device_id: z.string().min(1, 'Selecciona un equipo'),
  component_id: z.string().min(1, 'Selecciona el componente afectado'),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW'], { error: 'Selecciona la prioridad' }),
  opened_at: z
    .string()
    .min(1, 'Indica la fecha y hora de la falla')
    .refine(
      (value) => new Date(fromDateTimeInputValue(value)).getTime() <= Date.now(),
      'La fecha no puede ser futura',
    ),
  description: z
    .string()
    .trim()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(MAX_DESCRIPTION_LENGTH),
  })
  .refine(
    (values) =>
      values.component_id !== otherComponentId ||
      values.description.trim().length >= MIN_OTHER_DESCRIPTION_LENGTH,
    {
      path: ['description'],
      message: `Si el componente es "Otro", describe la falla con al menos ${MIN_OTHER_DESCRIPTION_LENGTH} caracteres`,
    },
  )

type IncidentFormValues = z.input<ReturnType<typeof buildIncidentSchema>>

type IncidentFormProps = {
  // Equipo ya elegido al venir desde el historial del equipo.
  initialDevice: EligibleDevice | null
  reportedByName: string
  isSubmitting: boolean
  onDeviceChange: (deviceCode: string | null) => void
  onSubmit: (input: CreateIncidentInput) => void
  onCancel: () => void
}

// Formulario del Figma "3.4 Registrar / Vacío" a "3.6 Registrar / Errores de validación".
// Espera los laboratorios y los componentes de la API antes de armar el formulario.
function IncidentForm(props: IncidentFormProps) {
  const { options, isPending } = useDeviceOptions()
  const catalogs = useCatalogs()
  if (isPending || !catalogs.data) return null
  const components = catalogs.data.components.filter((component) => component.is_active)
  return <RegistrationForm {...props} laboratories={options.laboratories} components={components} />
}

function RegistrationForm({
  initialDevice,
  reportedByName,
  isSubmitting,
  onDeviceChange,
  onSubmit,
  onCancel,
  laboratories,
  components,
}: IncidentFormProps & { laboratories: LaboratoryOption[]; components: AffectedComponent[] }) {
  const laboratoryOptions = laboratories.map((lab) => ({ value: String(lab.id), label: lab.code }))
  const componentOptions = components.map((c) => ({ value: String(c.id), label: c.name }))
  // Si el componente es "Otro", la descripción pide más detalle (D-24).
  const otherComponentId = String(components.find((c) => c.code === 'OTHER')?.id ?? '')
  const incidentSchema = useMemo(() => buildIncidentSchema(otherComponentId), [otherComponentId])
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      laboratory_id: initialDevice ? String(initialDevice.laboratory_id) : '',
      device_id: initialDevice ? String(initialDevice.id) : '',
      component_id: '',
      priority: undefined,
      opened_at: toDateTimeInputValue(new Date().toISOString()),
      description: '',
    },
  })
  const [laboratoryId, description] = useWatch({ control, name: ['laboratory_id', 'description'] })

  // RN-13: solo los equipos del laboratorio que admiten incidencias.
  const eligibleDevices = useEligibleDevices(laboratoryId ? Number(laboratoryId) : null).data ?? []
  const deviceOptions = eligibleDevices.map((d) => ({ value: String(d.id), label: d.label }))

  function submit(values: IncidentFormValues) {
    onSubmit({
      device_id: Number(values.device_id),
      component_id: Number(values.component_id),
      priority: values.priority as Priority,
      opened_at: fromDateTimeInputValue(values.opened_at),
      description: values.description.trim(),
    })
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="flex min-w-0 flex-1 flex-col gap-5 rounded-lg border border-border-subtle bg-surface p-6"
    >
      <h2 className="text-base font-semibold">Datos de la incidencia</h2>

      <FormField id="incident-laboratory" label="Laboratorio" error={errors.laboratory_id?.message}>
        <Controller
          control={control}
          name="laboratory_id"
          render={({ field }) => (
            <Select
              id="incident-laboratory"
              options={laboratoryOptions}
              value={field.value || null}
              onChange={(value) => {
                field.onChange(value)
                // Al cambiar de laboratorio, el equipo elegido ya no aplica.
                setValue('device_id', '')
                onDeviceChange(null)
              }}
              placeholder="Selecciona un laboratorio"
              invalid={Boolean(errors.laboratory_id)}
              aria-describedby="incident-laboratory-help"
            />
          )}
        />
      </FormField>

      <FormField id="incident-device" label="Equipo" error={errors.device_id?.message}>
        <Controller
          control={control}
          name="device_id"
          render={({ field }) => (
            <Select
              id="incident-device"
              options={deviceOptions}
              value={field.value || null}
              onChange={(value) => {
                field.onChange(value)
                onDeviceChange(eligibleDevices.find((d) => String(d.id) === value)?.code ?? null)
              }}
              placeholder="Selecciona un equipo"
              disabled={!laboratoryId}
              invalid={Boolean(errors.device_id)}
              aria-describedby="incident-device-help"
            />
          )}
        />
      </FormField>

      <FormField id="incident-component" label="Componente afectado" error={errors.component_id?.message}>
        <Controller
          control={control}
          name="component_id"
          render={({ field }) => (
            <OptionGroup
              columns={4}
              options={componentOptions}
              value={field.value || null}
              onChange={field.onChange}
              aria-labelledby="incident-component-label"
              aria-describedby="incident-component-help"
            />
          )}
        />
      </FormField>

      <FormField id="incident-priority" label="Prioridad" error={errors.priority?.message}>
        <Controller
          control={control}
          name="priority"
          render={({ field }) => (
            <OptionGroup
              options={priorityOptions}
              value={field.value ?? null}
              onChange={field.onChange}
              aria-labelledby="incident-priority-label"
              aria-describedby="incident-priority-help"
            />
          )}
        />
      </FormField>

      <FormField id="incident-opened-at" label="Fecha y hora de la falla" error={errors.opened_at?.message}>
        <Input
          id="incident-opened-at"
          type="datetime-local"
          invalid={Boolean(errors.opened_at)}
          aria-describedby="incident-opened-at-help"
          {...register('opened_at')}
        />
      </FormField>

      <FormField
        id="incident-description"
        label="Descripción"
        error={errors.description?.message}
        counter={`${description.length}/${MAX_DESCRIPTION_LENGTH}`}
      >
        <Textarea
          id="incident-description"
          size="md"
          maxLength={MAX_DESCRIPTION_LENGTH}
          placeholder="Describe la falla del equipo..."
          invalid={Boolean(errors.description)}
          aria-describedby="incident-description-help"
          {...register('description')}
        />
      </FormField>

      {/* RN-15: quien registra es el usuario de la sesión; no se elige en el formulario. */}
      <p className="text-text-muted">Registrada por: {reportedByName}</p>

      <div className="flex justify-end gap-3 border-t border-border-subtle pt-5">
        <Button onClick={onCancel}>Cancelar</Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          Registrar incidencia
        </Button>
      </div>
    </form>
  )
}

export default IncidentForm
