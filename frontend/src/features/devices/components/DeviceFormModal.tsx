import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import Button from '../../../components/ui/Button'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import FormField from '../../../components/ui/FormField'
import Input from '../../../components/ui/Input'
import Modal from '../../../components/ui/Modal'
import Select from '../../../components/ui/Select'
import { useToast } from '../../../components/ui/toast/useToast'
import { DEVICE_CODE_PATTERN, DeviceCodeError, type DeviceListItem, type DeviceOptions } from '../api'
import { useDeviceOptions } from '../useDeviceOptions'
import { useCreateDevice, useUpdateDevice } from '../useDevices'

const FORM_ID = 'device-form'
const statusOptions = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'RETIRED', label: 'Retirado' },
]

const FORMAT_MESSAGE = 'El código debe tener el formato LAB-TIPO-NN, por ejemplo H103-PC-13 o H106A-PC-05'

// RN-11: formato LAB-TIPO-NN y, además, que empiece con el laboratorio y el tipo elegidos (D-21).
// El backend vuelve a validar las dos reglas.
const buildDeviceSchema = ({ laboratories, deviceTypes }: DeviceOptions) =>
  z
  .object({
    code: z.string().trim().min(1, 'Ingresa el código'),
    laboratory_id: z.string().min(1, 'Selecciona un laboratorio'),
    device_type_id: z.string().min(1, 'Selecciona el tipo de equipo'),
    physical_location: z.string().trim().max(100, 'Máximo 100 caracteres'),
    specifications: z.string().trim(),
    status: z.enum(['ACTIVE', 'RETIRED']),
  })
  .superRefine((values, context) => {
    const code = values.code.toUpperCase()
    if (!code) return
    if (!DEVICE_CODE_PATTERN.test(code)) {
      context.addIssue({ code: 'custom', path: ['code'], message: FORMAT_MESSAGE })
      return
    }
    const laboratory = laboratories.find((lab) => String(lab.id) === values.laboratory_id)
    const type = deviceTypes.find((t) => String(t.id) === values.device_type_id)
    const prefix = laboratory && type ? `${laboratory.code}-${type.code}-` : null
    if (prefix && !code.startsWith(prefix)) {
      context.addIssue({ code: 'custom', path: ['code'], message: `El código debe empezar con ${prefix}` })
    }
  })

type DeviceFormValues = z.infer<ReturnType<typeof buildDeviceSchema>>

type DeviceFormModalProps = {
  // null = nuevo equipo.
  device: DeviceListItem | null
  onClose: () => void
}

// Modal del Figma 5.6 "Nuevo equipo", 5.7 "Código con formato inválido" y 5.8 "Editar / Confirmar retiro".
// Espera las opciones de la API antes de armar el formulario.
function DeviceFormModal(props: DeviceFormModalProps) {
  const { options, isPending } = useDeviceOptions()
  return isPending ? null : <DeviceForm {...props} options={options} />
}

function DeviceForm({ device, onClose, options }: DeviceFormModalProps & { options: DeviceOptions }) {
  const laboratoryOptions = options.laboratories.map((lab) => ({ value: String(lab.id), label: lab.code }))
  const typeOptions = options.deviceTypes.map((type) => ({ value: String(type.id), label: type.name }))
  const { showToast } = useToast()
  const createDevice = useCreateDevice()
  const updateDevice = useUpdateDevice()
  const isEditing = device !== null
  const isRetired = device?.status === 'RETIRED'
  // Valores esperando la confirmación de retiro.
  const [pendingRetire, setPendingRetire] = useState<DeviceFormValues | null>(null)

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<DeviceFormValues>({
    resolver: zodResolver(buildDeviceSchema(options)),
    defaultValues: {
      code: device?.code ?? '',
      laboratory_id: device ? String(device.laboratory_id) : '',
      device_type_id: device ? String(device.device_type_id) : '',
      physical_location: device?.physical_location ?? '',
      specifications: device?.specifications ?? '',
      status: device?.status ?? 'ACTIVE',
    },
  })

  const onError = (error: Error) =>
    error instanceof DeviceCodeError
      ? setError('code', { message: error.message })
      : showToast({ message: 'No se pudo guardar el equipo', tone: 'error' })

  function save(values: DeviceFormValues) {
    const details = {
      physical_location: values.physical_location || null,
      specifications: values.specifications || null,
    }
    const onSuccess = (message: string) => () => {
      onClose()
      showToast({ message })
    }

    if (!device) {
      createDevice.mutate(
        {
          ...details,
          code: values.code,
          laboratory_id: Number(values.laboratory_id),
          device_type_id: Number(values.device_type_id),
        },
        { onSuccess: onSuccess(`Equipo ${values.code.toUpperCase()} creado`), onError },
      )
      return
    }
    const retiring = !isRetired && values.status === 'RETIRED'
    updateDevice.mutate(
      { id: device.id, input: { ...details, status: values.status } },
      { onSuccess: onSuccess(retiring ? `Equipo ${device.code} retirado` : 'Equipo actualizado'), onError },
    )
  }

  function submit(values: DeviceFormValues) {
    // Retirar es definitivo: se confirma antes de guardar (Figma 5.8).
    if (isEditing && !isRetired && values.status === 'RETIRED') setPendingRetire(values)
    else save(values)
  }

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={device ? `Editar equipo · ${device.code}` : 'Nuevo equipo'}
        footer={
          <>
            <Button onClick={onClose}>Cancelar</Button>
            <Button
              type="submit"
              form={FORM_ID}
              variant="primary"
              isLoading={createDevice.isPending || updateDevice.isPending}
            >
              Guardar
            </Button>
          </>
        }
      >
        <form id={FORM_ID} onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5">
          <FormField
            id="device-code"
            label="Código"
            hint={isEditing ? undefined : 'Formato LAB-TIPO-NN'}
            error={errors.code?.message}
          >
            <Input
              id="device-code"
              placeholder="H103-PC-13"
              disabled={isEditing}
              invalid={Boolean(errors.code)}
              aria-describedby="device-code-help"
              {...register('code')}
            />
          </FormField>

          <FormField id="device-laboratory" label="Laboratorio" error={errors.laboratory_id?.message}>
            <Controller
              control={control}
              name="laboratory_id"
              render={({ field }) => (
                <Select
                  id="device-laboratory"
                  options={laboratoryOptions}
                  value={field.value || null}
                  onChange={field.onChange}
                  placeholder="Selecciona un laboratorio"
                  // El código incluye el laboratorio y el tipo, y no se edita: tampoco ellos.
                  disabled={isEditing}
                  invalid={Boolean(errors.laboratory_id)}
                  aria-describedby="device-laboratory-help"
                />
              )}
            />
          </FormField>

          <FormField id="device-type" label="Tipo de equipo" error={errors.device_type_id?.message}>
            <Controller
              control={control}
              name="device_type_id"
              render={({ field }) => (
                <Select
                  id="device-type"
                  options={typeOptions}
                  value={field.value || null}
                  onChange={field.onChange}
                  placeholder="Selecciona el tipo de equipo"
                  disabled={isEditing}
                  invalid={Boolean(errors.device_type_id)}
                  aria-describedby="device-type-help"
                />
              )}
            />
          </FormField>

          <FormField id="device-location" label="Ubicación física" error={errors.physical_location?.message}>
            <Input
              id="device-location"
              placeholder="Fila 3, puesto 9"
              disabled={isRetired}
              {...register('physical_location')}
            />
          </FormField>

          <FormField id="device-specs" label="Especificaciones">
            <Input
              id="device-specs"
              placeholder="Intel Core i5, 8 GB RAM"
              disabled={isRetired}
              {...register('specifications')}
            />
          </FormField>

          {isEditing && (
            <FormField
              id="device-status"
              label="Estado"
              hint={isRetired ? 'Un equipo retirado no puede volver a activarse.' : undefined}
            >
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select
                    id="device-status"
                    options={statusOptions}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isRetired}
                    aria-describedby="device-status-help"
                  />
                )}
              />
            </FormField>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={pendingRetire !== null}
        onClose={() => setPendingRetire(null)}
        onConfirm={() => {
          if (pendingRetire) save(pendingRetire)
          setPendingRetire(null)
        }}
        title="Confirmar retiro"
        message={`El equipo ${device?.code ?? ''} dejará de aparecer en los formularios y en el cálculo de riesgo. Su historial se conserva.`}
        confirmLabel="Retirar equipo"
        variant="danger"
      />
    </>
  )
}

export default DeviceFormModal
