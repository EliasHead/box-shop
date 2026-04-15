import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

// Providers
import CredentialsProvider from "next-auth/providers/credentials"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "POC Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Mock implementation for the POC
        // In reality, this should check the DB and compare hashes
        if (credentials?.email === "admin@boxshop.com" && credentials?.password === "admin") {
          return { id: "1", name: "Admin", email: "admin@boxshop.com", role: "ADMIN" }
        }
        return null
      }
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    session({ session, token }) {
      if (session.user && token.role) {
        session.user.role = token.role
      }
      return session
    }
  }
})
