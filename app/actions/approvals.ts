"use server"

import { requireAdmin } from "@/app/actions/_auth-helpers"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getPendingTimecards() {
  const { user } = await requireAdmin()

  return prisma.timecard.findMany({
    where: { status: "SUBMITTED", user: { orgId: user.orgId } },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { submittedAt: "asc" },
  })
}

export async function getTimecardDetail(timecardId: string) {
  const { user } = await requireAdmin()

  const timecard = await prisma.timecard.findFirst({
    where: { id: timecardId, user: { orgId: user.orgId } },
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
  const { user } = await requireAdmin()

  const timecard = await prisma.timecard.findFirst({
    where: { id: timecardId, user: { orgId: user.orgId } },
  })
  if (!timecard) throw new Error("Timecard not found")
  if (timecard.status !== "SUBMITTED") throw new Error("Timecard is not pending approval")

  await prisma.timecard.update({
    where: { id: timecardId },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      approvedById: user.id,
    },
  })

  revalidatePath("/approvals")
}

export async function rejectTimecard(timecardId: string) {
  const { user } = await requireAdmin()

  const timecard = await prisma.timecard.findFirst({
    where: { id: timecardId, user: { orgId: user.orgId } },
  })
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
  const { user } = await requireAdmin()

  const timecard = await prisma.timecard.findFirst({
    where: { id: timecardId, user: { orgId: user.orgId } },
  })
  if (!timecard) throw new Error("Timecard not found")
  if (timecard.status !== "APPROVED") throw new Error("Timecard must be approved first")

  await prisma.timecard.update({
    where: { id: timecardId },
    data: {
      status: "INVOICED",
      invoicedAt: new Date(),
      invoicedById: user.id,
    },
  })

  revalidatePath("/approvals")
}

export async function getApprovedTimecards() {
  const { user } = await requireAdmin()

  return prisma.timecard.findMany({
    where: { status: "APPROVED", user: { orgId: user.orgId } },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { approvedAt: "asc" },
  })
}
