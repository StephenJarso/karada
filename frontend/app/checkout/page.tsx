'use client'

import { QRCodeSVG } from 'qrcode.react'
import { EmptyState } from '@/app/components/EmptyState'
import { OraclePanel } from '@/app/components/OraclePanel'
import { StatusBadge } from '@/app/components/StatusBadge'
import { PRODUCTS } from '@/app/lib/products'
import { useEscrowDemo } from '@/app/lib/useEscrowDemo'

export default function CheckoutPage() {
  const { escrow, loading, logs, refreshEscrow, simulatePayment, acceptDelivery, disputeDelivery } = useEscrowDemo()

  const copyInvoice = async () => {
    if (!escrow?.payment_request) return
    await navigator.clipboard.writeText(escrow.payment_request)
  }

  return (
    <div className="space-y-md">
      <section className="glass-panel rounded-3xl border border-outline-variant/30 p-md">
        <span className="font-label-caps text-label-caps text-secondary">Page 2 of 4</span>
        <h1 className="mt-xs font-display-lg text-display-lg font-bold leading-tight text-on-surface">Checkout and Lightning commitment</h1>
        <p className="mt-sm max-w-3xl text-on-surface-variant">
          The buyer scans the BOLT11 invoice or simulates payment. Once the HODL invoice is paid, the oracle waits for provider proof.
        </p>
      </section>

      {!escrow ? (
        <EmptyState icon="qr_code_2" title="No escrow ready for checkout" description="Create a HODL invoice escrow first, then return here to scan, copy, and simulate the buyer payment." actionHref="/create" actionLabel="Create Escrow" />
      ) : (
        <section className="grid gap-md lg:grid-cols-[0.9fr_1.1fr]">
          <div className="glass-panel rounded-3xl border border-outline-variant/30 p-md">
            <div className="mb-md flex items-center justify-between gap-sm">
              <StatusBadge status={escrow.status} />
              <button onClick={() => refreshEscrow(escrow.payment_hash)} className="material-symbols-outlined text-on-surface-variant hover:text-on-surface">
                refresh
              </button>
            </div>

            {escrow.status === 'PENDING' ? (
              <div className="flex flex-col items-center gap-md">
                <div className="rounded-2xl border border-outline-variant/20 bg-white p-md">
                  <QRCodeSVG value={escrow.payment_request} size={230} level="M" includeMargin />
                </div>
                <button onClick={copyInvoice} className="inline-flex items-center gap-xs rounded-xl border border-outline-variant px-md py-sm font-label-caps text-label-caps text-on-surface">
                  <span className="material-symbols-outlined text-[18px]">content_copy</span>
                  Copy BOLT11 invoice
                </button>
                <button onClick={simulatePayment} disabled={loading} className="w-full rounded-xl bg-primary px-md py-sm font-label-caps text-label-caps text-on-primary disabled:opacity-50">
                  Simulate Payment
                </button>
              </div>
            ) : (
              <div className="space-y-sm rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-sm">
                <div className="flex items-center gap-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-secondary">bolt</span>
                  <span>Lightning commitment detected</span>
                </div>
                <div className="flex items-center gap-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-primary">lock</span>
                  <span>Funds remain held until proof is verified</span>
                </div>
                <div className="flex items-center gap-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-primary">account_tree</span>
                  <span>Oracle can verify the submitted proof</span>
                </div>
              </div>
            )}
          </div>

          <div className="glass-panel rounded-3xl border border-outline-variant/30 p-md">
            <div className="mb-md flex items-start justify-between gap-sm">
              <div>
                <span className="font-label-caps text-label-caps text-secondary">Escrow contract</span>
                <h2 className="mt-xs font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{escrow.title}</h2>
                <p className="mt-sm text-on-surface-variant">{escrow.description}</p>
              </div>
              <span className="material-symbols-outlined text-primary">payments</span>
            </div>

            <div className="grid gap-sm md:grid-cols-3">
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
            </div>

            {escrow.status === 'DELIVERED_INSPECTING' && (
              <div className="mt-md grid gap-sm sm:grid-cols-2">
                <button onClick={acceptDelivery} disabled={loading} className="rounded-xl bg-green-500 px-md py-md font-label-caps text-label-caps text-white disabled:opacity-50">
                  Accept & Release
                </button>
                <button onClick={disputeDelivery} disabled={loading} className="rounded-xl border border-yellow-400/40 bg-yellow-500/20 px-md py-md font-label-caps text-label-caps text-yellow-100 disabled:opacity-50">
                  Open Dispute
                </button>
              </div>
            )}

            {escrow.status === 'SETTLED' && (
              <div className="mt-md rounded-xl border border-green-400/30 bg-green-500/10 p-sm text-green-200">
                Settlement complete. The preimage was released and the HODL invoice settled.
              </div>
            )}
          </div>
        </section>
      )}

      <OraclePanel mode="checkout" escrow={escrow} logs={logs} loading={loading} />
    </div>
  )
}
