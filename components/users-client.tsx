"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogTrigger, DialogClose,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { UsersIcon, ShieldCheckIcon, UserIcon, PlusIcon, Trash2Icon, PencilIcon } from "lucide-react"

type UserRow = {
  id: string
  name: string
  email: string
  role: string
  emailVerified: boolean
  banned: boolean | null
  createdAt: string
}

type Stats = { total: number; admin: number; user: number }

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
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" })

  // Form edit
  const [editForm, setEditForm] = useState({ name: "", role: "user" })

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
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
      setForm({ name: "", email: "", password: "", role: "user" })
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

  async function handleUpdateName(userId: string, name: string) {
    const res = await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, name } : u))
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
    setEditForm({ name: u.name, role: u.role })
  }

  const statCards = [
    { label: "Total User", value: stats.total, icon: UsersIcon, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Admin", value: stats.admin, icon: ShieldCheckIcon, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "User", value: stats.user, icon: UserIcon, color: "text-green-600", bg: "bg-green-50" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen User</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola akun pengguna dan role akses
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger
            render={() => (
              <Button>
                <PlusIcon className="size-4" />
                Tambah User
              </Button>
            )}
          />
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
                <Input
                  id="cu-pass"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 6 karakter"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cu-role">Role</Label>
                <select
                  id="cu-role"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
            <DialogFooter>
              <DialogClose render={() => <Button variant="outline" disabled={loading}>Batal</Button>} />
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? <Spinner className="size-4" /> : null}
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`grid size-10 place-items-center rounded-lg ${s.bg}`}>
                  <Icon className={`size-5 ${s.color}`} />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold leading-tight">{s.value}</span>
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Cari nama atau email…"
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
                    {u.role === "admin" ? (
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary">User</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.banned ? (
                      <Badge variant="destructive">Banned</Badge>
                    ) : u.emailVerified ? (
                      <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-50">
                        Aktif
                      </Badge>
                    ) : (
                      <Badge variant="outline">Beluk verifikasi</Badge>
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
                <select
                  id="eu-role"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                Email: <span className="font-medium text-foreground">{editUser.email}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose render={() => <Button variant="outline">Batal</Button>} />
            <Button
              onClick={() => {
                if (!editUser) return
                if (editForm.name !== editUser.name) {
                  handleUpdateName(editUser.id, editForm.name)
                }
                if (editForm.role !== editUser.role) {
                  handleUpdateRole(editUser.id, editForm.role)
                }
              }}
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
