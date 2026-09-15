import { RealisasiClient } from "@/components/realisasi-client"

export const dynamic = "force-dynamic"

export default function RealisasiPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Realisasi</h1>
        <p className="text-sm text-muted-foreground">
          Laporan & realisasi kegiatan per bulan untuk seluruh bidang.
        </p>
      </div>
      <RealisasiClient />
    </div>
  )
}
