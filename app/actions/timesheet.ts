"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getWeekString } from "@/lib/utils"

async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
  return session
}

export async function getTimesheetData(week: string) {
  const session = await requireAuth()
  const userId = session.user.id

  const [assignments, entries, timecard] = await Promise.all([
    prisma.projectAssignment.findMany({
      where: {
        userId,
        project: { archivedAt: null },
      },
      include: {
        project: {
          include: { client: { select: { id: true, name: true } } },
        },
      },
      orderBy: [
        { project: { client: { name: "asc" } } },
        { project: { name: "asc" } },
      ],
    }),
    prisma.timeEntry.findMany({
      where: { userId, week },
      select: {
        id: true,
        projectId: true,
        date: true,
        hours: true,
        notes: true,
      },
    }),
    prisma.timecard.findUnique({
      where: { userId_week: { userId, week } },
    }),
  ])

  return {
    assignments: assignments.map((a) => ({
      projectId: a.project.id,
      projectName: a.project.name,
      clientName: a.project.client.name,
      clientId: a.project.client.id,
    })),
    entries: entries.map((e) => ({
      id: e.id,
      projectId: e.projectId,
      date: e.date.toISOString().split("T")[0],
      hours: e.hours.toNumber(),
      notes: e.notes,
    })),
    timecard: timecard
      ? {
          id: timecard.id,
          status: timecard.status,
          submittedAt: timecard.submittedAt?.toISOString() ?? null,
          approvedAt: timecard.approvedAt?.toISOString() ?? null,
        }
      : null,
  }
}

export async function saveTimeEntry(data: {
  projectId: string
  date: string
  hours: number
  notes?: string
}) {
  const session = await requireAuth()
  const userId = session.user.id
  const week = getWeekString(new Date(data.date))

  // Check if timecard is locked
  const timecard = await prisma.timecard.findUnique({
    where: { userId_week: { userId, week } },
  })
  if (timecard && timecard.status !== "OPEN") {
    throw new Error("Timecard is locked")
  }

  const entryDate = new Date(data.date + "T00:00:00.000Z")

  if (data.hours <= 0) {
    // Delete entry if hours is 0 or negative
    await prisma.timeEntry.deleteMany({
      where: { userId, projectId: data.projectId, date: entryDate },
    })
  } else {
    await prisma.timeEntry.upsert({
      where: {
        userId_projectId_date: {
          userId,
          projectId: data.projectId,
          date: entryDate,
        },
      },
      update: {
        hours: data.hours,
        notes: data.notes,
        updatedById: userId,
      },
      create: {
        userId,
        projectId: data.projectId,
        date: entryDate,
        hours: data.hours,
        notes: data.notes,
        week,
        createdById: userId,
        updatedById: userId,
      },
    })
  }

  revalidatePath("/timesheet")
}

export async function submitTimecard(week: string) {
  const session = await requireAuth()
  const userId = session.user.id

  const existing = await prisma.timecard.findUnique({
    where: { userId_week: { userId, week } },
  })

  if (existing) {
    if (existing.status !== "OPEN") {
      throw new Error("Timecard has already been submitted")
    }
    await prisma.timecard.update({
      where: { id: existing.id },
      data: { status: "SUBMITTED", submittedAt: new Date() },
    })
  } else {
    await prisma.timecard.create({
      data: {
        userId,
        week,
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    })
  }

  revalidatePath("/timesheet")
}
