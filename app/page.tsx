import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import Link from "next/link"
import { ArrowRightIcon, ShieldCheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function RootPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session) redirect("/dashboard")

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="grid size-16 place-items-center rounded-sm bg-primary text-primary-foreground">
        <ShieldCheckIcon className="size-8" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Portal Wakasek</h1>
        <p className="text-sm text-muted-foreground">SMAN 1 Bantarujeg</p>
      </div>
      <Link href="/login">
        <Button>
          Masuk <ArrowRightIcon className="size-4" />
        </Button>
      </Link>
    </main>
  )
}
