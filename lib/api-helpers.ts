import { auth } from "@/lib/auth"
import { headers } from "next/headers"

// Helper: ambil session wajib. Return user atau throw 401.
export async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    throw new Response(JSON.stringify({ error: "Tidak terautentikasi" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }
  return session
}

// Helper: validasi & parse body JSON
export async function parseBody<T = Record<string, unknown>>(
  request: Request
): Promise<T> {
  try {
    return (await request.json()) as T
  } catch {
    throw new Response(JSON.stringify({ error: "Body bukan JSON valid" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }
}

// Helper: wrap error jadi Response
export function errorResponse(message: string, status = 400) {
  return Response.json({ error: message }, { status })
}
