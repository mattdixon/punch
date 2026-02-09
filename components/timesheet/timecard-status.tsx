"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { submitTimecard } from "@/app/actions/timesheet"
import { toast } from "sonner"
import { Send } from "lucide-react"

type TimecardInfo = {
  id: string
  status: string
  submittedAt: string | null
  approvedAt: string | null
} | null

const statusConfig: Record<string, { label: string; variant: "outline" | "default" | "secondary"; className: string }> = {
  OPEN: { label: "Open", variant: "outline", className: "text-green-600 border-green-600" },
  SUBMITTED: { label: "Submitted", variant: "secondary", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  APPROVED: { label: "Approved", variant: "secondary", className: "bg-green-100 text-green-800 border-green-300" },
  INVOICED: { label: "Invoiced", variant: "secondary", className: "bg-blue-100 text-blue-800 border-blue-300" },
}

export function TimecardStatus({
  timecard,
  week,
  hasEntries,
}: {
  timecard: TimecardInfo
  week: string
  hasEntries: boolean
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const status = timecard?.status ?? "OPEN"
  const config = statusConfig[status] ?? statusConfig.OPEN
  const canSubmit = status === "OPEN" && hasEntries

  async function handleSubmit() {
    setSubmitting(true)
    try {
      await submitTimecard(week)
      setConfirmOpen(false)
      toast.success("Timecard submitted for approval")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
      {canSubmit && (
        <Button size="sm" onClick={() => setConfirmOpen(true)}>
          <Send className="mr-2 h-4 w-4" />
          Submit for Approval
        </Button>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Timecard</DialogTitle>
            <DialogDescription>
              Submit your timecard for week <strong>{week}</strong> for approval?
              You won&apos;t be able to edit time entries after submission.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
