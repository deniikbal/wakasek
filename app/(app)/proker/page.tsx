import { ProkerClient } from "@/components/proker-client"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { BIDANG_OPTIONS } from "@/lib/constants"

export const dynamic = "force-dynamic"

export default function ProkerPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Program Kerja</h1>
        <p className="text-sm text-muted-foreground">
          Kelola program kerja seluruh bidang wakasek.
        </p>
      </div>

      {/* Tabs per bidang — semua user bisa lihat semua bidang */}
      <Tabs defaultValue="all">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all">Semua</TabsTrigger>
          {BIDANG_OPTIONS.map((b) => (
            <TabsTrigger key={b.value} value={b.value}>
              {b.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <ProkerClient />
    </div>
  )
}
