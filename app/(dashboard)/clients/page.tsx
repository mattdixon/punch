import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getClients } from "@/app/actions/clients"
import { ClientTable } from "@/components/clients/client-table"
import { ToggleArchived } from "@/components/team/toggle-archived"

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ showArchived?: string }>
}) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "OWNER") {
    redirect("/timesheet")
  }

  const params = await searchParams
  const showArchived = params.showArchived === "true"
  const clients = await getClients(showArchived)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground">
            Manage clients and their projects.
          </p>
        </div>
        <ToggleArchived showArchived={showArchived} />
      </div>
      <ClientTable clients={clients} />
    </div>
  )
}
