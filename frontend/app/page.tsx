'use client'

import { useState } from 'react'
import axios from 'axios'

interface Escrow {
  id: string
  payment_hash: string
  preimage: string
  amount_sats: number
  status: string
  tracking_number: string
  description: string
}

export default function Home() {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [escrow, setEscrow] = useState<Escrow | null>(null)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [loading, setLoading] = useState(false)

  const createEscrow = async () => {
    setLoading(true)
    try {
      const response = await axios.post('/api/v1/escrow', {
        amount_sats: parseInt(amount),
        description,
      })
      setEscrow(response.data)
    } catch (error) {
      console.error(error)
    }
    setLoading(false)
  }

  const shipItem = async () => {
    if (!escrow) return
    try {
      await axios.post('/api/v1/escrow/ship', {
        payment_hash: escrow.payment_hash,
        tracking_number: trackingNumber,
      })
      setEscrow({ ...escrow, status: 'SHIPPED', tracking_number: trackingNumber })
    } catch (error) {
      console.error(error)
    }
  }

  const simulateDelivery = async () => {
    if (!escrow?.tracking_number) return
    try {
      await axios.post('/api/v1/oracle/simulate-delivery', {
        tracking_number: escrow.tracking_number,
      })
      setEscrow({ ...escrow, status: 'SETTLED' })
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-orange-600">
          🎴 Karada
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Trustless Cross-Border Lightning Escrow
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Buyer Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600">
              🛒 Buyer - Create Purchase
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Amount (Satoshis)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="50000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Hand-carved Mahogany Art"
                />
              </div>
              <button
                onClick={createEscrow}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Escrow'}
              </button>
            </div>
          </div>

          {/* Merchant Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-green-600">
              🚚 Merchant - Ship Item
            </h2>
            {escrow ? (
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">Payment Request:</p>
                  <p className="font-mono text-xs break-all">
                    {escrow.payment_request}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="DHL-NBO-9921"
                  />
                </div>
                <button
                  onClick={shipItem}
                  disabled={!trackingNumber || escrow.status !== 'PENDING'}
                  className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Ship Item
                </button>
                {escrow.status === 'SHIPPED' && (
                  <button
                    onClick={simulateDelivery}
                    className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
                  >
                    Simulate Delivery
                  </button>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Create an escrow to begin</p>
            )}
          </div>
        </div>

        {/* Status Display */}
        {escrow && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Transaction Status</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-bold text-lg">{escrow.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Amount</p>
                <p className="font-bold text-lg">{escrow.amount_sats} sats</p>
              </div>
              {escrow.tracking_number && (
                <div>
                  <p className="text-sm text-gray-600">Tracking</p>
                  <p className="font-bold">{escrow.tracking_number}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}