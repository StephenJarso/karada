'use client'

import Link from 'next/link'
import { PRODUCTS } from '@/app/lib/products'
import type { Escrow } from '@/app/lib/types'
import { StatusBadge } from './StatusBadge'

export function EscrowSummary({ escrow }: { escrow: Escrow | null }) {
  if (!escrow) {
    return (
      <section className="glass-panel rounded-3xl border border-outline-variant/30 p-md">
        <div className="flex items-start justify-between gap-sm">
          <div>
            <span className="font-label-caps text-label-caps text-secondary">Current escrow</span>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile mt-xs text-on-surface">No escrow loaded</h2>
            <p className="mt-sm text-on-surface-variant">Create a HODL invoice escrow to feed the oracle workflow.</p>
          </div>
          <span className="material-symbols-outlined text-outline">receipt_long</span>
        </div>
        <Link href="/create" className="mt-md inline-flex w-full items-center justify-center rounded-xl bg-primary-container px-md py-sm font-label-caps text-label-caps text-on-primary-container">
          Create first escrow
        </Link>
      </section>
    )
  }

  return (
    <section className="glass-panel rounded-3xl border border-outline-variant/30 p-md">
      <div className="flex items-start justify-between gap-sm">
        <div>
          <span className="font-label-caps text-label-caps text-secondary">Current escrow</span>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile mt-xs text-on-surface">{escrow.title}</h2>
          <p className="mt-sm text-on-surface-variant">{escrow.description}</p>
        </div>
        <StatusBadge status={escrow.status} />
      </div>

      <div className="mt-md grid grid-cols-2 gap-sm">
        <div className="rounded-xl bg-surface-container-lowest p-sm">
          <p className="font-label-caps text-label-caps text-on-surface-variant">Amount</p>
          <p className="font-code-sm text-primary">{escrow.amount_sats.toLocaleString()} sats</p>
        </div>
        <div className="rounded-xl bg-surface-container-lowest p-sm">
          <p className="font-label-caps text-label-caps text-on-surface-variant">Product</p>
          <p className="font-code-sm text-primary">{PRODUCTS.find(product => product.type === escrow.product_type)?.label}</p>
        </div>
        <div className="rounded-xl bg-surface-container-lowest p-sm">
          <p className="font-label-caps text-label-caps text-on-surface-variant">Proof</p>
          <p className="font-code-sm text-primary">{escrow.tracking_number || escrow.proof_reference || 'Pending'}</p>
        </div>
        <div className="rounded-xl bg-surface-container-lowest p-sm">
          <p className="font-label-caps text-label-caps text-on-surface-variant">Inspection</p>
          <p className="font-code-sm text-primary">{escrow.inspection_deadline ? new Date(escrow.inspection_deadline).toLocaleString() : 'Not opened'}</p>
        </div>
      </div>

      <Link href="/oracle" className="mt-md inline-flex w-full items-center justify-center gap-xs rounded-xl bg-secondary-container px-md py-sm font-label-caps text-label-caps text-on-secondary-container">
        <span className="material-symbols-outlined text-[18px]">account_tree</span>
        Open Oracle
      </Link>
    </section>
  )
}
