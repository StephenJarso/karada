'use client'

import axios from 'axios'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Escrow, LogEntry, ProductDefinition } from '@/app/lib/types'

type OraclePanelMode = 'dashboard' | 'create' | 'checkout' | 'merchant' | 'oracle'

const MODE_COPY: Record<OraclePanelMode, { eyebrow: string; title: string; description: string; action: string }> = {
  dashboard: {
    eyebrow: 'Oracle heartbeat',
    title: 'Oracle working below the dashboard',
    description: 'The panel pings the Python backend and shows the proof model that will verify each escrow.',
    action: 'Open Oracle',
  },
  create: {
    eyebrow: 'Oracle rules',
    title: 'Oracle working below the create page',
    description: 'The oracle is prepared for the proof type selected here: courier, school document, or savings lock.',
    action: 'Review Oracle',
  },
  checkout: {
    eyebrow: 'Oracle waiting',
    title: 'Oracle working below checkout',
    description: 'Once the buyer pays, funds remain held until the provider submits proof and the oracle verifies it.',
    action: 'Open Oracle',
  },
  merchant: {
    eyebrow: 'Oracle intake',
    title: 'Oracle working below the merchant page',
    description: 'Proof submitted here becomes the oracle verification signal for the inspection window.',
    action: 'Open Oracle',
  },
  oracle: {
    eyebrow: 'Oracle simulator',
    title: 'Oracle working below the oracle page',
    description: 'Use this panel to verify the active proof reference and open the buyer inspection window.',
    action: 'Run Verification',
  },
}

export function OraclePanel({
  mode,
  escrow,
  logs,
  loading,
}: {
  mode: OraclePanelMode
  escrow: Escrow | null
  logs: LogEntry[]
  loading: boolean
}) {
  const copy = MODE_COPY[mode]
  const [oracleStatus, setOracleStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [products, setProducts] = useState<ProductDefinition[]>([])

  const pingOracle = async () => {
    setOracleStatus('checking')
    try {
      const response = await axios.get<ProductDefinition[]>('/api/v1/products')
      setProducts(response.data)
      setOracleStatus('online')
    } catch (error) {
      console.error(error)
      setOracleStatus('offline')
    }
  }

  useEffect(() => {
    pingOracle()
  }, [])

  const proofReference = escrow?.tracking_number || escrow?.proof_reference
  const oracleActionHref = mode === 'oracle' ? '/oracle' : '/oracle'

  return (
    <section className="glass-panel rounded-3xl border border-outline-variant/30 p-md">
      <div className="flex flex-col gap-md lg:flex-row lg:items-start lg:justify-between">
        <div>
          <span className="font-label-caps text-label-caps text-secondary">{copy.eyebrow}</span>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile mt-xs text-on-surface">{copy.title}</h2>
          <p className="mt-sm max-w-3xl text-on-surface-variant">{copy.description}</p>
        </div>

        <div className="flex items-center gap-xs rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-sm py-xs">
          <span className={`h-2 w-2 rounded-full ${oracleStatus === 'online' ? 'bg-secondary animate-pulse' : oracleStatus === 'offline' ? 'bg-error' : 'bg-primary-container animate-pulse'}`}></span>
          <span className="font-label-caps text-label-caps text-on-surface-variant">
            {oracleStatus === 'online' ? 'Backend online' : oracleStatus === 'offline' ? 'Backend offline' : 'Checking'}
          </span>
          <button onClick={pingOracle} className="material-symbols-outlined text-on-surface-variant hover:text-on-surface">
            refresh
          </button>
        </div>
      </div>

      <div className="mt-md grid gap-sm md:grid-cols-3">
        <div className="rounded-xl bg-surface-container-lowest p-sm">
          <p className="font-label-caps text-label-caps text-on-surface-variant">Supported proof models</p>
          <p className="font-code-sm text-primary">{products.length || 3}</p>
        </div>
        <div className="rounded-xl bg-surface-container-lowest p-sm">
          <p className="font-label-caps text-label-caps text-on-surface-variant">Current escrow</p>
          <p className="font-code-sm text-primary">{escrow ? 'Loaded' : 'No escrow'}</p>
        </div>
        <div className="rounded-xl bg-surface-container-lowest p-sm">
          <p className="font-label-caps text-label-caps text-on-surface-variant">Next oracle action</p>
          <p className="font-code-sm text-primary">{copy.action}</p>
        </div>
      </div>

      {escrow && (
        <div className="mt-md grid gap-sm lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="grid gap-sm md:grid-cols-3">
            <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest/70 p-sm">
              <p className="font-label-caps text-label-caps text-on-surface-variant">Status</p>
              <p className="font-code-sm text-primary">{escrow.status}</p>
            </div>
            <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest/70 p-sm">
              <p className="font-label-caps text-label-caps text-on-surface-variant">Proof reference</p>
              <p className="font-code-sm text-primary">{proofReference || 'Pending'}</p>
            </div>
            <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest/70 p-sm">
              <p className="font-label-caps text-label-caps text-on-surface-variant">Inspection deadline</p>
              <p className="font-code-sm text-primary">{escrow.inspection_deadline ? new Date(escrow.inspection_deadline).toLocaleString() : 'Not opened'}</p>
            </div>
          </div>

          <Link
            href={oracleActionHref}
            className="inline-flex items-center justify-center gap-xs rounded-xl bg-secondary-container px-md py-sm font-label-caps text-label-caps text-on-secondary-container"
          >
            <span className="material-symbols-outlined text-[18px]">account_tree</span>
            {copy.action}
          </Link>
        </div>
      )}

      <div className="mt-md">
        <div className="mb-xs flex items-center justify-between">
          <span className="font-label-caps text-label-caps text-secondary">Recent protocol log</span>
          <span className="font-label-caps text-label-caps text-on-surface-variant">{loading ? 'Working...' : `${logs.length} events`}</span>
        </div>
        <div className="max-h-40 overflow-auto rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-sm font-code-sm text-xs">
          {logs.length ? (
            logs.slice(-8).reverse().map((log, index) => (
              <div key={`${log.time}-${log.message}-${index}`} className="mb-xs last:mb-0">
                <span className="text-outline">[{log.time}]</span>{' '}
                <span className={log.type === 'success' ? 'text-secondary' : log.type === 'warn' ? 'text-yellow-300' : log.type === 'action' ? 'text-primary' : 'text-on-surface-variant'}>
                  {log.message}
                </span>
              </div>
            ))
          ) : (
            <p className="text-on-surface-variant">No protocol events yet.</p>
          )}
        </div>
      </div>
    </section>
  )
}
