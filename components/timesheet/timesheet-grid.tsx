"use client"

import { useState, useCallback, useRef, Fragment } from "react"
import { TimeCell, TimeCellRef } from "./time-cell"
import { saveTimeEntry } from "@/app/actions/timesheet"
import { toast } from "sonner"
import { MessageSquareText, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

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
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({})
  const [editingNote, setEditingNote] = useState<string | null>(null)

  // Refs for tab navigation: time cells keyed by "projectId:date"
  const timeCellRefs = useRef<Record<string, TimeCellRef | null>>({})

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

  // Tab from time cell → open notes row + focus note for same day
  const handleTimeCellTab = useCallback(
    (projectId: string, date: string) => {
      // Expand notes row if collapsed
      setExpandedNotes((prev) => ({ ...prev, [projectId]: true }))
      // Set editing note for this cell
      setEditingNote(`${projectId}:${date}`)
    },
    []
  )

  // Tab from note → focus next day's time cell (or next project's Mon if on Sun)
  const handleNoteTab = useCallback(
    (projectId: string, dayIndex: number) => {
      if (dayIndex < days.length - 1) {
        // Next day, same project
        const nextDate = days[dayIndex + 1].date
        const ref = timeCellRefs.current[`${projectId}:${nextDate}`]
        if (ref) {
          setTimeout(() => ref.focus(), 0)
        }
      } else {
        // Last day (Sun) → find next project's first day (Mon)
        const allProjects = assignments
        const idx = allProjects.findIndex((a) => a.projectId === projectId)
        if (idx < allProjects.length - 1) {
          const nextProject = allProjects[idx + 1]
          const firstDate = days[0].date
          const ref = timeCellRefs.current[`${nextProject.projectId}:${firstDate}`]
          if (ref) {
            setTimeout(() => ref.focus(), 0)
          }
        }
      }
    },
    [days, assignments]
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

  function projectHasNotes(projectId: string) {
    return days.some((d) => !!getNotes(projectId, d.date))
  }

  function toggleNotes(projectId: string) {
    setExpandedNotes((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }))
  }

  if (assignments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        No projects assigned. Ask an admin to assign you to a project.
      </div>
    )
  }

  return (
    <div className="space-y-0 overflow-x-auto">
      <div className="min-w-[800px]">
      {/* Header row */}
      <div className="grid grid-cols-[minmax(150px,1.5fr)_repeat(7,1fr)_70px] gap-px text-sm">
        <div className="px-3 py-2 text-muted-foreground font-medium">Project</div>
        {days.map((d) => (
          <div key={d.date} className="text-center px-1 py-2">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider">
              {d.dayName}
            </div>
            <div className="text-xs text-muted-foreground">{d.label}</div>
          </div>
        ))}
        <div className="text-center px-1 py-2 text-xs text-muted-foreground font-semibold">
          Total
        </div>
      </div>

      {/* Project rows */}
      <div className="rounded-lg border overflow-hidden divide-y">
        {grouped.map((group) => (
          <Fragment key={`group-${group.clientName}`}>
            {grouped.length > 1 && (
              <div className="bg-muted/40 px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {group.clientName}
              </div>
            )}
            {group.projects.map((project) => {
              const hasNotes = projectHasNotes(project.projectId)
              const isExpanded = expandedNotes[project.projectId] ?? hasNotes
              const pTotal = projectTotal(project.projectId)

              return (
                <div key={project.projectId}>
                  {/* Hours row */}
                  <div className="grid grid-cols-[minmax(150px,1.5fr)_repeat(7,1fr)_70px] gap-px">
                    <div className="flex items-center gap-2 px-3 py-2">
                      <span className="font-medium text-sm truncate">
                        {project.projectName}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleNotes(project.projectId)}
                        className={cn(
                          "shrink-0 p-0.5 rounded transition-colors",
                          hasNotes
                            ? "text-blue-500 hover:text-blue-600"
                            : "text-muted-foreground/40 hover:text-muted-foreground"
                        )}
                        title={isExpanded ? "Hide notes" : "Show notes"}
                      >
                        <MessageSquareText className="size-3.5" />
                      </button>
                    </div>
                    {days.map((d) => {
                      const h = getHours(project.projectId, d.date)
                      const n = getNotes(project.projectId, d.date)
                      const cellKey = `${project.projectId}:${d.date}`
                      return (
                        <div
                          key={d.date}
                          className={cn(
                            "relative",
                            n && "after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-blue-400"
                          )}
                        >
                          <TimeCell
                            ref={(el) => { timeCellRefs.current[cellKey] = el }}
                            hours={h}
                            onSave={(hours) =>
                              handleSave(project.projectId, d.date, hours)
                            }
                            onTab={() => handleTimeCellTab(project.projectId, d.date)}
                            disabled={locked}
                            saving={saving[cellKey] ?? false}
                          />
                        </div>
                      )
                    })}
                    <div className="flex items-center justify-center text-sm font-mono font-semibold bg-muted/30">
                      {pTotal || ""}
                    </div>
                  </div>

                  {/* Inline notes row */}
                  {isExpanded && (
                    <div className="grid grid-cols-[minmax(150px,1.5fr)_repeat(7,1fr)_70px] gap-px bg-muted/20 border-t border-dashed">
                      <div className="flex items-start px-3 py-1.5">
                        <ChevronDown
                          className="size-3 text-muted-foreground/50 mt-0.5 shrink-0 cursor-pointer hover:text-muted-foreground"
                          onClick={() => toggleNotes(project.projectId)}
                        />
                      </div>
                      {days.map((d, dayIndex) => {
                        const key = `${project.projectId}:${d.date}`
                        const n = getNotes(project.projectId, d.date)
                        const h = getHours(project.projectId, d.date)
                        const isEditingThis = editingNote === key

                        if (isEditingThis) {
                          return (
                            <div key={d.date} className="px-0.5 py-1">
                              <textarea
                                autoFocus
                                className="w-full text-[11px] leading-tight bg-background border rounded px-1.5 py-1 resize-none outline-none focus:ring-1 focus:ring-ring"
                                rows={2}
                                defaultValue={n ?? ""}
                                placeholder="Note..."
                                onBlur={(e) => {
                                  const val = e.target.value.trim() || null
                                  handleSaveNotes(project.projectId, d.date, val)
                                  setEditingNote(null)
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Escape") {
                                    setEditingNote(null)
                                  } else if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    const val =
                                      (e.target as HTMLTextAreaElement).value.trim() ||
                                      null
                                    handleSaveNotes(project.projectId, d.date, val)
                                    setEditingNote(null)
                                  } else if (e.key === "Tab" && !e.shiftKey) {
                                    e.preventDefault()
                                    const val =
                                      (e.target as HTMLTextAreaElement).value.trim() ||
                                      null
                                    handleSaveNotes(project.projectId, d.date, val)
                                    setEditingNote(null)
                                    handleNoteTab(project.projectId, dayIndex)
                                  }
                                }}
                              />
                            </div>
                          )
                        }

                        return (
                          <div
                            key={d.date}
                            className={cn(
                              "px-1 py-1 min-h-[28px] cursor-pointer group/note",
                              !locked && "hover:bg-muted/40",
                              !h && !n && "opacity-30"
                            )}
                            onClick={() => {
                              if (!locked && (h > 0 || n)) setEditingNote(key)
                            }}
                          >
                            {n ? (
                              <p className="text-[11px] leading-tight text-muted-foreground line-clamp-2">
                                {n}
                              </p>
                            ) : h > 0 ? (
                              <p className="text-[11px] leading-tight text-muted-foreground/40 italic group-hover/note:text-muted-foreground/60">
                                {locked ? "" : "Add note..."}
                              </p>
                            ) : null}
                          </div>
                        )
                      })}
                      <div />
                    </div>
                  )}
                </div>
              )
            })}
          </Fragment>
        ))}

        {/* Daily totals row */}
        <div className="grid grid-cols-[minmax(150px,1.5fr)_repeat(7,1fr)_70px] gap-px bg-muted/40">
          <div className="px-3 py-2.5 text-sm font-semibold">Daily Total</div>
          {days.map((d) => (
            <div
              key={d.date}
              className="flex items-center justify-center text-sm font-mono font-semibold"
            >
              {dayTotal(d.date) || ""}
            </div>
          ))}
          <div className="flex items-center justify-center text-sm font-mono font-bold bg-muted/30">
            {grandTotal || ""}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
