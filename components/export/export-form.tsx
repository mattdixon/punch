"use client"

import { useState, useMemo, useCallback } from "react"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Download, Search, Loader2 } from "lucide-react"
import { getWeekString } from "@/lib/utils"
import { getExportPreview } from "@/app/actions/export"
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

type FilterOptions = {
  clients: { id: string; name: string }[]
  projects: { id: string; name: string; clientId: string }[]
  users: { id: string; name: string }[]
}

type PreviewData = {
  entries: {
    date: string
    user: string
    client: string
    project: string
    hours: number
    notes: string | null
  }[]
  totalCount: number
  totalHours: number
  showing: number
}

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

export function ExportForm({ filterOptions }: { filterOptions: FilterOptions }) {
  const currentWeek = getWeekString(new Date())
  const [rangeType, setRangeType] = useState<DateRangeType>("thisMonth")
  const [startWeek, setStartWeek] = useState(currentWeek)
  const [endWeek, setEndWeek] = useState(currentWeek)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [status, setStatus] = useState("APPROVED")
  const [clientId, setClientId] = useState("")
  const [projectId, setProjectId] = useState("")
  const [userId, setUserId] = useState("")
  const [exportFormat, setExportFormat] = useState<"detailed" | "quickbooks">("quickbooks")
  const [startingInvoiceNo, setStartingInvoiceNo] = useState("1001")
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [previewing, setPreviewing] = useState(false)

  const showWeekInputs = rangeType === "customWeeks"
  const showDateInputs = rangeType === "customDates"

  const filteredProjects = useMemo(() => {
    if (!clientId) return filterOptions.projects
    return filterOptions.projects.filter((p) => p.clientId === clientId)
  }, [clientId, filterOptions.projects])

  const previewRange = useMemo(() => {
    if (rangeType === "customWeeks" || rangeType === "customDates") return null
    const { startDate, endDate } = getDateRangeValues(rangeType)
    return `${startDate} to ${endDate}`
  }, [rangeType])

  function buildParams() {
    const params: Record<string, string> = {}

    if (rangeType === "customWeeks") {
      if (startWeek) params.startWeek = startWeek
      if (endWeek) params.endWeek = endWeek
    } else if (rangeType === "customDates") {
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
    } else {
      const range = getDateRangeValues(rangeType)
      params.startDate = range.startDate
      params.endDate = range.endDate
    }

    if (status && status !== "ALL") params.status = status
    if (clientId) params.clientId = clientId
    if (projectId) params.projectId = projectId
    if (userId) params.userId = userId

    return params
  }

  const handlePreview = useCallback(async () => {
    setPreviewing(true)
    try {
      const result = await getExportPreview(buildParams())
      setPreview(result)
    } catch {
      setPreview(null)
    } finally {
      setPreviewing(false)
    }
  }, [rangeType, startWeek, endWeek, startDate, endDate, status, clientId, projectId, userId])

  function handleExport() {
    const params = new URLSearchParams(buildParams())
    if (exportFormat === "quickbooks") {
      params.set("format", "quickbooks")
      if (startingInvoiceNo) params.set("invoiceNo", startingInvoiceNo)
    }
    window.open(`/api/export?${params.toString()}`, "_blank")
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Export Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Date Range</Label>
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
                <Label>Start Week</Label>
                <Input
                  placeholder="YYYY-Www"
                  value={startWeek}
                  onChange={(e) => setStartWeek(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Week</Label>
                <Input
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
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Timecard Status</Label>
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
            <Label>Client</Label>
            <Select value={clientId || "ALL"} onValueChange={(v) => {
              setClientId(v === "ALL" ? "" : v)
              setProjectId("")
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Clients</SelectItem>
                {filterOptions.clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Project</Label>
            <Select value={projectId || "ALL"} onValueChange={(v) => setProjectId(v === "ALL" ? "" : v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Projects</SelectItem>
                {filteredProjects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Team Member</Label>
            <Select value={userId || "ALL"} onValueChange={(v) => setUserId(v === "ALL" ? "" : v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Members</SelectItem>
                {filterOptions.users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as "detailed" | "quickbooks")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="detailed">Detailed (all entries)</SelectItem>
                <SelectItem value="quickbooks">QuickBooks Invoice Import</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {exportFormat === "quickbooks" && (
            <div className="space-y-2">
              <Label>Starting Invoice Number</Label>
              <Input
                type="number"
                min="1"
                value={startingInvoiceNo}
                onChange={(e) => setStartingInvoiceNo(e.target.value)}
              />
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={handlePreview} disabled={previewing}>
              {previewing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Preview
            </Button>
            <Button className="flex-1" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Download CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Preview</span>
            {preview && (
              <span className="text-sm font-normal text-muted-foreground">
                Showing {preview.showing} of {preview.totalCount} entries
                {" \u00B7 "}
                {preview.totalHours.toFixed(1)} hours total
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!preview ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Click Preview to see matching entries
            </div>
          ) : preview.entries.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              No entries match the selected filters
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.entries.map((entry, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-sm">{entry.date}</TableCell>
                      <TableCell>{entry.user}</TableCell>
                      <TableCell>{entry.client}</TableCell>
                      <TableCell>{entry.project}</TableCell>
                      <TableCell className="text-right font-mono">{entry.hours}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {entry.notes || ""}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
