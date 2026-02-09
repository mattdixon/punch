import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getISOWeek, getISOWeekYear, startOfISOWeek, addDays, format, addWeeks, subWeeks } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function getWeekString(date: Date): string {
  const year = getISOWeekYear(date)
  const week = getISOWeek(date)
  return `${year}-W${String(week).padStart(2, "0")}`
}

export function getWeekDates(weekString: string): { date: string; label: string; dayName: string }[] {
  const [yearStr, weekStr] = weekString.split("-W")
  const year = parseInt(yearStr)
  const week = parseInt(weekStr)

  // Build a date from ISO week: Jan 4 is always in week 1
  const jan4 = new Date(year, 0, 4)
  const startOfWeek1 = startOfISOWeek(jan4)
  const monday = addDays(startOfWeek1, (week - 1) * 7)

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  return days.map((dayName, i) => {
    const d = addDays(monday, i)
    return {
      date: format(d, "yyyy-MM-dd"),
      label: format(d, "MMM d"),
      dayName,
    }
  })
}

export function getAdjacentWeek(weekString: string, direction: "prev" | "next"): string {
  const dates = getWeekDates(weekString)
  const monday = new Date(dates[0].date + "T00:00:00")
  const adjusted = direction === "next" ? addWeeks(monday, 1) : subWeeks(monday, 1)
  return getWeekString(adjusted)
}
