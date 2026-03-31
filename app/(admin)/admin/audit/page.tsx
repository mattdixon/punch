import { getAuditLogs } from "@/app/actions/admin/audit"
import { AuditLogTable } from "@/components/admin/audit-log-table"

export default async function AuditLogPage() {
  const { logs, total } = await getAuditLogs({ limit: 100 })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground">
          {total} total admin action{total !== 1 ? "s" : ""} recorded.
        </p>
      </div>
      <AuditLogTable logs={logs} />
    </div>
  )
}
