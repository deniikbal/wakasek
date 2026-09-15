import { createAuthClient } from "better-auth/client"
import { adminClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002",
  plugins: [adminClient()],
})

export async function isAdmin() {
  const { data: session } = await authClient.getSession()
  return (session as { user?: { role?: string } } | null)?.user?.role === "admin"
}
