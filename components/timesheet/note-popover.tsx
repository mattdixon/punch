"use client"

import { useState } from "react"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { MessageSquareText } from "lucide-react"
import { cn } from "@/lib/utils"

export function NotePopover({
  notes,
  onSave,
  disabled,
}: {
  notes: string | null
  onSave: (notes: string | null) => void
  disabled: boolean
}) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  const hasNotes = !!notes?.trim()

  function handleOpenChange(isOpen: boolean) {
    if (isOpen) setValue(notes ?? "")
    setOpen(isOpen)
  }

  function handleSave() {
    onSave(value.trim() || null)
    setOpen(false)
  }

  if (!hasNotes && disabled) return null

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "absolute top-0 right-0 p-0.5 rounded-sm z-20",
            hasNotes
              ? "text-blue-500 opacity-100"
              : "text-muted-foreground opacity-0 group-hover:opacity-100",
            "transition-opacity"
          )}
          onClick={(e) => e.stopPropagation()}
          tabIndex={-1}
        >
          <MessageSquareText className="size-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-3"
        side="top"
        align="center"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="space-y-2">
          <p className="text-sm font-medium">Notes</p>
          {disabled ? (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {notes}
            </p>
          ) : (
            <>
              <Textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Add a note..."
                rows={3}
                className="text-sm resize-none"
              />
              <div className="flex justify-between items-center">
                {hasNotes && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onSave(null)
                      setOpen(false)
                    }}
                  >
                    Clear
                  </Button>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="button" size="sm" onClick={handleSave}>
                    Save
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
