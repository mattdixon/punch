import { getTimesheetData } from "@/app/actions/timesheet"
import { getWeekString, getWeekDates } from "@/lib/utils"
import { TimesheetGrid } from "@/components/timesheet/timesheet-grid"
import { WeekNav } from "@/components/timesheet/week-nav"
import { TimecardStatus } from "@/components/timesheet/timecard-status"

export default async function TimesheetPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>
}) {
  const params = await searchParams
  const week = params.week || getWeekString(new Date())
  const days = getWeekDates(week)
  const data = await getTimesheetData(week)

  const status = data.timecard?.status ?? "OPEN"
  const locked = status !== "OPEN"
  const hasEntries = data.entries.length > 0

  const statusBg =
    status === "SUBMITTED"
      ? "bg-muted/30"
      : status === "APPROVED"
        ? "bg-green-50 dark:bg-green-950/20"
        : status === "INVOICED"
          ? "bg-blue-50 dark:bg-blue-950/20"
          : ""

  return (
    <div className={`space-y-6 ${statusBg} -m-4 p-4 lg:-m-6 lg:p-6 min-h-full`}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Timesheet</h1>
          <p className="text-muted-foreground">
            Week of {days[0].label} &ndash; {days[6].label} ({week})
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <TimecardStatus timecard={data.timecard} week={week} hasEntries={hasEntries} />
          <WeekNav week={week} />
        </div>
      </div>
      <TimesheetGrid
        assignments={data.assignments}
        entries={data.entries}
        days={days}
        locked={locked}
      />
    </div>
  )
}
