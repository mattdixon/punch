import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { getProjectWithAssignments, getUnassignedUsers } from "@/app/actions/assignments"
import { AssignmentTable } from "@/components/assignments/assignment-table"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "OWNER") {
    redirect("/timesheet")
  }

  const { id } = await params
  const project = await getProjectWithAssignments(id)
  if (!project) {
    notFound()
  }

  const unassignedUsers = await getUnassignedUsers(id)

  return (
    <div className="space-y-6">
      <div>
        <Link href="/projects">
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.archivedAt && (
            <Badge variant="outline" className="text-muted-foreground">
              Archived
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          {project.client.name} &middot; Default bill rate: {formatCurrency(project.defaultBillCents)}/hr
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Team Assignments</h2>
        <AssignmentTable
          projectId={id}
          assignments={project.assignments}
          unassignedUsers={unassignedUsers}
          projectDefaultBillCents={project.defaultBillCents}
        />
      </div>
    </div>
  )
}
