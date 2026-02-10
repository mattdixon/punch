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
import { createProject, updateProject } from "@/app/actions/projects"
import { toast } from "sonner"

type Project = {
  id: string
  name: string
  clientId: string
  defaultBillCents: number
  paymentTerms: string
}

const PAYMENT_TERMS_OPTIONS = [
  "Due on receipt",
  "Net 15",
  "Net 30",
  "Net 60",
]

type Client = {
  id: string
  name: string
}

type CompanyDefaults = {
  paymentTerms: string
  billRateCents: number
}

export function ProjectFormDialog({
  open,
  onOpenChange,
  clients,
  project,
  companyDefaults,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  clients: Client[]
  project?: Project
  companyDefaults?: CompanyDefaults
}) {
  const isEditing = !!project
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(project?.name ?? "")
  const [clientId, setClientId] = useState(project?.clientId ?? "")
  const [billRate, setBillRate] = useState(
    project
      ? (project.defaultBillCents / 100).toFixed(2)
      : companyDefaults?.billRateCents
        ? (companyDefaults.billRateCents / 100).toFixed(2)
        : ""
  )
  const [paymentTerms, setPaymentTerms] = useState(
    project?.paymentTerms ?? companyDefaults?.paymentTerms ?? "Net 30"
  )

  function reset() {
    setName(project?.name ?? "")
    setClientId(project?.clientId ?? "")
    setBillRate(
      project
        ? (project.defaultBillCents / 100).toFixed(2)
        : companyDefaults?.billRateCents
          ? (companyDefaults.billRateCents / 100).toFixed(2)
          : ""
    )
    setPaymentTerms(project?.paymentTerms ?? companyDefaults?.paymentTerms ?? "Net 30")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const defaultBillCents = Math.round(parseFloat(billRate || "0") * 100)

    try {
      if (isEditing) {
        await updateProject(project.id, { name, clientId, defaultBillCents, paymentTerms })
        toast.success("Project updated")
      } else {
        await createProject({ name, clientId, defaultBillCents, paymentTerms })
        toast.success("Project created")
        setName("")
        setClientId("")
        setBillRate(
          companyDefaults?.billRateCents
            ? (companyDefaults.billRateCents / 100).toFixed(2)
            : ""
        )
        setPaymentTerms(companyDefaults?.paymentTerms ?? "Net 30")
      }
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save project")
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
          <DialogTitle>{isEditing ? "Edit Project" : "Add Project"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Name</Label>
            <Input
              id="projectName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client">Client</Label>
            <Select value={clientId} onValueChange={setClientId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="billRate">Default Bill Rate ($/hr)</Label>
            <Input
              id="billRate"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={billRate}
              onChange={(e) => setBillRate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentTerms">Payment Terms</Label>
            <Select value={paymentTerms} onValueChange={setPaymentTerms}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_TERMS_OPTIONS.map((term) => (
                  <SelectItem key={term} value={term}>
                    {term}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !clientId}>
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
