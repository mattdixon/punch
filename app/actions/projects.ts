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

export async function getProjects(showArchived: boolean = false) {
  await requireAdmin()

  return prisma.project.findMany({
    where: showArchived ? {} : { archivedAt: null },
    orderBy: [{ client: { name: "asc" } }, { name: "asc" }],
    include: {
      client: { select: { id: true, name: true } },
      _count: { select: { assignments: true } },
    },
  })
}

export async function getActiveClients() {
  await requireAdmin()

  return prisma.client.findMany({
    where: { archivedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })
}

export async function createProject(data: {
  name: string
  clientId: string
  defaultBillCents: number
}) {
  await requireAdmin()

  if (!data.name.trim()) {
    throw new Error("Project name is required")
  }

  await prisma.project.create({
    data: {
      name: data.name.trim(),
      clientId: data.clientId,
      defaultBillCents: data.defaultBillCents,
    },
  })

  revalidatePath("/projects")
}

export async function updateProject(
  id: string,
  data: {
    name: string
    clientId: string
    defaultBillCents: number
  }
) {
  await requireAdmin()

  if (!data.name.trim()) {
    throw new Error("Project name is required")
  }

  await prisma.project.update({
    where: { id },
    data: {
      name: data.name.trim(),
      clientId: data.clientId,
      defaultBillCents: data.defaultBillCents,
    },
  })

  revalidatePath("/projects")
}

export async function archiveProject(id: string) {
  await requireAdmin()

  await prisma.project.update({
    where: { id },
    data: { archivedAt: new Date() },
  })

  revalidatePath("/projects")
}

export async function restoreProject(id: string) {
  await requireAdmin()

  await prisma.project.update({
    where: { id },
    data: { archivedAt: null },
  })

  revalidatePath("/projects")
}
