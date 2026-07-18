'use client'

import { useEffect, useMemo, useState } from 'react'
import { EmptyState } from '@/app/components/EmptyState'
import { OraclePanel } from '@/app/components/OraclePanel'
import { PRODUCT_COPY } from '@/app/lib/products'
import { useEscrowDemo } from '@/app/lib/useEscrowDemo'
import type { ProductType } from '@/app/lib/types'

export default function MerchantPage() {
  const { escrow, loading, logs, submitFulfillment } = useEscrowDemo()
  const [proofReference, setProofReference] = useState('')

  const activeProduct = useMemo(() => (escrow ? PRODUCT_COPY[escrow.product_type as ProductType] : PRODUCT_COPY.COMMERCE), [escrow])

  useEffect(() => {
    if (escrow?.tracking_number || escrow?.proof_reference) {
      setProofReference(escrow.tracking_number || escrow.proof_reference || '')
    }
  }, [escrow?.tracking_number, escrow?.proof_reference])

  const handleSubmit = async () => {
    if (!proofReference) return
    try {
      await submitFulfillment(proofReference)
    } catch {
      alert('Failed to submit fulfillment proof')
    }
  }

  return (
    <div className="space-y-md">
      <section className="glass-panel rounded-3xl border border-outline-variant/30 p-md">
        <span className="font-label-caps text-label-caps text-secondary">Page 3 of 4</span>
        <h1 className="mt-xs font-display-lg text-display-lg font-bold leading-tight text-on-surface">Merchant / provider workspace</h1>
        <p className="mt-sm max-w-3xl text-on-surface-variant">
          Submit the courier tracking, school document, or savings lock proof that the oracle will verify before opening the inspection window.
        </p>
      </section>

      {!escrow ? (
        <EmptyState icon="local_shipping" title="No escrow assigned to merchant" description="Create an escrow and simulate buyer payment, then submit proof from this workspace." actionHref="/create" actionLabel="Create Escrow" />
      ) : (
        <section className="grid gap-md lg:grid-cols-[1.1fr_0.9fr]">
          <div className="glass-panel rounded-3xl border border-outline-variant/30 p-md">
            <div className="mb-md flex items-start justify-between gap-sm">
              <div>
                <span className="font-label-caps text-label-caps text-secondary">Proof submission</span>
                <h2 className="mt-xs font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{escrow.title}</h2>
                <p className="mt-sm text-on-surface-variant">{escrow.description}</p>
              </div>
              <span className="material-symbols-outlined text-secondary">fact_check</span>
            </div>

            {escrow.status === 'HELD' && (
              <div className="space-y-sm">
                <label className="block space-y-xs">
                  <span className="font-label-caps text-label-caps text-on-surface-variant">{activeProduct.proofLabel}</span>
                  <input className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-sm" value={proofReference} onChange={event => setProofReference(event.target.value)} placeholder={activeProduct.proofPlaceholder} />
                </label>
                <button onClick={handleSubmit} disabled={loading || !proofReference} className="w-full rounded-xl bg-primary-container px-md py-md font-headline-lg-mobile text-headline-lg-mobile text-on-primary-container disabled:opacity-50">
                  Submit Proof
                </button>
              </div>
            )}

            {escrow.status === 'IN_PROGRESS' && (
              <div className="rounded-2xl border border-secondary/20 bg-secondary-container/10 p-md">
                <div className="mb-sm flex items-center gap-xs text-secondary">
                  <span className="material-symbols-outlined animate-pulse">sync_alt</span>
                  <span className="font-label-caps text-label-caps">Oracle is verifying proof</span>
                </div>
                <p className="text-on-surface-variant">{escrow.tracking_number || escrow.proof_reference}</p>
              </div>
            )}

            {escrow.status === 'DELIVERED_INSPECTING' && (
              <div className="rounded-2xl border border-green-400/30 bg-green-500/10 p-md text-green-200">
                Oracle verified the proof. The buyer inspection window is open.
              </div>
            )}

            {escrow.status === 'SETTLED' && (
              <div className="rounded-2xl border border-green-400/30 bg-green-500/10 p-md text-green-200">
                Settlement complete. The provider was paid after buyer acceptance.
              </div>
            )}

            {['PENDING', 'CANCELLED', 'REFUNDED'].includes(escrow.status) && (
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-md text-on-surface-variant">
                This escrow is not ready for proof submission yet. Current status: {escrow.status}.
              </div>
            )}
          </div>

          <aside className="space-y-md">
            <div className="glass-panel rounded-3xl border border-outline-variant/30 p-md">
              <span className="font-label-caps text-label-caps text-secondary">Proof model</span>
              <h2 className="mt-xs font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{activeProduct.label}</h2>
              <p className="mt-sm text-sm text-on-surface-variant">{activeProduct.proof}</p>
              <p className="mt-sm text-sm text-on-surface-variant">{activeProduct.settlement_rule}</p>
            </div>

            <div className="glass-panel rounded-3xl border border-outline-variant/30 p-md">
              <span className="font-label-caps text-label-caps text-secondary">State handoff</span>
              <div className="mt-md space-y-sm text-sm text-on-surface-variant">
                <p>1. Merchant submits proof reference.</p>
                <p>2. Oracle verifies reference and opens inspection.</p>
                <p>3. Buyer accepts or disputes from checkout.</p>
              </div>
            </div>
          </aside>
        </section>
      )}

      <OraclePanel mode="merchant" escrow={escrow} logs={logs} loading={loading} />
    </div>
  )
}
