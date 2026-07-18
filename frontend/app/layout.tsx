import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { JetBrains_Mono } from 'next/font/google'
import PageFrame from './components/PageFrame'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' })

export const metadata: Metadata = {
  title: 'Karada - Trustless Lightning Escrow',
  description: 'Cross-border e-commerce escrow on Bitcoin Lightning Network',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${jetbrains.variable}`}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.className} font-body-md text-body-md`}>
        <PageFrame>{children}</PageFrame>
      </body>
    </html>
  )
}
