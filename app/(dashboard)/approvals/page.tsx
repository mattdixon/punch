import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import {
  getPendingTimecards,
  getApprovedTimecards,
  getTimecardDetail,
} from "@/app/actions/approvals"
import { ApprovalsList } from "@/components/approvals/approvals-list"

export default async function ApprovalsPage() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "OWNER") {
    redirect("/timesheet")
  }

  const [pending, approved] = await Promise.all([
    getPendingTimecards(),
    getApprovedTimecards(),
  ])

  // Pre-fetch entries for all timecards to show totals and detail
  const allTimecards = [...pending, ...approved]
  const entriesMap: Record<
    string,
    { id: string; projectName: string; clientName: string; date: string; hours: number; notes: string | null }[]
  > = {}

  await Promise.all(
    allTimecards.map(async (tc) => {
      const detail = await getTimecardDetail(tc.id)
      if (detail) {
        entriesMap[tc.id] = detail.entries
      }
    })
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Approvals</h1>
        <p className="text-muted-foreground">
          Review and approve submitted timecards.
        </p>
      </div>
      <ApprovalsList pending={pending} approved={approved} entries={entriesMap} />
    </div>
  )
}
