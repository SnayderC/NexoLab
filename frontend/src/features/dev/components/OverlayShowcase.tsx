import { useState } from 'react'
import Button from '../../../components/ui/Button'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import FormField from '../../../components/ui/FormField'
import Input from '../../../components/ui/Input'
import Modal from '../../../components/ui/Modal'
import Select from '../../../components/ui/Select'
import { useToast } from '../../../components/ui/toast/useToast'
import { deviceTypeOptions, laboratoryOptions } from '../showcaseData'
import ShowcaseSection from './ShowcaseSection'

// Réplica de "5.6 Equipos / Nuevo equipo" y "5.8 Equipos / Confirmar retiro".
function OverlayShowcase() {
  const { showToast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [laboratory, setLaboratory] = useState<string | null>('H103')
  const [deviceType, setDeviceType] = useState<string | null>('PC')

  return (
    <ShowcaseSection title="Modal, confirmación y mensajes emergentes">
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          Abrir modal
        </Button>
        <Button onClick={() => setIsConfirmOpen(true)}>Abrir confirmación</Button>
        <Button onClick={() => showToast({ message: 'Incidencia INC-2026-0049 registrada' })}>
          Toast de éxito
        </Button>
        <Button onClick={() => showToast({ message: 'No se pudo guardar el equipo', tone: 'error' })}>
          Toast de error
        </Button>
        <Button onClick={() => showToast({ message: 'Recalculando el riesgo…', tone: 'info' })}>
          Toast informativo
        </Button>
      </div>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nuevo equipo"
        footer={
          <>
            <Button onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>
              Guardar
            </Button>
          </>
        }
      >
        <FormField id="dev-modal-code" label="Código" hint="Formato LAB-TIPO-NN">
          <Input id="dev-modal-code" defaultValue="H103-PC-13" />
        </FormField>
        <FormField id="dev-modal-laboratory" label="Laboratorio">
          <Select
            id="dev-modal-laboratory"
            options={laboratoryOptions}
            value={laboratory}
            onChange={setLaboratory}
          />
        </FormField>
        <FormField id="dev-modal-type" label="Tipo de equipo">
          <Select
            id="dev-modal-type"
            options={deviceTypeOptions}
            value={deviceType}
            onChange={setDeviceType}
          />
        </FormField>
        <FormField id="dev-modal-location" label="Ubicación física">
          <Input id="dev-modal-location" defaultValue="Fila 3, puesto 9" />
        </FormField>
        <FormField id="dev-modal-specs" label="Especificaciones">
          <Input id="dev-modal-specs" defaultValue="Intel Core i5, 8 GB RAM" />
        </FormField>
      </Modal>

      <ConfirmDialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          setIsConfirmOpen(false)
          showToast({ message: 'Equipo H103-MON-03 retirado' })
        }}
        title="Confirmar retiro"
        message="El equipo H103-MON-03 dejará de aparecer en los formularios y en el cálculo de riesgo. Su historial se conserva."
        confirmLabel="Retirar equipo"
        variant="danger"
      />
    </ShowcaseSection>
  )
}

export default OverlayShowcase
