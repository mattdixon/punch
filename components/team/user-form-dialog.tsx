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
import { createUser, updateUser } from "@/app/actions/users"
import { toast } from "sonner"

type User = {
  id: string
  name: string
  email: string
  role: "OWNER" | "ADMIN" | "MEMBER"
  defaultPayCents: number
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  onUserCreated,
  companyDefaultPayCents,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User
  onUserCreated?: (result: {
    name: string
    tempPassword?: string
    emailSent?: boolean
  }) => void
  companyDefaultPayCents?: number
}) {
  const isEditing = !!user
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(user?.name ?? "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [role, setRole] = useState<"OWNER" | "ADMIN" | "MEMBER">(user?.role ?? "MEMBER")
  const [payRate, setPayRate] = useState(
    user
      ? (user.defaultPayCents / 100).toFixed(2)
      : companyDefaultPayCents
        ? (companyDefaultPayCents / 100).toFixed(2)
        : ""
  )

  function reset() {
    setName(user?.name ?? "")
    setEmail(user?.email ?? "")
    setRole(user?.role ?? "MEMBER")
    setPayRate(
      user
        ? (user.defaultPayCents / 100).toFixed(2)
        : companyDefaultPayCents
          ? (companyDefaultPayCents / 100).toFixed(2)
          : ""
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const defaultPayCents = Math.round(parseFloat(payRate || "0") * 100)

    try {
      if (isEditing) {
        await updateUser(user.id, { name, email, role, defaultPayCents })
        toast.success("User updated")
        onOpenChange(false)
      } else {
        const result = await createUser({ name, email, role, defaultPayCents })
        toast.success("User created")
        onOpenChange(false)
        reset()
        onUserCreated?.({ name, ...result })
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save user")
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
          <DialogTitle>{isEditing ? "Edit User" : "Add User"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "OWNER" | "ADMIN" | "MEMBER")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payRate">Default Pay Rate ($/hr)</Label>
            <Input
              id="payRate"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={payRate}
              onChange={(e) => setPayRate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
