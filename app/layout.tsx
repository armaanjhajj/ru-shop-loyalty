import './globals.css'
import type { Metadata } from 'next'
import { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'RU Smoke Shop — Loyalty',
  description: 'Simple loyalty tracker for RU Smoke Shop',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="border-b bg-white">
            <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs font-bold">R</div>
              <h1 className="text-lg font-semibold">RU Smoke Shop — Loyalty</h1>
            </div>
          </header>
          <main className="max-w-5xl mx-auto px-4 py-6">
            {children}
          </main>
          <footer className="py-6 text-center text-xs text-gray-500">
            Built for RU Smoke Shop. All data via Google Apps Script.
          </footer>
        </div>
      </body>
    </html>
  )
}

