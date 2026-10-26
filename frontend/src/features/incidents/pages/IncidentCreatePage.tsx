import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useToast } from '../../../components/ui/toast/useToast'
import { useCurrentUser } from '../../auth/useCurrentUser'
import { findRegistrationDevice, type CreateIncidentInput } from '../api'
import DeviceInfoPanel from '../components/DeviceInfoPanel'
import IncidentForm from '../components/IncidentForm'
import { useCreateIncident } from '../useIncidents'

function IncidentCreatePage() {
  const navigate = useNavigate()
  const { user } = useCurrentUser()
  const { showToast } = useToast()
  const createIncident = useCreateIncident()
  const [searchParams] = useSearchParams()
  // ?equipo=H103-PC-03 abre el formulario con ese equipo elegido.
  const [initialDevice] = useState(() => {
    const code = searchParams.get('equipo')
    return code ? findRegistrationDevice(code) : null
  })
  const [deviceId, setDeviceId] = useState<number | null>(initialDevice?.device_id ?? null)

  function handleSubmit(input: CreateIncidentInput) {
    createIncident.mutate(input, {
      onSuccess: (incidentNumber) => {
        showToast({ message: `Incidencia ${incidentNumber} registrada` })
        // La lista resalta la nueva incidencia (Figma 3.7).
        navigate('/incidencias', { state: { highlight: incidentNumber } })
      },
      onError: () => showToast({ message: 'No se pudo registrar la incidencia', tone: 'error' }),
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Registrar incidencia</h1>
      <div className="flex items-start gap-6">
        <IncidentForm
          initialDevice={initialDevice}
          reportedByName={`${user.first_name} ${user.last_name}`}
          isSubmitting={createIncident.isPending}
          onDeviceChange={setDeviceId}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/incidencias')}
        />
        <DeviceInfoPanel deviceId={deviceId} />
      </div>
    </div>
  )
}

export default IncidentCreatePage
