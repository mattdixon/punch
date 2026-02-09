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

export async function getProjectWithAssignments(projectId: string) {
  await requireAdmin()

  return prisma.project.findUnique({
    where: { id: projectId },
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
  await requireAdmin()

  const assigned = await prisma.projectAssignment.findMany({
    where: { projectId },
    select: { userId: true },
  })
  const assignedIds = assigned.map((a) => a.userId)

  return prisma.user.findMany({
    where: {
      archivedAt: null,
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
  await requireAdmin()

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
  await requireAdmin()

  const assignment = await prisma.projectAssignment.update({
    where: { id },
    data: {
      payRateCents: data.payRateCents,
      billRateCents: data.billRateCents,
    },
  })

  revalidatePath(`/projects/${assignment.projectId}`)
}

export async function removeAssignment(id: string) {
  await requireAdmin()

  const assignment = await prisma.projectAssignment.delete({
    where: { id },
  })

  revalidatePath(`/projects/${assignment.projectId}`)
}
