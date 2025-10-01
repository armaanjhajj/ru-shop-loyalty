"use client"

import { useMemo, useState } from 'react'
import type { Customer } from '@/lib/types'
import { applySpend, resetReward } from '@/lib/api'
import { formatCurrency, formatDate, progressPercent, safeLocalStorageGet } from '@/lib/utils'
import clsx from 'clsx'

type Props = {
  customer: Customer
  onChange(updated: Customer): void
}

export default function CustomerCard({ customer, onChange }: Props) {
  const [amount, setAmount] = useState<number | ''>('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const progress = useMemo(() => progressPercent(customer.Spend, customer.Goal), [customer.Spend, customer.Goal])
  const password = useMemo(() => safeLocalStorageGet('app_password') || '', [])

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    window.setTimeout(() => setToast(null), 2000)
  }

  async function doApply(value: number) {
    if (!value || value <= 0) {
      showToast('error', 'Enter a positive amount')
      return
    }
    setLoading(true)
    try {
      const updated = await applySpend(customer.ID, value, password)
      onChange(updated)
      showToast('success', `Applied ${formatCurrency(value)}`)
      setAmount('')
    } catch (e: any) {
      showToast('error', e?.message || 'Failed to apply')
    } finally {
      setLoading(false)
    }
  }

  async function doReset() {
    setLoading(true)
    try {
      const updated = await resetReward(customer.ID, password)
      onChange(updated)
      showToast('success', 'Reward reset')
    } catch (e: any) {
      showToast('error', e?.message || 'Failed to reset')
    } finally {
      setLoading(false)
    }
  }

  const quick = [1, 5, 10, 20, 50]

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-base font-semibold">{customer.Name}</div>
          <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
            <span>ID:</span>
            <button
              type="button"
              className="underline"
              onClick={() => {
                navigator.clipboard.writeText(customer.ID).catch(() => {})
                showToast('success', 'ID copied')
              }}
            >
              {customer.ID}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={doReset}
          disabled={loading}
          className="btn btn-outline text-xs h-8 px-2"
        >
          Reset
        </button>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>{formatCurrency(customer.Spend)} / {formatCurrency(customer.Goal)}</span>
          <span>{progress}%</span>
        </div>
        <div className="progress-bar" aria-label="Spend progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <span style={{ width: `${progress}%` }} className="transition-all"></span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
          <div>
            <div className="font-medium">Goal</div>
            <div>{formatCurrency(customer.Goal)}</div>
          </div>
          <div>
            <div className="font-medium">Visits</div>
            <div>{customer.Visits}</div>
          </div>
          <div>
            <div className="font-medium">Last Visit</div>
            <div>{formatDate(customer.LastVisit)}</div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex flex-wrap gap-2">
          {quick.map((q) => (
            <button key={q} type="button" className="btn btn-outline" disabled={loading} onClick={() => void doApply(q)}>
              +{formatCurrency(q)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <div className="flex-1">
            <label className="label" htmlFor={`custom-${customer.ID}`}>Custom $</label>
            <input
              id={`custom-${customer.ID}`}
              type="number"
              min={0}
              step={0.01}
              className="input"
              value={amount}
              onChange={(e) => {
                const v = e.target.value
                setAmount(v === '' ? '' : Number(v))
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && amount) {
                  e.preventDefault()
                  void doApply(Number(amount))
                }
              }}
            />
          </div>
          <button type="button" className={clsx('btn btn-primary mt-6', loading && 'opacity-70')} disabled={loading || !amount} onClick={() => void doApply(Number(amount))}>
            Apply
          </button>
        </div>
      </div>

      <div aria-live="polite" className="mt-2">
        {toast && (
          <div className={clsx('text-xs px-2 py-1 rounded inline-block', toast.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
            {toast.message}
          </div>
        )}
      </div>
    </div>
  )
}

