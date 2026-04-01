import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/layout/admin-sidebar"
import { AdminHeader } from "@/components/layout/admin-header"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (!session.user.isSuperAdmin) {
    redirect("/")
  }

  return (
    <div className="flex h-screen">
      <AdminSidebar user={session.user} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <AdminHeader user={session.user} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-muted/40">
          {children}
        </main>
      </div>
    </div>
  )
}
