"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectIcon,
} from "@/components/ui/select"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  BULAN_SINGKAT,
  BULAN_LENGKAP,
  STATUS_OPTIONS,
  statusLabel,
  statusVariant,
  bidangLabel,
  formatBulan,
  type Proker,
  type Realisasi,
  type StatusKegiatan,
} from "@/lib/constants"
import {
  PlusIcon,
  PencilIcon,
  SearchIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "lucide-react"
import { cn } from "cn"

interface ProkerWithRealisasi extends Proker {
  realisasi: Realisasi[]
}

export function RealisasiClient() {
  const [data, setData] = useState<ProkerWithRealisasi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter
  const [search, setSearch] = useState("")

  // Dialog create/edit realisasi
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editRealisasiId, setEditRealisasiId] = useState<string | null>(null)
  const [selectedProker, setSelectedProker] = useState<ProkerWithRealisasi | null>(null)
  const [form, setForm] = useState({
    bulan: String(new Date().getMonth() + 1),
    tahun: String(new Date().getFullYear()),
    status: "belum_dimulai" as StatusKegiatan,
    catatan: "",
  })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Expanded rows
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/realisasi")
      if (!res.ok) throw new Error("Gagal memuat data")
      const d = await res.json()
      setData(d)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filtered = data.filter((p) => {
    return (
      p.nama_kegiatan.toLowerCase().includes(search.toLowerCase()) ||
      p.penanggung_jawab.toLowerCase().includes(search.toLowerCase()) ||
      p.tahun_ajaran.includes(search)
    )
  })

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function openCreateRealisasi(p: ProkerWithRealisasi) {
    setSelectedProker(p)
    setEditRealisasiId(null)
    setForm({
      bulan: String(new Date().getMonth() + 1),
      tahun: String(new Date().getFullYear()),
      status: "belum_dimulai",
      catatan: "",
    })
    setFormError(null)
    setDialogOpen(true)
  }

  function openEditRealisasi(p: ProkerWithRealisasi, r: Realisasi) {
    setSelectedProker(p)
    setEditRealisasiId(r.id)
    setForm({
      bulan: String(r.bulan),
      tahun: String(r.tahun),
      status: r.status,
      catatan: r.catatan || "",
    })
    setFormError(null)
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (!selectedProker) return

    setSaving(true)
    try {
      const payload = {
        proker_id: selectedProker.id,
        bulan: Number(form.bulan),
        tahun: Number(form.tahun),
        status: form.status,
        catatan: form.catatan,
      }
      const url = editRealisasiId
        ? `/api/realisasi/${editRealisasiId}`
        : "/api/realisasi"
      const method = editRealisasiId ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => null)
        throw new Error(d?.error || "Gagal menyimpan")
      }
      setDialogOpen(false)
      await fetchData()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <SearchIcon className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari kegiatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7 sm:w-64"
          />
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircleIcon className="size-4 shrink-0" /> {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="size-6" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <CheckCircle2Icon className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {search ? "Tidak ada proker yang cocok." : "Belum ada program kerja."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Kegiatan</TableHead>
                <TableHead className="hidden md:table-cell">Bidang</TableHead>
                <TableHead className="hidden sm:table-cell">Tahun</TableHead>
                <TableHead className="hidden lg:table-cell">Bulan Proker</TableHead>
                <TableHead className="text-center">Realisasi</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const isExpanded = expanded.has(p.id)
                const terlaksana = p.realisasi.filter((r) => r.status === "terlaksana").length
                return (
                  <>
                    <TableRow key={p.id}>
                      <TableCell className="w-8">
                        <button
                          onClick={() => toggleExpand(p.id)}
                          className="rounded p-1 hover:bg-muted"
                        >
                          {isExpanded ? (
                            <ChevronDownIcon className="size-3.5" />
                          ) : (
                            <ChevronRightIcon className="size-3.5" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="font-medium">{p.nama_kegiatan}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{bidangLabel(p.bidang)}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {p.tahun_ajaran}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {formatBulan(p.bulan_pelaksanaan)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={terlaksana > 0 ? "success" : "secondary"}>
                          {p.realisasi.length} laporan
                        </Badge>
                        {terlaksana > 0 && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({terlaksana} terlaksana)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openCreateRealisasi(p)}
                        >
                          <PlusIcon /> Tambah
                        </Button>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={7} className="p-4">
                          {p.realisasi.length === 0 ? (
                            <p className="py-2 text-center text-xs text-muted-foreground">
                              Belum ada laporan realisasi untuk kegiatan ini.
                            </p>
                          ) : (
                            <div className="space-y-1.5">
                              {p.realisasi
                                .sort((a, b) => b.tahun - a.tahun || b.bulan - a.bulan)
                                .map((r) => (
                                  <div
                                    key={r.id}
                                    className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2"
                                  >
                                    <div className="flex items-center gap-3">
                                      <Badge variant={statusVariant(r.status)}>
                                        {statusLabel(r.status)}
                                      </Badge>
                                      <span className="text-sm font-medium">
                                        {BULAN_LENGKAP[r.bulan - 1]} {r.tahun}
                                      </span>
                                      {r.catatan && (
                                        <span className="hidden text-xs text-muted-foreground sm:block">
                                          {r.catatan}
                                        </span>
                                      )}
                                    </div>
                                    <Button
                                      size="icon-sm"
                                      variant="ghost"
                                      onClick={() => openEditRealisasi(p, r)}
                                    >
                                      <PencilIcon />
                                    </Button>
                                  </div>
                                ))}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create / Edit realisasi dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editRealisasiId ? "Edit Realisasi" : "Tambah Realisasi"}
            </DialogTitle>
            <DialogDescription>
              {selectedProker && (
                <>
                  Kegiatan: <span className="font-medium">{selectedProker.nama_kegiatan}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="r-bulan">Bulan *</Label>
                <Select
                  value={form.bulan}
                  onValueChange={(v) => setForm({ ...form, bulan: String(v) })}
                >
                  <SelectTrigger id="r-bulan">
                    <SelectValue />
                    <SelectIcon />
                  </SelectTrigger>
                  <SelectContent>
                    {BULAN_SINGKAT.map((b, i) => (
                      <SelectItem key={i} value={String(i + 1)}>
                        {BULAN_LENGKAP[i]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="r-tahun">Tahun *</Label>
                <Input
                  id="r-tahun"
                  type="number"
                  min={2000}
                  max={2100}
                  value={form.tahun}
                  onChange={(e) => setForm({ ...form, tahun: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="r-status">Status *</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as StatusKegiatan })}
              >
                <SelectTrigger id="r-status">
                  <SelectValue />
                  <SelectIcon />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="r-catatan">Catatan</Label>
              <Textarea
                id="r-catatan"
                value={form.catatan}
                onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                rows={3}
                placeholder="Detail pelaksanaan, kendala, dll..."
              />
            </div>

            {formError && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircleIcon className="size-4 shrink-0" /> {formError}
              </div>
            )}

            <DialogFooter>
              <DialogClose render={<Button variant="outline" type="button">Batal</Button>} />
              <Button type="submit" disabled={saving}>
                {saving ? <Spinner /> : null}
                {saving ? "Menyimpan..." : editRealisasiId ? "Simpan" : "Tambah Realisasi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
