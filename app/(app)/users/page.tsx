import { pool } from "@/lib/db"
import { UsersClient } from "@/components/users-client"

export const dynamic = "force-dynamic"

export default async function UsersPage() {
  const result = await pool.query(
    `SELECT id, name, email, role, "emailVerified", banned, "createdAt"
     FROM "user" ORDER BY "createdAt" DESC`
  )

  const stats = {
    total: result.rows.length,
    admin: result.rows.filter((u: { role: string }) => u.role === "admin").length,
    user: result.rows.filter((u: { role: string }) => u.role === "user").length,
  }

  return <UsersClient users={result.rows} stats={stats} />
}
