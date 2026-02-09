"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

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

export async function getClients(showArchived: boolean = false) {
  await requireAdmin()

  return prisma.client.findMany({
    where: showArchived ? {} : { archivedAt: null },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { projects: true } },
    },
  })
}

export async function createClient(data: { name: string }) {
  await requireAdmin()

  if (!data.name.trim()) {
    throw new Error("Client name is required")
  }

  await prisma.client.create({
    data: { name: data.name.trim() },
  })

  revalidatePath("/clients")
}

export async function updateClient(id: string, data: { name: string }) {
  await requireAdmin()

  if (!data.name.trim()) {
    throw new Error("Client name is required")
  }

  await prisma.client.update({
    where: { id },
    data: { name: data.name.trim() },
  })

  revalidatePath("/clients")
}

export async function archiveClient(id: string) {
  await requireAdmin()

  await prisma.client.update({
    where: { id },
    data: { archivedAt: new Date() },
  })

  revalidatePath("/clients")
}

export async function restoreClient(id: string) {
  await requireAdmin()

  await prisma.client.update({
    where: { id },
    data: { archivedAt: null },
  })

  revalidatePath("/clients")
}
