'use client'

import Link from 'next/link'

export function EmptyState({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon: string
  title: string
  description: string
  actionHref?: string
  actionLabel?: string
}) {
  return (
    <section className="glass-panel rounded-3xl border border-outline-variant/30 p-md text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary-container/10 text-secondary">
        <span className="material-symbols-outlined text-[36px]">{icon}</span>
      </div>
      <h2 className="font-headline-lg-mobile text-headline-lg-mobile mt-md text-on-surface">{title}</h2>
      <p className="mx-auto mt-sm max-w-xl text-on-surface-variant">{description}</p>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="inline-flex mt-md items-center gap-xs rounded-xl bg-primary-container px-md py-sm font-label-caps text-label-caps text-on-primary-container">
          {actionLabel}
        </Link>
      )}
    </section>
  )
}
