import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getISOWeek, getISOWeekYear } from "date-fns"

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
