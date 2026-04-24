import { type DefaultSession } from "next-auth"
import { type JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      role: string
      tenantId?: string | null
    } & DefaultSession["user"]
  }

  interface User {
    role?: string
    tenantId?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    tenantId?: string | null
  }
}
