"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

type AuditLog = {
  id: string
  action: string
  targetType: string
  targetId: string
  metadata: Record<string, unknown> | null
  adminName: string
  adminEmail: string
  createdAt: string
}

function ActionBadge({ action }: { action: string }) {
  const variant = action.includes("DELETE") || action.includes("ARCHIVE")
    ? "destructive" as const
    : action.includes("SUSPEND")
      ? "destructive" as const
      : action.includes("ACTIVATE") || action.includes("RESTORE")
        ? "default" as const
        : "secondary" as const

  return <Badge variant={variant}>{action}</Badge>
}

function formatMetadata(metadata: Record<string, unknown> | null): string {
  if (!metadata) return ""
  return Object.entries(metadata)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ")
}

export function AuditLogTable({ logs }: { logs: AuditLog[] }) {
  if (logs.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        No audit log entries yet.
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Admin</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Target</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="text-muted-foreground whitespace-nowrap">
                {new Date(log.createdAt).toLocaleString()}
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-sm">{log.adminName}</p>
                  <p className="text-xs text-muted-foreground">{log.adminEmail}</p>
                </div>
              </TableCell>
              <TableCell>
                <ActionBadge action={log.action} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                <span className="text-xs">{log.targetType}</span>
                <br />
                <code className="text-xs">{log.targetId.slice(0, 12)}...</code>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                {formatMetadata(log.metadata)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
