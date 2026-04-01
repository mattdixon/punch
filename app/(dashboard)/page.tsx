import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getMemberDashboard, getAdminDashboard } from "@/app/actions/dashboard"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Clock, CheckSquare, Download, ArrowRight } from "lucide-react"

const statusConfig: Record<
  string,
  { label: string; variant: "outline" | "secondary"; className: string }
> = {
  OPEN: {
    label: "Open",
    variant: "outline",
    className: "text-green-600 border-green-600 dark:text-green-400 dark:border-green-400",
  },
  SUBMITTED: {
    label: "Submitted",
    variant: "secondary",
    className: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-700",
  },
  APPROVED: {
    label: "Approved",
    variant: "secondary",
    className: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700",
  },
  INVOICED: {
    label: "Invoiced",
    variant: "secondary",
    className: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700",
  },
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "OWNER"

  if (isAdmin) {
    const data = await getAdminDashboard()
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Approvals
              </CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.pendingCount}</div>
              <Button variant="link" className="px-0 mt-1" asChild>
                <Link href="/approvals">
                  Review timecards <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Team Hours This Week
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.totalHours}</div>
              <p className="text-sm text-muted-foreground mt-1">
                {data.week}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link href="/approvals">
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Approvals
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link href="/export">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link href="/timesheet">
                  <Clock className="mr-2 h-4 w-4" />
                  My Timesheet
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Member view
  const data = await getMemberDashboard()
  const config = statusConfig[data.status] ?? statusConfig.OPEN

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Week
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalHours} hrs</div>
            <p className="text-sm text-muted-foreground mt-1">{data.week}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Timecard Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={config.variant} className={config.className}>
              {config.label}
            </Badge>
            <Button variant="link" className="px-0 mt-3 block" asChild>
              <Link href="/timesheet">
                Go to timesheet <ArrowRight className="ml-1 h-4 w-4 inline" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
