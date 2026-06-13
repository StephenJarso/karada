'use client'

import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { QRCodeSVG } from 'qrcode.react'

type ProductType = 'COMMERCE' | 'SCHOOL_FEES' | 'SAVINGS'
type Screen = 'create' | 'checkout' | 'merchant' | 'oracle'
type LogType = 'info' | 'warn' | 'success' | 'action'

interface Escrow {
  id?: number
  payment_request: string
  payment_hash: string
  product_type: ProductType
  title: string
  description: string
  counterparty_name?: string
  terms?: string
  amount_sats: number
  tracking_number?: string
  carrier?: string
  proof_type?: string
  proof_reference?: string
  status: string
  created_at?: string
  held_at?: string
  delivered_at?: string
  settled_at?: string
  inspection_deadline?: string
  dispute_reason?: string
}

interface ProductDefinition {
  type: ProductType
  label: string
  proof: string
  settlement_rule: string
}

const PRODUCTS: ProductDefinition[] = [
  {
    type: 'COMMERCE',
    label: 'Commerce',
    proof: 'Courier tracking number or delivery signature',
    settlement_rule: 'Release after delivery proof and buyer inspection window.',
  },
  {
    type: 'SCHOOL_FEES',
    label: 'School Fees',
    proof: 'Admission letter, school invoice, or registrar confirmation',
    settlement_rule: 'Release after document verification and parent/student inspection window.',
  },
  {
    type: 'SAVINGS',
    label: 'Savings',
    proof: 'Savings goal, lock confirmation, or trusted custodian attestation',
    settlement_rule: 'Release after savings proof verification and dispute window.',
  },
]

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Awaiting Lightning commitment',
  HELD: 'Funds held by HODL invoice',
  IN_PROGRESS: 'Fulfillment proof submitted',
  DELIVERED_INSPECTING: 'Verified - inspection window open',
  DISPUTED: 'Disputed - preimage held',
  SETTLED: 'Settled - preimage released',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
}

const PRODUCT_COPY: Record<ProductType, { label: string; placeholder: string; proofLabel: string; proofPlaceholder: string; proof: string; settlement_rule: string }> = {
  COMMERCE: {
    label: 'Merchant deal',
    placeholder: 'Handmade leather bag for export',
    proofLabel: 'Courier tracking number',
    proofPlaceholder: 'DHL-NBO-101',
    proof: 'Courier tracking number or delivery signature',
    settlement_rule: 'Release after delivery proof and buyer inspection window.',
  },
  SCHOOL_FEES: {
    label: 'School fees payment',
    placeholder: 'Term 2 school fees for Amina - invoice SF-2026-042',
    proofLabel: 'School proof reference',
    proofPlaceholder: 'Admission letter, invoice number, or registrar reference',
    proof: 'Admission letter, school invoice, or registrar confirmation',
    settlement_rule: 'Release after document verification and parent/student inspection window.',
  },
  SAVINGS: {
    label: 'Savings lock',
    placeholder: 'Emergency fund lock for household savings circle',
    proofLabel: 'Savings proof reference',
    proofPlaceholder: 'Lock confirmation, goal ID, or custodian reference',
    proof: 'Savings goal, lock confirmation, or trusted custodian attestation',
    settlement_rule: 'Release after savings proof verification and dispute window.',
  },
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>('create')
  const [productType, setProductType] = useState<ProductType>('COMMERCE')
  const [amount, setAmount] = useState('50000')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [counterparty, setCounterparty] = useState('')
  const [proofReference, setProofReference] = useState('')
  const [carrier, setCarrier] = useState('DHL')
  const [inspectionHours, setInspectionHours] = useState('24')
  const [escrow, setEscrow] = useState<Escrow | null>(null)
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<Array<{ time: string; message: string; type: LogType }>>([])
  const [showSuccess, setShowSuccess] = useState(false)

  const activeProduct = useMemo(() => PRODUCT_COPY[productType], [productType])

  const addLog = (message: string, type: LogType = 'info') => {
    const now = new Date()
    const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLogs(prev => [...prev, { time, message, type }])
  }

  useEffect(() => {
    addLog('Karada Python protocol engine online', 'success')
    addLog('HODL invoice mode ready for commerce, school fees, and savings', 'info')
  }, [])

  const refreshEscrow = async () => {
    if (!escrow) return
    try {
      const response = await axios.get(`/api/v1/escrow/${escrow.payment_hash}`)
      setEscrow(response.data)
    } catch (error) {
      addLog('Failed to refresh escrow status', 'warn')
    }
  }

  const createEscrow = async () => {
    if (!amount || !title || !description) return
    setLoading(true)
    try {
      const reference = productType === 'COMMERCE' ? proofReference : proofReference
      const payload = {
        amount_sats: Number(amount),
        product_type: productType,
        title,
        description,
        counterparty_name: counterparty || undefined,
        tracking_number: productType === 'COMMERCE' ? reference : undefined,
        carrier: productType === 'COMMERCE' ? carrier : undefined,
        proof_reference: productType !== 'COMMERCE' ? reference : undefined,
        proof_type: productType === 'SCHOOL_FEES' ? 'SCHOOL_DOCUMENT' : productType === 'SAVINGS' ? 'SAVINGS_LOCK' : 'COURIER_TRACKING',
        inspection_hours: Number(inspectionHours),
      }

      const response = await axios.post('/api/v1/escrow', payload)
      setEscrow(response.data)
      setScreen('checkout')
      addLog(`Created ${PRODUCTS.find(p => p.type === productType)?.label} escrow`, 'success')
      addLog(`Payment hash: ${response.data.payment_hash}`, 'info')
    } catch (error) {
      console.error(error)
      addLog('Failed to create HODL invoice escrow', 'warn')
      alert('Failed to create escrow. Is the Python backend running on port 8000?')
    } finally {
      setLoading(false)
    }
  }

  const simulatePayment = async () => {
    if (!escrow) return
    setLoading(true)
    try {
      await axios.post(`/api/v1/escrow/${escrow.payment_hash}/pay`)
      addLog('HTLC/HODL payment detected - funds are now cryptographically locked', 'success')
      await refreshEscrow()
    } catch (error) {
      console.error(error)
      addLog('Failed to simulate payment', 'warn')
      alert('Failed to simulate payment')
    } finally {
      setLoading(false)
    }
  }

  const submitFulfillment = async () => {
    if (!escrow || !proofReference) return
    setLoading(true)
    try {
      if (productType === 'COMMERCE') {
        await axios.post('/api/v1/escrow/ship', {
          payment_hash: escrow.payment_hash,
          tracking_number: proofReference,
          carrier,
        })
        addLog(`Merchant submitted courier tracking: ${proofReference}`, 'action')
      } else {
        await axios.post(`/api/v1/escrow/${escrow.payment_hash}/fulfill`, {
          reference: proofReference,
          proof_type: productType === 'SCHOOL_FEES' ? 'SCHOOL_DOCUMENT' : 'SAVINGS_LOCK',
          message: `${PRODUCTS.find(p => p.type === productType)?.label} proof submitted for oracle verification`,
        })
        addLog(`${PRODUCTS.find(p => p.type === productType)?.label} proof submitted`, 'action')
      }
      await refreshEscrow()
      setScreen('oracle')
    } catch (error) {
      console.error(error)
      addLog('Failed to submit fulfillment proof', 'warn')
      alert('Failed to submit fulfillment proof')
    } finally {
      setLoading(false)
    }
  }

  const simulateDelivery = async () => {
    if (!escrow) return
    const reference = escrow.tracking_number || escrow.proof_reference || proofReference
    if (!reference) return
    setLoading(true)
    try {
      addLog(`Oracle verifying proof reference: ${reference}`, 'action')
      await axios.post('/api/v1/oracle/simulate-delivery', {
        reference,
        status: 'VERIFIED',
        message: 'Oracle proof verified. Inspection window opened.',
      })
      addLog('Oracle proof verified - buyer inspection window is active', 'success')
      await refreshEscrow()
      setScreen('checkout')
    } catch (error) {
      console.error(error)
      addLog('Failed to simulate oracle verification', 'warn')
      alert('Failed to simulate oracle verification')
    } finally {
      setLoading(false)
    }
  }

  const acceptDelivery = async () => {
    if (!escrow) return
    setLoading(true)
    try {
      await axios.post(`/api/v1/escrow/${escrow.payment_hash}/accept`)
      addLog('Buyer accepted. Karada released the preimage to settle the HODL invoice', 'success')
      await refreshEscrow()
      setShowSuccess(true)
    } catch (error) {
      console.error(error)
      addLog('Failed to accept delivery', 'warn')
      alert('Failed to accept delivery')
    } finally {
      setLoading(false)
    }
  }

  const disputeDelivery = async () => {
    if (!escrow) return
    const reason = window.prompt('Describe the dispute reason')
    if (!reason) return
    setLoading(true)
    try {
      await axios.post(`/api/v1/escrow/${escrow.payment_hash}/dispute`, { reason })
      addLog('Dispute opened - preimage remains hidden', 'warn')
      await refreshEscrow()
    } catch (error) {
      console.error(error)
      addLog('Failed to open dispute', 'warn')
      alert('Failed to open dispute')
    } finally {
      setLoading(false)
    }
  }

  const resetDemo = () => {
    setEscrow(null)
    setScreen('create')
    setProofReference('')
    setShowSuccess(false)
    setLogs([])
    addLog('Demo reset', 'info')
  }

  const getStatusBadge = (status: string) => {
    const className =
      status === 'SETTLED'
        ? 'bg-green-500/20 text-green-300 border-green-400/30'
        : status === 'DISPUTED'
          ? 'bg-yellow-500/20 text-yellow-200 border-yellow-400/30'
          : status === 'PENDING'
            ? 'bg-primary-container/20 text-primary-container border-primary-container/30'
            : 'bg-secondary-container/20 text-secondary border-secondary/30'

    return (
      <div className={`glass-panel rounded-xl px-md py-sm border ${className} flex items-center gap-xs`}>
        <span className="material-symbols-outlined">{status === 'SETTLED' ? 'check_circle' : status === 'DISPUTED' ? 'warning' : 'lock'}</span>
        <span className="font-label-caps text-label-caps">{STATUS_LABELS[status] || status}</span>
      </div>
    )
  }

  const proofHelp = activeProduct.proof

  return (
    <main className="min-h-screen bg-background text-on-surface pb-28">
      <header className="fixed top-0 w-full z-50 bg-surface-container-low/95 border-b border-outline-variant flex items-center justify-between px-sm h-xl backdrop-blur">
        <div className="flex items-center gap-xs">
          <span className="material-symbols-outlined text-primary">security</span>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">Karada</h1>
        </div>
        <div className="flex items-center gap-xs text-on-surface-variant">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
          <span className="font-label-caps text-[10px]">Protocol active</span>
        </div>
      </header>

      <main className="pt-28 px-sm max-w-5xl mx-auto space-y-lg">
        <section className="glass-panel rounded-2xl p-md border-outline-variant/30">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-md">
            <div>
              <span className="font-label-caps text-label-caps text-secondary tracking-widest">Trustless Lightning Escrow Protocol</span>
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mt-xs">Build trust with HODL invoices, HTLC time-locks, and oracle proof.</h2>
              <p className="text-on-surface-variant mt-sm max-w-2xl">
                Karada is a protocol layer for commerce, school fees, and savings. Funds are locked in Lightning and released only when the agreed proof is verified.
              </p>
            </div>
            <div className="flex gap-xs">
              {(['create', 'checkout', 'merchant', 'oracle'] as Screen[]).map(item => (
                <button
                  key={item}
                  onClick={() => setScreen(item)}
                  className={`px-sm py-xs rounded-lg font-label-caps text-label-caps border ${
                    screen === item ? 'bg-primary-container text-on-primary-container border-primary-container' : 'border-outline text-on-surface-variant'
                  }`}
                >
                  {item.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </section>

        {screen === 'create' && (
          <section className="grid md:grid-cols-[1.1fr_0.9fr] gap-md">
            <div className="glass-panel rounded-2xl p-md border-outline-variant/30">
              <div className="flex items-center justify-between mb-md">
                <div>
                  <span className="font-label-caps text-label-caps text-secondary">Product Studio</span>
                  <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mt-xs">Create a Karada escrow</h3>
                </div>
                <span className="material-symbols-outlined text-primary">qr_code_scanner</span>
              </div>

              <div className="grid sm:grid-cols-3 gap-sm mb-md">
                {PRODUCTS.map(product => (
                  <button
                    key={product.type}
                    onClick={() => setProductType(product.type)}
                    className={`rounded-xl border p-sm text-left transition-all ${
                      productType === product.type ? 'border-secondary bg-secondary-container/10' : 'border-outline-variant hover:border-secondary/60'
                    }`}
                  >
                    <span className="material-symbols-outlined text-secondary">{product.type === 'COMMERCE' ? 'storefront' : product.type === 'SCHOOL_FEES' ? 'school' : 'savings'}</span>
                    <p className="font-label-caps text-label-caps mt-xs">{product.label}</p>
                  </button>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-md">
                <label className="space-y-xs">
                  <span className="font-label-caps text-label-caps text-on-surface-variant">Title</span>
                  <input className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-sm" value={title} onChange={event => setTitle(event.target.value)} placeholder={activeProduct.placeholder} />
                </label>
                <label className="space-y-xs">
                  <span className="font-label-caps text-label-caps text-on-surface-variant">Amount (sats)</span>
                  <input className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-sm font-code-sm" type="number" value={amount} onChange={event => setAmount(event.target.value)} />
                </label>
                <label className="space-y-xs sm:col-span-2">
                  <span className="font-label-caps text-label-caps text-on-surface-variant">Description / contract terms</span>
                  <textarea className="w-full min-h-28 bg-surface-container-lowest border border-outline-variant rounded-lg p-sm" value={description} onChange={event => setDescription(event.target.value)} placeholder="Describe exactly what must be delivered, verified, or saved." />
                </label>
                <label className="space-y-xs">
                  <span className="font-label-caps text-label-caps text-on-surface-variant">Counterparty</span>
                  <input className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-sm" value={counterparty} onChange={event => setCounterparty(event.target.value)} placeholder="Buyer, parent, school, or savings group" />
                </label>
                <label className="space-y-xs">
                  <span className="font-label-caps text-label-caps text-on-surface-variant">Inspection hours</span>
                  <input className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-sm" type="number" value={inspectionHours} onChange={event => setInspectionHours(event.target.value)} />
                </label>
                <label className="space-y-xs sm:col-span-2">
                  <span className="font-label-caps text-label-caps text-on-surface-variant">{activeProduct.proofLabel}</span>
                  <div className="flex gap-xs">
                    <input className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-lg p-sm" value={proofReference} onChange={event => setProofReference(event.target.value)} placeholder={activeProduct.proofPlaceholder} />
                    {productType === 'COMMERCE' && (
                      <input className="w-32 bg-surface-container-lowest border border-outline-variant rounded-lg p-sm" value={carrier} onChange={event => setCarrier(event.target.value)} placeholder="Carrier" />
                    )}
                  </div>
                  <p className="text-on-surface-variant text-xs">{proofHelp}</p>
                </label>
              </div>

              <button onClick={createEscrow} disabled={loading || !amount || !title || !description || !proofReference} className="w-full mt-md bg-primary-container text-on-primary-container py-md rounded-xl font-headline-lg-mobile text-headline-lg-mobile disabled:opacity-50">
                {loading ? 'Creating HODL Invoice...' : 'Generate HODL Invoice'}
              </button>
            </div>

            <aside className="space-y-md">
              <div className="glass-panel rounded-2xl p-md border-outline-variant/30">
                <span className="font-label-caps text-label-caps text-secondary">Protocol sequence</span>
                <div className="mt-md space-y-sm">
                  {[
                    ['1', 'Create payment_hash from a hidden 32-byte preimage'],
                    ['2', 'Buyer pays BOLT11 HODL invoice; HTLC locks funds'],
                    ['3', 'Seller/school/savings party submits proof'],
                    ['4', 'Oracle verifies proof and opens inspection window'],
                    ['5', 'Accept releases preimage; dispute keeps it hidden'],
                  ].map(([step, text]) => (
                    <div key={step} className="flex gap-sm items-start">
                      <span className="w-7 h-7 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-code-sm">{step}</span>
                      <p className="text-on-surface-variant text-sm">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-panel rounded-2xl p-md border-outline-variant/30">
                <span className="font-label-caps text-label-caps text-secondary">Current product</span>
                <h3 className="font-headline-lg-mobile text-headline-lg-mobile mt-xs">{activeProduct.label}</h3>
                <p className="text-on-surface-variant mt-sm text-sm">{activeProduct.settlement_rule}</p>
              </div>
            </aside>
          </section>
        )}

        {screen === 'checkout' && escrow && (
          <section className="grid md:grid-cols-[0.9fr_1.1fr] gap-md">
            <div className="glass-panel rounded-2xl p-md border-outline-variant/30">
              {getStatusBadge(escrow.status)}
              {escrow.status === 'PENDING' && (
                <div className="mt-md flex flex-col items-center gap-md">
                  <div className="bg-white p-md rounded-xl">
                    <QRCodeSVG value={escrow.payment_request} size={220} level="M" includeMargin />
                  </div>
                  <button onClick={() => navigator.clipboard.writeText(escrow.payment_request)} className="text-secondary font-label-caps flex items-center gap-xs">
                    <span className="material-symbols-outlined">content_copy</span> Copy BOLT11 invoice
                  </button>
                  <button onClick={simulatePayment} disabled={loading} className="w-full bg-primary text-on-primary py-sm rounded-lg disabled:opacity-50">Simulate Payment</button>
                </div>
              )}
              {escrow.status !== 'PENDING' && (
                <div className="mt-md space-y-sm">
                  <div className="flex items-center gap-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-secondary">bolt</span>
                    <span>Lightning commitment detected</span>
                  </div>
                  <div className="flex items-center gap-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary">lock</span>
                    <span>Funds remain held until proof is verified</span>
                  </div>
                </div>
              )}
            </div>

            <div className="glass-panel rounded-2xl p-md border-outline-variant/30">
              <h3 className="font-headline-lg-mobile text-headline-lg-mobile">{escrow.title}</h3>
              <p className="text-on-surface-variant mt-xs">{escrow.description}</p>
              <div className="grid sm:grid-cols-3 gap-sm mt-md">
                <div className="bg-surface-container-lowest rounded-xl p-sm">
                  <p className="font-label-caps text-label-caps text-on-surface-variant">Amount</p>
                  <p className="font-code-sm text-primary text-lg">{escrow.amount_sats} sats</p>
                </div>
                <div className="bg-surface-container-lowest rounded-xl p-sm">
                  <p className="font-label-caps text-label-caps text-on-surface-variant">Product</p>
                  <p className="font-code-sm text-primary text-lg">{PRODUCTS.find(p => p.type === escrow.product_type)?.label}</p>
                </div>
                <div className="bg-surface-container-lowest rounded-xl p-sm">
                  <p className="font-label-caps text-label-caps text-on-surface-variant">Proof</p>
                  <p className="font-code-sm text-primary text-sm truncate">{escrow.tracking_number || escrow.proof_reference || 'Pending'}</p>
                </div>
              </div>
              {escrow.status === 'DELIVERED_INSPECTING' && (
                <div className="mt-md grid sm:grid-cols-2 gap-sm">
                  <button onClick={acceptDelivery} disabled={loading} className="bg-green-500 text-white py-md rounded-xl font-label-caps">Accept & Release</button>
                  <button onClick={disputeDelivery} disabled={loading} className="bg-yellow-500/20 text-yellow-100 border border-yellow-400/40 py-md rounded-xl font-label-caps">Open Dispute</button>
                </div>
              )}
            </div>
          </section>
        )}

        {screen === 'merchant' && escrow && (
          <section className="glass-panel rounded-2xl p-md border-outline-variant/30">
            <div className="flex items-center justify-between mb-md">
              <div>
                <span className="font-label-caps text-label-caps text-secondary">Merchant / provider workspace</span>
                <h3 className="font-headline-lg-mobile text-headline-lg-mobile mt-xs">{escrow.title}</h3>
              </div>
              <button onClick={refreshEscrow} className="material-symbols-outlined text-on-surface-variant">refresh</button>
            </div>
            {escrow.status === 'HELD' && (
              <div className="grid sm:grid-cols-[1fr_auto] gap-sm">
                <input className="bg-surface-container-lowest border border-outline-variant rounded-lg p-sm" value={proofReference} onChange={event => setProofReference(event.target.value)} placeholder={activeProduct.proofPlaceholder} />
                <button onClick={submitFulfillment} disabled={loading || !proofReference} className="bg-primary-container text-on-primary-container px-md rounded-lg disabled:opacity-50">
                  Submit Proof
                </button>
              </div>
            )}
            {escrow.status === 'IN_PROGRESS' && (
              <div className="glass-panel rounded-xl p-md bg-secondary-container/10 border-secondary/20">
                <p className="font-label-caps text-secondary">Proof submitted</p>
                <p className="text-on-surface-variant text-sm mt-xs">Oracle is verifying: {escrow.tracking_number || escrow.proof_reference}</p>
              </div>
            )}
            {escrow.status === 'SETTLED' && <p className="text-green-300">Settlement complete. Preimage released.</p>}
          </section>
        )}

        {screen === 'oracle' && (
          <section className="grid md:grid-cols-[1fr_0.8fr] gap-md">
            <div className="glass-panel rounded-2xl p-md border-outline-variant/30">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-label-caps text-label-caps text-secondary">Oracle simulator</span>
                  <h3 className="font-headline-lg-mobile text-headline-lg-mobile mt-xs">Verify proof and open inspection</h3>
                </div>
                <span className="material-symbols-outlined text-secondary">account_tree</span>
              </div>
              {escrow ? (
                <div className="mt-md space-y-sm">
                  <div className="bg-surface-container-lowest rounded-xl p-sm">
                    <p className="font-label-caps text-label-caps text-on-surface-variant">Reference</p>
                    <p className="font-code-sm text-primary">{escrow.tracking_number || escrow.proof_reference || 'No proof reference yet'}</p>
                  </div>
                  <button onClick={simulateDelivery} disabled={loading || !escrow.tracking_number && !escrow.proof_reference} className="w-full bg-secondary text-on-secondary py-md rounded-xl disabled:opacity-50">
                    Simulate Verified Proof
                  </button>
                </div>
              ) : (
                <p className="text-on-surface-variant mt-md">Create an escrow first to run the oracle flow.</p>
              )}
            </div>

            <div className="glass-panel rounded-2xl p-md border-outline-variant/30">
              <span className="font-label-caps text-label-caps text-secondary">Event log</span>
              <div className="mt-md h-64 overflow-auto bg-surface-container-lowest rounded-xl p-sm font-code-sm text-xs">
                {logs.map((log, index) => (
                  <div key={index} className="mb-xs">
                    <span className="text-outline">[{log.time}]</span>{' '}
                    <span className={log.type === 'success' ? 'text-secondary' : log.type === 'warn' ? 'text-yellow-300' : log.type === 'action' ? 'text-primary' : 'text-on-surface-variant'}>{log.message}</span>
                  </div>
                ))}
              </div>
              <button onClick={resetDemo} className="w-full mt-md border border-outline text-on-surface py-sm rounded-lg">Reset Demo</button>
            </div>
          </section>
        )}

        {escrow && (
          <section className="glass-panel rounded-2xl p-md border-outline-variant/30">
            <div className="grid sm:grid-cols-5 gap-sm text-sm">
              <div><p className="font-label-caps text-on-surface-variant">Status</p><p className="font-code-sm text-primary">{escrow.status}</p></div>
              <div><p className="font-label-caps text-on-surface-variant">Payment hash</p><p className="font-code-sm text-primary truncate">{escrow.payment_hash}</p></div>
              <div><p className="font-label-caps text-on-surface-variant">Product</p><p className="font-code-sm text-primary">{PRODUCTS.find(p => p.type === escrow.product_type)?.label}</p></div>
              <div><p className="font-label-caps text-on-surface-variant">Inspection deadline</p><p className="font-code-sm text-primary">{escrow.inspection_deadline ? new Date(escrow.inspection_deadline).toLocaleString() : 'Not opened'}</p></div>
              <div><p className="font-label-caps text-on-surface-variant">Settled</p><p className="font-code-sm text-primary">{escrow.settled_at ? 'Yes' : 'No'}</p></div>
            </div>
          </section>
        )}
      </main>

      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-sm">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowSuccess(false)}></div>
          <div className="relative glass-panel w-full max-w-sm rounded-2xl p-md text-center border-secondary/30">
            <div className="w-16 h-16 mx-auto rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[40px]">check_circle</span>
            </div>
            <h3 className="font-headline-lg-mobile text-headline-lg-mobile mt-md">Preimage Released</h3>
            <p className="text-on-surface-variant mt-sm">The Lightning HTLC settled and funds were released according to the Karada protocol.</p>
            <button onClick={() => setShowSuccess(false)} className="w-full mt-md bg-primary-container text-on-primary-container py-sm rounded-lg">Dismiss</button>
          </div>
        </div>
      )}
    </main>
  )
}
