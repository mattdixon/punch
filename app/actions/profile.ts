"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { compare, hash } from "bcryptjs"
import { revalidatePath } from "next/cache"

async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
  return session
}

export async function getProfile() {
  const session = await requireAuth()

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      defaultPayCents: true,
      createdAt: true,
    },
  })

  return user
}

export async function updateProfile(data: { name: string }) {
  const session = await requireAuth()

  if (!data.name.trim()) {
    throw new Error("Name is required")
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: data.name.trim() },
  })

  revalidatePath("/profile")
  revalidatePath("/", "layout")
}

export async function changePassword(data: {
  currentPassword: string
  newPassword: string
}) {
  const session = await requireAuth()

  if (!data.newPassword || data.newPassword.length < 8) {
    throw new Error("New password must be at least 8 characters")
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { passwordHash: true },
  })

  if (!user.passwordHash) {
    throw new Error("No password set. Use the password reset flow.")
  }

  const valid = await compare(data.currentPassword, user.passwordHash)
  if (!valid) {
    throw new Error("Current password is incorrect")
  }

  const passwordHash = await hash(data.newPassword, 12)

  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash },
  })
}
