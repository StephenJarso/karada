'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { OraclePanel } from '@/app/components/OraclePanel'
import { useEscrowDemo } from '@/app/lib/useEscrowDemo'
import { PRODUCT_COPY, PRODUCTS } from '@/app/lib/products'
import type { ProductType } from '@/app/lib/types'

export default function CreatePage() {
  const router = useRouter()
  const { createEscrow, loading, logs } = useEscrowDemo()
  const [productType, setProductType] = useState<ProductType>('COMMERCE')
  const [amount, setAmount] = useState('50000')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [counterparty, setCounterparty] = useState('')
  const [proofReference, setProofReference] = useState('')
  const [carrier, setCarrier] = useState('DHL')
  const [inspectionHours, setInspectionHours] = useState('24')

  const activeProduct = useMemo(() => PRODUCT_COPY[productType], [productType])

  const handleSubmit = async () => {
    if (!amount || !title || !description || !proofReference) return

    try {
      await createEscrow({
        amount_sats: Number(amount),
        product_type: productType,
        title,
        description,
        counterparty_name: counterparty || undefined,
        tracking_number: productType === 'COMMERCE' ? proofReference : undefined,
        carrier: productType === 'COMMERCE' ? carrier : undefined,
        proof_type: productType === 'SCHOOL_FEES' ? 'SCHOOL_DOCUMENT' : productType === 'SAVINGS' ? 'SAVINGS_LOCK' : 'COURIER_TRACKING',
        proof_reference: productType !== 'COMMERCE' ? proofReference : undefined,
        inspection_hours: Number(inspectionHours),
      })
      router.push('/checkout')
    } catch {
      alert('Failed to create escrow. Is the Python backend running on port 8000?')
    }
  }

  return (
    <div className="space-y-md">
      <section className="glass-panel rounded-3xl border border-outline-variant/30 p-md">
        <span className="font-label-caps text-label-caps text-secondary">Page 1 of 4</span>
        <h1 className="mt-xs font-display-lg text-display-lg font-bold leading-tight text-on-surface">Create a Karada escrow</h1>
        <p className="mt-sm max-w-3xl text-on-surface-variant">
          Select the product family, define the contract terms, and generate a BOLT11 HODL invoice that the oracle can later verify.
        </p>
      </section>

      <section className="grid gap-md lg:grid-cols-[1.15fr_0.85fr]">
        <div className="glass-panel rounded-3xl border border-outline-variant/30 p-md">
          <div className="mb-md flex items-center justify-between gap-sm">
            <div>
              <span className="font-label-caps text-label-caps text-secondary">Product studio</span>
              <h2 className="mt-xs font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Escrow contract</h2>
            </div>
            <span className="material-symbols-outlined text-primary">qr_code_scanner</span>
          </div>

          <div className="mb-md grid gap-sm sm:grid-cols-3">
            {PRODUCTS.map(product => (
              <button
                key={product.type}
                type="button"
                onClick={() => setProductType(product.type)}
                className={`rounded-2xl border p-sm text-left transition ${
                  productType === product.type
                    ? 'border-secondary bg-secondary-container/10'
                    : 'border-outline-variant hover:border-secondary/60'
                }`}
              >
                <span className="material-symbols-outlined text-secondary">{product.type === 'COMMERCE' ? 'storefront' : product.type === 'SCHOOL_FEES' ? 'school' : 'savings'}</span>
                <p className="mt-xs font-label-caps text-label-caps text-on-surface">{product.label}</p>
              </button>
            ))}
          </div>

          <div className="grid gap-md sm:grid-cols-2">
            <label className="space-y-xs">
              <span className="font-label-caps text-label-caps text-on-surface-variant">Title</span>
              <input className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-sm" value={title} onChange={event => setTitle(event.target.value)} placeholder={activeProduct.placeholder} />
            </label>
            <label className="space-y-xs">
              <span className="font-label-caps text-label-caps text-on-surface-variant">Amount (sats)</span>
              <input className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-sm font-code-sm" type="number" value={amount} onChange={event => setAmount(event.target.value)} />
            </label>
            <label className="space-y-xs sm:col-span-2">
              <span className="font-label-caps text-label-caps text-on-surface-variant">Description / contract terms</span>
              <textarea className="min-h-32 w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-sm" value={description} onChange={event => setDescription(event.target.value)} placeholder="Describe exactly what must be delivered, verified, or saved." />
            </label>
            <label className="space-y-xs">
              <span className="font-label-caps text-label-caps text-on-surface-variant">Counterparty</span>
              <input className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-sm" value={counterparty} onChange={event => setCounterparty(event.target.value)} placeholder="Buyer, parent, school, or savings group" />
            </label>
            <label className="space-y-xs">
              <span className="font-label-caps text-label-caps text-on-surface-variant">Inspection hours</span>
              <input className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-sm" type="number" value={inspectionHours} onChange={event => setInspectionHours(event.target.value)} />
            </label>
            <label className="space-y-xs sm:col-span-2">
              <span className="font-label-caps text-label-caps text-on-surface-variant">{activeProduct.proofLabel}</span>
              <div className="flex gap-xs">
                <input className="flex-1 rounded-xl border border-outline-variant bg-surface-container-lowest p-sm" value={proofReference} onChange={event => setProofReference(event.target.value)} placeholder={activeProduct.proofPlaceholder} />
                {productType === 'COMMERCE' && (
                  <input className="w-32 rounded-xl border border-outline-variant bg-surface-container-lowest p-sm" value={carrier} onChange={event => setCarrier(event.target.value)} placeholder="Carrier" />
                )}
              </div>
              <p className="text-xs text-on-surface-variant">{activeProduct.proof}</p>
            </label>
          </div>

          <button onClick={handleSubmit} disabled={loading || !amount || !title || !description || !proofReference} className="mt-md w-full rounded-xl bg-primary-container px-md py-md font-headline-lg-mobile text-headline-lg-mobile text-on-primary-container disabled:opacity-50">
            {loading ? 'Generating HODL Invoice...' : 'Generate HODL Invoice'}
          </button>
        </div>

        <aside className="space-y-md">
          <div className="glass-panel rounded-3xl border border-outline-variant/30 p-md">
            <span className="font-label-caps text-label-caps text-secondary">Protocol sequence</span>
            <div className="mt-md space-y-sm">
              {[
                ['1', 'Create payment_hash from a hidden 32-byte preimage'],
                ['2', 'Buyer pays BOLT11 HODL invoice; HTLC locks funds'],
                ['3', 'Provider submits proof to Karada'],
                ['4', 'Oracle verifies proof and opens inspection window'],
                ['5', 'Acceptance releases preimage; dispute keeps it hidden'],
              ].map(([step, text]) => (
                <div key={step} className="flex items-start gap-sm">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-container font-code-sm text-on-primary-container">{step}</span>
                  <p className="text-sm text-on-surface-variant">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-3xl border border-outline-variant/30 p-md">
            <span className="font-label-caps text-label-caps text-secondary">Current product</span>
            <h2 className="mt-xs font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{activeProduct.label}</h2>
            <p className="mt-sm text-sm text-on-surface-variant">{activeProduct.settlement_rule}</p>
          </div>
        </aside>
      </section>

      <OraclePanel mode="create" escrow={null} logs={logs} loading={loading} />
    </div>
  )
}
