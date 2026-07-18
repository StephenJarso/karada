'use client'

import { useState } from 'react'
import { EmptyState } from '@/app/components/EmptyState'
import { OraclePanel } from '@/app/components/OraclePanel'
import { PRODUCTS } from '@/app/lib/products'
import { useEscrowDemo } from '@/app/lib/useEscrowDemo'

export default function OraclePage() {
  const { escrow, loading, logs, simulateDelivery, addLog } = useEscrowDemo()
  const [manualReference, setManualReference] = useState('')

  const reference = escrow?.tracking_number || escrow?.proof_reference || manualReference
  const productLabel = escrow ? PRODUCTS.find(product => product.type === escrow.product_type)?.label : 'Karada'

  const runVerification = async () => {
    if (!reference) return
    addLog(`Oracle simulator requested verification for ${reference}`, 'action')
    try {
      await simulateDelivery(reference)
    } catch {
      alert('Failed to simulate oracle verification')
    }
  }

  return (
    <div className="space-y-md">
      <section className="glass-panel rounded-3xl border border-outline-variant/30 p-md">
        <span className="font-label-caps text-label-caps text-secondary">Page 4 of 4</span>
        <h1 className="mt-xs font-display-lg text-display-lg font-bold leading-tight text-on-surface">Oracle verification</h1>
        <p className="mt-sm max-w-3xl text-on-surface-variant">
          This page makes the oracle visible and actionable. It verifies the active proof reference and opens the buyer inspection window.
        </p>
      </section>

      {!escrow ? (
        <EmptyState icon="account_tree" title="No oracle signal available" description="Create an escrow, submit proof, and return here to simulate oracle verification." actionHref="/create" actionLabel="Create Escrow" />
      ) : (
        <section className="grid gap-md lg:grid-cols-[1fr_0.85fr]">
          <div className="glass-panel rounded-3xl border border-outline-variant/30 p-md">
            <div className="mb-md flex items-start justify-between gap-sm">
              <div>
                <span className="font-label-caps text-label-caps text-secondary">Oracle simulator</span>
                <h2 className="mt-xs font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Verify proof and open inspection</h2>
                <p className="mt-sm text-on-surface-variant">The oracle checks the provider proof reference, then moves the escrow into buyer inspection.</p>
              </div>
              <span className="material-symbols-outlined text-secondary">account_tree</span>
            </div>

            <div className="grid gap-sm md:grid-cols-3">
              <div className="rounded-xl bg-surface-container-lowest p-sm">
                <p className="font-label-caps text-label-caps text-on-surface-variant">Product</p>
                <p className="font-code-sm text-primary">{productLabel}</p>
              </div>
              <div className="rounded-xl bg-surface-container-lowest p-sm">
                <p className="font-label-caps text-label-caps text-on-surface-variant">Status</p>
                <p className="font-code-sm text-primary">{escrow.status}</p>
              </div>
              <div className="rounded-xl bg-surface-container-lowest p-sm">
                <p className="font-label-caps text-label-caps text-on-surface-variant">Reference</p>
                <p className="font-code-sm text-primary">{escrow.tracking_number || escrow.proof_reference || 'Pending'}</p>
              </div>
            </div>

            <div className="mt-md space-y-sm">
              <label className="block space-y-xs">
                <span className="font-label-caps text-label-caps text-on-surface-variant">Proof reference</span>
                <input className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-sm" value={manualReference} onChange={event => setManualReference(event.target.value)} placeholder={escrow.tracking_number || escrow.proof_reference || 'Enter proof reference'} />
              </label>
              <button onClick={runVerification} disabled={loading || !reference} className="w-full rounded-xl bg-secondary px-md py-md font-headline-lg-mobile text-headline-lg-mobile text-on-secondary disabled:opacity-50">
                {loading ? 'Oracle verifying...' : 'Simulate Verified Proof'}
              </button>
            </div>

            <div className="mt-md rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-sm">
              <div className="mb-sm flex items-center gap-xs text-secondary">
                <span className="material-symbols-outlined">schema</span>
                <span className="font-label-caps text-label-caps">Oracle state machine</span>
              </div>
              <div className="grid gap-xs md:grid-cols-4">
                {([
                  ['Proof submitted', escrow.status !== 'PENDING' && escrow.status !== 'HELD'],
                  ['Oracle verified', escrow.status === 'IN_PROGRESS' || escrow.status === 'DELIVERED_INSPECTING' || escrow.status === 'DISPUTED' || escrow.status === 'SETTLED'],
                  ['Inspection open', escrow.status === 'DELIVERED_INSPECTING' || escrow.status === 'DISPUTED' || escrow.status === 'SETTLED'],
                  ['Settled', escrow.status === 'SETTLED'],
                ] as Array<[string, boolean]>).map(([label, active]) => (
                  <div key={label} className={`rounded-xl p-sm ${active ? 'bg-secondary-container/10 text-secondary' : 'bg-surface-container-low text-on-surface-variant'}`}>
                    <p className="font-label-caps text-label-caps">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-3xl border border-outline-variant/30 p-md">
            <div className="mb-md flex items-center justify-between gap-sm">
              <div>
                <span className="font-label-caps text-label-caps text-secondary">Protocol event log</span>
                <h2 className="mt-xs font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Oracle activity</h2>
              </div>
              <span className="material-symbols-outlined text-primary">history_toggle_off</span>
            </div>

            <div className="max-h-80 overflow-auto rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-sm font-code-sm text-xs">
              {logs.length ? (
                logs.slice().reverse().map((log, index) => (
                  <div key={`${log.time}-${log.message}-${index}`} className="mb-xs last:mb-0">
                    <span className="text-outline">[{log.time}]</span>{' '}
                    <span className={log.type === 'success' ? 'text-secondary' : log.type === 'warn' ? 'text-yellow-300' : log.type === 'action' ? 'text-primary' : 'text-on-surface-variant'}>{log.message}</span>
                  </div>
                ))
              ) : (
                <p className="text-on-surface-variant">No oracle events yet.</p>
              )}
            </div>
          </div>
        </section>
      )}

      <OraclePanel mode="oracle" escrow={escrow} logs={logs} loading={loading} />
    </div>
  )
}
