'use client'

import { STATUS_LABELS } from '@/app/lib/products'

export function StatusBadge({ status }: { status: string }) {
  const className =
    status === 'SETTLED'
      ? 'bg-green-500/20 text-green-200 border-green-400/30'
      : status === 'DISPUTED'
        ? 'bg-yellow-500/20 text-yellow-100 border-yellow-400/30'
        : status === 'PENDING'
          ? 'bg-primary-container/20 text-primary border-primary-container/30'
          : status === 'DELIVERED_INSPECTING'
            ? 'bg-secondary-container/20 text-secondary border-secondary-container/30'
            : 'bg-surface-container-highest text-on-surface border-outline-variant/40'

  return (
    <div className={`glass-panel inline-flex items-center gap-xs rounded-xl border px-sm py-xs ${className}`}>
      <span className="material-symbols-outlined text-[18px]">
        {status === 'SETTLED' ? 'check_circle' : status === 'DISPUTED' ? 'warning' : status === 'DELIVERED_INSPECTING' ? 'verified' : 'lock'}
      </span>
      <span className="font-label-caps text-label-caps">{STATUS_LABELS[status] || status}</span>
    </div>
  )
}
