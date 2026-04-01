"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
import { ArrowLeft, Shield, LogIn } from "lucide-react"
import {
  adminResetPassword,
  adminArchiveUser,
  adminRestoreUser,
  adminToggleSuperAdmin,
} from "@/app/actions/admin/users"
import { startImpersonation } from "@/app/actions/admin/impersonation"
import { toast } from "sonner"

type UserDetail = {
  id: string
  name: string
  email: string
  role: string
  isSuperAdmin: boolean
  defaultPayCents: number
  isArchived: boolean
  createdAt: string
  org: {
    id: string
    companyName: string
    slug: string
  } | null
  assignments: {
    id: string
    projectName: string
    clientName: string
    payRateCents: number | null
    billRateCents: number | null
  }[]
}

function formatCurrency(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export function AdminUserDetail({ user }: { user: UserDetail }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  async function handleResetPassword() {
    setLoading(true)
    try {
      const result = await adminResetPassword(user.id)
      if (result.emailSent) {
        toast.success("Password reset email sent")
      } else if (result.tempPassword) {
        setTempPassword(result.tempPassword)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset password")
    } finally {
      setLoading(false)
    }
  }

  async function handleArchive() {
    setLoading(true)
    try {
      await adminArchiveUser(user.id)
      toast.success("User archived")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to archive user")
    } finally {
      setLoading(false)
    }
  }

  async function handleRestore() {
    setLoading(true)
    try {
      await adminRestoreUser(user.id)
      toast.success("User restored")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to restore user")
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleSuperAdmin() {
    setLoading(true)
    try {
      await adminToggleSuperAdmin(user.id)
      toast.success(user.isSuperAdmin ? "Super admin removed" : "Super admin granted")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <Badge variant="outline">{user.role}</Badge>
            {user.isSuperAdmin && (
              <Badge variant="destructive">SUPER ADMIN</Badge>
            )}
            {user.isArchived && (
              <Badge variant="secondary">Archived</Badge>
            )}
          </div>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex gap-2">
          {!user.isArchived && user.org && (
            <form action={() => startImpersonation(user.id)}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
              >
                <LogIn className="mr-2 h-3.5 w-3.5" />
                Login As
              </Button>
            </form>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={handleResetPassword}
          >
            Reset Password
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={handleToggleSuperAdmin}
          >
            <Shield className="mr-2 h-3.5 w-3.5" />
            {user.isSuperAdmin ? "Remove Super Admin" : "Make Super Admin"}
          </Button>
          {user.isArchived ? (
            <Button
              variant="default"
              size="sm"
              disabled={loading}
              onClick={handleRestore}
            >
              Restore
            </Button>
          ) : (
            <Button
              variant="destructive"
              size="sm"
              disabled={loading}
              onClick={handleArchive}
            >
              Archive
            </Button>
          )}
        </div>
      </div>

      {tempPassword && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30">
          <CardContent className="pt-4">
            <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
              Temporary password:{" "}
              <code className="rounded bg-orange-100 dark:bg-orange-900/50 px-2 py-1 font-mono text-sm">
                {tempPassword}
              </code>
            </p>
            <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
              Share this securely with the user. They should change it on first login.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Organization</dt>
                <dd className="font-medium">
                  {user.org ? (
                    <Link
                      href={`/admin/tenants/${user.org.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {user.org.companyName}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">No organization</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Default Pay Rate</dt>
                <dd className="font-medium">{formatCurrency(user.defaultPayCents)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Joined</dt>
                <dd className="font-medium">
                  {new Date(user.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Assignments</CardTitle>
            <CardDescription>
              {user.assignments.length} assignment{user.assignments.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user.assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No project assignments.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead className="text-right">Pay Rate</TableHead>
                    <TableHead className="text-right">Bill Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.assignments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-muted-foreground">{a.clientName}</TableCell>
                      <TableCell className="font-medium">{a.projectName}</TableCell>
                      <TableCell className="text-right">
                        {a.payRateCents != null ? formatCurrency(a.payRateCents) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {a.billRateCents != null ? formatCurrency(a.billRateCents) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
