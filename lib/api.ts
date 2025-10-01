import { z } from 'zod'
import type { Customer, ApiResponse } from './types'

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL

if (!BASE_URL) {
  // This will help in dev to notice missing env. In prod, NEXT_PUBLIC must be set.
  // eslint-disable-next-line no-console
  console.warn('NEXT_PUBLIC_BACKEND_URL is not set')
}

const addOrUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('').transform(() => undefined)),
  phone: z.string().optional().or(z.literal('').transform(() => undefined)),
})

export function withAuthHeaders(password: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Auth': password,
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const body = isJson ? await res.json() : await res.text()
  if (!res.ok) {
    const message = isJson && body && (body.error || body.message)
      ? `${body.error || body.message}`
      : `Request failed (${res.status})`
    throw new Error(message)
  }
  return (isJson ? (body as ApiResponse<T>) : body) as any as T
}

export async function listCustomers(query: string, password: string): Promise<Customer[]> {
  const url = `${BASE_URL}?action=list&query=${encodeURIComponent(query || '')}`
  const res = await fetch(url, {
    method: 'GET',
    headers: withAuthHeaders(password),
    cache: 'no-store',
  })
  const json = await handleResponse<ApiResponse<Customer[]>>(res)
  if (typeof (json as any).ok === 'boolean') {
    const api = json as ApiResponse<Customer[]>
    if (!api.ok) throw new Error(api.error || 'Failed to fetch customers')
    return api.data || []
  }
  // Fallback if backend returns raw array
  return (json as unknown as Customer[]) || []
}

export async function addOrUpdate(payload: { name: string; email?: string; phone?: string }, password: string): Promise<Customer> {
  const parsed = addOrUpdateSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message || 'Invalid input')
  }
  const url = `${BASE_URL}?action=add_or_update`
  const res = await fetch(url, {
    method: 'POST',
    headers: withAuthHeaders(password),
    body: JSON.stringify(parsed.data),
    cache: 'no-store',
  })
  const json = await handleResponse<ApiResponse<Customer>>(res)
  if ((json as any).ok === false) throw new Error((json as any).error || 'Failed to upsert customer')
  return ((json as any).data || json) as Customer
}

export async function applySpend(id: string, amount: number, password: string): Promise<Customer> {
  if (!id) throw new Error('Missing customer ID')
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Amount must be greater than 0')
  const url = `${BASE_URL}?action=apply_spend`
  const res = await fetch(url, {
    method: 'POST',
    headers: withAuthHeaders(password),
    body: JSON.stringify({ id, amount }),
    cache: 'no-store',
  })
  const json = await handleResponse<ApiResponse<Customer>>(res)
  if ((json as any).ok === false) throw new Error((json as any).error || 'Failed to apply spend')
  return ((json as any).data || json) as Customer
}

export async function resetReward(id: string, password: string): Promise<Customer> {
  if (!id) throw new Error('Missing customer ID')
  const url = `${BASE_URL}?action=reset_reward`
  const res = await fetch(url, {
    method: 'POST',
    headers: withAuthHeaders(password),
    body: JSON.stringify({ id }),
    cache: 'no-store',
  })
  const json = await handleResponse<ApiResponse<Customer>>(res)
  if ((json as any).ok === false) throw new Error((json as any).error || 'Failed to reset reward')
  return ((json as any).data || json) as Customer
}

