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
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MoreHorizontal, UserPlus } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { AssignmentFormDialog } from "./assignment-form-dialog"
import { removeAssignment } from "@/app/actions/assignments"
import { toast } from "sonner"

type Assignment = {
  id: string
  userId: string
  payRateCents: number | null
  billRateCents: number | null
  user: {
    id: string
    name: string
    email: string
    defaultPayCents: number
    archivedAt: Date | null
  }
}

type UnassignedUser = {
  id: string
  name: string
  email: string
  defaultPayCents: number
}

export function AssignmentTable({
  projectId,
  assignments,
  unassignedUsers,
  projectDefaultBillCents,
}: {
  projectId: string
  assignments: Assignment[]
  unassignedUsers: UnassignedUser[]
  projectDefaultBillCents: number
}) {
  const [addOpen, setAddOpen] = useState(false)
  const [editAssignment, setEditAssignment] = useState<Assignment | null>(null)
  const [removeTarget, setRemoveTarget] = useState<Assignment | null>(null)
  const [removing, setRemoving] = useState(false)

  async function handleRemove() {
    if (!removeTarget) return
    setRemoving(true)
    try {
      await removeAssignment(removeTarget.id)
      setRemoveTarget(null)
      toast.success("Assignment removed")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove assignment")
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setAddOpen(true)} disabled={unassignedUsers.length === 0}>
          <UserPlus className="mr-2 h-4 w-4" />
          Assign User
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Pay Rate</TableHead>
              <TableHead className="text-right">Bill Rate</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No users assigned to this project yet.
                </TableCell>
              </TableRow>
            ) : (
              assignments.map((assignment) => (
                <TableRow
                  key={assignment.id}
                  className={assignment.user.archivedAt ? "opacity-60" : ""}
                >
                  <TableCell className="font-medium">{assignment.user.name}</TableCell>
                  <TableCell>{assignment.user.email}</TableCell>
                  <TableCell className="text-right font-mono">
                    {assignment.payRateCents !== null ? (
                      formatCurrency(assignment.payRateCents)
                    ) : (
                      <span className="text-muted-foreground">
                        {formatCurrency(assignment.user.defaultPayCents)}
                      </span>
                    )}
                    /hr
                    {assignment.payRateCents !== null && (
                      <span className="text-xs text-muted-foreground ml-1">(override)</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {assignment.billRateCents !== null ? (
                      formatCurrency(assignment.billRateCents)
                    ) : (
                      <span className="text-muted-foreground">
                        {formatCurrency(projectDefaultBillCents)}
                      </span>
                    )}
                    /hr
                    {assignment.billRateCents !== null && (
                      <span className="text-xs text-muted-foreground ml-1">(override)</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditAssignment(assignment)}>
                          Edit Rates
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setRemoveTarget(assignment)}
                          className="text-destructive"
                        >
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AssignmentFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        projectId={projectId}
        users={unassignedUsers}
      />

      {editAssignment && (
        <AssignmentFormDialog
          open={!!editAssignment}
          onOpenChange={(open) => !open && setEditAssignment(null)}
          projectId={projectId}
          assignment={editAssignment}
        />
      )}

      <Dialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Assignment</DialogTitle>
            <DialogDescription>
              Remove <strong>{removeTarget?.user.name}</strong> from this project?
              This won&apos;t delete their existing time entries.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemove} disabled={removing}>
              {removing ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
