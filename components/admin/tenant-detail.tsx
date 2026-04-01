"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { ArrowLeft, Building2, Users, FolderOpen, Briefcase, LogIn } from "lucide-react"
import { updateOrganizationStatus, updateOrganization, updateTrialEndDate } from "@/app/actions/admin/tenants"
import { startImpersonation } from "@/app/actions/admin/impersonation"
import { toast } from "sonner"
import Link from "next/link"

type OrgDetail = {
  id: string
  companyName: string
  slug: string
  status: string
  defaultPaymentTerms: string
  defaultBillCents: number
  defaultPayCents: number
  defaultCurrency: string
  trialEndsAt: string | null
  createdAt: string
  updatedAt: string
  clientCount: number
  projectCount: number
  users: {
    id: string
    name: string
    email: string
    role: string
    isArchived: boolean
    createdAt: string
  }[]
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "ACTIVE":
      return <Badge variant="default" className="bg-green-600">Active</Badge>
    case "SUSPENDED":
      return <Badge variant="destructive">Suspended</Badge>
    case "DELETED":
      return <Badge variant="secondary">Deleted</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function formatCurrency(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export function TenantDetail({ org }: { org: OrgDetail }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [editName, setEditName] = useState(org.companyName)
  const [editOpen, setEditOpen] = useState(false)
  const [trialDate, setTrialDate] = useState(org.trialEndsAt?.split("T")[0] ?? "")

  async function handleStatusChange(status: "ACTIVE" | "SUSPENDED" | "DELETED") {
    setLoading(true)
    try {
      await updateOrganizationStatus(org.id, status)
      toast.success(`Organization ${status.toLowerCase()}`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status")
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateTrial(newDate: string | null) {
    try {
      await updateTrialEndDate(org.id, newDate)
      toast.success(newDate ? "Trial date updated" : "Trial removed")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update trial")
    }
  }

  async function handleUpdateName() {
    try {
      await updateOrganization(org.id, { companyName: editName })
      toast.success("Organization name updated")
      setEditOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/tenants">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{org.companyName}</h1>
            <StatusBadge status={org.status} />
          </div>
          <p className="text-muted-foreground">/{org.slug}</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">Edit Name</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Organization Name</DialogTitle>
                <DialogDescription>
                  Change the display name for this organization.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleUpdateName}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {org.status === "ACTIVE" && (
            <Button
              variant="destructive"
              size="sm"
              disabled={loading}
              onClick={() => handleStatusChange("SUSPENDED")}
            >
              Suspend
            </Button>
          )}
          {org.status === "SUSPENDED" && (
            <>
              <Button
                variant="default"
                size="sm"
                disabled={loading}
                onClick={() => handleStatusChange("ACTIVE")}
              >
                Activate
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={loading}
                onClick={() => handleStatusChange("DELETED")}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{org.users.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{org.clientCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{org.projectCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {new Date(org.createdAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Organization configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Currency</dt>
              <dd className="font-medium">{org.defaultCurrency}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Payment Terms</dt>
              <dd className="font-medium">{org.defaultPaymentTerms}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Default Pay Rate</dt>
              <dd className="font-medium">{formatCurrency(org.defaultPayCents)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Default Bill Rate</dt>
              <dd className="font-medium">{formatCurrency(org.defaultBillCents)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trial</CardTitle>
          <CardDescription>
            {org.trialEndsAt
              ? new Date(org.trialEndsAt) > new Date()
                ? `Trial active until ${new Date(org.trialEndsAt).toLocaleDateString()}`
                : `Trial expired on ${new Date(org.trialEndsAt).toLocaleDateString()}`
              : "No trial restriction"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="trialDate" className="text-sm">Trial End Date</Label>
              <Input
                id="trialDate"
                type="date"
                value={trialDate}
                onChange={(e) => setTrialDate(e.target.value)}
                className="w-48"
              />
            </div>
            <Button
              size="sm"
              onClick={() => handleUpdateTrial(trialDate || null)}
            >
              {trialDate ? "Set Date" : "Remove Trial"}
            </Button>
            {org.trialEndsAt && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTrialDate("")
                  handleUpdateTrial(null)
                }}
              >
                Remove Trial
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            {org.users.length} user{org.users.length !== 1 ? "s" : ""} in this organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {org.users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {user.isArchived ? (
                      <Badge variant="secondary">Archived</Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-600">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {!user.isArchived && (
                      <form action={() => startImpersonation(user.id)}>
                        <Button type="submit" variant="ghost" size="icon" title="Login as this user">
                          <LogIn className="h-4 w-4" />
                        </Button>
                      </form>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
