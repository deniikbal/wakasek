// ============================================================
// Konstanta & tipe bersama untuk aplikasi wakasek
// ============================================================

export type BidangWakasek = "kurikulum" | "kesiswaan" | "sarpras" | "humas"

export type StatusKegiatan =
  | "belum_dimulai"
  | "terlaksana"
  | "ditunda"
  | "tidak_jadi"

export interface Proker {
  id: string
  bidang: BidangWakasek
  tahun_ajaran: string
  nama_kegiatan: string
  deskripsi: string | null
  bulan_pelaksanaan: number[]
  penanggung_jawab: string
  anggaran: number
  sumber_dana: string | null
  dibuat_oleh: string | null
  created_at: string
  updated_at: string
}

export interface Realisasi {
  id: string
  proker_id: string
  bulan: number
  tahun: number
  status: StatusKegiatan
  catatan: string | null
  dokumentasi: string[]
  dilaporkan_oleh: string | null
  updated_at: string
}

// Label & warna untuk masing-masing bidang
export const BIDANG_OPTIONS: {
  value: BidangWakasek
  label: string
  short: string
  color: string
}[] = [
  { value: "kurikulum", label: "Kurikulum", short: "Kur", color: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  { value: "kesiswaan", label: "Kesiswaan", short: "Ksw", color: "bg-purple-500/10 text-purple-700 dark:text-purple-300" },
  { value: "sarpras", label: "Sarana & Prasarana", short: "Spr", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  { value: "humas", label: "Humas", short: "Hms", color: "bg-orange-500/10 text-orange-700 dark:text-orange-300" },
]

export const STATUS_OPTIONS: {
  value: StatusKegiatan
  label: string
  variant: "secondary" | "success" | "warning" | "destructive"
}[] = [
  { value: "belum_dimulai", label: "Belum Dimulai", variant: "secondary" },
  { value: "terlaksana", label: "Terlaksana", variant: "success" },
  { value: "ditunda", label: "Ditunda", variant: "warning" },
  { value: "tidak_jadi", label: "Tidak Jadi", variant: "destructive" },
]

export const BULAN_SINGKAT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
]

export const BULAN_LENGKAP = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
]

export function bidangLabel(v: string): string {
  return BIDANG_OPTIONS.find((b) => b.value === v)?.label ?? v
}

export function bidangColor(v: string): string {
  return BIDANG_OPTIONS.find((b) => b.value === v)?.color ?? ""
}

export function statusLabel(v: string): string {
  return STATUS_OPTIONS.find((s) => s.value === v)?.label ?? v
}

export function statusVariant(v: string): "secondary" | "success" | "warning" | "destructive" {
  return (
    STATUS_OPTIONS.find((s) => s.value === v)?.variant ?? "secondary"
  )
}

export function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatBulan(bulan: number[]): string {
  if (!bulan || bulan.length === 0) return "-"
  const sorted = [...bulan].sort((a, b) => a - b)
  if (sorted.length === 1) return BULAN_SINGKAT[sorted[0] - 1]
  return `${BULAN_SINGKAT[sorted[0] - 1]} - ${BULAN_SINGKAT[sorted[sorted.length - 1] - 1]}`
}
