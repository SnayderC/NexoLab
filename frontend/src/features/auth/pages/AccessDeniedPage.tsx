function AccessDeniedPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Acceso restringido</h1>
      <p className="mt-2 text-text-muted">Esta sección solo está disponible para administradores.</p>
    </div>
  )
}

export default AccessDeniedPage
