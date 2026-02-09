import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getUsers } from "@/app/actions/users"
import { UserTable } from "@/components/team/user-table"
import { ToggleArchived } from "@/components/team/toggle-archived"

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ showArchived?: string }>
}) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    redirect("/timesheet")
  }

  const params = await searchParams
  const showArchived = params.showArchived === "true"
  const users = await getUsers(showArchived)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-muted-foreground">
            Manage team members, roles, and pay rates.
          </p>
        </div>
        <ToggleArchived showArchived={showArchived} />
      </div>
      <UserTable users={users} showArchived={showArchived} />
    </div>
  )
}
