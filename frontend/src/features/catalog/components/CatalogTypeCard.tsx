import {
  BatteryCharging,
  Box,
  Cctv,
  Computer,
  Fingerprint,
  HardDrive,
  Laptop,
  Mic,
  Monitor,
  Network,
  PanelTop,
  Phone,
  Presentation,
  Printer,
  Projector,
  Router,
  Scan,
  ScanBarcode,
  ScanLine,
  Server,
  Shield,
  SlidersHorizontal,
  Speaker,
  Tablet,
  Tv,
  Video,
  Webcam,
  Wifi,
  type LucideIcon,
} from 'lucide-react'
import type { CatalogType } from '../api'

// Ícono de cada tipo, como en el Figma 5.9. Un tipo nuevo usa una caja genérica.
const typeIcons: Record<string, LucideIcon> = {
  NAS: HardDrive, CDO: ScanLine, CIP: Cctv, CAM: Webcam, CAU: SlidersHorizontal, DDE: HardDrive,
  VDC: Video, ESC: Scan, FWL: Shield, IMP: Printer, IMF: Printer, KIO: PanelTop, LAP: Laptop,
  LBI: Fingerprint, LCB: ScanBarcode, MIC: Mic, MON: Monitor, PAR: Speaker, PC: Computer,
  PZD: Presentation, PLT: Printer, PRY: Projector, APW: Wifi, RCK: Server, RTR: Router, SRV: Server,
  SWT: Network, TAB: Tablet, TIP: Phone, TV: Tv, AIO: Monitor, UPS: BatteryCharging,
}

type CatalogTypeCardProps = {
  type: CatalogType
  isSelected: boolean
  onToggle: () => void
}

// Tarjeta de un tipo con su interruptor (Figma 5.9). Seleccionada: borde azul.
function CatalogTypeCard({ type, isSelected, onToggle }: CatalogTypeCardProps) {
  const Icon = typeIcons[type.code] ?? Box

  return (
    <div
      className={`flex min-h-32 flex-col gap-2 rounded-lg border bg-surface p-3 ${
        isSelected ? 'border-primary' : 'border-border-subtle'
      }`}
    >
      <div className="flex items-start justify-between">
        <span className="flex size-8 items-center justify-center rounded-lg bg-background text-text-muted">
          <Icon className="size-4.5" aria-hidden />
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={isSelected}
          aria-label={`${type.name}: ${isSelected ? 'activo' : 'inactivo'}`}
          onClick={onToggle}
          className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${
            isSelected ? 'bg-nav-active' : 'bg-border'
          }`}
        >
          <span
            className={`absolute top-0.75 left-0.75 size-4.5 rounded-full bg-surface shadow-menu transition-transform ${
              isSelected ? 'translate-x-4' : ''
            }`}
            aria-hidden
          />
        </button>
      </div>
      <p className="font-semibold">{type.name}</p>
      <div className="mt-auto flex flex-col gap-1 text-xs text-text-muted">
        <span>{type.code}</span>
        {isSelected && (
          <span>
            {type.active_device_count > 0
              ? `${type.active_device_count} equipos activos`
              : 'Sin equipos registrados'}
          </span>
        )}
      </div>
    </div>
  )
}

export default CatalogTypeCard
