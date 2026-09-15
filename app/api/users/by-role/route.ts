import { pool } from "@/lib/db"
import { requireSession, errorResponse } from "@/lib/api-helpers"
import { VALID_ROLES } from "@/lib/roles"

// GET /api/users/by-role?role=kurikulum — list nama user per role
export async function GET(request: Request) {
  try {
    await requireSession()

    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")

    if (role && !VALID_ROLES.includes(role)) {
      return errorResponse("Role tidak valid", 400)
    }

    const query = role
      ? `SELECT id, name, email, role FROM "user" WHERE role = $1 ORDER BY name`
      : `SELECT id, name, email, role FROM "user" WHERE role IN ('kurikulum','kesiswaan','sarpras','humas') ORDER BY role, name`

    const res = await pool.query(query, role ? [role] : [])

    // Group by role
    const grouped: Record<string, { id: string; name: string; email: string }[]> = {}
    for (const row of res.rows) {
      if (!grouped[row.role]) grouped[row.role] = []
      grouped[row.role].push({ id: row.id, name: row.name, email: row.email })
    }

    return Response.json(grouped)
  } catch (e) {
    if (e instanceof Response) return e
    return errorResponse("Gagal memuat data user", 500)
  }
}
