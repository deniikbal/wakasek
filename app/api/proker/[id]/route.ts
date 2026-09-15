import { pool } from "@/lib/db"
import { requireSession, parseBody, errorResponse } from "@/lib/api-helpers"
import type { BidangWakasek } from "@/lib/constants"

const VALID_BIDANG: BidangWakasek[] = [
  "kurikulum",
  "kesiswaan",
  "sarpras",
  "humas",
]

const ROLE_TO_BIDANG: Record<string, BidangWakasek> = {
  kurikulum: "kurikulum",
  kesiswaan: "kesiswaan",
  sarpras: "sarpras",
  humas: "humas",
}

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/proker/[id]
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    await requireSession()
    const { id } = await params
    const res = await pool.query(`SELECT * FROM proker WHERE id = $1`, [id])
    if (res.rows.length === 0) return errorResponse("Proker tidak ditemukan", 404)
    return Response.json(res.rows[0])
  } catch (e) {
    if (e instanceof Response) return e
    return errorResponse("Gagal memuat proker", 500)
  }
}

// PUT /api/proker/[id]
// Non-admin hanya bisa edit proker bidang sendiri & tidak bisa ganti bidang.
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await requireSession()
    const userRole = session.user.role || ""
    const { id } = await params
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

    // Cek exists
    const existing = await pool.query(`SELECT id, bidang FROM proker WHERE id = $1`, [id])
    if (existing.rows.length === 0)
      return errorResponse("Proker tidak ditemukan", 404)

    // Cek akses: non-admin hanya bisa edit bidang sendiri
    const prokerBidang = existing.rows[0].bidang as string
    if (userRole !== "admin") {
      const allowedBidang = ROLE_TO_BIDANG[userRole]
      if (!allowedBidang || prokerBidang !== allowedBidang) {
        return errorResponse("Anda tidak memiliki akses ke proker bidang ini", 403)
      }
      // Non-admin tidak boleh ganti bidang
      if (body.bidang && body.bidang !== allowedBidang) {
        return errorResponse("Anda tidak dapat mengubah bidang proker", 403)
      }
      // Paksa bidang tetap
      body.bidang = allowedBidang
    } else {
      // Admin bebas, tapi validasi
      if (body.bidang && !VALID_BIDANG.includes(body.bidang as BidangWakasek)) {
        return errorResponse("Bidang tidak valid")
      }
    }

    if (body.bulan_pelaksanaan !== undefined) {
      if (
        !Array.isArray(body.bulan_pelaksanaan) ||
        body.bulan_pelaksanaan.length === 0
      ) {
        return errorResponse("Minimal 1 bulan pelaksanaan")
      }
    }
    const anggaran = body.anggaran !== undefined ? Number(body.anggaran) || 0 : undefined
    if (anggaran !== undefined && anggaran < 0) {
      return errorResponse("Anggaran tidak boleh negatif")
    }

    const res = await pool.query(
      `UPDATE proker SET
        bidang = COALESCE($1, bidang),
        tahun_ajaran = COALESCE($2, tahun_ajaran),
        nama_kegiatan = COALESCE($3, nama_kegiatan),
        deskripsi = COALESCE($4, deskripsi),
        bulan_pelaksanaan = COALESCE($5, bulan_pelaksanaan),
        penanggung_jawab = COALESCE($6, penanggung_jawab),
        anggaran = COALESCE($7, anggaran),
        sumber_dana = COALESCE($8, sumber_dana)
       WHERE id = $9
       RETURNING *`,
      [
        body.bidang ?? null,
        body.tahun_ajaran?.trim() ?? null,
        body.nama_kegiatan?.trim() ?? null,
        body.deskripsi?.trim() ?? null,
        body.bulan_pelaksanaan ?? null,
        body.penanggung_jawab?.trim() ?? null,
        anggaran ?? null,
        body.sumber_dana?.trim() ?? null,
        id,
      ]
    )
    return Response.json(res.rows[0])
  } catch (e) {
    if (e instanceof Response) return e
    console.error("PUT /api/proker error:", e)
    return errorResponse("Gagal mengubah proker", 500)
  }
}

// DELETE /api/proker/[id]
// Non-admin hanya bisa hapus proker bidang sendiri.
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const session = await requireSession()
    const userRole = session.user.role || ""
    const { id } = await params

    // Cek exists & akses
    const existing = await pool.query(`SELECT id, bidang FROM proker WHERE id = $1`, [id])
    if (existing.rows.length === 0)
      return errorResponse("Proker tidak ditemukan", 404)

    if (userRole !== "admin") {
      const allowedBidang = ROLE_TO_BIDANG[userRole]
      const prokerBidang = existing.rows[0].bidang as string
      if (!allowedBidang || prokerBidang !== allowedBidang) {
        return errorResponse("Anda tidak memiliki akses ke proker bidang ini", 403)
      }
    }

    await pool.query(`DELETE FROM proker WHERE id = $1`, [id])
    return Response.json({ success: true })
  } catch (e) {
    if (e instanceof Response) return e
    console.error("DELETE /api/proker error:", e)
    return errorResponse("Gagal menghapus proker", 500)
  }
}
