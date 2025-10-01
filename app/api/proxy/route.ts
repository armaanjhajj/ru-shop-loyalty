import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL as string

function getPassword(req: Request): string {
  return req.headers.get('x-auth') || process.env.APP_PASSWORD || ''
}

async function forward(req: Request, init: RequestInit & { method: 'GET' | 'POST' }) {
  if (!BACKEND) {
    return new Response(JSON.stringify({ ok: false, error: 'Backend URL not configured' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
  const url = new URL(req.url)
  const target = `${BACKEND}?${url.searchParams.toString()}`
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Auth': getPassword(req),
  }
  const body = init.method === 'POST' ? await req.text() : undefined
  const res = await fetch(target, {
    method: init.method,
    headers,
    body,
    cache: 'no-store',
  })
  const contentType = res.headers.get('content-type') || 'application/json'
  const data = await res.text()
  return new Response(data, { status: res.status, headers: { 'content-type': contentType } })
}

export async function GET(req: NextRequest) {
  return forward(req, { method: 'GET' })
}

export async function POST(req: NextRequest) {
  return forward(req, { method: 'POST' })
}


