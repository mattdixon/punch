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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { toast } from "sonner"

export function PasswordDialog({
  data,
  onOpenChange,
}: {
  data: { name: string; password: string } | null
  onOpenChange: (open: boolean) => void
}) {
  function copyPassword() {
    if (data) {
      navigator.clipboard.writeText(data.password)
      toast.success("Password copied to clipboard")
    }
  }

  return (
    <Dialog open={!!data} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Temporary Password</DialogTitle>
          <DialogDescription>
            Share this temporary password with <strong>{data?.name}</strong>.
            They should change it after their first login.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Password</Label>
          <div className="flex gap-2">
            <Input value={data?.password ?? ""} readOnly className="font-mono" />
            <Button type="button" variant="outline" size="icon" onClick={copyPassword}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
