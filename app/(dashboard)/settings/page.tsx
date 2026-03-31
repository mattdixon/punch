import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getCompanySettings } from "@/app/actions/settings"
import { SettingsForm } from "@/components/settings/settings-form"

export default async function SettingsPage() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "OWNER") {
    redirect("/timesheet")
  }

  const settings = await getCompanySettings()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure company-wide defaults for rates, payment terms, and display.
        </p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  )
}
