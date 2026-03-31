import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getProjects, getActiveClients } from "@/app/actions/projects"
import { getCompanySettings } from "@/app/actions/settings"
import { ProjectTable } from "@/components/projects/project-table"
import { ToggleArchived } from "@/components/team/toggle-archived"

export default async function ProjectsPage({
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
  const [projects, clients, settings] = await Promise.all([
    getProjects(showArchived),
    getActiveClients(),
    getCompanySettings(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Manage projects, assign clients, and set bill rates.
          </p>
        </div>
        <ToggleArchived showArchived={showArchived} />
      </div>
      <ProjectTable
        projects={projects}
        clients={clients}
        companyDefaults={{
          paymentTerms: settings.defaultPaymentTerms,
          billRateCents: settings.defaultBillCents,
        }}
      />
    </div>
  )
}
