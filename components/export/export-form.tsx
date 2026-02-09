"use client"

import { useState } from "react"
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

export function ExportForm() {
  const currentWeek = getWeekString(new Date())
  const [startWeek, setStartWeek] = useState(currentWeek)
  const [endWeek, setEndWeek] = useState(currentWeek)
  const [status, setStatus] = useState("APPROVED")

  function handleExport() {
    const params = new URLSearchParams()
    if (startWeek) params.set("startWeek", startWeek)
    if (endWeek) params.set("endWeek", endWeek)
    if (status && status !== "ALL") params.set("status", status)
    window.open(`/api/export?${params.toString()}`, "_blank")
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Export Time Entries</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
        <Button onClick={handleExport} className="w-full">
          <Download className="mr-2 h-4 w-4" />
          Download CSV
        </Button>
      </CardContent>
    </Card>
  )
}
