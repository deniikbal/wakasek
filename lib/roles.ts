// ============================================================
// Konstanta role — dipakai di server & client
// ============================================================

export const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "kurikulum", label: "Kurikulum" },
  { value: "kesiswaan", label: "Kesiswaan" },
  { value: "sarpras", label: "Sarpras" },
  { value: "humas", label: "Humas" },
] as const

export type RoleValue = (typeof ROLES)[number]["value"]

export const VALID_ROLES: string[] = ROLES.map((r) => r.value)

export function roleLabel(role: string): string {
  return ROLES.find((r) => r.value === role)?.label || role
}

// Badge class per role (untuk client component)
export const ROLE_BADGE: Record<string, string> = {
  admin: "bg-amber-100 text-amber-700",
  kurikulum: "bg-blue-100 text-blue-700",
  kesiswaan: "bg-green-100 text-green-700",
  sarpras: "bg-purple-100 text-purple-700",
  humas: "bg-pink-100 text-pink-700",
}

export function roleBadgeClass(role: string): string {
  return ROLE_BADGE[role] || "bg-gray-100 text-gray-700"
}
