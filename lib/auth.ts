import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        const user = await prisma.user.findUnique({
          where: { email },
          include: { organization: true },
        })

        if (!user || user.archivedAt) {
          return null
        }

        if (!user.passwordHash) {
          return null
        }

        // Block login if the user's org is suspended or deleted (unless super admin)
        if (user.organization && user.organization.status !== "ACTIVE" && !user.isSuperAdmin) {
          return null
        }

        const passwordMatch = await compare(password, user.passwordHash)
        if (!passwordMatch) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          orgId: user.orgId,
          isSuperAdmin: user.isSuperAdmin,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!
        token.role = (user as { role: string }).role
        token.orgId = (user as { orgId: string | null }).orgId
        token.isSuperAdmin = (user as { isSuperAdmin: boolean }).isSuperAdmin
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.orgId = token.orgId as string | null
        session.user.isSuperAdmin = token.isSuperAdmin as boolean
      }
      return session
    },
  },
})
