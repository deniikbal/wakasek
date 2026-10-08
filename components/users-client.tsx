"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Card, CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectIcon,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { PasswordInput } from "@/components/password-input"
import { UsersIcon, ShieldCheckIcon, PlusIcon, Trash2Icon, PencilIcon, GraduationCapIcon, BookOpenIcon, WrenchIcon, MegaphoneIcon, KeyRoundIcon } from "lucide-react"
import { ROLES, roleLabel, roleBadgeClass } from "@/lib/roles"

// Icon per role (hanya untuk UI client)
const ROLE_ICONS: Record<string, typeof ShieldCheckIcon> = {
  admin: ShieldCheckIcon,
  kurikulum: BookOpenIcon,
  kesiswaan: GraduationCapIcon,
  sarpras: WrenchIcon,
  humas: MegaphoneIcon,
}

const ROLE_COLORS: Record<string, { color: string; bg: string }> = {
  admin: { color: "text-amber-600", bg: "bg-amber-50" },
  kurikulum: { color: "text-blue-600", bg: "bg-blue-50" },
  kesiswaan: { color: "text-green-600", bg: "bg-green-50" },
  sarpras: { color: "text-purple-600", bg: "bg-purple-50" },
  humas: { color: "text-pink-600", bg: "bg-pink-50" },
}

type UserRow = {
  id: string
  name: string
  email: string
  role: string
  emailVerified: boolean
  banned: boolean | null
  createdAt: string
}

type Stats = Record<string, number>

export function UsersClient({
  users: initial,
  stats,
}: {
  users: UserRow[]
  stats: Stats
}) {
  const router = useRouter()
  const [users, setUsers] = useState(initial)
  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<UserRow | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Form create
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "kurikulum" })

  // Form edit
  const [editForm, setEditForm] = useState({ name: "", role: "kurikulum", password: "" })
  const [saving, setSaving] = useState(false)

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || roleLabel(u.role).toLowerCase().includes(q)
  })

  async function handleCreate() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal")
      setCreateOpen(false)
      setForm({ name: "", email: "", password: "", role: "kurikulum" })
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuat user")
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateRole(userId: string, role: string) {
    const res = await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    })
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u))
      )
      setEditUser(null)
    }
  }

  async function handleDelete(userId: string) {
    if (!confirm("Yakin hapus user ini?")) return
    const res = await fetch(`/api/users/${userId}`, { method: "DELETE" })
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      router.refresh()
    }
  }

  function openEdit(u: UserRow) {
    setEditUser(u)
    setEditForm({ name: u.name, role: u.role, password: "" })
    setError("")
  }

  async function handleUpdatePassword(userId: string, password: string) {
    const res = await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Gagal mengubah password")
  }

  async function submitEdit() {
    if (!editUser) return
    setSaving(true)
    setError("")
    try {
      if (editForm.name !== editUser.name) {
        await fetch(`/api/users/${editUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: editForm.name }),
        })
        setUsers((prev) => prev.map((u) => (u.id === editUser.id ? { ...u, name: editForm.name } : u)))
      }
      if (editForm.role !== editUser.role) {
        await handleUpdateRole(editUser.id, editForm.role)
      }
      if (editForm.password) {
        await handleUpdatePassword(editUser.id, editForm.password)
      }
      setEditUser(null)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen User</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola akun pengguna dan role akses
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon className="size-4" />
          Tambah User
        </Button>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Tambah User Baru</DialogTitle>
              <DialogDescription>
                Buat akun baru untuk mengakses portal wakasek.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="cu-name">Nama</Label>
                <Input
                  id="cu-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nama lengkap"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cu-email">Email</Label>
                <Input
                  id="cu-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="nama@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cu-pass">Password</Label>
                <PasswordInput
                  id="cu-pass"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 6 karakter"
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cu-role">Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm({ ...form, role: v as string })}
                >
                  <SelectTrigger id="cu-role" className="h-9">
                    <SelectValue />
                    <SelectIcon />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" disabled={loading} onClick={() => setCreateOpen(false)}>Batal</Button>
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? <Spinner className="size-4" /> : null}
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {ROLES.map((r) => {
          const Icon = ROLE_ICONS[r.value] || UsersIcon
          const colors = ROLE_COLORS[r.value] || { color: "text-gray-600", bg: "bg-gray-50" }
          return (
            <Card key={r.value}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`grid size-10 place-items-center rounded-sm ${colors.bg}`}>
                  <Icon className={`size-5 ${colors.color}`} />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold leading-tight">{stats[r.value] ?? 0}</span>
                  <span className="text-xs text-muted-foreground">{r.label}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Cari nama, email, atau role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Nama</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Dibuat</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium ${roleBadgeClass(u.role)}`}>
                      {roleLabel(u.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.banned ? (
                      <Badge variant="destructive">Banned</Badge>
                    ) : u.emailVerified ? (
                      <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-50">
                        Aktif
                      </Badge>
                    ) : (
                      <Badge variant="outline">Belum verifikasi</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(u.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => openEdit(u)}
                      >
                        <PencilIcon className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(u.id)}
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Tidak ada user
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editUser} onOpenChange={(v) => !v && setEditUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Ubah nama atau role pengguna.
            </DialogDescription>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="eu-name">Nama</Label>
                <Input
                  id="eu-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eu-role">Role</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(v) => setEditForm({ ...editForm, role: v as string })}
                >
                  <SelectTrigger id="eu-role" className="h-9">
                    <SelectValue />
                    <SelectIcon />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="eu-pass">
                  Password Baru
                  <span className="ml-1 font-normal text-muted-foreground">(kosongkan jika tidak diubah)</span>
                </Label>
                <PasswordInput
                  id="eu-pass"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Min. 6 karakter"
                  minLength={6}
                  icon={<KeyRoundIcon className="size-3.5" />}
                />
                <p className="text-xs text-muted-foreground">
                  Mengubah password akan mengeluarkan user tersebut dari semua sesi aktifnya.
                </p>
              </div>
              <div className="rounded-sm bg-muted/50 p-3 text-xs text-muted-foreground">
                Email: <span className="font-medium text-foreground">{editUser.email}</span>
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" disabled={saving} onClick={() => setEditUser(null)}>Batal</Button>
            <Button onClick={submitEdit} disabled={saving}>
              {saving ? <Spinner className="size-4" /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
