import { loadTokens } from './tokens'

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized')
    this.name = 'UnauthorizedError'
  }
}

export async function apiReq(url: string, options: RequestInit = {}): Promise<Response> {
  const token = loadTokens()
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.body != null ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
      Authorization: `Bearer ${token?.access_token ?? ''}`,
    },
  })
  if (res.status === 401) {
    throw new UnauthorizedError()
  }
  return res
}
