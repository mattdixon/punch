"use server"

import { requireSuperAdmin } from "@/app/actions/_auth-helpers"
import { prisma } from "@/lib/prisma"
import { hash } from "bcryptjs"
import { revalidatePath } from "next/cache"
import { createToken } from "@/lib/tokens"
import { sendEmail, isEmailConfigured } from "@/lib/email"
import { ResetEmail } from "@/components/emails/reset-email"

function generateTempPassword(): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let password = ""
  for (let i = 0; i < 12; i++) {
    password += chars[Math.floor(Math.random() * chars.length)]
  }
  return password
}

export async function listAllUsers(filters?: {
  search?: string
  orgId?: string
  role?: string
  showArchived?: boolean
}) {
  await requireSuperAdmin()

  const where: Record<string, unknown> = {}

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ]
  }
  if (filters?.orgId) {
    where.orgId = filters.orgId
  }
  if (filters?.role) {
    where.role = filters.role
  }
  if (!filters?.showArchived) {
    where.archivedAt = null
  }

  const users = await prisma.user.findMany({
    where,
    include: {
      organization: { select: { id: true, companyName: true } },
    },
    orderBy: { name: "asc" },
  })

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isSuperAdmin: u.isSuperAdmin,
    orgName: u.organization?.companyName ?? null,
    orgId: u.orgId,
    isArchived: !!u.archivedAt,
    createdAt: u.createdAt.toISOString(),
  }))
}

export async function getUserDetail(userId: string) {
  await requireSuperAdmin()

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organization: { select: { id: true, companyName: true, slug: true } },
      assignments: {
        include: {
          project: {
            include: { client: { select: { name: true } } },
          },
        },
      },
    },
  })

  if (!user) {
    throw new Error("User not found")
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isSuperAdmin: user.isSuperAdmin,
    defaultPayCents: user.defaultPayCents,
    isArchived: !!user.archivedAt,
    createdAt: user.createdAt.toISOString(),
    org: user.organization
      ? {
          id: user.organization.id,
          companyName: user.organization.companyName,
          slug: user.organization.slug,
        }
      : null,
    assignments: user.assignments.map((a) => ({
      id: a.id,
      projectName: a.project.name,
      clientName: a.project.client.name,
      payRateCents: a.payRateCents,
      billRateCents: a.billRateCents,
    })),
  }
}

export async function adminResetPassword(
  userId: string
): Promise<{ tempPassword?: string; emailSent?: boolean }> {
  await requireSuperAdmin()

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  })
  if (!user) throw new Error("User not found")

  if (isEmailConfigured()) {
    const rawToken = await createToken(user.id, "PASSWORD_RESET")
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const resetUrl = `${baseUrl}/set-password?token=${rawToken}&type=reset`

    await sendEmail({
      to: user.email,
      subject: "Reset your Punch password",
      react: ResetEmail({ name: user.name, resetUrl }),
    })

    return { emailSent: true }
  }

  const tempPassword = generateTempPassword()
  const passwordHash = await hash(tempPassword, 12)

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  })

  return { tempPassword }
}

export async function adminArchiveUser(userId: string) {
  const { user } = await requireSuperAdmin()

  if (userId === user.id) {
    throw new Error("You cannot archive yourself")
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } })
  if (!targetUser) throw new Error("User not found")

  await prisma.user.update({
    where: { id: userId },
    data: { archivedAt: new Date() },
  })

  revalidatePath("/admin/users")
  revalidatePath(`/admin/users/${userId}`)
}

export async function adminRestoreUser(userId: string) {
  await requireSuperAdmin()

  const targetUser = await prisma.user.findUnique({ where: { id: userId } })
  if (!targetUser) throw new Error("User not found")

  await prisma.user.update({
    where: { id: userId },
    data: { archivedAt: null },
  })

  revalidatePath("/admin/users")
  revalidatePath(`/admin/users/${userId}`)
}

export async function adminToggleSuperAdmin(userId: string) {
  const { user } = await requireSuperAdmin()

  if (userId === user.id) {
    throw new Error("You cannot modify your own super admin status")
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } })
  if (!targetUser) throw new Error("User not found")

  await prisma.user.update({
    where: { id: userId },
    data: { isSuperAdmin: !targetUser.isSuperAdmin },
  })

  revalidatePath("/admin/users")
  revalidatePath(`/admin/users/${userId}`)
}
