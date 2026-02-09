"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"

type User = {
  id: string
  name: string
}

export function ArchiveDialog({
  user,
  onOpenChange,
  onConfirm,
}: {
  user: User | null
  onOpenChange: (open: boolean) => void
  onConfirm: (id: string) => Promise<void>
}) {
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    if (!user) return
    setLoading(true)
    await onConfirm(user.id)
    setLoading(false)
  }

  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Archive User</DialogTitle>
          <DialogDescription>
            Are you sure you want to archive <strong>{user?.name}</strong>? They
            will no longer be able to log in. You can restore them later.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? "Archiving..." : "Archive User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
