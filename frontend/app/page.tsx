'use client'

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { QRCodeSVG } from 'qrcode.react'

type Screen = 'merchant' | 'checkout' | 'oracle'

interface Escrow {
  payment_request: string
  payment_hash: string
  preimage: string
  amount_sats: number
  status: string
  tracking_number: string
  description: string
}

interface LogEntry {
  time: string
  message: string
  type: 'info' | 'warn' | 'success' | 'action'
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>('merchant')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [escrow, setEscrow] = useState<Escrow | null>(null)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const logConsoleRef = useRef<HTMLDivElement>(null)

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const now = new Date()
    const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLogs(prev => [...prev, { time, message, type }])
  }

  useEffect(() => {
    addLog('Oracle Node Listening on Port 8080', 'info')
    addLog('HTLC-LOCK Detected for Channel ID: 8871...', 'info')
  }, [])

  useEffect(() => {
    if (logConsoleRef.current) {
      logConsoleRef.current.scrollTop = logConsoleRef.current.scrollHeight
    }
  }, [logs])

  const createEscrow = async () => {
    setLoading(true)
    try {
      const response = await axios.post('/api/v1/escrow', {
        amount_sats: parseInt(amount),
        description,
      })
      setEscrow(response.data)
      setScreen('checkout')
    } catch (error) {
      console.error(error)
      alert('Failed to create escrow')
    }
    setLoading(false)
  }

  const simulatePayment = async () => {
    if (!escrow) return
    setLoading(true)
    try {
      await axios.post(`/api/v1/escrow/${escrow.payment_hash}/pay`)
      setEscrow({ ...escrow, status: 'HELD' })
    } catch (error) {
      console.error(error)
      alert('Failed to simulate payment')
    }
    setLoading(false)
  }

  const shipItem = async () => {
    if (!escrow) return
    setLoading(true)
    try {
      await axios.post('/api/v1/escrow/ship', {
        payment_hash: escrow.payment_hash,
        tracking_number: trackingNumber,
      })
      setEscrow({ ...escrow, status: 'SHIPPED', tracking_number: trackingNumber })
    } catch (error) {
      console.error(error)
      alert('Failed to ship item')
    }
    setLoading(false)
  }

  const simulateDelivery = async () => {
    if (!escrow?.tracking_number) return
    setLoading(true)
    addLog(`ACT: Simulation triggered for ${escrow.tracking_number}`, 'action')
    addLog('INF: Fetching proof of delivery from Courier API...', 'info')
    
    try {
      await axios.post('/api/v1/oracle/simulate-delivery', {
        tracking_number: escrow.tracking_number,
      })
      addLog('INF: API returned: DELIVERED (Signature Found)', 'info')
      addLog('HTLC: Releasing preimage to routing nodes...', 'success')
      addLog('SUCCESS: Settlement Broadcast Complete', 'success')
      setEscrow({ ...escrow, status: 'SETTLED' })
      setShowSuccessModal(true)
    } catch (error) {
      console.error(error)
      addLog('ERR: Failed to simulate delivery', 'warn')
      alert('Failed to simulate delivery')
    }
    setLoading(false)
  }

  const resetDemo = () => {
    setEscrow(null)
    setAmount('')
    setDescription('')
    setTrackingNumber('')
    setScreen('merchant')
    setShowSuccessModal(false)
    setLogs([])
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <div className="bg-primary-container text-on-primary-container px-md py-xs rounded-xl flex items-center justify-center gap-xs font-label-caps text-label-caps shimmer">
            <span className="material-symbols-outlined animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            Awaiting Commitment Funds
          </div>
        )
      case 'HELD':
        return (
          <div className="glass-panel rounded-xl p-sm border-primary-container/30 flex items-center gap-sm bg-primary-container/10">
            <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container shadow-lg">
              <span className="material-symbols-outlined" data-icon="verified_user">verified_user</span>
            </div>
            <div>
              <p className="font-label-caps text-label-caps text-primary-container uppercase">Cryptographic Verification</p>
              <p className="font-body-md text-body-md text-on-surface font-semibold">Funds Secured by Bitcoin Script</p>
            </div>
          </div>
        )
      case 'SHIPPED':
        return <span className="px-3 py-1 rounded-full text-sm font-bold bg-purple-100 text-purple-800">Item Dispatched</span>
      case 'SETTLED':
        return <span className="px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800">Transaction Complete</span>
      default:
        return <span className="px-3 py-1 rounded-full text-sm font-bold bg-gray-100 text-gray-800">{status}</span>
    }
  }

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'action': return 'text-primary'
      case 'success': return 'text-secondary'
      case 'warn': return 'text-yellow-400'
      default: return 'text-on-surface-variant'
    }
  }

  return (
    <main className="min-h-screen bg-background text-on-surface">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface-container-low border-b border-outline-variant flex items-center justify-between px-sm h-xl">
        <div className="flex items-center gap-xs">
          <span className="material-symbols-outlined text-primary">security</span>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
                      Karada
          </h1>
        </div>
        <div className="w-xs h-xs rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden border border-outline-variant">
          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">person</span>
        </div>
      </header>

      <main className="flex-grow pt-xl pb-xl px-sm flex flex-col items-center">
        {/* Merchant Screen */}
        {screen === 'merchant' && !escrow && (
          <>
            {/* Context Header */}
            <div className="mt-md mb-lg w-full max-w-md">
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Merchant: New Deal</h2>
              <p className="text-on-surface-variant font-label-caps mt-base uppercase tracking-widest opacity-70">Secured via Lightning HODL</p>
            </div>

            {/* Progress Stepper (Node Graph Style) */}
            <div className="flex items-center justify-between mb-lg px-xs w-full max-w-md">
              <div className="flex flex-col items-center relative z-10">
                <div className="w-4 h-4 rounded-full bg-primary-container cyber-glow-teal"></div>
                <span className="font-label-caps text-[10px] mt-xs text-primary">INITIATE</span>
              </div>
              <div className="flex-grow h-[1px] node-line mx-2"></div>
              <div className="flex flex-col items-center opacity-40">
                <div className="w-4 h-4 rounded-full border border-outline"></div>
                <span className="font-label-caps text-[10px] mt-xs text-on-surface-variant">LOCK</span>
              </div>
              <div className="flex-grow h-[1px] bg-outline-variant mx-2"></div>
              <div className="flex flex-col items-center opacity-40">
                <div className="w-4 h-4 rounded-full border border-outline"></div>
                <span className="font-label-caps text-[10px] mt-xs text-on-surface-variant">RELEASE</span>
              </div>
            </div>

            {/* Form Card */}
            <div className="glass-panel p-md rounded-xl space-y-md w-full max-w-md">
              {/* Item Description */}
              <div className="space-y-xs">
                <label className="font-label-caps text-on-surface-variant text-[11px]" htmlFor="description">ITEM DESCRIPTION</label>
                <div className="relative">
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface p-sm rounded-lg focus:outline-none transition-all placeholder:text-on-surface-variant/30"
                    id="description"
                    placeholder="e.g. Vintage Watch - Ref 5513"
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* Price */}
              <div className="space-y-xs">
                <label className="font-label-caps text-on-surface-variant text-[11px]" htmlFor="price">PRICE (SATS)</label>
                <div className="relative flex items-center">
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant font-code-sm text-primary text-[20px] p-sm rounded-lg focus:outline-none transition-all"
                    id="price"
                    placeholder="0"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <div className="absolute right-sm flex items-center gap-xs pointer-events-none">
                    <span className="material-symbols-outlined text-primary-container text-[18px]" data-icon="bolt" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                    <span className="font-label-caps text-on-surface-variant">SATS</span>
                  </div>
                </div>
              </div>

              {/* Protocol Status Info */}
              <div className="bg-surface-container-high/50 p-sm rounded-lg border-l-2 border-primary flex gap-sm items-start">
                <span className="material-symbols-outlined text-primary text-[20px]" data-icon="info">info</span>
                <p className="font-label-caps text-[10px] leading-relaxed text-on-surface-variant">
                  Your escrow will be secured by a HODL invoice. Funds are only settled upon cryptographic proof of delivery or oracle mediation.
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={createEscrow}
                disabled={loading || !amount || !description}
                className="w-full bg-primary-container text-on-primary-container py-md rounded-xl font-headline-lg-mobile text-headline-lg-mobile active:scale-[0.98] transition-transform flex items-center justify-center gap-sm mt-md disabled:opacity-50"
              >
                <span className="material-symbols-outlined" data-icon="qr_code_2">qr_code_2</span>
                {loading ? 'Generating...' : 'Generate HODL Invoice'}
              </button>
            </div>
          </>
        )}

        {/* Merchant Active Order Screen (merchant3.png) */}
        {screen === 'merchant' && escrow && escrow.status !== 'SETTLED' && (
          <div className="w-full max-w-lg">
            {/* Page Title & Status */}
            <div className="mb-md">
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-xs">Merchant: Active Order</h2>
              <div className="flex items-center gap-xs">
                <span className="inline-block w-2 h-2 rounded-full bg-primary glow-orange animate-pulse"></span>
                <span className="font-label-caps text-label-caps text-primary tracking-widest">
                  {escrow.status === 'HELD' ? 'AWAITING DISPATCH' : escrow.status === 'SHIPPED' ? 'IN TRANSIT' : escrow.status}
                </span>
              </div>
            </div>

            {/* Success Banner */}
            {escrow.status === 'HELD' && (
              <div className="glass-panel rounded-xl p-sm border-primary-container/30 mb-md flex items-center gap-sm bg-primary-container/10">
                <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container shadow-lg">
                  <span className="material-symbols-outlined" data-icon="verified_user">verified_user</span>
                </div>
                <div>
                  <p className="font-label-caps text-label-caps text-primary-container uppercase">Cryptographic Verification</p>
                  <p className="font-body-md text-body-md text-on-surface font-semibold">Funds Secured by Bitcoin Script</p>
                </div>
              </div>
            )}

            {/* Node Graph Stepper */}
            <div className="relative flex justify-between items-center px-lg mb-lg">
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-outline-variant -z-10"></div>
              {/* Node 1: Locked */}
              <div className="relative flex flex-col items-center">
                <div className={`w-4 h-4 rounded-full border-2 border-surface shadow-xl ${escrow.status === 'HELD' || escrow.status === 'SHIPPED' || escrow.status === 'SETTLED' ? 'bg-primary glow-orange' : 'bg-surface-container-highest border-outline-variant'}`}></div>
                <span className="absolute -bottom-6 font-label-caps text-[10px] text-primary whitespace-nowrap">LOCKED</span>
              </div>
              {/* Node 2: Dispatch (Active) */}
              <div className="relative flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full border-4 border-surface-container shadow-[0_0_12px_#ffb874] ${escrow.status === 'HELD' ? 'animate-pulse bg-primary' : escrow.status === 'SHIPPED' ? 'bg-secondary-container border-secondary' : 'bg-surface-container-highest border-outline'}`}></div>
                <span className="absolute -bottom-7 font-label-caps text-[10px] text-on-surface font-bold whitespace-nowrap">
                  {escrow.status === 'SETTLED' ? 'RELEASED' : 'DISPATCH'}
                </span>
              </div>
              {/* Node 3: Release */}
              <div className="relative flex flex-col items-center">
                <div className={`w-4 h-4 rounded-full border-2 ${escrow.status === 'SETTLED' ? 'bg-green-500 border-green-400' : 'bg-surface-container-highest border-outline-variant'}`}></div>
                <span className="absolute -bottom-6 font-label-caps text-[10px] text-on-surface-variant whitespace-nowrap">RELEASE</span>
              </div>
            </div>

            {/* Contract Details Card */}
            <div className="glass-panel rounded-xl overflow-hidden mb-md">
              <div className="bg-surface-container-high px-sm py-xs border-b border-outline-variant flex justify-between items-center">
                <span className="font-label-caps text-label-caps text-on-surface-variant">TXID: 8C4F...01BA</span>
                <span className="material-symbols-outlined text-on-surface-variant text-sm cursor-pointer hover:text-primary transition-colors" data-icon="content_copy">content_copy</span>
              </div>
              <div className="p-sm space-y-md">
                <div className="grid grid-cols-2 gap-sm">
                  <div>
                    <p className="font-label-caps text-[10px] text-on-surface-variant uppercase mb-base">Contract Value</p>
                    <p className="font-headline-lg-mobile text-headline-lg-mobile text-primary">{escrow.amount_sats} sats</p>
                  </div>
                  <div>
                    <p className="font-label-caps text-[10px] text-on-surface-variant uppercase mb-base">Oracle Node</p>
                    <p className="font-body-md text-body-md text-secondary">Global Logistics #42</p>
                  </div>
                </div>
                <div className="pt-sm border-t border-outline-variant/30 flex justify-between items-center">
                  <div className="flex items-center gap-xs">
                    <span className="material-symbols-outlined text-secondary text-sm" data-icon="inventory_2">inventory_2</span>
                    <span className="font-body-md text-body-md">{escrow.description || 'High-End Precision Optics'}</span>
                  </div>
                  <span className="font-code-sm text-code-sm text-on-surface-variant">${(escrow.amount_sats * 0.0248).toFixed(2)} USD</span>
                </div>
              </div>
            </div>

            {/* Action Section */}
            {escrow.status === 'HELD' && (
              <div className="glass-panel rounded-xl p-md border-primary/20 bg-surface-container-low/50">
                <div className="mb-md">
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-xs" htmlFor="tracking">Carrier Tracking Number</label>
                  <div className="relative group">
                    <input
                      className="w-full bg-surface-container-highest border border-outline-variant rounded-lg px-md py-sm text-on-surface font-code-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all placeholder:text-on-surface-variant/40"
                      id="tracking"
                      placeholder="e.g., DHL-NBO-101"
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                    />
                    <span className="absolute right-sm top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant" data-icon="local_shipping">local_shipping</span>
                  </div>
                </div>
                <button
                  onClick={shipItem}
                  disabled={loading || !trackingNumber}
                  className="w-full bg-primary text-on-primary font-bold py-md rounded-lg flex items-center justify-center gap-sm active:scale-95 transition-all shadow-lg hover:shadow-primary/20 disabled:opacity-50"
                >
                  <span className="font-label-caps text-label-caps text-lg tracking-widest uppercase">
                    {loading ? 'Processing...' : 'Dispatch Item'}
                  </span>
                  <span className="material-symbols-outlined" data-icon="send">send</span>
                </button>
                <p className="mt-md text-center font-body-md text-[12px] text-on-surface-variant px-md">
                  By dispatching, you confirm that the item has been handed to the carrier. The Oracle will monitor this tracking number for final fund release.
                </p>
              </div>
            )}

            {escrow.status === 'SHIPPED' && (
              <div className="glass-panel rounded-xl p-md border-secondary/20 bg-surface-container-low/50">
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">📦</div>
                  <h3 className="text-xl font-bold text-secondary mb-2">Item Dispatched</h3>
                  <p className="text-on-surface-variant">
                    Tracking: <span className="font-code-sm font-bold">{escrow.tracking_number}</span>
                  </p>
                  <p className="text-on-surface-variant mt-2 text-sm">
                    Waiting for delivery confirmation...
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Customer Checkout Screen */}
        {screen === 'checkout' && escrow && (
          <>
            {/* Status Badge */}
            <div className="mt-md w-full max-w-md">
              {getStatusBadge(escrow.status)}
            </div>

            {/* QR Code Section */}
                        {escrow.status === 'PENDING' && (
                          <>
                            <div className="mt-lg relative cursor-pointer w-full max-w-md">
                              <div className="absolute inset-0 qr-gradient opacity-20 blur-2xl transition-opacity"></div>
                              <div className="glass-panel p-md rounded-full flex flex-col items-center gap-md border-primary/20">
                                <div className="bg-white p-base rounded-lg shadow-[0_0_20px_rgba(247,147,26,0.3)]">
                                  <QRCodeSVG
                                    value={escrow.payment_request}
                                    size={240}
                                    level="M"
                                    includeMargin
                                  />
                                </div>
                                <div className="flex flex-col items-center gap-xs">
                                  <p className="font-code-sm text-code-sm text-on-surface-variant opacity-70">
                                    {escrow.payment_request.slice(0, 15)}...
                                  </p>
                                  <button className="flex items-center gap-xs text-secondary font-label-caps text-label-caps hover:text-primary-container transition-colors active:scale-95 duration-200">
                                    <span className="material-symbols-outlined text-sm">content_copy</span>
                                    Copy Invoice Address
                                  </button>
                                </div>
                              </div>
                            </div>
                            {/* Simulate Payment Button */}
                            <button
                              onClick={simulatePayment}
                              disabled={loading}
                              className="w-full mt-md bg-primary-container text-on-primary-container py-sm rounded-lg font-label-caps text-label-caps active:scale-[0.98] transition-transform flex items-center justify-center gap-xs disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-sm">bolt</span>
                              {loading ? 'Processing...' : 'Simulate Payment'}
                            </button>
                          </>
                        )}

            {/* Item Details */}
            <div className="mt-lg w-full max-w-md space-y-sm">
              <div className="glass-panel rounded-xl p-md flex justify-between items-center border-l-4 border-l-secondary">
                <div className="flex flex-col">
                  <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{escrow.description || 'Premium Global Node License'}</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant">Transaction ID: <span className="font-code-sm">#TX-882193B</span></p>
                </div>
                <div className="text-right">
                  <p className="font-label-caps text-label-caps text-secondary">AMOUNT</p>
                  <p className="font-headline-lg-mobile text-headline-lg-mobile text-primary">{escrow.amount_sats} sats</p>
                  <p className="font-code-sm text-code-sm text-on-surface-variant opacity-60">≈ ${(escrow.amount_sats * 0.0248).toFixed(2)} USD</p>
                </div>
              </div>

              {/* Transaction Graph Micro-interaction */}
              <div className="glass-panel rounded-xl p-md space-y-md relative overflow-hidden">
                <div className="flex justify-between items-center relative z-10">
                  <div className="flex flex-col items-center gap-xs relative">
                    <div className="w-xs h-xs rounded-full bg-secondary pulse-teal flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-secondary text-sm">person</span>
                    </div>
                    <span className="font-label-caps text-[10px] text-on-surface-variant">Customer</span>
                  </div>
                  <div className="flex-grow h-[1px] bg-outline-variant relative mx-xs">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full" style={{ animation: 'move 2s infinite linear' }}></div>
                  </div>
                  <div className="flex flex-col items-center gap-xs relative">
                    <div className={`w-xs h-xs rounded-full flex items-center justify-center ${escrow.status === 'HELD' || escrow.status === 'SHIPPED' || escrow.status === 'SETTLED' ? 'bg-secondary-container border border-secondary' : 'bg-surface-container-highest border border-outline'}`}>
                      <span className="material-symbols-outlined text-on-surface-variant text-sm">lock</span>
                    </div>
                    <span className="font-label-caps text-[10px] text-on-surface-variant">HODL Lock</span>
                  </div>
                  <div className="flex-grow h-[1px] bg-outline-variant border-dashed mx-xs"></div>
                  <div className="flex flex-col items-center gap-xs relative">
                    <div className={`w-xs h-xs rounded-full flex items-center justify-center ${escrow.status === 'SHIPPED' || escrow.status === 'SETTLED' ? 'bg-primary-container border border-primary' : 'bg-surface-container-highest border border-outline opacity-40'}`}>
                      <span className="material-symbols-outlined text-on-surface-variant text-sm">storefront</span>
                    </div>
                    <span className={`font-label-caps text-[10px] ${escrow.status === 'SHIPPED' || escrow.status === 'SETTLED' ? 'text-on-surface-variant' : 'text-on-surface-variant opacity-40'}`}>Merchant</span>
                  </div>
                </div>
              </div>
            </div>

            {/* How it works footer */}
            <footer className="mt-lg w-full max-w-md mb-xl">
              <div className="bg-surface-container p-md rounded-xl border border-outline-variant space-y-sm">
                <div className="flex items-center gap-xs text-primary">
                  <span className="material-symbols-outlined">help_center</span>
                  <h3 className="font-label-caps text-label-caps uppercase">How it works: HODL Mechanism</h3>
                </div>
                <div className="space-y-xs">
                  <div className="flex gap-sm">
                    <span className="font-code-sm text-secondary">01.</span>
                    <p className="font-body-md text-body-md text-on-surface-variant">Your funds are committed to the network but <span className="text-primary font-bold">not released</span> to the merchant yet.</p>
                  </div>
                  <div className="flex gap-sm">
                    <span className="font-code-sm text-secondary">02.</span>
                    <p className="font-body-md text-body-md text-on-surface-variant">The invoice remains in a 'HODL' state until the Oracle verifies the fulfillment of the contract.</p>
                  </div>
                  <div className="flex gap-sm">
                    <span className="font-code-sm text-secondary">03.</span>
                    <p className="font-body-md text-body-md text-on-surface-variant">If the deal fails, your funds are returned instantly without counterparty risk.</p>
                  </div>
                </div>
                <div className="pt-xs border-t border-outline-variant/30 flex justify-center">
                  <a className="text-secondary font-label-caps text-[11px] underline underline-offset-4 decoration-secondary/30 hover:text-primary transition-colors" href="#">READ TECHNICAL DOCUMENTATION</a>
                </div>
              </div>
            </footer>
          </>
        )}

        {/* Oracle Simulator Screen (lightningoracle4.png) */}
        {screen === 'oracle' && (
          <div className="w-full max-w-container-max pt-md">
            {/* Hero / Context Area */}
            <section className="mb-lg">
              <div className="flex flex-col gap-base">
                <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">Protocol Layer</span>
                <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Oracle Simulator</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
                  Administrative interface for simulating Courier API callbacks and preimage release triggers. Use this tool to test settlement logic.
                </p>
              </div>
            </section>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-sm mb-lg">
              <div className="glass-panel p-md rounded-lg flex flex-col gap-base">
                <span className="font-label-caps text-label-caps text-on-surface-variant">NODE STATUS</span>
                <div className="flex items-center gap-xs">
                  <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_#00eefc] animate-pulse"></div>
                  <span className="font-code-sm text-code-sm text-secondary">ACTIVE</span>
                </div>
              </div>
              <div className="glass-panel p-md rounded-lg flex flex-col gap-base">
                <span className="font-label-caps text-label-caps text-on-surface-variant">ORACLE SYNC</span>
                <span className="font-code-sm text-code-sm text-on-surface">99.98%</span>
              </div>
            </div>

            {/* Packages in Transit List */}
            <section>
              <div className="flex items-center justify-between mb-sm">
                <h3 className="font-label-caps text-label-caps text-on-surface-variant">PACKAGES IN TRANSIT</h3>
                <span className="font-code-sm text-code-sm text-primary">{escrow ? '1 ACTIVE' : '0 ACTIVE'}</span>
              </div>
              <div className="flex flex-col gap-sm">
                {/* Current Escrow Package Card */}
                {escrow && escrow.tracking_number && (
                  <div className="glass-panel p-md rounded-xl border-l-4 border-primary transition-all hover:bg-surface-container-high active:scale-[0.98]">
                    <div className="flex justify-between items-start mb-md">
                      <div className="flex flex-col gap-base">
                        <span className="font-label-caps text-label-caps text-on-surface-variant">TRACKING NUMBER</span>
                        <span className="font-code-sm text-code-sm text-on-surface font-bold">{escrow.tracking_number}</span>
                      </div>
                      <span className={`px-xs py-[2px] rounded font-label-caps text-[10px] ${
                        escrow.status === 'HELD' ? 'bg-primary-container text-on-primary-container' :
                        escrow.status === 'SHIPPED' ? 'bg-secondary-container text-on-secondary' :
                        escrow.status === 'SETTLED' ? 'bg-green-500/20 text-green-400' :
                        'bg-surface-container-highest text-on-surface-variant'
                      }`}>
                        {escrow.status}
                      </span>
                    </div>
                    <div className="flex flex-col gap-xs mb-md">
                      <div className="flex justify-between text-body-md">
                        <span className="text-on-surface-variant">Current Status:</span>
                        <span className="text-secondary">
                          {escrow.status === 'HELD' ? 'Awaiting Dispatch' :
                           escrow.status === 'SHIPPED' ? 'In Transit' :
                           escrow.status === 'SETTLED' ? 'Delivered' : 'Pending'}
                        </span>
                      </div>
                      <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
                        <div className={`h-full shadow-[0_0_10px_#00eefc] transition-all ${
                          escrow.status === 'HELD' ? 'bg-secondary w-1/4' :
                          escrow.status === 'SHIPPED' ? 'bg-secondary w-3/4' :
                          escrow.status === 'SETTLED' ? 'bg-green-500 w-full' : 'bg-secondary w-0'
                        }`}></div>
                      </div>
                    </div>
                    {escrow.status === 'SHIPPED' && (
                      <button
                        onClick={simulateDelivery}
                        disabled={loading}
                        className="w-full h-xl bg-primary text-on-primary font-headline-lg-mobile text-headline-lg-mobile font-bold rounded-lg flex items-center justify-center gap-sm active:scale-95 transition-transform disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined">local_shipping</span>
                        {loading ? 'Processing...' : 'Simulate Courier Delivery'}
                      </button>
                    )}
                    {escrow.status === 'SETTLED' && (
                      <div className="text-center py-2">
                        <span className="text-secondary font-bold">Settlement Complete</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Demo Package Card 2 (Pending) */}
                <div className="glass-panel p-md rounded-xl border-l-4 border-outline-variant opacity-80">
                  <div className="flex justify-between items-start mb-md">
                    <div className="flex flex-col gap-base">
                      <span className="font-label-caps text-label-caps text-on-surface-variant">TRACKING NUMBER</span>
                      <span className="font-code-sm text-code-sm text-on-surface">LX-1102-4412-KE</span>
                    </div>
                    <span className="bg-surface-container-highest text-on-surface-variant px-xs py-[2px] rounded font-label-caps text-[10px]">PENDING</span>
                  </div>
                  <div className="flex justify-between text-body-md mb-xs">
                    <span className="text-on-surface-variant">Current Status:</span>
                    <span className="text-on-surface-variant italic">Out for Delivery</span>
                  </div>
                  <button className="w-full h-md border border-outline text-outline font-label-caps rounded-lg opacity-50 cursor-not-allowed" disabled>
                    AWAITING UPDATE
                  </button>
                </div>

                {/* Demo Package Card 3 (Settled) */}
                <div className="glass-panel p-md rounded-xl border-l-4 border-secondary/40">
                  <div className="flex justify-between items-start mb-md">
                    <div className="flex flex-col gap-base">
                      <span className="font-label-caps text-label-caps text-on-surface-variant">TRACKING NUMBER</span>
                      <span className="font-code-sm text-code-sm text-on-surface">LX-2291-5501-DE</span>
                    </div>
                    <div className="flex items-center gap-xs text-secondary">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      <span className="font-label-caps text-[10px]">SETTLED</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-body-md">
                    <span className="text-on-surface-variant">Preimage:</span>
                    <span className="font-code-sm text-[11px] text-secondary truncate max-w-[140px]">03a11b2...9f21</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Technical Log Overlay */}
            <section className="mt-lg">
              <div className="glass-panel p-md rounded-xl border border-outline-variant/30 bg-surface-container-lowest">
                <div className="flex items-center justify-between mb-sm">
                  <div className="flex items-center gap-xs">
                    <span className="material-symbols-outlined text-primary text-sm">terminal</span>
                    <span className="font-label-caps text-label-caps text-on-surface-variant">EVENT_LOG</span>
                  </div>
                  <span className="font-code-sm text-[10px] text-outline">AUTO-SCROLL: ON</span>
                </div>
                <div 
                  className="h-32 overflow-y-auto font-code-sm text-[11px] flex flex-col gap-1 text-on-surface-variant/80"
                  ref={logConsoleRef}
                >
                  {logs.map((log, i) => (
                    <div key={i} className="flex gap-sm">
                      <span className="text-outline">[{log.time}]</span>
                      <span className={getLogColor(log.type)}>{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Transaction Status (always visible when escrow exists on merchant screen) */}
        {escrow && screen === 'merchant' && escrow.status === 'SETTLED' && (
          <div className="mt-8 glass-panel p-md rounded-xl w-full max-w-md">
            <h2 className="font-headline-lg text-headline-lg mb-4">Transaction Status</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-on-surface-variant">Status</p>
                <p className="font-bold text-lg">{escrow.status}</p>
              </div>
              <div>
                <p className="text-sm text-on-surface-variant">Amount</p>
                <p className="font-bold text-lg">{escrow.amount_sats} sats</p>
              </div>
              {escrow.tracking_number && (
                <div>
                  <p className="text-sm text-on-surface-variant">Tracking</p>
                  <p className="font-bold">{escrow.tracking_number}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-xl pb-safe px-sm bg-surface-container-low border-t border-outline-variant">
        <button
          onClick={() => setScreen('merchant')}
          className={`flex flex-col items-center justify-center transition-colors active:scale-90 duration-200 ${
            screen === 'merchant' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary-container'
          }`}
        >
          <span className="material-symbols-outlined" data-icon="storefront" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
          <span className="font-label-caps text-label-caps">Merchant</span>
        </button>
        <button
          onClick={() => escrow && setScreen('checkout')}
          disabled={!escrow}
          className={`flex flex-col items-center justify-center transition-colors active:scale-90 duration-200 ${
            screen === 'checkout' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary-container'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <span className="material-symbols-outlined" data-icon="shopping_cart" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
          <span className="font-label-caps text-label-caps">Customer</span>
        </button>
        <button
          onClick={() => setScreen('oracle')}
          className={`flex flex-col items-center justify-center transition-colors active:scale-90 duration-200 ${
            screen === 'oracle' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary-container'
          }`}
        >
          <span className="material-symbols-outlined" data-icon="account_tree">account_tree</span>
          <span className="font-label-caps text-label-caps">Oracle</span>
        </button>
      </nav>

      {/* Protocol Status Indicator (Floating Mini) */}
      <div className="fixed bottom-[84px] right-sm z-40">
        <div className="glass-panel px-sm py-xs rounded-full flex items-center gap-xs cyber-glow-teal">
          <div className="w-2 h-2 rounded-full bg-secondary-container animate-pulse"></div>
          <span className="font-label-caps text-[9px] text-secondary tracking-widest uppercase">Protocol: Active</span>
        </div>
      </div>

      {/* Aesthetic Background Elements */}
      <div className="fixed top-[20%] right-[-10%] w-[400px] h-[400px] bg-primary/5 blur-[120px] pointer-events-none -z-10"></div>
      <div className="fixed bottom-[10%] left-[-10%] w-[300px] h-[300px] bg-secondary-container/5 blur-[100px] pointer-events-none -z-10"></div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-sm">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowSuccessModal(false)}></div>
          <div className="relative glass-panel w-full max-w-sm rounded-xl p-lg flex flex-col items-center text-center gap-md glow-teal">
            <div className="w-16 h-16 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <div className="flex flex-col gap-base">
              <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Preimage Released</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">Signature verified. Courier delivery proof confirmed. BTC released to Merchant via Lightning Network.</p>
            </div>
            <div className="w-full flex flex-col gap-sm">
              <div className="bg-surface-container-highest p-sm rounded border border-outline-variant/30 flex flex-col gap-1">
                <span className="font-label-caps text-[10px] text-outline text-left uppercase">HTLC PREIMAGE</span>
                <span className="font-code-sm text-code-sm text-secondary truncate">e93b0a2c8f...11f0</span>
              </div>
              <button 
                className="w-full h-md bg-surface-container-high border border-outline text-on-surface font-label-caps rounded-lg"
                onClick={() => setShowSuccessModal(false)}
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
