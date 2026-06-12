'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import api from '../../lib/api'

interface EscrowResponse {
  payment_request: string
  payment_hash: string
  preimage: string
  amount_sats: number
  status: string
  expiry: number
}

export default function MerchantPage() {
  const [amount, setAmount] = useState('25000')
  const [description, setDescription] = useState('Handcrafted ceramic set')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [escrow, setEscrow] = useState<EscrowResponse | null>(null)

  const checkoutUrl = useMemo(() => {
    if (!escrow) return ''
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/checkout/${escrow.payment_hash}`
  }, [escrow])

  const createEscrow = async () => {
    setLoading(true)
    setMessage('Creating your escrow invoice...')
    try {
      const response = await api.post('/escrow', {
        amount_sats: parseInt(amount, 10),
        description,
      })
      setEscrow(response.data)
      setMessage('Escrow created. Share the checkout link with the customer.')
    } catch (error) {
      console.error(error)
      setMessage('Could not create escrow right now.')
    } finally {
      setLoading(false)
    }
  }

  const simulatePayment = async () => {
    if (!escrow) return
    setLoading(true)
    try {
      await api.post(`/escrow/${escrow.payment_hash}/pay`)
      setMessage('The customer payment was simulated and the funds are now held.')
    } catch (error) {
      console.error(error)
      setMessage('Payment simulation failed.')
    } finally {
      setLoading(false)
    }
  }

  const shipItem = async () => {
    if (!escrow || !trackingNumber) return
    setLoading(true)
    try {
      await api.post('/escrow/ship', {
        payment_hash: escrow.payment_hash,
        tracking_number: trackingNumber,
      })
      setMessage('Shipment has been logged.')
    } catch (error) {
      console.error(error)
      setMessage('Shipment update failed.')
    } finally {
      setLoading(false)
    }
  }

  const simulateDelivery = async () => {
    if (!escrow?.payment_hash || !trackingNumber) return
    setLoading(true)
    try {
      await api.post('/oracle/simulate-delivery', {
        tracking_number: trackingNumber,
      })
      setMessage('Delivery simulated. Funds were released to the merchant.')
    } catch (error) {
      console.error(error)
      setMessage('Oracle delivery simulation failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,238,252,0.15),_transparent_35%),linear-gradient(135deg,#07111f,#111f34)] p-6 text-slate-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Merchant workspace</p>
            <h1 className="mt-2 text-3xl font-semibold">Create escrow requests and move the deal forward.</h1>
          </div>
          <Link href="/" className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 hover:border-cyan-300 hover:text-cyan-300">
            Back home
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur">
            <label className="block text-sm text-slate-400">Item</label>
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />

            <label className="mt-4 block text-sm text-slate-400">Amount (sats)</label>
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />

            <button
              onClick={createEscrow}
              disabled={loading}
              className="mt-6 rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
            >
              {loading ? 'Creating...' : 'Create escrow'}
            </button>

            {message ? <p className="mt-4 text-sm text-slate-300">{message}</p> : null}

            {escrow ? (
              <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-950/20 p-4 text-sm text-slate-300">
                <p className="font-semibold text-cyan-300">Checkout link</p>
                <a className="mt-2 block break-all text-cyan-200" href={checkoutUrl}>
                  {checkoutUrl}
                </a>
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur">
            {escrow ? (
              <>
                <div className="rounded-2xl bg-white p-4">
                  <QRCodeSVG value={escrow.payment_request} size={220} level="M" includeMargin />
                </div>
                <p className="mt-4 text-sm text-slate-400">Payment request</p>
                <p className="break-all text-xs text-slate-200">{escrow.payment_request}</p>

                <div className="mt-6 space-y-3">
                  <button
                    onClick={simulatePayment}
                    disabled={loading}
                    className="w-full rounded-full border border-cyan-400/30 px-4 py-3 text-sm font-semibold text-cyan-200 hover:border-cyan-300"
                  >
                    Simulate customer payment
                  </button>

                  <input
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm"
                    placeholder="Tracking number"
                    value={trackingNumber}
                    onChange={(event) => setTrackingNumber(event.target.value)}
                  />

                  <button
                    onClick={shipItem}
                    disabled={loading || !trackingNumber}
                    className="w-full rounded-full border border-white/15 px-4 py-3 text-sm font-semibold hover:border-cyan-300"
                  >
                    Log shipment
                  </button>

                  <button
                    onClick={simulateDelivery}
                    disabled={loading || !trackingNumber}
                    className="w-full rounded-full bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
                  >
                    Simulate delivery
                  </button>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-400">
                Create an escrow first to view the QR invoice and share the checkout link.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
