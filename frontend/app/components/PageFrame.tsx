'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const pages = [
  { href: '/', label: 'Dashboard' },
  { href: '/create', label: 'Create' },
  { href: '/checkout', label: 'Checkout' },
  { href: '/merchant', label: 'Merchant' },
  { href: '/oracle', label: 'Oracle' },
]

export default function PageFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen text-on-surface">
      <header className="fixed top-0 z-50 w-full border-b border-outline-variant/30 bg-surface-container-low/90 backdrop-blur-xl">
        <div className="mx-auto flex h-xl max-w-6xl items-center justify-between px-sm">
          <Link href="/" className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-primary">security</span>
            <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">Karada</span>
          </Link>

          <nav className="hidden items-center gap-xs md:flex">
            {pages.map(page => (
              <Link
                key={page.href}
                href={page.href}
                className={`rounded-lg px-sm py-xs font-label-caps text-label-caps transition-colors ${
                  pathname === page.href
                    ? 'bg-primary-container text-on-primary-container'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {page.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-xs text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span className="font-label-caps text-[10px]">Oracle live</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-md px-sm pb-40 pt-28">{children}</main>

      <footer className="fixed bottom-0 z-50 w-full border-t border-outline-variant/30 bg-surface-container-low/95 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-sm py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-label-caps text-label-caps text-on-surface-variant">Distinct pages</p>
            <nav className="grid grid-cols-4 gap-2 sm:flex sm:grid-cols-none sm:gap-xs">
              {pages.map(page => (
                <Link
                  key={page.href}
                  href={page.href}
                  className={`rounded-lg px-sm py-xs text-center font-label-caps text-label-caps transition-colors ${
                    pathname === page.href
                      ? 'bg-secondary-container text-on-secondary-container border-secondary-container'
                      : 'border border-outline-variant text-on-surface-variant hover:border-secondary/60 hover:text-on-surface'
                  }`}
                >
                  {page.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}
