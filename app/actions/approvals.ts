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

export async function getPendingTimecards() {
  await requireAdmin()

  return prisma.timecard.findMany({
    where: { status: "SUBMITTED" },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { submittedAt: "asc" },
  })
}

export async function getTimecardDetail(timecardId: string) {
  await requireAdmin()

  const timecard = await prisma.timecard.findUnique({
    where: { id: timecardId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  })

  if (!timecard) return null

  const entries = await prisma.timeEntry.findMany({
    where: { userId: timecard.userId, week: timecard.week },
    include: {
      project: {
        include: { client: { select: { name: true } } },
      },
    },
    orderBy: [
      { project: { client: { name: "asc" } } },
      { project: { name: "asc" } },
      { date: "asc" },
    ],
  })

  return {
    timecard: {
      id: timecard.id,
      week: timecard.week,
      status: timecard.status,
      submittedAt: timecard.submittedAt?.toISOString() ?? null,
      approvedAt: timecard.approvedAt?.toISOString() ?? null,
      user: timecard.user,
    },
    entries: entries.map((e) => ({
      id: e.id,
      projectId: e.projectId,
      projectName: e.project.name,
      clientName: e.project.client.name,
      date: e.date.toISOString().split("T")[0],
      hours: e.hours.toNumber(),
      notes: e.notes,
    })),
  }
}

export async function approveTimecard(timecardId: string) {
  const session = await requireAdmin()

  const timecard = await prisma.timecard.findUnique({ where: { id: timecardId } })
  if (!timecard) throw new Error("Timecard not found")
  if (timecard.status !== "SUBMITTED") throw new Error("Timecard is not pending approval")

  await prisma.timecard.update({
    where: { id: timecardId },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      approvedById: session.user.id,
    },
  })

  revalidatePath("/approvals")
}

export async function rejectTimecard(timecardId: string) {
  await requireAdmin()

  const timecard = await prisma.timecard.findUnique({ where: { id: timecardId } })
  if (!timecard) throw new Error("Timecard not found")
  if (timecard.status !== "SUBMITTED") throw new Error("Timecard is not pending approval")

  await prisma.timecard.update({
    where: { id: timecardId },
    data: {
      status: "OPEN",
      submittedAt: null,
    },
  })

  revalidatePath("/approvals")
}

export async function markInvoiced(timecardId: string) {
  const session = await requireAdmin()

  const timecard = await prisma.timecard.findUnique({ where: { id: timecardId } })
  if (!timecard) throw new Error("Timecard not found")
  if (timecard.status !== "APPROVED") throw new Error("Timecard must be approved first")

  await prisma.timecard.update({
    where: { id: timecardId },
    data: {
      status: "INVOICED",
      invoicedAt: new Date(),
      invoicedById: session.user.id,
    },
  })

  revalidatePath("/approvals")
}

export async function getApprovedTimecards() {
  await requireAdmin()

  return prisma.timecard.findMany({
    where: { status: "APPROVED" },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { approvedAt: "asc" },
  })
}
