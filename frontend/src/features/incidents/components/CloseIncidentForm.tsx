import { zodResolver } from '@hookform/resolvers/zod'
import { TriangleAlert } from 'lucide-react'
import { useMemo } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import FormField from '../../../components/ui/FormField'
import Input from '../../../components/ui/Input'
import OptionGroup from '../../../components/ui/OptionGroup'
import Textarea from '../../../components/ui/Textarea'
import { fromDateTimeInputValue, toDateTimeInputValue } from '../../../lib/formatDate'
import { formatDuration } from '../../../lib/formatRelative'
import { DEMO_NOW } from '../../../mocks/demoClock'
import { getRegistrationOptions, type CloseIncidentInput, type IncidentDetail } from '../api'

export const CLOSE_INCIDENT_FORM_ID = 'close-incident-form'

const MAX_TEXT_LENGTH = 500
const { resolutionActions } = getRegistrationOptions()
const actionOptions = resolutionActions.map((action) => ({ value: String(action.id), label: action.name }))

// RN-17: diagnóstico de 10 a 500 caracteres, acción obligatoria y cierre entre la falla y ahora.
function buildSchema(openedAt: string) {
  return z
    .object({
      diagnosis: z
        .string()
        .trim()
        .min(1, 'El diagnóstico es obligatorio')
        .min(10, 'El diagnóstico debe tener al menos 10 caracteres')
        .max(MAX_TEXT_LENGTH),
      resolution_action_id: z.string().min(1, 'Selecciona la acción tomada'),
      notes: z.string().trim().max(MAX_TEXT_LENGTH),
      closed_at: z.string().min(1, 'Indica la fecha y hora de cierre'),
    })
    .superRefine((values, context) => {
      if (!values.closed_at) return
      const closedAt = new Date(fromDateTimeInputValue(values.closed_at)).getTime()
      if (closedAt < new Date(openedAt).getTime()) {
        context.addIssue({
          code: 'custom',
          path: ['closed_at'],
          message: 'La fecha de cierre no puede ser anterior a la fecha de la falla',
        })
      } else if (closedAt > new Date(DEMO_NOW).getTime()) {
        context.addIssue({ code: 'custom', path: ['closed_at'], message: 'La fecha de cierre no puede ser futura' })
      }
    })
}

type CloseIncidentValues = z.infer<ReturnType<typeof buildSchema>>

type CloseIncidentFormProps = {
  incident: IncidentDetail
  closedByName: string
  onSubmit: (input: CloseIncidentInput) => void
}

// Campos del Figma "3.8 Cerrar / Vacío" a "3.10 Cerrar / Errores de validación".
function CloseIncidentForm({ incident, closedByName, onSubmit }: CloseIncidentFormProps) {
  const schema = useMemo(() => buildSchema(incident.opened_at), [incident.opened_at])
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CloseIncidentValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      diagnosis: '',
      resolution_action_id: '',
      notes: '',
      closed_at: toDateTimeInputValue(DEMO_NOW),
    },
  })
  const [diagnosis, notes, actionId, closedAt] = useWatch({
    control,
    name: ['diagnosis', 'notes', 'resolution_action_id', 'closed_at'],
  })

  const selectedAction = resolutionActions.find((action) => String(action.id) === actionId)
  const minutes = closedAt
    ? Math.round(
        (new Date(fromDateTimeInputValue(closedAt)).getTime() - new Date(incident.opened_at).getTime()) / 60_000,
      )
    : -1

  function submit(values: CloseIncidentValues) {
    onSubmit({
      resolution_action_id: Number(values.resolution_action_id),
      diagnosis: values.diagnosis,
      notes: values.notes || null,
      closed_at: fromDateTimeInputValue(values.closed_at),
    })
  }

  return (
    <form id={CLOSE_INCIDENT_FORM_ID} onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5">
      <FormField
        id="close-diagnosis"
        label="Diagnóstico"
        error={errors.diagnosis?.message}
        counter={`${diagnosis.length}/${MAX_TEXT_LENGTH}`}
      >
        <Textarea
          id="close-diagnosis"
          size="md"
          maxLength={MAX_TEXT_LENGTH}
          placeholder="Describe el diagnóstico y la solución aplicada..."
          invalid={Boolean(errors.diagnosis)}
          aria-describedby="close-diagnosis-help"
          {...register('diagnosis')}
        />
      </FormField>

      <FormField id="close-action" label="Acción tomada" error={errors.resolution_action_id?.message}>
        <Controller
          control={control}
          name="resolution_action_id"
          render={({ field }) => (
            <OptionGroup
              options={actionOptions}
              value={field.value || null}
              onChange={field.onChange}
              aria-labelledby="close-action-label"
              aria-describedby="close-action-help"
            />
          )}
        />
      </FormField>

      {selectedAction?.is_retirement_action && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-lg border border-warning-border bg-risk-medium-bg p-4"
        >
          <TriangleAlert className="size-5 shrink-0 text-warning" aria-hidden />
          <p className="leading-5 text-warning-text">
            El equipo {incident.device_code} pasará a estado Retirado y dejará de incluirse en el cálculo de
            riesgo.
          </p>
        </div>
      )}

      <FormField id="close-notes" label="Observaciones" counter={`${notes.length}/${MAX_TEXT_LENGTH}`}>
        <Textarea
          id="close-notes"
          size="sm"
          maxLength={MAX_TEXT_LENGTH}
          placeholder="Observaciones adicionales (opcional)"
          {...register('notes')}
        />
      </FormField>

      <FormField id="close-closed-at" label="Fecha y hora de cierre" error={errors.closed_at?.message}>
        <Input
          id="close-closed-at"
          type="datetime-local"
          invalid={Boolean(errors.closed_at)}
          aria-describedby="close-closed-at-help"
          {...register('closed_at')}
        />
      </FormField>

      {/* Vista previa: el tiempo de atención lo calcula el backend al cerrar (RN-18). */}
      <div className="flex flex-col gap-2 rounded-lg bg-info-bg p-4 text-info-text">
        <p className="font-medium">Tiempo de atención: {minutes >= 0 ? formatDuration(minutes) : '—'}</p>
        <p>Cerrada por: {closedByName}</p>
      </div>
    </form>
  )
}

export default CloseIncidentForm
