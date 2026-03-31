import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ExportForm } from "@/components/export/export-form"
import { getExportFilterOptions } from "@/app/actions/export"

export default async function ExportPage() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "OWNER") {
    redirect("/timesheet")
  }

  const filterOptions = await getExportFilterOptions()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Export</h1>
        <p className="text-muted-foreground">
          Download time entries as CSV for invoicing.
        </p>
      </div>
      <ExportForm filterOptions={filterOptions} />
    </div>
  )
}
