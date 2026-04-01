"use client"

import { useState } from "react"
import Image from "next/image"
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
  UserCircle,
  PanelLeftClose,
  PanelLeft,
  Menu,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet"

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
    roles: ["ADMIN", "OWNER"],
  },
  {
    label: "Clients",
    href: "/clients",
    icon: Briefcase,
    roles: ["ADMIN", "OWNER"],
  },
  {
    label: "Projects",
    href: "/projects",
    icon: FolderOpen,
    roles: ["ADMIN", "OWNER"],
  },
  {
    label: "Team",
    href: "/team",
    icon: Users,
    roles: ["ADMIN", "OWNER"],
  },
  {
    label: "Export",
    href: "/export",
    icon: Download,
    roles: ["ADMIN", "OWNER"],
  },
]

interface SidebarProps {
  user: {
    name?: string | null
    role: string
    isSuperAdmin?: boolean
  }
  companyName?: string
  logoBase64?: string | null
}

function NavLink({
  item,
  isActive,
  collapsed,
  onClick,
}: {
  item: (typeof navItems)[0]
  isActive: boolean
  collapsed?: boolean
  onClick?: () => void
}) {
  const link = (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        collapsed && "justify-center px-2",
        isActive
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {!collapsed && item.label}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    )
  }

  return link
}

function FooterLink({
  href,
  label,
  icon: Icon,
  isActive,
  collapsed,
  onClick,
}: {
  href: string
  label: string
  icon: typeof UserCircle
  isActive: boolean
  collapsed?: boolean
  onClick?: () => void
}) {
  const link = (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        collapsed && "justify-center px-2",
        isActive
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && label}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    )
  }

  return link
}

function SidebarContent({
  user,
  companyName,
  logoBase64,
  collapsed,
  onToggle,
  onNavigate,
}: SidebarProps & {
  collapsed?: boolean
  onToggle?: () => void
  onNavigate?: () => void
}) {
  const pathname = usePathname()

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(user.role)
  )

  return (
    <>
      <div className={cn("flex h-14 items-center border-b", collapsed ? "justify-center px-2" : "justify-between px-6")}>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/" className="flex items-center justify-center">
                {logoBase64 ? (
                  <Image src={logoBase64} alt={companyName || "Logo"} width={28} height={28} className="object-contain" />
                ) : (
                  <span className="text-lg font-bold">{(companyName || "Punch")[0]}</span>
                )}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{companyName || "Punch"}</TooltipContent>
          </Tooltip>
        ) : (
          <>
            <Link href="/" className="flex items-center gap-2">
              {logoBase64 && (
                <Image src={logoBase64} alt={companyName || "Logo"} width={28} height={28} className="object-contain" />
              )}
              <span className="text-xl font-bold">{companyName || "Punch"}</span>
            </Link>
            {onToggle && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={onToggle}>
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </div>
      <nav className={cn("flex-1 space-y-1", collapsed ? "p-2" : "p-4")}>
        {collapsed && onToggle && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggle}
                className="flex w-full items-center justify-center rounded-md px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground mb-2"
              >
                <PanelLeft className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Expand sidebar</TooltipContent>
          </Tooltip>
        )}
        {visibleItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href)
          return (
            <NavLink
              key={item.href}
              item={item}
              isActive={isActive}
              collapsed={collapsed}
              onClick={onNavigate}
            />
          )
        })}
      </nav>
      <div className={cn("border-t space-y-1", collapsed ? "p-2" : "p-4")}>
        <FooterLink
          href="/profile"
          label="My Profile"
          icon={UserCircle}
          isActive={pathname.startsWith("/profile")}
          collapsed={collapsed}
          onClick={onNavigate}
        />
        {(user.role === "ADMIN" || user.role === "OWNER") && (
          <FooterLink
            href="/settings"
            label="Settings"
            icon={Settings}
            isActive={pathname.startsWith("/settings")}
            collapsed={collapsed}
            onClick={onNavigate}
          />
        )}
        {user.isSuperAdmin && (
          <FooterLink
            href="/admin"
            label="Admin Console"
            icon={Shield}
            isActive={false}
            collapsed={collapsed}
            onClick={onNavigate}
          />
        )}
      </div>
    </>
  )
}

export function Sidebar(props: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r bg-background transition-all duration-200",
          collapsed ? "w-14" : "w-64"
        )}
      >
        <SidebarContent
          {...props}
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
      </aside>

      {/* Mobile sidebar (sheet) */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-3 left-3 z-40 h-8 w-8"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 flex flex-col">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent {...props} />
        </SheetContent>
      </Sheet>
    </>
  )
}
