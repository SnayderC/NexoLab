import { Plus } from 'lucide-react'
import { useState } from 'react'
import Button from '../../../components/ui/Button'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import ErrorState from '../../../components/ui/ErrorState'
import TableSkeleton from '../../../components/ui/TableSkeleton'
import { useToast } from '../../../components/ui/toast/useToast'
import type { LaboratoryListItem } from '../api'
import LaboratoryFormModal from '../components/LaboratoryFormModal'
import LaboratoryTable from '../components/LaboratoryTable'
import { useLaboratories, useSetLaboratoryActive } from '../useLaboratories'

// Modal de formulario: cerrado, nuevo (null) o editando un laboratorio.
type FormState = { open: false } | { open: true; laboratory: LaboratoryListItem | null }

const pluralIncidents = (count: number) => (count === 1 ? '1 incidencia abierta' : `${count} incidencias abiertas`)

function LaboratoryListPage() {
  const { showToast } = useToast()
  const { data: laboratories, isPending, isError, refetch } = useLaboratories()
  const setActive = useSetLaboratoryActive()
  const [form, setForm] = useState<FormState>({ open: false })
  // Laboratorio a desactivar o activar, y si está bloqueado por incidencias abiertas (Figma 5.3).
  const [toggleTarget, setToggleTarget] = useState<LaboratoryListItem | null>(null)
  const isBlocked = toggleTarget !== null && toggleTarget.is_active && toggleTarget.open_incident_count > 0

  function confirmToggle() {
    if (!toggleTarget) return
    const target = toggleTarget
    setToggleTarget(null)
    setActive.mutate(
      { id: target.id, isActive: !target.is_active },
      {
        onSuccess: () =>
          showToast({ message: `Laboratorio ${target.code} ${target.is_active ? 'desactivado' : 'activado'}` }),
        onError: () => showToast({ message: 'No se pudo cambiar el estado del laboratorio', tone: 'error' }),
      },
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex h-10 items-center justify-between">
        <h1 className="text-2xl font-semibold">Laboratorios</h1>
        <Button variant="primary" icon={Plus} onClick={() => setForm({ open: true, laboratory: null })}>
          Nuevo laboratorio
        </Button>
      </div>

      {isError ? (
        <div className="rounded-lg border border-border-subtle bg-surface">
          <ErrorState title="No se pudieron cargar los laboratorios" onRetry={() => refetch()} />
        </div>
      ) : isPending ? (
        <TableSkeleton rows={5} columns={9} />
      ) : (
        <LaboratoryTable
          laboratories={laboratories}
          onEdit={(laboratory) => setForm({ open: true, laboratory })}
          onToggleActive={setToggleTarget}
        />
      )}

      {form.open && (
        // `key` reinicia el formulario al cambiar de laboratorio.
        <LaboratoryFormModal
          key={form.laboratory?.id ?? 'new'}
          open
          laboratory={form.laboratory}
          onClose={() => setForm({ open: false })}
        />
      )}

      {isBlocked ? (
        <ConfirmDialog
          open
          onClose={() => setToggleTarget(null)}
          onConfirm={() => setToggleTarget(null)}
          title="No se puede desactivar"
          message={`No puedes desactivar ${toggleTarget.code} porque tiene ${pluralIncidents(toggleTarget.open_incident_count)}. Ciérrala${toggleTarget.open_incident_count === 1 ? '' : 's'} antes de desactivar el laboratorio.`}
          confirmLabel="Entendido"
          cancelLabel={null}
        />
      ) : (
        <ConfirmDialog
          open={toggleTarget !== null}
          onClose={() => setToggleTarget(null)}
          onConfirm={confirmToggle}
          title={toggleTarget?.is_active ? `Desactivar ${toggleTarget.code}` : `Activar ${toggleTarget?.code ?? ''}`}
          message={
            toggleTarget?.is_active
              ? 'El laboratorio dejará de aparecer en los formularios y filtros. Puedes volver a activarlo después.'
              : 'El laboratorio volverá a aparecer en los formularios y filtros.'
          }
          confirmLabel={toggleTarget?.is_active ? 'Desactivar' : 'Activar'}
          variant={toggleTarget?.is_active ? 'danger' : 'primary'}
        />
      )}
    </div>
  )
}

export default LaboratoryListPage
