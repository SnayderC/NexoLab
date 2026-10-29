import { CircleAlert, Layers, Plus } from 'lucide-react'
import { useState } from 'react'
import Button from '../../../components/ui/Button'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import ErrorState from '../../../components/ui/ErrorState'
import SearchInput from '../../../components/ui/SearchInput'
import Skeleton from '../../../components/ui/Skeleton'
import { useToast } from '../../../components/ui/toast/useToast'
import type { CatalogType } from '../api'
import AddTypeModal from '../components/AddTypeModal'
import CatalogTypeCard from '../components/CatalogTypeCard'
import { useCatalogTypes, useSaveCatalogSelection } from '../useCatalog'

// Administración › Catálogo de equipos (Figma 5.9 a 5.14).
function DeviceTypeCatalogPage() {
  const { showToast } = useToast()
  const { data: types, isPending, isError, refetch } = useCatalogTypes()
  const save = useSaveCatalogSelection()
  const [search, setSearch] = useState('')
  // Selección editada en pantalla; null = sin cambios respecto a lo guardado.
  const [draft, setDraft] = useState<Set<number> | null>(null)
  // Tipo con equipos que se quiere desactivar (Figma 5.11).
  const [pendingOff, setPendingOff] = useState<CatalogType | null>(null)
  const [isConfirmingSave, setIsConfirmingSave] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)

  const saved = new Set((types ?? []).filter((t) => t.is_selected).map((t) => t.id))
  const selection = draft ?? saved
  const changeCount = (types ?? []).filter((t) => saved.has(t.id) !== selection.has(t.id)).length
  const hasNoneSelected = selection.size === 0

  const visible = (types ?? []).filter((t) =>
    `${t.name} ${t.code}`.toLowerCase().includes(search.trim().toLowerCase()),
  )

  function setSelected(ids: Set<number>) {
    setDraft(ids)
  }

  function toggle(type: CatalogType) {
    const next = new Set(selection)
    if (next.has(type.id)) {
      // Desactivar un tipo con equipos activos se confirma antes (Figma 5.11).
      if (type.active_device_count > 0 && saved.has(type.id) && !pendingOff) {
        setPendingOff(type)
        return
      }
      next.delete(type.id)
    } else {
      next.add(type.id)
    }
    setSelected(next)
  }

  function confirmSave() {
    setIsConfirmingSave(false)
    save.mutate([...selection], {
      // RN-08: el backend recalcula el riesgo al guardar; si el cálculo falla, la selección igual queda guardada.
      onSuccess: ({ risk_error }) => {
        setDraft(null)
        showToast(
          risk_error
            ? { message: `Configuración guardada. No se pudo recalcular el riesgo: ${risk_error}`, tone: 'error' }
            : { message: 'Configuración guardada y riesgo de los equipos recalculado' },
        )
      },
      onError: () => showToast({ message: 'No se pudo guardar la configuración', tone: 'error' }),
    })
  }

  return (
    <div className="flex flex-col gap-5 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Catálogo de equipos</h1>
        <p className="text-text-muted">
          Selecciona los tipos de equipo que utiliza tu institución. Solo los tipos activos aparecen en los
          formularios y en el cálculo de riesgo.
        </p>
      </div>

      {isError ? (
        <div className="rounded-lg border border-border-subtle bg-surface">
          <ErrorState title="No se pudo cargar el catálogo" onRetry={() => refetch()} />
        </div>
      ) : isPending ? (
        <div className="grid grid-cols-4 gap-3" aria-hidden>
          {Array.from({ length: 12 }, (_, index) => (
            <Skeleton key={index} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          {/* Resumen: degradado normal; rojo si no queda ningún tipo activo (Figma 5.12). */}
          <div
            className={`flex h-14 items-center gap-3 rounded-lg px-4 text-lg font-semibold ${
              hasNoneSelected
                ? 'border border-danger/30 bg-danger-bg text-danger-text'
                : 'bg-linear-to-r from-primary to-accent text-surface'
            }`}
          >
            <Layers className="size-5" aria-hidden />
            Tipos activos: {selection.size} de {types.length}
          </div>

          {hasNoneSelected && (
            <div role="alert" className="flex items-center gap-3 rounded-lg border-l-4 border-danger bg-surface p-4 shadow-toast">
              <CircleAlert className="size-5 text-danger" aria-hidden />
              <p>Debe haber al menos un tipo de equipo activo</p>
            </div>
          )}

          <SearchInput
            className="w-80"
            placeholder="Buscar tipo de equipo"
            aria-label="Buscar tipo de equipo"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <Button onClick={() => setSelected(new Set(types.map((t) => t.id)))}>Seleccionar todos</Button>
              <Button onClick={() => setSelected(new Set())}>Desmarcar todos</Button>
            </div>
            <Button variant="primary" icon={Plus} onClick={() => setIsAddOpen(true)}>
              Agregar tipo al catálogo
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {visible.map((type) => (
              <CatalogTypeCard
                key={type.id}
                type={type}
                isSelected={selection.has(type.id)}
                onToggle={() => toggle(type)}
              />
            ))}
          </div>
        </>
      )}

      {/* Barra de cambios sin guardar (Figma 5.10). */}
      {changeCount > 0 && (
        <div className="fixed right-0 bottom-0 left-64 z-10 flex items-center justify-between border-t border-border-subtle bg-surface px-8 py-4">
          <p>{changeCount === 1 ? '1 cambio sin guardar' : `${changeCount} cambios sin guardar`}</p>
          <div className="flex gap-3">
            <Button onClick={() => setDraft(null)}>Descartar</Button>
            <Button
              variant="primary"
              disabled={hasNoneSelected}
              isLoading={save.isPending}
              onClick={() => setIsConfirmingSave(true)}
            >
              Guardar configuración
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={pendingOff !== null}
        onClose={() => setPendingOff(null)}
        onConfirm={() => {
          if (pendingOff) {
            const next = new Set(selection)
            next.delete(pendingOff.id)
            setSelected(next)
          }
          setPendingOff(null)
        }}
        title={`Desactivar tipo ${pendingOff?.name ?? ''}`}
        message={`Hay ${pendingOff?.active_device_count ?? 0} equipos activos de tipo ${pendingOff?.name ?? ''}. Dejarán de aparecer en los formularios y en el cálculo de riesgo. Su historial se conserva.`}
        confirmLabel="Desactivar de todos modos"
        variant="danger"
      />

      {/* RN-08: guardar recalcula el riesgo (Figma 5.13). */}
      <ConfirmDialog
        open={isConfirmingSave}
        onClose={() => setIsConfirmingSave(false)}
        onConfirm={confirmSave}
        title="Guardar configuración"
        message="Se recalculará el riesgo de los equipos con la nueva configuración. ¿Continuar?"
        confirmLabel="Guardar y recalcular"
      />

      {isAddOpen && <AddTypeModal onClose={() => setIsAddOpen(false)} />}
    </div>
  )
}

export default DeviceTypeCatalogPage
