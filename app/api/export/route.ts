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
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  const status = searchParams.get("status")
  const format = searchParams.get("format")
  const invoiceNoParam = searchParams.get("invoiceNo")

  const where: Record<string, unknown> = {}

  // Date-based filtering takes precedence over week-based
  if (startDate || endDate) {
    const dateFilter: Record<string, Date> = {}
    if (startDate) dateFilter.gte = new Date(startDate + "T00:00:00")
    if (endDate) dateFilter.lte = new Date(endDate + "T23:59:59")
    where.date = dateFilter
  } else if (startWeek || endWeek) {
    const weekFilter: Record<string, string> = {}
    if (startWeek) weekFilter.gte = startWeek
    if (endWeek) weekFilter.lte = endWeek
    where.week = weekFilter
  }

  // If status filter, only include entries for timecards with that status
  let userWeekFilter: { userId: string; week: string }[] | null = null
  if (status) {
    const timecardWhere: Record<string, unknown> = { status: status as TimecardStatus }
    if (where.week) {
      timecardWhere.week = where.week
    }
    // For date-based queries, we still filter by timecard status but let the date filter apply to entries
    const timecards = await prisma.timecard.findMany({
      where: timecardWhere,
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
        select: {
          name: true,
          defaultBillCents: true,
          paymentTerms: true,
          client: { select: { name: true } },
        },
      },
    },
    orderBy: [{ week: "asc" }, { date: "asc" }, { user: { name: "asc" } }],
  })

  // Get company settings for rate fallbacks
  const companySettings = await prisma.companySettings.findUnique({
    where: { id: "default" },
  })
  const companyBillCents = companySettings?.defaultBillCents ?? 0
  const companyPayCents = companySettings?.defaultPayCents ?? 0
  const companyPaymentTerms = companySettings?.defaultPaymentTerms ?? "Net 30"

  // Get assignments for rate overrides
  const assignments = await prisma.projectAssignment.findMany({
    where: {
      OR: entries.map((e) => ({ userId: e.userId, projectId: e.projectId })),
    },
  })
  const assignmentMap = new Map(
    assignments.map((a) => [`${a.userId}:${a.projectId}`, a])
  )

  function escapeCsv(value: string) {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  // QuickBooks Invoice Import format
  if (format === "quickbooks") {
    // Aggregate by client and project
    const aggregated = new Map<string, {
      client: string
      project: string
      hours: number
      billRateCents: number
      billAmount: number
      paymentTerms: string
    }>()

    for (const e of entries) {
      const key = `${e.project.client.name}:${e.project.name}`
      const assignment = assignmentMap.get(`${e.userId}:${e.projectId}`)
      const billRateCents = assignment?.billRateCents || e.project.defaultBillCents || companyBillCents
      const hours = e.hours.toNumber()
      const billAmount = (billRateCents * hours) / 100

      const existing = aggregated.get(key)
      if (existing) {
        existing.hours += hours
        existing.billAmount += billAmount
      } else {
        aggregated.set(key, {
          client: e.project.client.name,
          project: e.project.name,
          hours,
          billRateCents,
          billAmount,
          paymentTerms: e.project.paymentTerms || companyPaymentTerms,
        })
      }
    }

    // Group by client for invoice numbers
    const byClient = new Map<string, typeof aggregated extends Map<string, infer V> ? V[] : never>()
    for (const item of aggregated.values()) {
      const existing = byClient.get(item.client) || []
      existing.push(item)
      byClient.set(item.client, existing)
    }

    // Format date as M/D/YYYY for QuickBooks
    function formatQBDate(date: Date): string {
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
    }

    // Calculate due date based on payment terms
    function getDueDate(invoiceDate: Date, terms: string): Date {
      const days = terms === "Due on receipt" ? 0
        : terms === "Net 15" ? 15
        : terms === "Net 60" ? 60
        : 30 // Default Net 30
      return new Date(invoiceDate.getTime() + days * 24 * 60 * 60 * 1000)
    }

    const today = new Date()

    // QuickBooks Online invoice import headers (matching QB sample)
    const qbHeaders = [
      "*InvoiceNo",
      "*Customer",
      "*InvoiceDate",
      "*DueDate",
      "Terms",
      "Location",
      "Memo",
      "Item(Product/Service)",
      "ItemDescription",
      "ItemQuantity",
      "ItemRate",
      "*ItemAmount",
    ]

    const qbRows: string[][] = []
    let invoiceNum = invoiceNoParam ? parseInt(invoiceNoParam, 10) : 1001

    for (const [client, items] of byClient) {
      // Use the first item's payment terms for the invoice
      // (could vary by project, but QB invoice has one terms field per invoice)
      const invoiceTerms = items[0].paymentTerms
      const dueDate = getDueDate(today, invoiceTerms)

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const isFirstLine = i === 0
        qbRows.push([
          String(invoiceNum),                           // *InvoiceNo (same for all lines of invoice)
          isFirstLine ? client : "",                    // *Customer
          isFirstLine ? formatQBDate(today) : "",       // *InvoiceDate
          isFirstLine ? formatQBDate(dueDate) : "",     // *DueDate
          isFirstLine ? invoiceTerms : "",              // Terms (from project)
          "",                                           // Location
          "",                                           // Memo
          item.project,                                 // Item(Product/Service)
          "",                                           // ItemDescription
          item.hours.toFixed(2),                        // ItemQuantity
          (item.billRateCents / 100).toFixed(2),        // ItemRate
          item.billAmount.toFixed(2),                   // *ItemAmount
        ])
      }
      invoiceNum++
    }

    const csv = [
      qbHeaders.map(escapeCsv).join(","),
      ...qbRows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\n")

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="punch-quickbooks-${Date.now()}.csv"`,
      },
    })
  }

  // Detailed CSV format (default)
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
    const payRateCents = assignment?.payRateCents || e.user.defaultPayCents || companyPayCents
    const billRateCents = assignment?.billRateCents || e.project.defaultBillCents || companyBillCents
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
