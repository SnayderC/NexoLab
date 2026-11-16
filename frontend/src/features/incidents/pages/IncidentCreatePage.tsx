import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useToast } from '../../../components/ui/toast/useToast'
import { useCurrentUser } from '../../auth/useCurrentUser'
import { findRegistrationDevice, IncidentRequestError, type CreateIncidentInput } from '../api'
import DeviceInfoPanel from '../components/DeviceInfoPanel'
import IncidentForm from '../components/IncidentForm'
import { useCreateIncident } from '../useIncidents'

function IncidentCreatePage() {
  const navigate = useNavigate()
  const { user } = useCurrentUser()
  const { showToast } = useToast()
  const createIncident = useCreateIncident()
  const [searchParams] = useSearchParams()
  // ?equipo=H103-PC-03 abre el formulario con ese equipo elegido, si admite incidencias (RN-13).
  const initialCode = searchParams.get('equipo')
  const initialDevice = useQuery({
    queryKey: ['devices', 'eligible', 'code', initialCode],
    queryFn: () => findRegistrationDevice(initialCode!),
    enabled: initialCode !== null,
  })
  // null = el usuario cambió o quitó el equipo; undefined = todavía no eligió otro.
  const [chosenCode, setChosenCode] = useState<string | null | undefined>(undefined)
  const deviceCode = chosenCode === undefined ? (initialDevice.data?.code ?? null) : chosenCode

  function handleSubmit(input: CreateIncidentInput) {
    createIncident.mutate(input, {
      onSuccess: (incidentNumber) => {
        showToast({ message: `Incidencia ${incidentNumber} registrada` })
        // La lista resalta la nueva incidencia (Figma 3.7).
        navigate('/incidencias', { state: { highlight: incidentNumber } })
      },
      onError: (error) =>
        showToast({
          message: error instanceof IncidentRequestError ? error.message : 'No se pudo registrar la incidencia',
          tone: 'error',
        }),
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Registrar incidencia</h1>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Con ?equipo= se espera a saber si el equipo admite incidencias antes de armar el formulario. */}
        {!(initialCode !== null && initialDevice.isPending) && (
          <IncidentForm
            initialDevice={initialDevice.data ?? null}
            reportedByName={`${user.first_name} ${user.last_name}`}
            isSubmitting={createIncident.isPending}
            onDeviceChange={setChosenCode}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/incidencias')}
          />
        )}
        <DeviceInfoPanel deviceCode={deviceCode} />
      </div>
    </div>
  )
}

export default IncidentCreatePage
