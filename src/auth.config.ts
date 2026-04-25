import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/app/login",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.tenantId = user.tenantId
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.tenantId = token.tenantId as string | null
      }
      return session
    }
  }
} satisfies NextAuthConfig
