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
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Plus, Search, UserPlus } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { UserFormDialog } from "./user-form-dialog"
import { ArchiveDialog } from "./archive-dialog"
import { PasswordDialog } from "./password-dialog"
import { archiveUser, restoreUser, resetUserPassword } from "@/app/actions/users"
import { toast } from "sonner"

type User = {
  id: string
  name: string
  email: string
  role: "ADMIN" | "MEMBER"
  defaultPayCents: number
  archivedAt: Date | null
  createdAt: Date
}

export function UserTable({
  users,
  showArchived,
  companyDefaultPayCents,
}: {
  users: User[]
  showArchived: boolean
  companyDefaultPayCents?: number
}) {
  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<User | null>(null)
  const [tempPassword, setTempPassword] = useState<{ name: string; password: string } | null>(null)

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  async function handleArchive(id: string) {
    try {
      await archiveUser(id)
      setArchiveTarget(null)
      toast.success("User archived")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to archive user")
    }
  }

  async function handleRestore(id: string) {
    try {
      await restoreUser(id)
      toast.success("User restored")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to restore user")
    }
  }

  async function handleResetPassword(id: string, name: string) {
    try {
      const result = await resetUserPassword(id)
      setTempPassword({ name, password: result.tempPassword })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reset password")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Default Pay Rate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {search ? "No users match your search." : "No users found."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((user) => (
                <TableRow key={user.id} className={user.archivedAt ? "opacity-60" : ""}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(user.defaultPayCents)}/hr
                  </TableCell>
                  <TableCell>
                    {user.archivedAt ? (
                      <Badge variant="outline" className="text-muted-foreground">
                        Archived
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Active
                      </Badge>
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
                        <DropdownMenuItem onClick={() => setEditUser(user)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleResetPassword(user.id, user.name)}>
                          Reset Password
                        </DropdownMenuItem>
                        {user.archivedAt ? (
                          <DropdownMenuItem onClick={() => handleRestore(user.id)}>
                            Restore
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => setArchiveTarget(user)}
                            className="text-destructive"
                          >
                            Archive
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <UserFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onPasswordGenerated={(name, password) => setTempPassword({ name, password })}
        companyDefaultPayCents={companyDefaultPayCents}
      />

      {editUser && (
        <UserFormDialog
          open={!!editUser}
          onOpenChange={(open) => !open && setEditUser(null)}
          user={editUser}
        />
      )}

      <ArchiveDialog
        user={archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        onConfirm={handleArchive}
      />

      <PasswordDialog
        data={tempPassword}
        onOpenChange={(open) => !open && setTempPassword(null)}
      />
    </div>
  )
}
