import { format } from 'date-fns'

export function formatCurrency(amount: number): string {
  if (Number.isNaN(amount)) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function formatDate(iso?: string): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (isNaN(date.getTime())) return '—'
  try {
    return format(date, 'M/d/yyyy, h:mm:ss a')
  } catch {
    return date.toLocaleString()
  }
}

export function progressPercent(spend: number, goal: number): number {
  if (!goal || goal <= 0) return 0
  const pct = (spend / goal) * 100
  return Math.max(0, Math.min(100, Math.round(pct)))
}

export function safeLocalStorageGet(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function safeLocalStorageSet(key: string, value: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // ignore
  }
}

