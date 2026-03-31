import { getOrganizationDetail } from "@/app/actions/admin/tenants"
import { TenantDetail } from "@/components/admin/tenant-detail"
import { notFound } from "next/navigation"

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = await params

  try {
    const org = await getOrganizationDetail(orgId)
    return <TenantDetail org={org} />
  } catch {
    notFound()
  }
}
