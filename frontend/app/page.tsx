'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,238,252,0.15),_transparent_35%),linear-gradient(135deg,#07111f,#111f34)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
        <div className="max-w-3xl space-y-5">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Karada</p>
          <h1 className="text-4xl font-semibold sm:text-6xl">Trustless escrow for merchant and customer flows on Lightning.</h1>
          <p className="max-w-2xl text-lg text-slate-300">
            Create secured escrow payments, let the customer scan a QR invoice, and release funds only when the merchant and customer reach the right outcome.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur">
            <h2 className="text-2xl font-semibold">Merchant workspace</h2>
            <p className="mt-3 text-slate-300">
              Create a HODL escrow, share the customer checkout link, and manage shipment and delivery updates from one place.
            </p>
            <Link
              href="/merchant"
              className="mt-6 inline-flex rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Open merchant workspace
            </Link>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur">
            <h2 className="text-2xl font-semibold">Customer checkout</h2>
            <p className="mt-3 text-slate-300">
              Scan or open the shared QR link, pay the invoice, and accept or dispute the delivery once the merchant has shipped it.
            </p>
            <Link
              href="/merchant"
              className="mt-6 inline-flex rounded-full border border-white/15 px-5 py-3 font-semibold text-slate-100 transition hover:border-cyan-300 hover:text-cyan-300"
            >
              Go to checkout flow
            </Link>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-slate-900/60 p-6 text-sm text-slate-400">
          <p>Backend status: Flask API running on port 5001.</p>
          <p className="mt-2">Frontend status: Next.js app connected through the local API rewrite.</p>
        </div>
      </div>
    </main>
  )
}
