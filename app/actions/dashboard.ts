"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getWeekString } from "@/lib/utils"

async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
  return session
}

export async function getMemberDashboard() {
  const session = await requireAuth()
  const userId = session.user.id
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
  const session = await requireAuth()
  if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden")
  }

  const week = getWeekString(new Date())

  const [pendingCount, entries] = await Promise.all([
    prisma.timecard.count({
      where: { status: "SUBMITTED" },
    }),
    prisma.timeEntry.findMany({
      where: { week },
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
