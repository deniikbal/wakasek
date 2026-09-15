import { pool } from "@/lib/db"
import { requireSession, parseBody, errorResponse } from "@/lib/api-helpers"
import type { StatusKegiatan } from "@/lib/constants"

const VALID_STATUS: StatusKegiatan[] = [
  "belum_dimulai",
  "terlaksana",
  "ditunda",
  "tidak_jadi",
]

// GET /api/realisasi — list proker + realisasinya
// Admin lihat semua. Role wakasek hanya lihat bidang sendiri.
const ROLE_TO_BIDANG: Record<string, string> = {
  kurikulum: "kurikulum",
  kesiswaan: "kesiswaan",
  sarpras: "sarpras",
  humas: "humas",
}

export async function GET() {
  try {
    const session = await requireSession()
    const userRole = session.user.role || ""
    const bidang = userRole !== "admin" ? ROLE_TO_BIDANG[userRole] : null

    // Ambil proker (filter bidang untuk non-admin)
    const prokerRes = bidang
      ? await pool.query(`
          SELECT id, bidang, tahun_ajaran, nama_kegiatan, deskripsi,
                 bulan_pelaksanaan, penanggung_jawab, anggaran,
                 sumber_dana, dibuat_oleh, created_at, updated_at
          FROM proker WHERE bidang = $1
          ORDER BY created_at DESC
        `, [bidang])
      : await pool.query(`
          SELECT id, bidang, tahun_ajaran, nama_kegiatan, deskripsi,
                 bulan_pelaksanaan, penanggung_jawab, anggaran,
                 sumber_dana, dibuat_oleh, created_at, updated_at
          FROM proker
          ORDER BY created_at DESC
        `)

    if (prokerRes.rows.length === 0) return Response.json([])

    // Ambil semua realisasi
    const realisasiRes = await pool.query(`
      SELECT id, proker_id, bulan, tahun, status, catatan,
             dokumentasi, dilaporkan_oleh, updated_at
      FROM realisasi
      ORDER BY tahun DESC, bulan DESC
    `)

    // Gabungkan
    const realisasiMap: Record<string, typeof realisasiRes.rows> = {}
    for (const r of realisasiRes.rows) {
      const pid = r.proker_id
      if (!realisasiMap[pid]) realisasiMap[pid] = []
      realisasiMap[pid].push(r)
    }

    const result = prokerRes.rows.map((p) => ({
      ...p,
      realisasi: realisasiMap[p.id] || [],
    }))

    return Response.json(result)
  } catch (e) {
    if (e instanceof Response) return e
    console.error("GET /api/realisasi error:", e)
    return errorResponse("Gagal memuat data realisasi", 500)
  }
}

// POST /api/realisasi — create realisasi baru
export async function POST(request: Request) {
  try {
    const session = await requireSession()
    const body = await parseBody<{
      proker_id?: string
      bulan?: number
      tahun?: number
      status?: string
      catatan?: string
    }>(request)

    if (!body.proker_id) return errorResponse("Proker ID wajib diisi")
    const bulan = Number(body.bulan)
    const tahun = Number(body.tahun)
    if (!Number.isInteger(bulan) || bulan < 1 || bulan > 12) {
      return errorResponse("Bulan tidak valid (1-12)")
    }
    if (!Number.isInteger(tahun) || tahun < 2000 || tahun > 2100) {
      return errorResponse("Tahun tidak valid")
    }
    if (!body.status || !VALID_STATUS.includes(body.status as StatusKegiatan)) {
      return errorResponse("Status tidak valid")
    }

    // Cek proker exists + akses bidang (non-admin hanya bidang sendiri)
    const prokerCheck = await pool.query(
      `SELECT id, bidang FROM proker WHERE id = $1`,
      [body.proker_id]
    )
    if (prokerCheck.rows.length === 0) {
      return errorResponse("Proker tidak ditemukan", 404)
    }
    const userRoleR = session.user.role || ""
    if (userRoleR !== "admin") {
      const allowed = ROLE_TO_BIDANG[userRoleR]
      if (!allowed || prokerCheck.rows[0].bidang !== allowed) {
        return errorResponse("Anda tidak memiliki akses ke proker bidang ini", 403)
      }
    }

    // Cek unique (proker_id, bulan, tahun)
    const dupCheck = await pool.query(
      `SELECT id FROM realisasi WHERE proker_id = $1 AND bulan = $2 AND tahun = $3`,
      [body.proker_id, bulan, tahun]
    )
    if (dupCheck.rows.length > 0) {
      return errorResponse("Realisasi untuk bulan/tahun ini sudah ada. Edit yang ada.", 409)
    }

    const res = await pool.query(
      `INSERT INTO realisasi
        (proker_id, bulan, tahun, status, catatan, dilaporkan_oleh)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        body.proker_id,
        bulan,
        tahun,
        body.status,
        body.catatan?.trim() || null,
        session.user.id,
      ]
    )
    return Response.json(res.rows[0], { status: 201 })
  } catch (e) {
    if (e instanceof Response) return e
    console.error("POST /api/realisasi error:", e)
    return errorResponse("Gagal membuat realisasi", 500)
  }
}
