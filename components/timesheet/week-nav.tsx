"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getAdjacentWeek, getWeekString } from "@/lib/utils"

export function WeekNav({ week }: { week: string }) {
  const router = useRouter()
  const currentWeek = getWeekString(new Date())
  const isCurrentWeek = week === currentWeek

  function goTo(w: string) {
    router.push(`/timesheet?week=${w}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => goTo(getAdjacentWeek(week, "prev"))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        variant={isCurrentWeek ? "default" : "outline"}
        size="sm"
        onClick={() => goTo(currentWeek)}
      >
        Today
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => goTo(getAdjacentWeek(week, "next"))}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
