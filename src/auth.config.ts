import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/app/login",
  },
  providers: [],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role
        token.tenantId = user.tenantId
      }
      // Handle manual session update
      if (trigger === "update" && session) {
        if (session.tenantId !== undefined) token.tenantId = session.tenantId
        if (session.role !== undefined) token.role = session.role
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
        session.user.role = token.role as string
        session.user.tenantId = token.tenantId as string | null
      }
      return session
    }
  }
} satisfies NextAuthConfig
