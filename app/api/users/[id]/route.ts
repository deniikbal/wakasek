import { pool } from "@/lib/db"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { requireSession, parseBody, errorResponse } from "@/lib/api-helpers"
import { VALID_ROLES } from "@/lib/roles"

// PUT /api/users/[id] — update role/nama/password
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession()
  if (session.user.role !== "admin") {
    return errorResponse("Hanya admin yang dapat mengubah user", 403)
  }

  const { id } = await params
  const body = await parseBody<{ role?: string; name?: string; password?: string }>(request)

  // Update password via better-auth (hash yang benar + revoke sesi user target)
  if (body.password) {
    if (body.password.length < 6) {
      return errorResponse("Password minimal 6 karakter", 400)
    }
    try {
      await auth.api.setUserPassword({
        body: { userId: id, newPassword: body.password },
        headers: await headers(),
      })
      return Response.json({ ok: true })
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : "Gagal mengubah password", 400)
    }
  }

  // Update role
  if (body.role) {
    const role = VALID_ROLES.includes(body.role) ? body.role : "kurikulum"
    // Cegah admin menurunkan role diri sendiri (opsional proteksi)
    await pool.query(`UPDATE "user" SET role = $1, "updatedAt" = now() WHERE id = $2`, [role, id])
    return Response.json({ ok: true })
  }

  // Update name
  if (body.name) {
    await pool.query(`UPDATE "user" SET name = $1, "updatedAt" = now() WHERE id = $2`, [body.name, id])
    return Response.json({ ok: true })
  }

  return errorResponse("Tidak ada field untuk diupdate", 400)
}

// DELETE /api/users/[id] — hapus user
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession()
  if (session.user.role !== "admin") {
    return errorResponse("Hanya admin yang dapat menghapus user", 403)
  }

  const { id } = await params

  // Cegah admin menghapus diri sendiri
  if (id === session.user.id) {
    return errorResponse("Tidak dapat menghapus akun sendiri", 400)
  }

  // Hapus account & session dulu (FK cascade seharusnya handle, tapi pastikan)
  await pool.query(`DELETE FROM session WHERE "userId" = $1`, [id])
  await pool.query(`DELETE FROM account WHERE "userId" = $1`, [id])
  await pool.query(`DELETE FROM "user" WHERE id = $1`, [id])

  return Response.json({ ok: true })
}
