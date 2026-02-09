"use client"

import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff } from "lucide-react"

export function ToggleArchived({ showArchived }: { showArchived: boolean }) {
  const router = useRouter()
  const pathname = usePathname()

  function toggle() {
    const params = new URLSearchParams()
    if (!showArchived) {
      params.set("showArchived", "true")
    }
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <Button variant="outline" size="sm" onClick={toggle}>
      {showArchived ? (
        <>
          <EyeOff className="mr-2 h-4 w-4" />
          Hide Archived
        </>
      ) : (
        <>
          <Eye className="mr-2 h-4 w-4" />
          Show Archived
        </>
      )}
    </Button>
  )
}
