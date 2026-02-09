"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { approveTimecard, rejectTimecard, markInvoiced } from "@/app/actions/approvals"
import { toast } from "sonner"
import { Check, X, Receipt } from "lucide-react"
import { getWeekDates } from "@/lib/utils"

type Timecard = {
  id: string
  week: string
  status: string
  submittedAt: Date | null
  approvedAt: Date | null
  user: { id: string; name: string; email: string }
}

type TimecardEntry = {
  id: string
  projectName: string
  clientName: string
  date: string
  hours: number
  notes: string | null
}

export function ApprovalsList({
  pending,
  approved,
  entries,
}: {
  pending: Timecard[]
  approved: Timecard[]
  entries: Record<string, TimecardEntry[]>
}) {
  const [detailId, setDetailId] = useState<string | null>(null)
  const [acting, setActing] = useState(false)

  const detailCard = [...pending, ...approved].find((t) => t.id === detailId)
  const detailEntries = detailId ? entries[detailId] ?? [] : []

  async function handleAction(id: string, action: "approve" | "reject" | "invoice") {
    setActing(true)
    try {
      if (action === "approve") {
        await approveTimecard(id)
        toast.success("Timecard approved")
      } else if (action === "reject") {
        await rejectTimecard(id)
        toast.success("Timecard returned to user")
      } else {
        await markInvoiced(id)
        toast.success("Timecard marked as invoiced")
      }
      setDetailId(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed")
    } finally {
      setActing(false)
    }
  }

  // Calculate total hours for a timecard
  function totalHours(timecardId: string) {
    return (entries[timecardId] ?? []).reduce((sum, e) => sum + e.hours, 0)
  }

  return (
    <div className="space-y-8">
      {/* Pending Approval */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Pending Approval ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-muted-foreground text-sm">No timecards pending approval.</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Week</TableHead>
                  <TableHead className="text-right">Total Hours</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="w-[150px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((tc) => (
                  <TableRow key={tc.id}>
                    <TableCell className="font-medium">{tc.user.name}</TableCell>
                    <TableCell>{tc.week}</TableCell>
                    <TableCell className="text-right font-mono">{totalHours(tc.id)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {tc.submittedAt
                        ? new Date(tc.submittedAt).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="outline" onClick={() => setDetailId(tc.id)}>
                          Review
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAction(tc.id, "approve")}
                          disabled={acting}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAction(tc.id, "reject")}
                          disabled={acting}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Approved - Ready to Invoice */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Approved - Ready to Invoice ({approved.length})</h2>
        {approved.length === 0 ? (
          <p className="text-muted-foreground text-sm">No approved timecards.</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Week</TableHead>
                  <TableHead className="text-right">Total Hours</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead className="w-[120px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approved.map((tc) => (
                  <TableRow key={tc.id}>
                    <TableCell className="font-medium">{tc.user.name}</TableCell>
                    <TableCell>{tc.week}</TableCell>
                    <TableCell className="text-right font-mono">{totalHours(tc.id)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {tc.approvedAt
                        ? new Date(tc.approvedAt).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="outline" onClick={() => setDetailId(tc.id)}>
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAction(tc.id, "invoice")}
                          disabled={acting}
                        >
                          <Receipt className="mr-1 h-4 w-4" />
                          Invoice
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detailId} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detailCard?.user.name} — {detailCard?.week}
            </DialogTitle>
            <DialogDescription>
              {totalHours(detailId ?? "")} total hours
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailEntries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-sm text-muted-foreground">{e.clientName}</TableCell>
                    <TableCell className="font-medium">{e.projectName}</TableCell>
                    <TableCell className="text-sm">{e.date}</TableCell>
                    <TableCell className="text-right font-mono">{e.hours}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                      {e.notes || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            {detailCard?.status === "SUBMITTED" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleAction(detailCard.id, "reject")}
                  disabled={acting}
                >
                  <X className="mr-2 h-4 w-4" />
                  Return
                </Button>
                <Button
                  onClick={() => handleAction(detailCard.id, "approve")}
                  disabled={acting}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </>
            )}
            {detailCard?.status === "APPROVED" && (
              <Button
                onClick={() => handleAction(detailCard.id, "invoice")}
                disabled={acting}
              >
                <Receipt className="mr-2 h-4 w-4" />
                Mark Invoiced
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
