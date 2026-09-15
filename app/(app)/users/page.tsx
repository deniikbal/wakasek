import { pool } from "@/lib/db"
import { ROLES } from "@/lib/roles"
import { UsersClient } from "@/components/users-client"

export const dynamic = "force-dynamic"

export default async function UsersPage() {
  const result = await pool.query(
    `SELECT id, name, email, role, "emailVerified", banned, "createdAt"
     FROM "user" ORDER BY "createdAt" DESC`
  )

  const stats: Record<string, number> = {}
  for (const r of ROLES) {
    stats[r.value] = result.rows.filter((u: { role: string }) => u.role === r.value).length
  }

  return <UsersClient users={result.rows} stats={stats} />
}
