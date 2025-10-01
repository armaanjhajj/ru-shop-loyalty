"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PasswordGate from '@/components/PasswordGate'
import CustomerCard from '@/components/CustomerCard'
import type { Customer } from '@/lib/types'
import { addOrUpdate, listCustomers } from '@/lib/api'
import { safeLocalStorageGet } from '@/lib/utils'
import { z } from 'zod'

const addSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('').transform(() => undefined)),
  phone: z.string().optional().or(z.literal('').transform(() => undefined)),
})

export default function Page() {
  const [query, setQuery] = useState('')
  const [matches, setMatches] = useState<Customer[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [addForm, setAddForm] = useState<{ name: string; email?: string; phone?: string }>({ name: '', email: '', phone: '' })
  const [adding, setAdding] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const debounceRef = useRef<number | null>(null)

  const password = useMemo(() => safeLocalStorageGet('app_password') || '', [])

  const showToast = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(null), 2000)
  }, [])

  const runSearch = useCallback(async (q: string) => {
    setLoadingList(true)
    try {
      const res = await listCustomers(q, password)
      setMatches(res)
    } catch (e) {
      // ignored, PasswordGate handles auth
    } finally {
      setLoadingList(false)
    }
  }, [password])

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      void runSearch(query)
    }, 300)
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [query, runSearch])

  useEffect(() => {
    void runSearch('')
  }, [runSearch])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const parsed = addSchema.safeParse(addForm)
    if (!parsed.success) {
      showToast(parsed.error.errors[0]?.message || 'Invalid input')
      return
    }
    setAdding(true)
    try {
      const customer = await addOrUpdate(parsed.data, password)
      setMatches((prev) => {
        const existingIndex = prev.findIndex((c) => c.ID === customer.ID)
        if (existingIndex >= 0) {
          const copy = [...prev]
          copy[existingIndex] = customer
          return copy
        }
        return [customer, ...prev]
      })
      setAddForm({ name: '', email: '', phone: '' })
      showToast('Customer added/updated')
    } catch (e: any) {
      showToast(e?.message || 'Failed to add customer')
    } finally {
      setAdding(false)
    }
  }

  return (
    <PasswordGate>
      <div className="grid gap-6">
        <section className="card p-5">
          <h2 className="text-base font-semibold mb-3">Add Customer</h2>
          <form onSubmit={handleAdd} className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-1">
              <label htmlFor="name" className="label">Name</label>
              <input id="name" className="input" value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="md:col-span-1">
              <label htmlFor="email" className="label">Email</label>
              <input id="email" className="input" value={addForm.email || ''} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="md:col-span-1">
              <label htmlFor="phone" className="label">Phone</label>
              <input id="phone" className="input" value={addForm.phone || ''} onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="md:col-span-1 flex items-end">
              <button type="submit" className="btn btn-primary w-full" disabled={adding}>{adding ? 'Saving…' : 'Add'}</button>
            </div>
          </form>
        </section>

        <section className="card p-5">
          <div className="flex items-end justify-between gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="label">Find Customers</label>
              <input id="search" className="input" placeholder="Search name, email, phone, ID" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="text-sm text-gray-600 mb-1">Matches: {loadingList ? '…' : matches.length}</div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {!loadingList && matches.length === 0 && (
              <div className="text-sm text-gray-500">No customers found.</div>
            )}
            {matches.map((c) => (
              <CustomerCard
                key={c.ID}
                customer={c}
                onChange={(updated) => setMatches((prev) => prev.map((p) => (p.ID === updated.ID ? updated : p)))}
              />
            ))}
          </div>
        </section>

        <div aria-live="polite" className="text-center">
          {toast && (
            <div className="inline-flex items-center justify-center px-3 py-1 rounded bg-gray-800 text-white text-xs">{toast}</div>
          )}
        </div>
      </div>
    </PasswordGate>
  )
}

