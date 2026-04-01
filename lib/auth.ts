import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

const IMPERSONATION_COOKIE = "punch_impersonate"

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

        // Check for impersonation cookie
        try {
          const cookieStore = await cookies()
          const impersonateCookie = cookieStore.get(IMPERSONATION_COOKIE)

          if (impersonateCookie?.value && token.isSuperAdmin) {
            const targetUser = await prisma.user.findUnique({
              where: { id: impersonateCookie.value },
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                orgId: true,
              },
            })

            if (targetUser) {
              session.user.realAdminId = token.id as string
              session.user.isImpersonating = true
              session.user.id = targetUser.id
              session.user.name = targetUser.name
              session.user.email = targetUser.email
              session.user.role = targetUser.role
              session.user.orgId = targetUser.orgId
              // Keep isSuperAdmin false for the impersonated view
              session.user.isSuperAdmin = false
            }
          }
        } catch {
          // cookies() may throw in certain contexts (e.g., API routes)
        }
      }
      return session
    },
  },
})

export { IMPERSONATION_COOKIE }
