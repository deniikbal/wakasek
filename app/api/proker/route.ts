import { pool } from "@/lib/db"
import { requireSession, parseBody, errorResponse } from "@/lib/api-helpers"
import type { BidangWakasek } from "@/lib/constants"

const VALID_BIDANG: BidangWakasek[] = [
  "kurikulum",
  "kesiswaan",
  "sarpras",
  "humas",
]

// Mapping role wakasek → bidang
const ROLE_TO_BIDANG: Record<string, BidangWakasek> = {
  kurikulum: "kurikulum",
  kesiswaan: "kesiswaan",
  sarpras: "sarpras",
  humas: "humas",
}

// GET /api/proker — list proker
// Admin lihat semua. Role wakasek hanya lihat bidang sendiri.
export async function GET() {
  try {
    const session = await requireSession()
    const userRole = session.user.role || ""

    let query = `
      SELECT id, bidang, tahun_ajaran, nama_kegiatan, deskripsi,
             bulan_pelaksanaan, penanggung_jawab, anggaran,
             sumber_dana, dibuat_oleh, created_at, updated_at
      FROM proker
    `
    const params: unknown[] = []

    if (userRole !== "admin") {
      const bidang = ROLE_TO_BIDANG[userRole]
      if (bidang) {
        query += ` WHERE bidang = $1`
        params.push(bidang)
      }
    }

    query += ` ORDER BY created_at DESC`

    const res = await pool.query(query, params)
    return Response.json(res.rows)
  } catch (e) {
    if (e instanceof Response) return e
    return errorResponse("Gagal memuat data proker", 500)
  }
}

// POST /api/proker — create proker baru
// Admin bebas pilih bidang. Role wakasek dipaksa bidang = bidang sendiri.
export async function POST(request: Request) {
  try {
    const session = await requireSession()
    const userRole = session.user.role || ""

    const body = await parseBody<{
      bidang?: string
      tahun_ajaran?: string
      nama_kegiatan?: string
      deskripsi?: string
      bulan_pelaksanaan?: number[]
      penanggung_jawab?: string
      anggaran?: number
      sumber_dana?: string
    }>(request)

    // Tentukan bidang:
    // - admin: pakai bidang dari form
    // - role wakasek: paksa ke bidang sesuai role
    let bidang: string
    if (userRole === "admin") {
      if (!body.bidang || !VALID_BIDANG.includes(body.bidang as BidangWakasek)) {
        return errorResponse("Bidang tidak valid")
      }
      bidang = body.bidang
    } else {
      const mapped = ROLE_TO_BIDANG[userRole]
      if (!mapped) {
        return errorResponse("Role Anda tidak terkait bidang wakasek manapun", 403)
      }
      bidang = mapped
    }

    if (!body.tahun_ajaran?.trim()) {
      return errorResponse("Tahun ajaran wajib diisi")
    }
    if (!body.nama_kegiatan?.trim()) {
      return errorResponse("Nama kegiatan wajib diisi")
    }
    if (!body.penanggung_jawab?.trim()) {
      return errorResponse("Penanggung jawab wajib diisi")
    }
    if (
      !Array.isArray(body.bulan_pelaksanaan) ||
      body.bulan_pelaksanaan.length === 0
    ) {
      return errorResponse("Minimal 1 bulan pelaksanaan")
    }
    const bulan = body.bulan_pelaksanaan.filter(
      (b) => Number.isInteger(b) && b >= 1 && b <= 12
    )
    if (bulan.length === 0) {
      return errorResponse("Bulan pelaksanaan tidak valid")
    }
    const anggaran = Number(body.anggaran) || 0
    if (anggaran < 0) {
      return errorResponse("Anggaran tidak boleh negatif")
    }

    const res = await pool.query(
      `INSERT INTO proker
        (bidang, tahun_ajaran, nama_kegiatan, deskripsi, bulan_pelaksanaan,
         penanggung_jawab, anggaran, sumber_dana, dibuat_oleh)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        bidang,
        body.tahun_ajaran.trim(),
        body.nama_kegiatan.trim(),
        body.deskripsi?.trim() || null,
        bulan,
        body.penanggung_jawab.trim(),
        anggaran,
        body.sumber_dana?.trim() || null,
        session.user.id,
      ]
    )
    return Response.json(res.rows[0], { status: 201 })
  } catch (e) {
    if (e instanceof Response) return e
    console.error("POST /api/proker error:", e)
    return errorResponse("Gagal membuat proker", 500)
  }
}
