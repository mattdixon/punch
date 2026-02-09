import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"
import { TimecardStatus } from "@prisma/client"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    return new Response("Forbidden", { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const startWeek = searchParams.get("startWeek")
  const endWeek = searchParams.get("endWeek")
  const status = searchParams.get("status")

  const where: Record<string, unknown> = {}
  if (startWeek && endWeek) {
    where.week = { gte: startWeek, lte: endWeek }
  } else if (startWeek) {
    where.week = { gte: startWeek }
  } else if (endWeek) {
    where.week = { lte: endWeek }
  }

  // If status filter, only include entries for timecards with that status
  let userWeekFilter: { userId: string; week: string }[] | null = null
  if (status) {
    const timecards = await prisma.timecard.findMany({
      where: { status: status as TimecardStatus, ...(where.week ? { week: where.week as Record<string, string> } : {}) },
      select: { userId: true, week: true },
    })
    userWeekFilter = timecards.map((tc) => ({ userId: tc.userId, week: tc.week }))
  }

  const entries = await prisma.timeEntry.findMany({
    where: {
      ...where,
      ...(userWeekFilter
        ? { OR: userWeekFilter.map((f) => ({ userId: f.userId, week: f.week })) }
        : {}),
    },
    include: {
      user: { select: { name: true, email: true, defaultPayCents: true } },
      project: {
        include: {
          client: { select: { name: true } },
        },
      },
    },
    orderBy: [{ week: "asc" }, { date: "asc" }, { user: { name: "asc" } }],
  })

  // Get assignments for rate overrides
  const assignments = await prisma.projectAssignment.findMany({
    where: {
      OR: entries.map((e) => ({ userId: e.userId, projectId: e.projectId })),
    },
  })
  const assignmentMap = new Map(
    assignments.map((a) => [`${a.userId}:${a.projectId}`, a])
  )

  // Build CSV
  const headers = [
    "Week",
    "Date",
    "User",
    "Email",
    "Client",
    "Project",
    "Hours",
    "Pay Rate",
    "Bill Rate",
    "Pay Amount",
    "Bill Amount",
    "Notes",
  ]

  const rows = entries.map((e) => {
    const assignment = assignmentMap.get(`${e.userId}:${e.projectId}`)
    const payRateCents = assignment?.payRateCents ?? e.user.defaultPayCents
    const billRateCents = assignment?.billRateCents ?? e.project.defaultBillCents
    const hours = e.hours.toNumber()
    const payAmount = (payRateCents * hours) / 100
    const billAmount = (billRateCents * hours) / 100

    return [
      e.week,
      e.date.toISOString().split("T")[0],
      e.user.name,
      e.user.email,
      e.project.client.name,
      e.project.name,
      hours.toString(),
      (payRateCents / 100).toFixed(2),
      (billRateCents / 100).toFixed(2),
      payAmount.toFixed(2),
      billAmount.toFixed(2),
      e.notes ?? "",
    ]
  })

  function escapeCsv(value: string) {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  const csv = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\n")

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="punch-export-${Date.now()}.csv"`,
    },
  })
}
