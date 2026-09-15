import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { ProkerClient } from "@/components/proker-client"
import { BIDANG_OPTIONS } from "@/lib/constants"
import { roleLabel } from "@/lib/roles"

export const dynamic = "force-dynamic"

const ROLE_TO_BIDANG: Record<string, string> = {
  kurikulum: "kurikulum",
  kesiswaan: "kesiswaan",
  sarpras: "sarpras",
  humas: "humas",
}

export default async function ProkerPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  const userRole = session.user.role || ""
  const isAdmin = userRole === "admin"
  const bidangUser = ROLE_TO_BIDANG[userRole] || null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Program Kerja</h1>
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? "Kelola program kerja seluruh bidang wakasek."
            : bidangUser
              ? `Kelola program kerja bidang ${roleLabel(userRole)}.`
              : "Kelola program kerja."}
        </p>
      </div>

      <ProkerClient
        userRole={userRole}
        bidangUser={bidangUser}
        isAdmin={isAdmin}
      />
    </div>
  )
}
