"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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
import { createAssignment, updateAssignment } from "@/app/actions/assignments"
import { toast } from "sonner"

type Assignment = {
  id: string
  userId: string
  payRateCents: number | null
  billRateCents: number | null
  user: { name: string }
}

type User = {
  id: string
  name: string
  email: string
}

export function AssignmentFormDialog({
  open,
  onOpenChange,
  projectId,
  users,
  assignment,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  users?: User[]
  assignment?: Assignment
}) {
  const isEditing = !!assignment
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState("")
  const [payRate, setPayRate] = useState(
    assignment?.payRateCents != null ? (assignment.payRateCents / 100).toFixed(2) : ""
  )
  const [billRate, setBillRate] = useState(
    assignment?.billRateCents != null ? (assignment.billRateCents / 100).toFixed(2) : ""
  )

  function reset() {
    setUserId("")
    setPayRate(assignment?.payRateCents != null ? (assignment.payRateCents / 100).toFixed(2) : "")
    setBillRate(assignment?.billRateCents != null ? (assignment.billRateCents / 100).toFixed(2) : "")
  }

  function parseCents(value: string): number | null {
    if (!value.trim()) return null
    return Math.round(parseFloat(value) * 100)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      if (isEditing) {
        await updateAssignment(assignment.id, {
          payRateCents: parseCents(payRate),
          billRateCents: parseCents(billRate),
        })
        toast.success("Assignment updated")
      } else {
        await createAssignment({
          projectId,
          userId,
          payRateCents: parseCents(payRate),
          billRateCents: parseCents(billRate),
        })
        toast.success("User assigned")
        reset()
      }
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save assignment")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Edit Rates - ${assignment.user.name}` : "Assign User"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEditing && users && (
            <div className="space-y-2">
              <Label htmlFor="user">User</Label>
              <Select value={userId} onValueChange={setUserId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="payRate">Pay Rate Override ($/hr)</Label>
            <Input
              id="payRate"
              type="number"
              min="0"
              step="0.01"
              placeholder="Leave blank to use default"
              value={payRate}
              onChange={(e) => setPayRate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to use the user&apos;s default pay rate.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="billRate">Bill Rate Override ($/hr)</Label>
            <Input
              id="billRate"
              type="number"
              min="0"
              step="0.01"
              placeholder="Leave blank to use default"
              value={billRate}
              onChange={(e) => setBillRate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to use the project&apos;s default bill rate.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || (!isEditing && !userId)}>
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Assign User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
