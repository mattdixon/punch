"use client"

import { Button } from "@/components/ui/button"
import { stopImpersonation } from "@/app/actions/admin/impersonation"
import { Eye, X } from "lucide-react"

interface ImpersonationBannerProps {
  userName: string
}

export function ImpersonationBanner({ userName }: ImpersonationBannerProps) {
  return (
    <div className="bg-orange-500 text-white px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4" />
        <span>
          You are viewing as <strong>{userName}</strong>
        </span>
      </div>
      <form action={stopImpersonation}>
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="text-white hover:text-white hover:bg-orange-600 h-7"
        >
          <X className="mr-1 h-3.5 w-3.5" />
          End Impersonation
        </Button>
      </form>
    </div>
  )
}
