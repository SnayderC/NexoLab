import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import Button from '../../../components/ui/Button'
import FormField from '../../../components/ui/FormField'
import Input from '../../../components/ui/Input'
import Modal from '../../../components/ui/Modal'
import Select from '../../../components/ui/Select'
import Switch from '../../../components/ui/Switch'
import { useToast } from '../../../components/ui/toast/useToast'
import {
  DuplicateLaboratoryCodeError,
  LaboratoryHasOpenIncidentsError,
  type LaboratoryListItem,
  type ResponsibleOption,
} from '../api'
import { useResponsibleOptions, useSaveLaboratory } from '../useLaboratories'

const FORM_ID = 'laboratory-form'
const NO_RESPONSIBLE = 'none'


const laboratorySchema = z.object({
  code: z.string().trim().min(1, 'Ingresa el código').max(10, 'Máximo 10 caracteres'),
  name: z.string().trim().min(1, 'Ingresa el nombre').max(100, 'Máximo 100 caracteres'),
  location: z.string().trim().max(150, 'Máximo 150 caracteres'),
  station_count: z
    .string()
    .min(1, 'Ingresa la cantidad de puestos')
    .regex(/^\d+$/, 'Ingresa un número entero')
    .refine((value) => Number(value) > 0, 'Debe tener al menos 1 puesto'),
  responsible: z.string(),
  is_active: z.boolean(),
})

type LaboratoryFormValues = z.infer<typeof laboratorySchema>

type LaboratoryFormModalProps = {
  open: boolean
  // null = nuevo laboratorio.
  laboratory: LaboratoryListItem | null
  onClose: () => void
}

// Modal del Figma "5.1 Nuevo laboratorio" y "5.2 Código duplicado". Sirve también para editar.
// Espera la lista de técnicos de la API antes de armar el formulario.
function LaboratoryFormModal(props: LaboratoryFormModalProps) {
  const technicians = useResponsibleOptions().data
  return technicians ? <LaboratoryForm {...props} technicians={technicians} /> : null
}

function LaboratoryForm({
  open,
  laboratory,
  onClose,
  technicians,
}: LaboratoryFormModalProps & { technicians: ResponsibleOption[] }) {
  const responsibleOptions = [
    { value: NO_RESPONSIBLE, label: 'Sin responsable' },
    ...technicians.map((tech) => ({ value: String(tech.id), label: tech.name })),
  ]
  // Un laboratorio nuevo propone al primer técnico disponible (Figma 5.1).
  const defaultResponsible = technicians[0] ? String(technicians[0].id) : NO_RESPONSIBLE
  const { showToast } = useToast()
  const save = useSaveLaboratory()
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LaboratoryFormValues>({
    resolver: zodResolver(laboratorySchema),
    defaultValues: {
      code: laboratory?.code ?? '',
      name: laboratory?.name ?? '',
      location: laboratory?.location ?? '',
      station_count: laboratory ? String(laboratory.station_count) : '',
      responsible: !laboratory
        ? defaultResponsible
        : laboratory.responsible_technician_id
          ? String(laboratory.responsible_technician_id)
          : NO_RESPONSIBLE,
      is_active: laboratory?.is_active ?? true,
    },
  })

  function submit(values: LaboratoryFormValues) {
    save.mutate(
      {
        id: laboratory?.id ?? null,
        input: {
          code: values.code,
          name: values.name,
          location: values.location || null,
          station_count: Number(values.station_count),
          responsible_technician_id: values.responsible === NO_RESPONSIBLE ? null : Number(values.responsible),
          is_active: values.is_active,
        },
      },
      {
        onSuccess: () => {
          onClose()
          showToast({ message: laboratory ? 'Laboratorio actualizado' : 'Laboratorio creado' })
        },
        onError: (error) => {
          if (error instanceof DuplicateLaboratoryCodeError) {
            setError('code', { message: error.message })
          } else if (error instanceof LaboratoryHasOpenIncidentsError) {
            setError('is_active', {
              message: 'No se puede desactivar: el laboratorio tiene incidencias abiertas',
            })
          } else {
            showToast({ message: 'No se pudo guardar el laboratorio', tone: 'error' })
          }
        },
      },
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={laboratory ? `Editar laboratorio · ${laboratory.code}` : 'Nuevo laboratorio'}
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" form={FORM_ID} variant="primary" isLoading={save.isPending}>
            Guardar
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-6">
          <FormField id="lab-code" label="Código" error={errors.code?.message}>
            <Input
              id="lab-code"
              placeholder="H106"
              invalid={Boolean(errors.code)}
              aria-describedby="lab-code-help"
              {...register('code')}
            />
          </FormField>
          <FormField id="lab-name" label="Nombre" error={errors.name?.message}>
            <Input
              id="lab-name"
              placeholder="Laboratorio 6"
              invalid={Boolean(errors.name)}
              aria-describedby="lab-name-help"
              {...register('name')}
            />
          </FormField>
        </div>

        <FormField
          id="lab-location"
          label="Ubicación"
          error={errors.location?.message}
          hint="Ej.: Bloque H, planta alta"
        >
          <Input id="lab-location" aria-describedby="lab-location-help" {...register('location')} />
        </FormField>

        <FormField id="lab-stations" label="Puestos de trabajo" error={errors.station_count?.message}>
          <Input
            id="lab-stations"
            type="number"
            min={1}
            invalid={Boolean(errors.station_count)}
            aria-describedby="lab-stations-help"
            {...register('station_count')}
          />
        </FormField>

        <FormField id="lab-responsible" label="Técnico responsable">
          <Controller
            control={control}
            name="responsible"
            render={({ field }) => (
              <Select id="lab-responsible" options={responsibleOptions} value={field.value} onChange={field.onChange} />
            )}
          />
        </FormField>

        <div className="flex flex-col gap-1.5">
          <Controller
            control={control}
            name="is_active"
            render={({ field }) => <Switch label="Activo" checked={field.value} onChange={field.onChange} />}
          />
          {errors.is_active && <p className="text-xs leading-4.5 text-danger">{errors.is_active.message}</p>}
        </div>
      </form>
    </Modal>
  )
}

export default LaboratoryFormModal
