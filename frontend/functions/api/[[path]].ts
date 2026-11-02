/**
 * Cloudflare Pages Function: forwards every /api/* request to the backend (BACKEND_URL, set in the Pages dashboard).
 *
 * Why a proxy instead of calling the backend directly: the frontend calls the relative path /api/v1 and the refresh
 * token is a SameSite=Strict cookie, so browser and API must share one origin. Responses (including Set-Cookie) are
 * passed through unchanged.
 */
interface Env {
  BACKEND_URL: string
}

export const onRequest = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  if (!env.BACKEND_URL) return new Response('BACKEND_URL is not set for this Pages project', { status: 500 })

  const incoming = new URL(request.url)
  const target = new URL(incoming.pathname + incoming.search, env.BACKEND_URL)

  const headers = new Headers(request.headers)
  // The login rate limit is per client IP (first X-Forwarded-For entry). Replace whatever the browser sent with the
  // address Cloudflare saw, so testers don't share one limit and nobody can fake it through this proxy.
  const clientIp = request.headers.get('CF-Connecting-IP')
  headers.delete('X-Forwarded-For')
  if (clientIp) headers.set('X-Forwarded-For', clientIp)
  headers.set('X-Forwarded-Proto', 'https')
  headers.set('X-Forwarded-Host', incoming.host)

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD'
  const upstream = await fetch(target.toString(), {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    redirect: 'manual',
  })
  return new Response(upstream.body, upstream)
}
