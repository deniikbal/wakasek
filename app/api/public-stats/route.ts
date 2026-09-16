import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

// GET /api/public-stats — statistik ringan untuk landing & login (tanpa auth)
export async function GET() {
  try {
    const [proker, bidang, terlaksana] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int as total FROM proker`),
      pool.query(`SELECT COUNT(DISTINCT bidang)::int as total FROM proker`),
      pool.query(`SELECT COUNT(*)::int as total FROM realisasi WHERE status = 'terlaksana'`),
    ])

    return NextResponse.json({
      proker: proker.rows[0].total,
      bidang: bidang.rows[0].total || 4,
      terlaksana: terlaksana.rows[0].total,
    })
  } catch {
    return NextResponse.json({ proker: 0, bidang: 4, terlaksana: 0 })
  }
}