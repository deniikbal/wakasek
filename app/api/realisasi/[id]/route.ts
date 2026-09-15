import { pool } from "@/lib/db"
import { requireSession, parseBody, errorResponse } from "@/lib/api-helpers"
import type { StatusKegiatan } from "@/lib/constants"

const VALID_STATUS: StatusKegiatan[] = [
  "belum_dimulai",
  "terlaksana",
  "ditunda",
  "tidak_jadi",
]

const ROLE_TO_BIDANG: Record<string, string> = {
  kurikulum: "kurikulum",
  kesiswaan: "kesiswaan",
  sarpras: "sarpras",
  humas: "humas",
}

interface RouteParams {
  params: Promise<{ id: string }>
}

// Helper: cek akses user ke realisasi via bidang proker induknya
async function checkAkses(client: typeof pool, id: string, userRole: string) {
  const res = await client.query(
    `SELECT r.id, p.bidang FROM realisasi r
     JOIN proker p ON p.id = r.proker_id
     WHERE r.id = $1`,
    [id]
  )
  if (res.rows.length === 0) return { found: false as const }
  if (userRole === "admin") return { found: true as const, allowed: true as const }
  const allowed = ROLE_TO_BIDANG[userRole]
  return { found: true as const, allowed: res.rows[0].bidang === allowed }
}

// GET /api/realisasi/[id]
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    await requireSession()
    const { id } = await params
    const res = await pool.query(`SELECT * FROM realisasi WHERE id = $1`, [id])
    if (res.rows.length === 0)
      return errorResponse("Realisasi tidak ditemukan", 404)
    return Response.json(res.rows[0])
  } catch (e) {
    if (e instanceof Response) return e
    return errorResponse("Gagal memuat realisasi", 500)
  }
}

// PUT /api/realisasi/[id]
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await requireSession()
    const userRole = session.user.role || ""
    const { id } = await params
    const body = await parseBody<{
      bulan?: number
      tahun?: number
      status?: string
      catatan?: string
    }>(request)

    // Cek exists + akses bidang
    const akses = await checkAkses(pool, id, userRole)
    if (!akses.found)
      return errorResponse("Realisasi tidak ditemukan", 404)
    if (!akses.allowed)
      return errorResponse("Anda tidak memiliki akses ke realisasi bidang ini", 403)

    const exists = await pool.query(
      `SELECT id, proker_id FROM realisasi WHERE id = $1`,
      [id]
    )

    const prokerId = exists.rows[0].proker_id

    // Validasi
    if (body.bulan !== undefined) {
      const b = Number(body.bulan)
      if (!Number.isInteger(b) || b < 1 || b > 12) {
        return errorResponse("Bulan tidak valid (1-12)")
      }
    }
    if (body.tahun !== undefined) {
      const t = Number(body.tahun)
      if (!Number.isInteger(t) || t < 2000 || t > 2100) {
        return errorResponse("Tahun tidak valid")
      }
    }
    if (body.status && !VALID_STATUS.includes(body.status as StatusKegiatan)) {
      return errorResponse("Status tidak valid")
    }

    // Cek unique constraint jika ubah bulan/tahun
    const newBulan = body.bulan !== undefined ? Number(body.bulan) : null
    const newTahun = body.tahun !== undefined ? Number(body.tahun) : null
    if (newBulan || newTahun) {
      // Ambil nilai saat ini untuk yang tidak diubah
      const cur = await pool.query(
        `SELECT bulan, tahun FROM realisasi WHERE id = $1`,
        [id]
      )
      const finalBulan = newBulan ?? cur.rows[0].bulan
      const finalTahun = newTahun ?? cur.rows[0].tahun
      const dup = await pool.query(
        `SELECT id FROM realisasi WHERE proker_id = $1 AND bulan = $2 AND tahun = $3 AND id != $4`,
        [prokerId, finalBulan, finalTahun, id]
      )
      if (dup.rows.length > 0) {
        return errorResponse("Realisasi untuk bulan/tahun ini sudah ada", 409)
      }
    }

    const res = await pool.query(
      `UPDATE realisasi SET
        bulan = COALESCE($1, bulan),
        tahun = COALESCE($2, tahun),
        status = COALESCE($3, status),
        catatan = COALESCE($4, catatan)
       WHERE id = $5
       RETURNING *`,
      [
        newBulan,
        newTahun,
        body.status ?? null,
        body.catatan !== undefined ? (body.catatan.trim() || null) : null,
        id,
      ]
    )
    return Response.json(res.rows[0])
  } catch (e) {
    if (e instanceof Response) return e
    console.error("PUT /api/realisasi error:", e)
    return errorResponse("Gagal mengubah realisasi", 500)
  }
}

// DELETE /api/realisasi/[id]
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const session = await requireSession()
    const userRole = session.user.role || ""
    const { id } = await params

    // Cek akses bidang
    const akses = await checkAkses(pool, id, userRole)
    if (!akses.found)
      return errorResponse("Realisasi tidak ditemukan", 404)
    if (!akses.allowed)
      return errorResponse("Anda tidak memiliki akses ke realisasi bidang ini", 403)

    await pool.query(`DELETE FROM realisasi WHERE id = $1`, [id])
    return Response.json({ success: true })
  } catch (e) {
    if (e instanceof Response) return e
    console.error("DELETE /api/realisasi error:", e)
    return errorResponse("Gagal menghapus realisasi", 500)
  }
}
