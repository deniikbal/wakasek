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
  BIDANG_OPTIONS,
  BULAN_SINGKAT,
  bidangLabel,
  formatRupiah,
  formatBulan,
  type Proker,
  type BidangWakasek,
} from "@/lib/constants"
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  AlertCircleIcon,
  ClipboardListIcon,
} from "lucide-react"

interface ProkerFormState {
  bidang: BidangWakasek
  tahun_ajaran: string
  nama_kegiatan: string
  deskripsi: string
  bulan_pelaksanaan: number[]
  penanggung_jawab: string
  anggaran: string
  sumber_dana: string
}

type PJOption = { id: string; name: string; email: string }

export function ProkerClient({
  userRole,
  bidangUser,
  isAdmin,
}: {
  userRole: string
  bidangUser: string | null
  isAdmin: boolean
}) {
  const [proker, setProker] = useState<Proker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter
  const [search, setSearch] = useState("")
  const [filterBidang, setFilterBidang] = useState<string>(
    isAdmin ? "all" : (bidangUser || "all")
  )

  // Dialog create/edit
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<ProkerFormState>(getDefaultForm(bidangUser))
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // PJ options (dari user dengan role sama)
  const [pjOptions, setPjOptions] = useState<PJOption[]>([])

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  function getDefaultForm(bidang: string | null): ProkerFormState {
    return {
      bidang: (bidang as BidangWakasek) || "kurikulum",
      tahun_ajaran: new Date().getFullYear() + "/" + (new Date().getFullYear() + 1),
      nama_kegiatan: "",
      deskripsi: "",
      bulan_pelaksanaan: [],
      penanggung_jawab: "",
      anggaran: "0",
      sumber_dana: "",
    }
  }

  // Fetch PJ options — user dengan role yang sama
  const fetchPJ = useCallback(async () => {
    const targetRole = isAdmin ? null : userRole
    const url = targetRole
      ? `/api/users/by-role?role=${targetRole}`
      : `/api/users/by-role`
    try {
      const res = await fetch(url)
      if (!res.ok) return
      const data = await res.json() as Record<string, PJOption[]>
      // Flat atau filter
      if (isAdmin) {
        // Admin: semua wakasek role
        const all: PJOption[] = []
        for (const [role, users] of Object.entries(data)) {
          if (["kurikulum", "kesiswaan", "sarpras", "humas"].includes(role)) {
            all.push(...users)
          }
        }
        setPjOptions(all)
      } else {
        // Non-admin: hanya role sendiri
        setPjOptions(data[userRole] || [])
      }
    } catch {
      // silent
    }
  }, [isAdmin, userRole])

  const fetchProker = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/proker")
      if (!res.ok) throw new Error("Gagal memuat data")
      const data = await res.json()
      setProker(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProker()
    fetchPJ()
  }, [fetchProker, fetchPJ])

  // Auto-filter bidang untuk non-admin
  const filtered = proker.filter((p) => {
    const matchSearch =
      p.nama_kegiatan.toLowerCase().includes(search.toLowerCase()) ||
      p.penanggung_jawab.toLowerCase().includes(search.toLowerCase()) ||
      p.tahun_ajaran.includes(search)
    const matchBidang = isAdmin
      ? (filterBidang === "all" || p.bidang === filterBidang)
      : true // API sudah filter, tampil semua
    return matchSearch && matchBidang
  })

  function openCreate() {
    setForm(getDefaultForm(bidangUser))
    setEditId(null)
    setFormError(null)
    setDialogOpen(true)
  }

  function openEdit(p: Proker) {
    setForm({
      bidang: p.bidang,
      tahun_ajaran: p.tahun_ajaran,
      nama_kegiatan: p.nama_kegiatan,
      deskripsi: p.deskripsi || "",
      bulan_pelaksanaan: p.bulan_pelaksanaan || [],
      penanggung_jawab: p.penanggung_jawab,
      anggaran: String(p.anggaran),
      sumber_dana: p.sumber_dana || "",
    })
    setEditId(p.id)
    setFormError(null)
    setDialogOpen(true)
  }

  function toggleBulan(bulan: number) {
    setForm((f) => {
      const has = f.bulan_pelaksanaan.includes(bulan)
      return {
        ...f,
        bulan_pelaksanaan: has
          ? f.bulan_pelaksanaan.filter((b) => b !== bulan)
          : [...f.bulan_pelaksanaan, bulan],
      }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (form.bulan_pelaksanaan.length === 0) {
      setFormError("Pilih minimal 1 bulan pelaksanaan")
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        anggaran: Number(form.anggaran) || 0,
      }
      const url = editId ? `/api/proker/${editId}` : "/api/proker"
      const method = editId ? "PUT" : "POST"
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
      await fetchProker()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/proker/${deleteId}`, { method: "DELETE" })
      if (!res.ok) {
        const d = await res.json().catch(() => null)
        throw new Error(d?.error || "Gagal menghapus")
      }
      setDeleteId(null)
      await fetchProker()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setDeleting(false)
    }
  }

  // Bidang yang tersedia di form:
  // - Admin: semua bidang
  // - Non-admin: hanya bidang sendiri (locked)
  const formBidangOptions = isAdmin
    ? BIDANG_OPTIONS
    : BIDANG_OPTIONS.filter((b) => b.value === bidangUser)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <SearchIcon className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari kegiatan, PJ, tahun..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 sm:w-64"
            />
          </div>
          {/* Filter bidang hanya untuk admin */}
          {isAdmin && (
            <Select
              value={filterBidang}
              onValueChange={(v) => setFilterBidang(v as string)}
            >
              <SelectTrigger className="sm:w-40" size="sm">
                <SelectValue />
                <SelectIcon />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Bidang</SelectItem>
                {BIDANG_OPTIONS.map((b) => (
                  <SelectItem key={b.value} value={b.value}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {!isAdmin && bidangUser && (
            <Badge variant="secondary" className="h-8">
              {bidangLabel(bidangUser as BidangWakasek)}
            </Badge>
          )}
        </div>
        <Button onClick={openCreate}>
          <PlusIcon /> Tambah Proker
        </Button>
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
            <ClipboardListIcon className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {search
                ? "Tidak ada proker yang cocok dengan filter."
                : "Belum ada program kerja. Klik \"Tambah Proker\" untuk memulai."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kegiatan</TableHead>
                {isAdmin && <TableHead className="hidden md:table-cell">Bidang</TableHead>}
                <TableHead className="hidden sm:table-cell">Tahun</TableHead>
                <TableHead className="hidden lg:table-cell">Bulan</TableHead>
                <TableHead className="hidden lg:table-cell">PJ</TableHead>
                <TableHead className="hidden xl:table-cell">Anggaran</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nama_kegiatan}</TableCell>
                  {isAdmin && (
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">{bidangLabel(p.bidang)}</Badge>
                    </TableCell>
                  )}
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {p.tahun_ajaran}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {formatBulan(p.bulan_pelaksanaan)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {p.penanggung_jawab}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-muted-foreground">
                    {formatRupiah(p.anggaran)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(p)}
                        aria-label="Edit"
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setDeleteId(p.id)
                          setFormError(null)
                        }}
                        aria-label="Hapus"
                      >
                        <TrashIcon />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90svh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Program Kerja" : "Tambah Program Kerja"}</DialogTitle>
            <DialogDescription>
              {editId ? "Ubah data proker dan simpan." : "Isi detail program kerja baru."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nama">Nama Kegiatan *</Label>
              <Input
                id="nama"
                value={form.nama_kegiatan}
                onChange={(e) => setForm({ ...form, nama_kegiatan: e.target.value })}
                required
                placeholder="Contoh: Pelatihan Kurikulum Merdeka"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="bidang">Bidang *</Label>
                {isAdmin ? (
                  <Select
                    value={form.bidang}
                    onValueChange={(v) => {
                      const newBidang = v as BidangWakasek
                      setForm({ ...form, bidang: newBidang, penanggung_jawab: "" })
                      // Refresh PJ list for new bidang
                      fetchPJForBidang(newBidang).then(setPjOptions)
                    }}
                  >
                    <SelectTrigger id="bidang">
                      <SelectValue />
                      <SelectIcon />
                    </SelectTrigger>
                    <SelectContent>
                      {formBidangOptions.map((b) => (
                        <SelectItem key={b.value} value={b.value}>
                          {b.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={bidangLabel(form.bidang)}
                    disabled
                    className="bg-muted/50"
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tahun">Tahun Ajaran *</Label>
                <Input
                  id="tahun"
                  value={form.tahun_ajaran}
                  onChange={(e) => setForm({ ...form, tahun_ajaran: e.target.value })}
                  required
                  placeholder="2025/2026"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Bulan Pelaksanaan *</Label>
              <div className="flex flex-wrap gap-1.5">
                {BULAN_SINGKAT.map((b, i) => {
                  const bulan = i + 1
                  const selected = form.bulan_pelaksanaan.includes(bulan)
                  return (
                    <button
                      key={bulan}
                      type="button"
                      onClick={() => toggleBulan(bulan)}
                      className={
                        "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors " +
                        (selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-muted")
                      }
                    >
                      {b}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pj">Penanggung Jawab *</Label>
              {pjOptions.length > 0 ? (
                <Select
                  value={form.penanggung_jawab}
                  onValueChange={(v) => setForm({ ...form, penanggung_jawab: v as string })}
                >
                  <SelectTrigger id="pj">
                    <SelectValue placeholder="Pilih penanggung jawab" />
                    <SelectIcon />
                  </SelectTrigger>
                  <SelectContent>
                    {pjOptions.map((pj) => (
                      <SelectItem key={pj.id} value={pj.name}>
                        {pj.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="pj"
                  value={form.penanggung_jawab}
                  onChange={(e) => setForm({ ...form, penanggung_jawab: e.target.value })}
                  required
                  placeholder="Nama lengkap"
                />
              )}
              {pjOptions.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Belum ada user dengan role ini. Isi nama manual.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="anggaran">Anggaran (Rp)</Label>
                <Input
                  id="anggaran"
                  type="number"
                  min={0}
                  value={form.anggaran}
                  onChange={(e) => setForm({ ...form, anggaran: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sumber">Sumber Dana</Label>
                <Input
                  id="sumber"
                  value={form.sumber_dana}
                  onChange={(e) => setForm({ ...form, sumber_dana: e.target.value })}
                  placeholder="BOS / Komite / dll"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="deskripsi">Deskripsi</Label>
              <Textarea
                id="deskripsi"
                value={form.deskripsi}
                onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                rows={3}
                placeholder="Detail singkat kegiatan..."
              />
            </div>

            {formError && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircleIcon className="size-4 shrink-0" /> {formError}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Spinner /> : null}
                {saving ? "Menyimpan..." : editId ? "Simpan Perubahan" : "Tambah Proker"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteId}
        onOpenChange={(v) => { if (!v) setDeleteId(null) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Program Kerja?</DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan. Semua data realisasi terkait juga akan dihapus.
            </DialogDescription>
          </DialogHeader>
          {formError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircleIcon className="size-4 shrink-0" /> {formError}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Spinner /> : <TrashIcon />}
              {deleting ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper: fetch PJ for specific bidang (admin changing bidang in form)
async function fetchPJForBidang(bidang: BidangWakasek): Promise<PJOption[]> {
  const roleMap: Record<BidangWakasek, string> = {
    kurikulum: "kurikulum",
    kesiswaan: "kesiswaan",
    sarpras: "sarpras",
    humas: "humas",
  }
  const role = roleMap[bidang]
  try {
    const res = await fetch(`/api/users/by-role?role=${role}`)
    if (!res.ok) return []
    const data = await res.json() as Record<string, PJOption[]>
    return data[role] || []
  } catch {
    return []
  }
}
