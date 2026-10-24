import { useState } from 'react'
import Button from '../../../components/ui/Button'
import FormField from '../../../components/ui/FormField'
import Input from '../../../components/ui/Input'
import OptionGroup from '../../../components/ui/OptionGroup'
import Select from '../../../components/ui/Select'
import Textarea from '../../../components/ui/Textarea'
import { componentOptions, laboratoryOptions, priorityOptions } from '../showcaseData'
import ShowcaseSection from './ShowcaseSection'

// Réplica de "3.6 Registrar / Errores de validación".
function FormShowcase() {
  const [laboratory, setLaboratory] = useState<string | null>(null)
  const [component, setComponent] = useState<string | null>(null)
  const [priority, setPriority] = useState<string | null>(null)
  const [description, setDescription] = useState('No sirve')

  return (
    <ShowcaseSection title="Campos de formulario">
      <div className="flex max-w-167 flex-col gap-5">
        <FormField
          id="dev-laboratory"
          label="Laboratorio"
          required
          error={laboratory ? undefined : 'Selecciona un laboratorio'}
        >
          <Select
            id="dev-laboratory"
            options={laboratoryOptions}
            value={laboratory}
            onChange={setLaboratory}
            placeholder="Selecciona un laboratorio"
            invalid={!laboratory}
            aria-describedby="dev-laboratory-help"
          />
        </FormField>

        <FormField id="dev-device" label="Equipo" required>
          <Select
            id="dev-device"
            options={[]}
            value={null}
            onChange={() => {}}
            placeholder="Selecciona un equipo"
            disabled
          />
        </FormField>

        <FormField
          id="dev-component"
          label="Componente afectado"
          required
          error={component ? undefined : 'Selecciona el componente afectado'}
        >
          <OptionGroup
            options={componentOptions}
            value={component}
            onChange={setComponent}
            aria-labelledby="dev-component-label"
            aria-describedby="dev-component-help"
          />
        </FormField>

        <FormField id="dev-priority" label="Prioridad" required>
          <OptionGroup
            options={priorityOptions}
            value={priority}
            onChange={setPriority}
            aria-labelledby="dev-priority-label"
          />
        </FormField>

        <FormField
          id="dev-failure-at"
          label="Fecha y hora de la falla"
          required
          error="La fecha no puede ser futura"
        >
          <Input
            id="dev-failure-at"
            type="datetime-local"
            defaultValue="2026-10-18T10:00"
            invalid
            aria-describedby="dev-failure-at-help"
          />
        </FormField>

        <FormField
          id="dev-description"
          label="Descripción"
          required
          error={
            description.length < 10 ? 'La descripción debe tener al menos 10 caracteres' : undefined
          }
          counter={`${description.length}/500`}
        >
          <Textarea
            id="dev-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={500}
            invalid={description.length < 10}
            aria-describedby="dev-description-help"
          />
        </FormField>

        <FormField id="dev-code" label="Código" hint="Formato LAB-TIPO-NN">
          <Input id="dev-code" defaultValue="H103-PC-13" aria-describedby="dev-code-help" />
        </FormField>

        <div className="flex justify-end gap-3 border-t border-border-subtle pt-5">
          <Button>Cancelar</Button>
          <Button variant="primary">Registrar incidencia</Button>
        </div>
      </div>
    </ShowcaseSection>
  )
}

export default FormShowcase
