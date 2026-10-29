import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import Button from '../../../components/ui/Button'
import FormField from '../../../components/ui/FormField'
import Input from '../../../components/ui/Input'
import Modal from '../../../components/ui/Modal'
import { useToast } from '../../../components/ui/toast/useToast'
import { DuplicateTypeCodeError } from '../api'
import { useAddCatalogType } from '../useCatalog'

const FORM_ID = 'add-type-form'

const typeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Ingresa el código')
    // D-37: el código del tipo forma parte del código del equipo (H103-PC-01).
    .regex(/^[A-Za-z]{2,5}$/, 'De 2 a 5 letras, sin números ni espacios'),
  name: z.string().trim().min(1, 'Ingresa el nombre').max(80, 'Máximo 80 caracteres'),
})

type TypeValues = z.infer<typeof typeSchema>

// Figma "5.14 Catálogo / Agregar tipo".
function AddTypeModal({ onClose }: { onClose: () => void }) {
  const { showToast } = useToast()
  const addType = useAddCatalogType()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<TypeValues>({ resolver: zodResolver(typeSchema), defaultValues: { code: '', name: '' } })

  function submit(values: TypeValues) {
    addType.mutate(values, {
      onSuccess: () => {
        onClose()
        showToast({ message: `Tipo ${values.name} agregado al catálogo` })
      },
      onError: (error) =>
        error instanceof DuplicateTypeCodeError
          ? setError('code', { message: error.message })
          : showToast({ message: 'No se pudo agregar el tipo', tone: 'error' }),
    })
  }

  return (
    <Modal
      open
      size="md"
      onClose={onClose}
      title="Agregar tipo al catálogo"
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" form={FORM_ID} variant="primary" isLoading={addType.isPending}>
            Agregar
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField id="type-code" label="Código" error={errors.code?.message}>
            <Input id="type-code" placeholder="MPC" invalid={Boolean(errors.code)} {...register('code')} />
          </FormField>
          <FormField id="type-name" label="Nombre" error={errors.name?.message}>
            <Input id="type-name" placeholder="Mini PC" invalid={Boolean(errors.name)} {...register('name')} />
          </FormField>
        </div>
        <p className="text-xs text-text-muted">El nuevo tipo se agrega inactivo; actívalo para usarlo.</p>
      </form>
    </Modal>
  )
}

export default AddTypeModal
