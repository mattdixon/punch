"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hash } from "bcryptjs"
import { revalidatePath } from "next/cache"

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
}): Promise<{ tempPassword: string }> {
  await requireAdmin()

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  })
  if (existing) {
    throw new Error("A user with this email already exists")
  }

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

export async function resetUserPassword(id: string): Promise<{ tempPassword: string }> {
  await requireAdmin()

  const tempPassword = generateTempPassword()
  const passwordHash = await hash(tempPassword, 12)

  await prisma.user.update({
    where: { id },
    data: { passwordHash },
  })

  return { tempPassword }
}
