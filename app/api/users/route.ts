import { pool } from "@/lib/db"
import { requireSession, parseBody, errorResponse } from "@/lib/api-helpers"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

// GET /api/users — list semua user (admin only)
export async function GET() {
  const session = await requireSession()
  if (session.user.role !== "admin") {
    return errorResponse("Hanya admin yang dapat mengakses", 403)
  }

  const result = await pool.query(
    `SELECT id, name, email, role, "emailVerified", banned, "createdAt", "updatedAt"
     FROM "user" ORDER BY "createdAt" DESC`
  )
  return Response.json({ users: result.rows })
}

// POST /api/users — admin buat user baru (lewat better-auth admin.createUser)
export async function POST(request: Request) {
  const session = await requireSession()
  if (session.user.role !== "admin") {
    return errorResponse("Hanya admin yang dapat menambah user", 403)
  }

  const body = await parseBody<{
    name: string
    email: string
    password: string
    role: string
  }>(request)

  if (!body.name || !body.email || !body.password) {
    return errorResponse("Nama, email, dan password wajib diisi", 400)
  }

  if (body.password.length < 6) {
    return errorResponse("Password minimal 6 karakter", 400)
  }

  const role = body.role === "admin" ? "admin" : "user"

  try {
    const res = await auth.api.createUser({
      headers: await headers(),
      body: {
        name: body.name,
        email: body.email,
        password: body.password,
        role,
      },
    })

    if (!res || "error" in (res as Record<string, unknown>)) {
      const errMsg = (res as { error?: string; message?: string }).error || (res as { message?: string }).message
      return errorResponse(errMsg || "Gagal membuat user", 400)
    }

    // Set role via DB (createUser mungkin tidak set role)
    const userId = (res as { user?: { id?: string }; id?: string }).user?.id || (res as { id?: string }).id
    if (userId) {
      await pool.query(`UPDATE "user" SET role = $1 WHERE id = $2`, [role, userId])
    }

    return Response.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gagal membuat user"
    return errorResponse(msg, 400)
  }
}
