import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { getCompanySettings } from "@/app/actions/settings"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // Super admin without an org should go to admin console
  if (!session.user.orgId && session.user.isSuperAdmin) {
    redirect("/admin")
  }

  // User without an org who isn't a super admin shouldn't be here
  if (!session.user.orgId) {
    redirect("/login")
  }

  const settings = await getCompanySettings()

  return (
    <div className="flex h-screen">
      <Sidebar user={session.user} companyName={settings.companyName} logoBase64={settings.logoBase64} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header user={session.user} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-muted/40">
          {children}
        </main>
      </div>
    </div>
  )
}
