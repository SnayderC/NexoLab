import { useParams } from 'react-router'

function DeviceHistoryPage() {
  const { code } = useParams()

  return <h1 className="text-2xl font-semibold">Historial del equipo {code}</h1>
}

export default DeviceHistoryPage
