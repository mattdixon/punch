import { listAllUsers } from "@/app/actions/admin/users"
import { AdminUserTable } from "@/components/admin/admin-user-table"

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; orgId?: string; role?: string; showArchived?: string }>
}) {
  const params = await searchParams
  const users = await listAllUsers({
    search: params.search || undefined,
    orgId: params.orgId || undefined,
    role: params.role || undefined,
    showArchived: params.showArchived === "true",
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">All Users</h1>
        <p className="text-muted-foreground">
          Manage users across all organizations.
        </p>
      </div>
      <AdminUserTable users={users} />
    </div>
  )
}
