import brandMark from '../../../assets/brand/brand-mark-light.svg'
import circleLarge from '../../../assets/brand/circle-large.svg'
import circleSmall from '../../../assets/brand/circle-small.svg'

// Panel izquierdo del login (Figma "1.0 Login"). Se oculta en pantallas angostas.
function BrandPanel() {
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-linear-120 from-primary to-accent p-14 text-surface lg:flex">
      <img src={circleLarge} alt="" width={384} height={384} className="absolute -right-24 -bottom-24" />
      <img src={circleSmall} alt="" width={160} height={160} className="absolute right-20 bottom-40" />

      <div className="relative flex items-center gap-3">
        <img src={brandMark} alt="" width={44} height={44} />
        <span className="text-2xl leading-8 font-semibold">NexoLab</span>
      </div>

      <div className="relative flex max-w-132 flex-col gap-4">
        <p className="text-4xl leading-11.25 font-semibold">Gestión de incidencias y riesgo de equipos</p>
        <p className="leading-5 text-surface/80">Laboratorios de cómputo del Bloque H.</p>
      </div>

      <p className="relative text-xs text-surface/80">NexoLab · Bloque H</p>
    </aside>
  )
}

export default BrandPanel
