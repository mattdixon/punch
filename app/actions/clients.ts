"use server"

import { requireAdmin } from "@/app/actions/_auth-helpers"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getClients(showArchived: boolean = false) {
  const { user } = await requireAdmin()

  return prisma.client.findMany({
    where: showArchived ? { orgId: user.orgId } : { archivedAt: null, orgId: user.orgId },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { projects: true } },
    },
  })
}

export async function createClient(data: { name: string }) {
  const { user } = await requireAdmin()

  if (!data.name.trim()) {
    throw new Error("Client name is required")
  }

  await prisma.client.create({
    data: { name: data.name.trim(), orgId: user.orgId },
  })

  revalidatePath("/clients")
}

export async function updateClient(id: string, data: { name: string }) {
  const { user } = await requireAdmin()

  if (!data.name.trim()) {
    throw new Error("Client name is required")
  }

  await prisma.client.update({
    where: { id, orgId: user.orgId },
    data: { name: data.name.trim() },
  })

  revalidatePath("/clients")
}

export async function archiveClient(id: string) {
  const { user } = await requireAdmin()

  await prisma.client.update({
    where: { id, orgId: user.orgId },
    data: { archivedAt: new Date() },
  })

  revalidatePath("/clients")
}

export async function restoreClient(id: string) {
  const { user } = await requireAdmin()

  await prisma.client.update({
    where: { id, orgId: user.orgId },
    data: { archivedAt: null },
  })

  revalidatePath("/clients")
}
