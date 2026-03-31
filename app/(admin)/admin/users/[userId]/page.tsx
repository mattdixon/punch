import { getUserDetail } from "@/app/actions/admin/users"
import { AdminUserDetail } from "@/components/admin/admin-user-detail"
import { notFound } from "next/navigation"

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params

  try {
    const user = await getUserDetail(userId)
    return <AdminUserDetail user={user} />
  } catch {
    notFound()
  }
}
