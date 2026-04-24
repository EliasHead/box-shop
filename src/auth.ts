import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// Providers
import CredentialsProvider from "next-auth/providers/credentials"

export async function authorizeUser(credentials: Partial<Record<string, unknown>>) {
  if (!credentials?.email || !credentials?.password) {
    return null
  }
  
  const user = await prisma.user.findUnique({
    where: { email: credentials.email as string }
  })

  if (!user || !user.password) {
    return null
  }

  const isPasswordValid = await bcrypt.compare(
    credentials.password as string,
    user.password
  )

  if (!isPasswordValid) {
    return null
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/app/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: authorizeUser
    }),
  ],
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
})
