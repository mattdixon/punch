import { listOrganizations } from "@/app/actions/admin/tenants"
import { TenantTable } from "@/components/admin/tenant-table"

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>
}) {
  const params = await searchParams
  const orgs = await listOrganizations({
    search: params.search || undefined,
    status: params.status as "ACTIVE" | "SUSPENDED" | "DELETED" | undefined,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tenants</h1>
        <p className="text-muted-foreground">
          Manage all organizations on the platform.
        </p>
      </div>
      <TenantTable tenants={orgs} />
    </div>
  )
}
