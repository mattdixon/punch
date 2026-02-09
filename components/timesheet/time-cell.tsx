"use client"

import { useState, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"

export function TimeCell({
  hours,
  onSave,
  disabled,
  saving,
}: {
  hours: number
  onSave: (hours: number) => void
  disabled: boolean
  saving: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const startEditing = useCallback(() => {
    if (disabled) return
    setValue(hours > 0 ? String(hours) : "")
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }, [disabled, hours])

  const commitValue = useCallback(() => {
    setEditing(false)
    const parsed = parseFloat(value)
    if (isNaN(parsed) || parsed < 0) {
      if (hours > 0) {
        // If they cleared it, treat as 0 (delete)
        onSave(0)
      }
      return
    }
    const rounded = Math.round(parsed * 100) / 100
    if (rounded > 24) return
    onSave(rounded)
  }, [value, hours, onSave])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        commitValue()
      } else if (e.key === "Escape") {
        setEditing(false)
      }
    },
    [commitValue]
  )

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min="0"
        max="24"
        step="0.25"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commitValue}
        onKeyDown={handleKeyDown}
        className="w-full h-10 text-center text-sm font-mono bg-background border-2 border-primary outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    )
  }

  return (
    <div
      onClick={startEditing}
      className={cn(
        "h-10 flex items-center justify-center text-sm font-mono cursor-pointer transition-colors",
        disabled
          ? "cursor-default text-muted-foreground"
          : "hover:bg-muted/50",
        saving && "opacity-50",
        hours > 0 ? "font-medium" : "text-muted-foreground/30"
      )}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          startEditing()
        }
      }}
    >
      {hours > 0 ? hours : "\u00B7"}
    </div>
  )
}
