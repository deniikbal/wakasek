import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">Dashboard Wakasek</h1>
      <p className="text-sm text-muted-foreground">
        Selamat datang, {session.user.name || session.user.email}
      </p>
      <p className="text-xs text-muted-foreground">
        Role: {session.user.role || "user"}
      </p>
    </main>
  )
}
