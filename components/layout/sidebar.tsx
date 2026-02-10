"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Clock,
  CheckSquare,
  Users,
  Briefcase,
  FolderOpen,
  Download,
  Settings,
} from "lucide-react"

const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    roles: ["ADMIN", "MEMBER"],
  },
  {
    label: "Timesheet",
    href: "/timesheet",
    icon: Clock,
    roles: ["ADMIN", "MEMBER"],
  },
  {
    label: "Approvals",
    href: "/approvals",
    icon: CheckSquare,
    roles: ["ADMIN"],
  },
  {
    label: "Clients",
    href: "/clients",
    icon: Briefcase,
    roles: ["ADMIN"],
  },
  {
    label: "Projects",
    href: "/projects",
    icon: FolderOpen,
    roles: ["ADMIN"],
  },
  {
    label: "Team",
    href: "/team",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    label: "Export",
    href: "/export",
    icon: Download,
    roles: ["ADMIN"],
  },
]

interface SidebarProps {
  user: {
    name?: string | null
    role: string
  }
  companyName?: string
}

export function Sidebar({ user, companyName }: SidebarProps) {
  const pathname = usePathname()

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(user.role)
  )

  return (
    <aside className="flex w-64 flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-6">
        <Link href="/" className="text-xl font-bold">
          {companyName || "Punch"}
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {visibleItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      {user.role === "ADMIN" && (
        <div className="border-t p-4">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith("/settings")
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>
      )}
    </aside>
  )
}
