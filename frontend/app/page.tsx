'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { EscrowSummary } from '@/app/components/EscrowSummary'
import { OraclePanel } from '@/app/components/OraclePanel'
import { useEscrowDemo } from '@/app/lib/useEscrowDemo'
import { PRODUCTS } from '@/app/lib/products'

const pageCards = [
  {
    href: '/create',
    icon: 'add_chart',
    eyebrow: 'Page 1',
    title: 'Create',
    description: 'Choose commerce, school fees, or savings and generate a HODL invoice escrow.',
  },
  {
    href: '/checkout',
    icon: 'qr_code_2',
    eyebrow: 'Page 2',
    title: 'Checkout',
    description: 'Scan or copy the BOLT11 invoice, then simulate the buyer payment that locks funds.',
  },
  {
    href: '/merchant',
    icon: 'local_shipping',
    eyebrow: 'Page 3',
    title: 'Merchant',
    description: 'Submit courier tracking, school documents, or savings proof for oracle intake.',
  },
  {
    href: '/oracle',
    icon: 'account_tree',
    eyebrow: 'Page 4',
    title: 'Oracle',
    description: 'Verify the proof reference and open the inspection window for buyer acceptance.',
  },
]

export default function HomePage() {
  const { escrow, logs, addLog } = useEscrowDemo()

  useEffect(() => {
    addLog('Dashboard opened - oracle panel visible below every page', 'info')
  }, [addLog])

  return (
    <div className="space-y-md">
      <section className="glass-panel overflow-hidden rounded-3xl border border-outline-variant/30 p-md">
        <div className="relative">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-secondary-container/10 blur-3xl"></div>
          <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-primary-container/10 blur-3xl"></div>
          <div className="relative grid gap-md lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <span className="font-label-caps text-label-caps text-secondary">Trustless Lightning Escrow Protocol</span>
              <h1 className="mt-xs font-display-lg text-display-lg font-bold leading-tight text-on-surface">
                Karada verifies proof before Lightning funds settle.
              </h1>
              <p className="mt-sm max-w-2xl text-on-surface-variant">
                A clean multi-page frontend for commerce, school fees, and savings escrow. Each page keeps the oracle panel visible underneath so the verification flow is always working in view.
              </p>
              <div className="mt-md flex flex-col gap-xs sm:flex-row">
                <Link href="/create" className="inline-flex items-center justify-center gap-xs rounded-xl bg-primary-container px-md py-sm font-label-caps text-label-caps text-on-primary-container">
                  <span className="material-symbols-outlined text-[18px]">bolt</span>
                  Start escrow
                </Link>
                <Link href="/oracle" className="inline-flex items-center justify-center gap-xs rounded-xl border border-outline-variant px-md py-sm font-label-caps text-label-caps text-on-surface">
                  <span className="material-symbols-outlined text-[18px]">account_tree</span>
                  Open Oracle
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest/70 p-md">
              <div className="mb-md flex items-center justify-between">
                <span className="font-label-caps text-label-caps text-secondary">Live protocol state</span>
                <span className="material-symbols-outlined text-secondary">auto_awesome</span>
              </div>
              <div className="space-y-sm">
                {[
                  ['Hidden preimage', 'Generated server-side'],
                  ['HODL invoice', 'Funds held until release'],
                  ['Oracle proof', 'Courier, school, or savings'],
                  ['Inspection window', 'Buyer accepts or disputes'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-sm rounded-xl bg-surface-container-low p-sm">
                    <span className="text-on-surface-variant">{label}</span>
                    <span className="font-code-sm text-primary">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-md md:grid-cols-2 xl:grid-cols-4">
        {pageCards.map(card => (
          <Link key={card.href} href={card.href} className="glass-panel group rounded-3xl border border-outline-variant/30 p-md transition hover:-translate-y-1 hover:border-secondary/60">
            <div className="mb-md flex items-center justify-between">
              <span className="font-label-caps text-label-caps text-secondary">{card.eyebrow}</span>
              <span className="material-symbols-outlined text-secondary transition group-hover:scale-110">{card.icon}</span>
            </div>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{card.title}</h2>
            <p className="mt-sm text-on-surface-variant">{card.description}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-md lg:grid-cols-[0.9fr_1.1fr]">
        <EscrowSummary escrow={escrow} />
        <OraclePanel mode="dashboard" escrow={escrow} logs={logs} loading={false} />
      </section>

      <section className="glass-panel rounded-3xl border border-outline-variant/30 p-md">
        <div className="mb-md flex items-center justify-between gap-sm">
          <div>
            <span className="font-label-caps text-label-caps text-secondary">Product proof models</span>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile mt-xs text-on-surface">Oracle-ready product families</h2>
          </div>
          <span className="material-symbols-outlined text-primary">category</span>
        </div>

        <div className="grid gap-sm md:grid-cols-3">
          {PRODUCTS.map(product => (
            <div key={product.type} className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest/70 p-sm">
              <div className="mb-sm flex items-center gap-xs">
                <span className="material-symbols-outlined text-secondary">{product.type === 'COMMERCE' ? 'storefront' : product.type === 'SCHOOL_FEES' ? 'school' : 'savings'}</span>
                <span className="font-label-caps text-label-caps text-secondary">{product.label}</span>
              </div>
              <p className="text-sm text-on-surface-variant">{product.proof}</p>
              <p className="mt-sm text-xs text-on-surface-variant">{product.settlement_rule}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
