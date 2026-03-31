"use server"

import { requireAdmin } from "@/app/actions/_auth-helpers"
import { prisma } from "@/lib/prisma"
import { hash } from "bcryptjs"
import { revalidatePath } from "next/cache"
import { createToken } from "@/lib/tokens"
import { sendEmail, isEmailConfigured } from "@/lib/email"
import { InviteEmail } from "@/components/emails/invite-email"
import { ResetEmail } from "@/components/emails/reset-email"
import { getCompanySettings } from "./settings"

function generateTempPassword(): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let password = ""
  for (let i = 0; i < 12; i++) {
    password += chars[Math.floor(Math.random() * chars.length)]
  }
  return password
}

export async function getUsers(showArchived: boolean = false) {
  const { user } = await requireAdmin()

  return prisma.user.findMany({
    where: showArchived ? { orgId: user.orgId } : { archivedAt: null, orgId: user.orgId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      defaultPayCents: true,
      archivedAt: true,
      createdAt: true,
    },
  })
}

export async function createUser(data: {
  name: string
  email: string
  role: "OWNER" | "ADMIN" | "MEMBER"
  defaultPayCents: number
}): Promise<{ tempPassword?: string; emailSent?: boolean }> {
  const { user } = await requireAdmin()

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  })
  if (existing) {
    throw new Error("A user with this email already exists")
  }

  if (isEmailConfigured()) {
    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        defaultPayCents: data.defaultPayCents,
        orgId: user.orgId,
      },
    })

    const rawToken = await createToken(newUser.id, "INVITE")
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const inviteUrl = `${baseUrl}/set-password?token=${rawToken}&type=invite`
    const settings = await getCompanySettings()

    await sendEmail({
      to: data.email,
      subject: `You've been invited to ${settings.companyName}`,
      react: InviteEmail({
        name: data.name,
        inviteUrl,
        companyName: settings.companyName,
      }),
    })

    revalidatePath("/team")
    return { emailSent: true }
  }

  // Fallback: generate temp password (no email configured)
  const tempPassword = generateTempPassword()
  const passwordHash = await hash(tempPassword, 12)

  await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      defaultPayCents: data.defaultPayCents,
      passwordHash,
      orgId: user.orgId,
    },
  })

  revalidatePath("/team")
  return { tempPassword }
}

export async function updateUser(
  id: string,
  data: {
    name: string
    email: string
    role: "OWNER" | "ADMIN" | "MEMBER"
    defaultPayCents: number
  }
) {
  const { user } = await requireAdmin()

  // Verify user belongs to org
  const targetUser = await prisma.user.findFirst({
    where: { id, orgId: user.orgId },
  })
  if (!targetUser) throw new Error("User not found")

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  })
  if (existing && existing.id !== id) {
    throw new Error("A user with this email already exists")
  }

  await prisma.user.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      defaultPayCents: data.defaultPayCents,
    },
  })

  revalidatePath("/team")
}

export async function archiveUser(id: string) {
  const { user } = await requireAdmin()

  if (id === user.id) {
    throw new Error("You cannot archive yourself")
  }

  // Verify user belongs to org
  const targetUser = await prisma.user.findFirst({
    where: { id, orgId: user.orgId },
  })
  if (!targetUser) throw new Error("User not found")

  await prisma.user.update({
    where: { id },
    data: { archivedAt: new Date() },
  })

  revalidatePath("/team")
}

export async function restoreUser(id: string) {
  const { user } = await requireAdmin()

  // Verify user belongs to org
  const targetUser = await prisma.user.findFirst({
    where: { id, orgId: user.orgId },
  })
  if (!targetUser) throw new Error("User not found")

  await prisma.user.update({
    where: { id },
    data: { archivedAt: null },
  })

  revalidatePath("/team")
}

export async function resetUserPassword(
  id: string
): Promise<{ tempPassword?: string; emailSent?: boolean }> {
  const { user } = await requireAdmin()

  // Verify user belongs to org
  const targetUser = await prisma.user.findFirst({
    where: { id, orgId: user.orgId },
    select: { id: true, name: true, email: true },
  })
  if (!targetUser) throw new Error("User not found")

  if (isEmailConfigured()) {
    const rawToken = await createToken(targetUser.id, "PASSWORD_RESET")
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const resetUrl = `${baseUrl}/set-password?token=${rawToken}&type=reset`

    await sendEmail({
      to: targetUser.email,
      subject: "Reset your Punch password",
      react: ResetEmail({ name: targetUser.name, resetUrl }),
    })

    return { emailSent: true }
  }

  // Fallback: generate temp password (no email configured)
  const tempPassword = generateTempPassword()
  const passwordHash = await hash(tempPassword, 12)

  await prisma.user.update({
    where: { id },
    data: { passwordHash },
  })

  return { tempPassword }
}
