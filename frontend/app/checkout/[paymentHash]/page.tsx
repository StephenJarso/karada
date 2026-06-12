'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import api from '../../../lib/api'

interface EscrowResponse {
  payment_hash: string
  payment_request: string
  preimage: string
  amount_sats: number
  status: string
  tracking_number?: string
  description: string
}

export default function CheckoutPage() {
  const [paymentHash, setPaymentHash] = useState<string | null>(null)
  const [escrow, setEscrow] = useState<EscrowResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.pathname.split('/').filter(Boolean).pop() ?? null
      setPaymentHash(hash)
    }
  }, [])

  const loadEscrow = async (hash: string) => {
    try {
      const response = await api.get(`/escrow/${hash}`)
      setEscrow(response.data)
    } catch (error) {
      console.error(error)
      setMessage('Escrow not found.')
    }
  }

  useEffect(() => {
    if (paymentHash) {
      void loadEscrow(paymentHash)
    }
  }, [paymentHash])

  const simulatePayment = async () => {
    if (!escrow?.payment_hash) return
    setLoading(true)
    try {
      await api.post(`/escrow/${escrow.payment_hash}/pay`)
      await loadEscrow(escrow.payment_hash)
      setMessage('Payment simulated successfully.')
    } catch (error) {
      console.error(error)
      setMessage('Could not simulate payment.')
    } finally {
      setLoading(false)
    }
  }

  const acceptEscrow = async () => {
    if (!escrow?.payment_hash) return
    setLoading(true)
    try {
      await api.post(`/escrow/${escrow.payment_hash}/accept`)
      await loadEscrow(escrow.payment_hash)
      setMessage('Escrow accepted and settled.')
    } catch (error) {
      console.error(error)
      setMessage('Could not accept the escrow.')
    } finally {
      setLoading(false)
    }
  }

  const disputeEscrow = async () => {
    if (!escrow?.payment_hash) return
    setLoading(true)
    try {
      await api.post(`/escrow/${escrow.payment_hash}/dispute`)
      await loadEscrow(escrow.payment_hash)
      setMessage('Dispute raised.')
    } catch (error) {
      console.error(error)
      setMessage('Could not raise a dispute.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,238,252,0.15),_transparent_35%),linear-gradient(135deg,#07111f,#111f34)] p-6 text-slate-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Customer checkout</p>
            <h1 className="mt-2 text-3xl font-semibold">Pay the invoice, inspect the package, and resolve the escrow.</h1>
          </div>
          <Link href="/" className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 hover:border-cyan-300 hover:text-cyan-300">
            Back home
          </Link>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur">
          {escrow ? (
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="text-sm text-slate-400">Invoice</p>
                <div className="mt-3 rounded-2xl bg-white p-4">
                  <QRCodeSVG value={escrow.payment_request} size={220} level="M" includeMargin />
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <p className="text-sm text-slate-400">Status</p>
                  <p className="mt-2 text-xl font-semibold text-cyan-300">{escrow.status}</p>
                  <p className="mt-2 text-sm text-slate-300">{escrow.description}</p>
                  <p className="mt-2 text-sm text-slate-400">Amount: {escrow.amount_sats} sats</p>
                  {escrow.tracking_number ? <p className="mt-2 text-sm text-slate-400">Tracking: {escrow.tracking_number}</p> : null}
                </div>

                {message ? <p className="text-sm text-slate-300">{message}</p> : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={simulatePayment}
                    disabled={loading}
                    className="rounded-full border border-cyan-400/30 px-4 py-3 text-sm font-semibold text-cyan-200 hover:border-cyan-300"
                  >
                    Simulate payment
                  </button>
                  <button
                    onClick={acceptEscrow}
                    disabled={loading}
                    className="rounded-full bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
                  >
                    Accept delivery
                  </button>
                  <button
                    onClick={disputeEscrow}
                    disabled={loading}
                    className="rounded-full border border-rose-400/30 px-4 py-3 text-sm font-semibold text-rose-200 hover:border-rose-300 sm:col-span-2"
                  >
                    Raise dispute
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-400">Loading escrow...</p>
          )}
        </div>
      </div>
    </main>
  )
}
