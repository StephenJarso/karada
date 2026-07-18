'use client'

import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PRODUCTS } from './products'
import type { CreateEscrowPayload, Escrow, LogEntry, LogType, ProductType } from './types'

const ESCROW_STORAGE_KEY = 'karada.escrow.v1'
const LOGS_STORAGE_KEY = 'karada.logs.v1'

const readJson = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback

  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

const writeJson = <T,>(key: string, value: T) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

const removeJson = (key: string) => {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(key)
}

export function useEscrowDemo() {
  const router = useRouter()
  const [escrow, setEscrowState] = useState<Escrow | null>(() => readJson<Escrow | null>(ESCROW_STORAGE_KEY, null))
  const [logs, setLogsState] = useState<LogEntry[]>(() => readJson<LogEntry[]>(LOGS_STORAGE_KEY, []))
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (escrow) {
      writeJson(ESCROW_STORAGE_KEY, escrow)
    } else {
      removeJson(ESCROW_STORAGE_KEY)
    }
  }, [escrow])

  useEffect(() => {
    writeJson(LOGS_STORAGE_KEY, logs)
  }, [logs])

  const addLog = useCallback((message: string, type: LogType = 'info') => {
    const now = new Date()
    const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLogsState(prev => {
      const next = [...prev, { time, message, type }].slice(-120)
      writeJson(LOGS_STORAGE_KEY, next)
      return next
    })
  }, [])

  const refreshEscrowByHash = useCallback(async (paymentHash = escrow?.payment_hash) => {
    if (!paymentHash) return null

    try {
      const response = await axios.get<Escrow>(`/api/v1/escrow/${paymentHash}`)
      setEscrowState(response.data)
      return response.data
    } catch (error) {
      console.error(error)
      addLog('Failed to refresh escrow status', 'warn')
      return null
    }
  }, [escrow?.payment_hash, addLog])

  const createEscrow = useCallback(async (payload: CreateEscrowPayload) => {
    setLoading(true)
    try {
      const response = await axios.post<Escrow>('/api/v1/escrow', payload)
      setEscrowState(response.data)
      setShowSuccess(false)
      addLog(`Created ${PRODUCTS.find(product => product.type === payload.product_type)?.label ?? 'Karada'} escrow`, 'success')
      addLog(`Payment hash: ${response.data.payment_hash}`, 'info')
      return response.data
    } catch (error) {
      console.error(error)
      addLog('Failed to create HODL invoice escrow', 'warn')
      throw error
    } finally {
      setLoading(false)
    }
  }, [addLog])

  const simulatePayment = useCallback(async () => {
    if (!escrow) return
    setLoading(true)
    try {
      await axios.post(`/api/v1/escrow/${escrow.payment_hash}/pay`)
      addLog('HTLC/HODL payment detected - funds are now cryptographically locked', 'success')
      await refreshEscrowByHash(escrow.payment_hash)
    } catch (error) {
      console.error(error)
      addLog('Failed to simulate payment', 'warn')
    } finally {
      setLoading(false)
    }
  }, [escrow, addLog, refreshEscrowByHash])

  const submitFulfillment = useCallback(async (reference: string) => {
    if (!escrow || !reference) return
    setLoading(true)
    try {
      if (escrow.product_type === 'COMMERCE') {
        await axios.post('/api/v1/escrow/ship', {
          payment_hash: escrow.payment_hash,
          tracking_number: reference,
          carrier: escrow.carrier || undefined,
        })
        addLog(`Merchant submitted courier tracking: ${reference}`, 'action')
      } else {
        await axios.post(`/api/v1/escrow/${escrow.payment_hash}/fulfill`, {
          reference,
          proof_type: escrow.product_type === 'SCHOOL_FEES' ? 'SCHOOL_DOCUMENT' : 'SAVINGS_LOCK',
          message: `${PRODUCTS.find(product => product.type === escrow.product_type)?.label ?? 'Provider'} proof submitted for oracle verification`,
        })
        addLog(`${PRODUCTS.find(product => product.type === escrow.product_type)?.label ?? 'Provider'} proof submitted`, 'action')
      }
      await refreshEscrowByHash(escrow.payment_hash)
    } catch (error) {
      console.error(error)
      addLog('Failed to submit fulfillment proof', 'warn')
      throw error
    } finally {
      setLoading(false)
    }
  }, [escrow, addLog, refreshEscrowByHash])

  const simulateDelivery = useCallback(async (reference?: string) => {
    if (!escrow) return
    const proofReference = reference || escrow.tracking_number || escrow.proof_reference
    if (!proofReference) return

    setLoading(true)
    try {
      addLog(`Oracle verifying proof reference: ${proofReference}`, 'action')
      await axios.post('/api/v1/oracle/simulate-delivery', {
        reference: proofReference,
        status: 'VERIFIED',
        message: 'Oracle proof verified. Inspection window opened.',
      })
      addLog('Oracle proof verified - buyer inspection window is active', 'success')
      await refreshEscrowByHash(escrow.payment_hash)
    } catch (error) {
      console.error(error)
      addLog('Failed to simulate oracle verification', 'warn')
      throw error
    } finally {
      setLoading(false)
    }
  }, [escrow, addLog, refreshEscrowByHash])

  const acceptDelivery = useCallback(async () => {
    if (!escrow) return
    setLoading(true)
    try {
      await axios.post(`/api/v1/escrow/${escrow.payment_hash}/accept`)
      addLog('Buyer accepted. Karada released the preimage to settle the HODL invoice', 'success')
      await refreshEscrowByHash(escrow.payment_hash)
      setShowSuccess(true)
    } catch (error) {
      console.error(error)
      addLog('Failed to accept delivery', 'warn')
    } finally {
      setLoading(false)
    }
  }, [escrow, addLog, refreshEscrowByHash])

  const disputeDelivery = useCallback(async () => {
    if (!escrow) return
    const reason = window.prompt('Describe the dispute reason')
    if (!reason) return

    setLoading(true)
    try {
      await axios.post(`/api/v1/escrow/${escrow.payment_hash}/dispute`, { reason })
      addLog('Dispute opened - preimage remains hidden', 'warn')
      await refreshEscrowByHash(escrow.payment_hash)
    } catch (error) {
      console.error(error)
      addLog('Failed to open dispute', 'warn')
    } finally {
      setLoading(false)
    }
  }, [escrow, addLog, refreshEscrowByHash])

  const resetDemo = useCallback(() => {
    setEscrowState(null)
    setLogsState([])
    setShowSuccess(false)
    removeJson(ESCROW_STORAGE_KEY)
    removeJson(LOGS_STORAGE_KEY)
    addLog('Demo reset', 'info')
  }, [addLog])

  return {
    escrow,
    logs,
    loading,
    showSuccess,
    setShowSuccess,
    addLog,
    refreshEscrow: refreshEscrowByHash,
    createEscrow,
    simulatePayment,
    submitFulfillment,
    simulateDelivery,
    acceptDelivery,
    disputeDelivery,
    resetDemo,
    router,
  }
}
