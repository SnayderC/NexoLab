import type { ReactNode } from 'react'

function ShowcaseSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface p-6">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  )
}

export default ShowcaseSection
