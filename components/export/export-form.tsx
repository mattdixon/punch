"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download } from "lucide-react"
import { getWeekString } from "@/lib/utils"
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  startOfISOWeek,
  endOfISOWeek,
  subWeeks,
} from "date-fns"

type DateRangeType = "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth" | "customWeeks" | "customDates"

function getDateRangeValues(type: DateRangeType): { startDate: string; endDate: string } {
  const today = new Date()

  switch (type) {
    case "thisWeek": {
      const start = startOfISOWeek(today)
      const end = endOfISOWeek(today)
      return { startDate: format(start, "yyyy-MM-dd"), endDate: format(end, "yyyy-MM-dd") }
    }
    case "lastWeek": {
      const lastWeek = subWeeks(today, 1)
      const start = startOfISOWeek(lastWeek)
      const end = endOfISOWeek(lastWeek)
      return { startDate: format(start, "yyyy-MM-dd"), endDate: format(end, "yyyy-MM-dd") }
    }
    case "thisMonth": {
      const start = startOfMonth(today)
      const end = endOfMonth(today)
      return { startDate: format(start, "yyyy-MM-dd"), endDate: format(end, "yyyy-MM-dd") }
    }
    case "lastMonth": {
      const lastMonth = subMonths(today, 1)
      const start = startOfMonth(lastMonth)
      const end = endOfMonth(lastMonth)
      return { startDate: format(start, "yyyy-MM-dd"), endDate: format(end, "yyyy-MM-dd") }
    }
    default:
      return { startDate: "", endDate: "" }
  }
}

export function ExportForm() {
  const currentWeek = getWeekString(new Date())
  const [rangeType, setRangeType] = useState<DateRangeType>("thisMonth")
  const [startWeek, setStartWeek] = useState(currentWeek)
  const [endWeek, setEndWeek] = useState(currentWeek)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [status, setStatus] = useState("APPROVED")
  const [exportFormat, setExportFormat] = useState<"detailed" | "quickbooks">("quickbooks")
  const [startingInvoiceNo, setStartingInvoiceNo] = useState("1001")

  const showWeekInputs = rangeType === "customWeeks"
  const showDateInputs = rangeType === "customDates"

  const previewRange = useMemo(() => {
    if (rangeType === "customWeeks" || rangeType === "customDates") return null
    const { startDate, endDate } = getDateRangeValues(rangeType)
    return `${startDate} to ${endDate}`
  }, [rangeType])

  function handleExport() {
    const params = new URLSearchParams()

    if (rangeType === "customWeeks") {
      if (startWeek) params.set("startWeek", startWeek)
      if (endWeek) params.set("endWeek", endWeek)
    } else if (rangeType === "customDates") {
      if (startDate) params.set("startDate", startDate)
      if (endDate) params.set("endDate", endDate)
    } else {
      const { startDate, endDate } = getDateRangeValues(rangeType)
      params.set("startDate", startDate)
      params.set("endDate", endDate)
    }

    if (status && status !== "ALL") params.set("status", status)
    if (exportFormat === "quickbooks") {
      params.set("format", "quickbooks")
      if (startingInvoiceNo) params.set("invoiceNo", startingInvoiceNo)
    }
    window.open(`/api/export?${params.toString()}`, "_blank")
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Export Time Entries</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="rangeType">Date Range</Label>
          <Select value={rangeType} onValueChange={(v) => setRangeType(v as DateRangeType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisWeek">This Week</SelectItem>
              <SelectItem value="lastWeek">Last Week</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="customWeeks">Custom Weeks</SelectItem>
              <SelectItem value="customDates">Custom Dates</SelectItem>
            </SelectContent>
          </Select>
          {previewRange && (
            <p className="text-sm text-muted-foreground">{previewRange}</p>
          )}
        </div>

        {showWeekInputs && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startWeek">Start Week</Label>
              <Input
                id="startWeek"
                placeholder="YYYY-Www"
                value={startWeek}
                onChange={(e) => setStartWeek(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endWeek">End Week</Label>
              <Input
                id="endWeek"
                placeholder="YYYY-Www"
                value={endWeek}
                onChange={(e) => setEndWeek(e.target.value)}
              />
            </div>
          </div>
        )}

        {showDateInputs && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="status">Timecard Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="INVOICED">Invoiced</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="format">Export Format</Label>
          <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as "detailed" | "quickbooks")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="detailed">Detailed (all entries)</SelectItem>
              <SelectItem value="quickbooks">QuickBooks Invoice Import</SelectItem>
            </SelectContent>
          </Select>
          {exportFormat === "quickbooks" && (
            <p className="text-sm text-muted-foreground">
              Grouped by client/project with totals for QuickBooks import
            </p>
          )}
        </div>

        {exportFormat === "quickbooks" && (
          <div className="space-y-2">
            <Label htmlFor="invoiceNo">Starting Invoice Number</Label>
            <Input
              id="invoiceNo"
              type="number"
              min="1"
              value={startingInvoiceNo}
              onChange={(e) => setStartingInvoiceNo(e.target.value)}
            />
          </div>
        )}

        <Button onClick={handleExport} className="w-full">
          <Download className="mr-2 h-4 w-4" />
          Download CSV
        </Button>
      </CardContent>
    </Card>
  )
}
