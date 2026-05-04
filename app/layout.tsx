import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import { BUSINESS_RULES } from '@/lib/business-rules'
import './globals.css'

const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' })

export const metadata: Metadata = {
  title: 'Ember Coach Hire — Reliable. Clear pricing. 100% electric.',
  description:
    `Self-serve coach hire booking. Instant quotes. £${BUSINESS_RULES.baseRateGbp} base + £${BUSINESS_RULES.driveRatePerHourGbp}/hr drive + £${BUSINESS_RULES.waitRatePerHourGbp}/hr wait.`,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
