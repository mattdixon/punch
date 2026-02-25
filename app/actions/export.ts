"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { TimecardStatus } from "@prisma/client"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  if (session.user.role !== "ADMIN") throw new Error("Forbidden")
  return session
}

export async function getExportFilterOptions() {
  await requireAdmin()

  const [clients, projects, users] = await Promise.all([
    prisma.client.findMany({
      where: { archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.project.findMany({
      where: { archivedAt: null },
      select: { id: true, name: true, clientId: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  return { clients, projects, users }
}

export async function getExportPreview(params: {
  startDate?: string
  endDate?: string
  startWeek?: string
  endWeek?: string
  status?: string
  clientId?: string
  projectId?: string
  userId?: string
}) {
  await requireAdmin()

  const where: Record<string, unknown> = {}

  if (params.startDate || params.endDate) {
    const dateFilter: Record<string, Date> = {}
    if (params.startDate) dateFilter.gte = new Date(params.startDate + "T00:00:00")
    if (params.endDate) dateFilter.lte = new Date(params.endDate + "T23:59:59")
    where.date = dateFilter
  } else if (params.startWeek || params.endWeek) {
    const weekFilter: Record<string, string> = {}
    if (params.startWeek) weekFilter.gte = params.startWeek
    if (params.endWeek) weekFilter.lte = params.endWeek
    where.week = weekFilter
  }

  if (params.clientId) {
    where.project = { clientId: params.clientId }
  }
  if (params.projectId) {
    where.projectId = params.projectId
  }
  if (params.userId) {
    where.userId = params.userId
  }

  let userWeekFilter: { userId: string; week: string }[] | null = null
  if (params.status && params.status !== "ALL") {
    const timecardWhere: Record<string, unknown> = {
      status: params.status as TimecardStatus,
    }
    if (where.week) timecardWhere.week = where.week
    if (params.userId) timecardWhere.userId = params.userId

    const timecards = await prisma.timecard.findMany({
      where: timecardWhere,
      select: { userId: true, week: true },
    })
    userWeekFilter = timecards.map((tc) => ({
      userId: tc.userId,
      week: tc.week,
    }))
  }

  const entries = await prisma.timeEntry.findMany({
    where: {
      ...where,
      ...(userWeekFilter
        ? {
            OR: userWeekFilter.map((f) => ({
              userId: f.userId,
              week: f.week,
            })),
          }
        : {}),
    },
    include: {
      user: { select: { name: true } },
      project: {
        select: {
          name: true,
          client: { select: { name: true } },
        },
      },
    },
    orderBy: [{ date: "asc" }, { user: { name: "asc" } }],
    take: 100,
  })

  const totalCount = await prisma.timeEntry.count({
    where: {
      ...where,
      ...(userWeekFilter
        ? {
            OR: userWeekFilter.map((f) => ({
              userId: f.userId,
              week: f.week,
            })),
          }
        : {}),
    },
  })

  return {
    entries: entries.map((e) => ({
      date: e.date.toISOString().split("T")[0],
      user: e.user.name,
      client: e.project.client.name,
      project: e.project.name,
      hours: e.hours.toNumber(),
      notes: e.notes,
    })),
    totalCount,
    totalHours: entries.reduce((sum, e) => sum + e.hours.toNumber(), 0),
    showing: entries.length,
  }
}
