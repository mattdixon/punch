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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MoreHorizontal, Search, Plus } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { ProjectFormDialog } from "./project-form-dialog"
import { archiveProject, restoreProject } from "@/app/actions/projects"
import { toast } from "sonner"

type Project = {
  id: string
  name: string
  clientId: string
  defaultBillCents: number
  paymentTerms: string
  archivedAt: Date | null
  client: { id: string; name: string }
  _count: { assignments: number }
}

type Client = {
  id: string
  name: string
}

type CompanyDefaults = {
  paymentTerms: string
  billRateCents: number
}

export function ProjectTable({
  projects,
  clients,
  companyDefaults,
}: {
  projects: Project[]
  clients: Client[]
  companyDefaults?: CompanyDefaults
}) {
  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<Project | null>(null)
  const [archiving, setArchiving] = useState(false)

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client.name.toLowerCase().includes(search.toLowerCase())
  )

  async function handleArchive() {
    if (!archiveTarget) return
    setArchiving(true)
    try {
      await archiveProject(archiveTarget.id)
      setArchiveTarget(null)
      toast.success("Project archived")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to archive project")
    } finally {
      setArchiving(false)
    }
  }

  async function handleRestore(id: string) {
    try {
      await restoreProject(id)
      toast.success("Project restored")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to restore project")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by project or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Project
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Default Bill Rate</TableHead>
              <TableHead>Payment Terms</TableHead>
              <TableHead className="text-right">Assigned</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {search ? "No projects match your search." : "No projects found."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((project) => (
                <TableRow key={project.id} className={project.archivedAt ? "opacity-60" : ""}>
                  <TableCell className="font-medium">
                          <Link href={`/projects/${project.id}`} className="hover:underline">
                            {project.name}
                          </Link>
                        </TableCell>
                  <TableCell>{project.client.name}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(project.defaultBillCents)}/hr
                  </TableCell>
                  <TableCell>{project.paymentTerms}</TableCell>
                  <TableCell className="text-right">
                    {project._count.assignments}
                  </TableCell>
                  <TableCell>
                    {project.archivedAt ? (
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
                        <DropdownMenuItem onClick={() => setEditProject(project)}>
                          Edit
                        </DropdownMenuItem>
                        {project.archivedAt ? (
                          <DropdownMenuItem onClick={() => handleRestore(project.id)}>
                            Restore
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => setArchiveTarget(project)}
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

      <ProjectFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        clients={clients}
        companyDefaults={companyDefaults}
      />

      {editProject && (
        <ProjectFormDialog
          open={!!editProject}
          onOpenChange={(open) => !open && setEditProject(null)}
          clients={clients}
          project={editProject}
          companyDefaults={companyDefaults}
        />
      )}

      <Dialog open={!!archiveTarget} onOpenChange={(open) => !open && setArchiveTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Archive Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to archive <strong>{archiveTarget?.name}</strong>?
              It will be hidden from active lists. You can restore it later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleArchive} disabled={archiving}>
              {archiving ? "Archiving..." : "Archive Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
