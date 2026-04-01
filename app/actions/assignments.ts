"use server"

import { requireAdmin, requireAdminWriteAccess } from "@/app/actions/_auth-helpers"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getProjectWithAssignments(projectId: string) {
  const { user } = await requireAdmin()

  return prisma.project.findFirst({
    where: { id: projectId, orgId: user.orgId },
    include: {
      client: { select: { name: true } },
      assignments: {
        include: {
          user: {
            select: { id: true, name: true, email: true, defaultPayCents: true, archivedAt: true },
          },
        },
        orderBy: { user: { name: "asc" } },
      },
    },
  })
}

export async function getUnassignedUsers(projectId: string) {
  const { user } = await requireAdmin()

  const assigned = await prisma.projectAssignment.findMany({
    where: { projectId },
    select: { userId: true },
  })
  const assignedIds = assigned.map((a) => a.userId)

  return prisma.user.findMany({
    where: {
      archivedAt: null,
      orgId: user.orgId,
      id: { notIn: assignedIds },
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, defaultPayCents: true },
  })
}

export async function createAssignment(data: {
  projectId: string
  userId: string
  payRateCents: number | null
  billRateCents: number | null
}) {
  const { user } = await requireAdminWriteAccess()

  // Verify project belongs to org
  const project = await prisma.project.findFirst({
    where: { id: data.projectId, orgId: user.orgId },
  })
  if (!project) throw new Error("Project not found")

  // Verify user belongs to org
  const targetUser = await prisma.user.findFirst({
    where: { id: data.userId, orgId: user.orgId },
  })
  if (!targetUser) throw new Error("User not found")

  await prisma.projectAssignment.create({
    data: {
      projectId: data.projectId,
      userId: data.userId,
      payRateCents: data.payRateCents,
      billRateCents: data.billRateCents,
    },
  })

  revalidatePath(`/projects/${data.projectId}`)
}

export async function updateAssignment(
  id: string,
  data: {
    payRateCents: number | null
    billRateCents: number | null
  }
) {
  const { user } = await requireAdminWriteAccess()

  // Verify assignment belongs to org via project
  const assignment = await prisma.projectAssignment.findFirst({
    where: { id, project: { orgId: user.orgId } },
  })
  if (!assignment) throw new Error("Assignment not found")

  const updated = await prisma.projectAssignment.update({
    where: { id },
    data: {
      payRateCents: data.payRateCents,
      billRateCents: data.billRateCents,
    },
  })

  revalidatePath(`/projects/${updated.projectId}`)
}

export async function removeAssignment(id: string) {
  const { user } = await requireAdmin()

  // Verify assignment belongs to org via project
  const assignment = await prisma.projectAssignment.findFirst({
    where: { id, project: { orgId: user.orgId } },
  })
  if (!assignment) throw new Error("Assignment not found")

  const deleted = await prisma.projectAssignment.delete({
    where: { id },
  })

  revalidatePath(`/projects/${deleted.projectId}`)
}
