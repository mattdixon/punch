"use client"

import { useState, useCallback, Fragment } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TimeCell } from "./time-cell"
import { NotePopover } from "./note-popover"
import { saveTimeEntry } from "@/app/actions/timesheet"
import { toast } from "sonner"

type Assignment = {
  projectId: string
  projectName: string
  clientName: string
  clientId: string
}

type Entry = {
  id: string
  projectId: string
  date: string
  hours: number
  notes: string | null
}

type DayInfo = {
  date: string
  label: string
  dayName: string
}

export function TimesheetGrid({
  assignments,
  entries,
  days,
  locked,
}: {
  assignments: Assignment[]
  entries: Entry[]
  days: DayInfo[]
  locked: boolean
}) {
  const [localEntries, setLocalEntries] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {}
    for (const e of entries) {
      map[`${e.projectId}:${e.date}`] = e.hours
    }
    return map
  })
  const [localNotes, setLocalNotes] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const e of entries) {
      if (e.notes) {
        map[`${e.projectId}:${e.date}`] = e.notes
      }
    }
    return map
  })
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  const getHours = useCallback(
    (projectId: string, date: string) => {
      return localEntries[`${projectId}:${date}`] ?? 0
    },
    [localEntries]
  )

  const getNotes = useCallback(
    (projectId: string, date: string) => {
      return localNotes[`${projectId}:${date}`] ?? null
    },
    [localNotes]
  )

  const handleSave = useCallback(
    async (projectId: string, date: string, hours: number) => {
      const key = `${projectId}:${date}`
      const current = localEntries[key] ?? 0
      if (hours === current) return

      setLocalEntries((prev) => {
        const next = { ...prev }
        if (hours <= 0) {
          delete next[key]
        } else {
          next[key] = hours
        }
        return next
      })

      if (hours <= 0) {
        setLocalNotes((prev) => {
          const next = { ...prev }
          delete next[key]
          return next
        })
      }

      setSaving((prev) => ({ ...prev, [key]: true }))
      try {
        await saveTimeEntry({ projectId, date, hours })
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to save")
        // Revert on error
        setLocalEntries((prev) => {
          const next = { ...prev }
          if (current > 0) {
            next[key] = current
          } else {
            delete next[key]
          }
          return next
        })
      } finally {
        setSaving((prev) => ({ ...prev, [key]: false }))
      }
    },
    [localEntries]
  )

  const handleSaveNotes = useCallback(
    async (projectId: string, date: string, notes: string | null) => {
      const key = `${projectId}:${date}`
      const prev = localNotes[key] ?? null
      if (notes === prev) return

      setLocalNotes((s) => {
        const next = { ...s }
        if (notes) {
          next[key] = notes
        } else {
          delete next[key]
        }
        return next
      })

      const currentHours = localEntries[key] ?? 0
      setSaving((s) => ({ ...s, [key]: true }))
      try {
        await saveTimeEntry({
          projectId,
          date,
          hours: currentHours,
          notes,
        })
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to save notes")
        setLocalNotes((s) => {
          const next = { ...s }
          if (prev) {
            next[key] = prev
          } else {
            delete next[key]
          }
          return next
        })
      } finally {
        setSaving((s) => ({ ...s, [key]: false }))
      }
    },
    [localNotes, localEntries]
  )

  // Group assignments by client
  const grouped: { clientName: string; projects: Assignment[] }[] = []
  let currentClient = ""
  for (const a of assignments) {
    if (a.clientName !== currentClient) {
      grouped.push({ clientName: a.clientName, projects: [] })
      currentClient = a.clientName
    }
    grouped[grouped.length - 1].projects.push(a)
  }

  // Calculate totals
  function projectTotal(projectId: string) {
    return days.reduce((sum, d) => sum + getHours(projectId, d.date), 0)
  }

  function dayTotal(date: string) {
    return assignments.reduce((sum, a) => sum + getHours(a.projectId, date), 0)
  }

  const grandTotal = days.reduce((sum, d) => sum + dayTotal(d.date), 0)

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[200px] sticky left-0 bg-background z-10">
              Project
            </TableHead>
            {days.map((d) => (
              <TableHead key={d.date} className="text-center min-w-[80px]">
                <div className="text-xs text-muted-foreground">{d.dayName}</div>
                <div>{d.label}</div>
              </TableHead>
            ))}
            <TableHead className="text-center min-w-[70px] font-bold">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={days.length + 2}
                className="text-center text-muted-foreground py-12"
              >
                No projects assigned. Ask an admin to assign you to a project.
              </TableCell>
            </TableRow>
          ) : (
            <>
              {grouped.map((group) => (
                <Fragment key={`group-${group.clientName}`}>
                  {grouped.length > 1 && (
                    <TableRow key={`client-${group.clientName}`}>
                      <TableCell
                        colSpan={days.length + 2}
                        className="bg-muted/50 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                      >
                        {group.clientName}
                      </TableCell>
                    </TableRow>
                  )}
                  {group.projects.map((project) => (
                    <TableRow key={project.projectId}>
                      <TableCell className="font-medium sticky left-0 bg-background z-10">
                        {project.projectName}
                      </TableCell>
                      {days.map((d) => {
                        const h = getHours(project.projectId, d.date)
                        const n = getNotes(project.projectId, d.date)
                        return (
                          <TableCell
                            key={d.date}
                            className="p-0 text-center relative group"
                          >
                            <TimeCell
                              hours={h}
                              onSave={(hours) =>
                                handleSave(project.projectId, d.date, hours)
                              }
                              disabled={locked}
                              saving={
                                saving[`${project.projectId}:${d.date}`] ??
                                false
                              }
                            />
                            {(h > 0 || n) && (
                              <NotePopover
                                notes={n}
                                onSave={(notes) =>
                                  handleSaveNotes(
                                    project.projectId,
                                    d.date,
                                    notes
                                  )
                                }
                                disabled={locked}
                              />
                            )}
                          </TableCell>
                        )
                      })}
                      <TableCell className="text-center font-mono font-semibold bg-muted/30">
                        {projectTotal(project.projectId) || ""}
                      </TableCell>
                    </TableRow>
                  ))}
                </Fragment>
              ))}
              <TableRow className="border-t-2">
                <TableCell className="font-bold sticky left-0 bg-background z-10">
                  Daily Total
                </TableCell>
                {days.map((d) => (
                  <TableCell
                    key={d.date}
                    className="text-center font-mono font-semibold bg-muted/30"
                  >
                    {dayTotal(d.date) || ""}
                  </TableCell>
                ))}
                <TableCell className="text-center font-mono font-bold bg-muted/50">
                  {grandTotal || ""}
                </TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
