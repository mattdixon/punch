"use server"

import { auth } from "@/lib/auth"
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

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
  if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden")
  }
  return session
}

export async function getUsers(showArchived: boolean = false) {
  await requireAdmin()

  return prisma.user.findMany({
    where: showArchived ? {} : { archivedAt: null },
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
  role: "ADMIN" | "MEMBER"
  defaultPayCents: number
}): Promise<{ tempPassword?: string; emailSent?: boolean }> {
  await requireAdmin()

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  })
  if (existing) {
    throw new Error("A user with this email already exists")
  }

  if (isEmailConfigured()) {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        defaultPayCents: data.defaultPayCents,
      },
    })

    const rawToken = await createToken(user.id, "INVITE")
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
    role: "ADMIN" | "MEMBER"
    defaultPayCents: number
  }
) {
  await requireAdmin()

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
  const session = await requireAdmin()

  if (id === session.user.id) {
    throw new Error("You cannot archive yourself")
  }

  await prisma.user.update({
    where: { id },
    data: { archivedAt: new Date() },
  })

  revalidatePath("/team")
}

export async function restoreUser(id: string) {
  await requireAdmin()

  await prisma.user.update({
    where: { id },
    data: { archivedAt: null },
  })

  revalidatePath("/team")
}

export async function resetUserPassword(
  id: string
): Promise<{ tempPassword?: string; emailSent?: boolean }> {
  await requireAdmin()

  if (isEmailConfigured()) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id },
      select: { id: true, name: true, email: true },
    })

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

  // Fallback: generate temp password (no email configured)
  const tempPassword = generateTempPassword()
  const passwordHash = await hash(tempPassword, 12)

  await prisma.user.update({
    where: { id },
    data: { passwordHash },
  })

  return { tempPassword }
}
