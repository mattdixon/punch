"use client"

import { useState, useRef, useCallback, useImperativeHandle, forwardRef } from "react"
import { cn } from "@/lib/utils"

export type TimeCellRef = {
  focus: () => void
}

export const TimeCell = forwardRef<
  TimeCellRef,
  {
    hours: number
    onSave: (hours: number) => void
    onTab?: () => void
    disabled: boolean
    saving: boolean
  }
>(function TimeCell({ hours, onSave, onTab, disabled, saving }, ref) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => ({
    focus() {
      if (disabled) return
      setValue(hours > 0 ? String(hours) : "")
      setEditing(true)
      setTimeout(() => inputRef.current?.select(), 0)
    },
  }), [disabled, hours])

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
      } else if (e.key === "Tab" && !e.shiftKey && onTab) {
        e.preventDefault()
        commitValue()
        onTab()
      }
    },
    [commitValue, onTab]
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
        className="w-full h-11 text-center text-sm font-mono bg-background border-2 border-primary rounded-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    )
  }

  return (
    <div
      onClick={startEditing}
      className={cn(
        "h-11 flex items-center justify-center text-sm font-mono transition-colors rounded-sm",
        disabled
          ? "cursor-default text-muted-foreground"
          : "cursor-pointer hover:bg-muted/50",
        saving && "opacity-50",
        hours > 0 ? "font-medium" : "text-muted-foreground/20"
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
})
