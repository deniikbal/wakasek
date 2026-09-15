import { betterAuth } from "better-auth"
import { admin } from "better-auth/plugins"
import { pool } from "@/lib/db"

// Better-auth v1.7+ auto-detect pg via DATABASE_URL; kita kirim pool untuk koneksi pool.
export const auth = betterAuth({
  database: pool,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 6,
  },
  plugins: [
    admin({
      defaultRole: "user",
    }),
  ],
  trustedOrigins: [
    "https://wakasek.sman1bantarujeg.sch.id",
  ],
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
})
