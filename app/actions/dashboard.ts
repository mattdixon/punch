"use server"

import { requireAuth, requireAdmin } from "@/app/actions/_auth-helpers"
import { prisma } from "@/lib/prisma"
import { getWeekString } from "@/lib/utils"

export async function getMemberDashboard() {
  const { user } = await requireAuth()
  const userId = user.id
  const week = getWeekString(new Date())

  const [entries, timecard] = await Promise.all([
    prisma.timeEntry.findMany({
      where: { userId, week },
      select: { hours: true },
    }),
    prisma.timecard.findUnique({
      where: { userId_week: { userId, week } },
      select: { status: true },
    }),
  ])

  const totalHours = entries.reduce(
    (sum, e) => sum + e.hours.toNumber(),
    0
  )

  return {
    week,
    totalHours,
    status: timecard?.status ?? "OPEN",
  }
}

export async function getAdminDashboard() {
  const { user } = await requireAdmin()

  const week = getWeekString(new Date())

  const [pendingCount, entries] = await Promise.all([
    prisma.timecard.count({
      where: { status: "SUBMITTED", user: { orgId: user.orgId } },
    }),
    prisma.timeEntry.findMany({
      where: { week, user: { orgId: user.orgId } },
      select: { hours: true },
    }),
  ])

  const totalHours = entries.reduce(
    (sum, e) => sum + e.hours.toNumber(),
    0
  )

  return {
    week,
    pendingCount,
    totalHours,
  }
}
