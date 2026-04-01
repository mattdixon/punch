"use server"

import { requireAdmin, requireAdminWriteAccess } from "@/app/actions/_auth-helpers"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getProjects(showArchived: boolean = false) {
  const { user } = await requireAdmin()

  return prisma.project.findMany({
    where: showArchived ? { orgId: user.orgId } : { archivedAt: null, orgId: user.orgId },
    orderBy: [{ client: { name: "asc" } }, { name: "asc" }],
    include: {
      client: { select: { id: true, name: true } },
      _count: { select: { assignments: true } },
    },
  })
}

export async function getActiveClients() {
  const { user } = await requireAdmin()

  return prisma.client.findMany({
    where: { archivedAt: null, orgId: user.orgId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })
}

export async function createProject(data: {
  name: string
  clientId: string
  defaultBillCents: number
  paymentTerms: string
}) {
  const { user } = await requireAdminWriteAccess()

  if (!data.name.trim()) {
    throw new Error("Project name is required")
  }

  await prisma.project.create({
    data: {
      name: data.name.trim(),
      clientId: data.clientId,
      defaultBillCents: data.defaultBillCents,
      paymentTerms: data.paymentTerms,
      orgId: user.orgId,
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
    paymentTerms: string
  }
) {
  const { user } = await requireAdminWriteAccess()

  if (!data.name.trim()) {
    throw new Error("Project name is required")
  }

  await prisma.project.update({
    where: { id, orgId: user.orgId },
    data: {
      name: data.name.trim(),
      client: { connect: { id: data.clientId } },
      defaultBillCents: data.defaultBillCents,
      paymentTerms: data.paymentTerms,
    },
  })

  revalidatePath("/projects")
}

export async function archiveProject(id: string) {
  const { user } = await requireAdmin()

  await prisma.project.update({
    where: { id, orgId: user.orgId },
    data: { archivedAt: new Date() },
  })

  revalidatePath("/projects")
}

export async function restoreProject(id: string) {
  const { user } = await requireAdmin()

  await prisma.project.update({
    where: { id, orgId: user.orgId },
    data: { archivedAt: null },
  })

  revalidatePath("/projects")
}
