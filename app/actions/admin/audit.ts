"use server"

import { requireSuperAdmin } from "@/app/actions/_auth-helpers"
import { prisma } from "@/lib/prisma"

export async function getAuditLogs(filters?: {
  action?: string
  targetType?: string
  adminUserId?: string
  limit?: number
  offset?: number
}) {
  await requireSuperAdmin()

  const where: Record<string, unknown> = {}

  if (filters?.action) {
    where.action = filters.action
  }
  if (filters?.targetType) {
    where.targetType = filters.targetType
  }
  if (filters?.adminUserId) {
    where.adminUserId = filters.adminUserId
  }

  const [logs, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      include: {
        adminUser: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: filters?.limit ?? 50,
      skip: filters?.offset ?? 0,
    }),
    prisma.adminAuditLog.count({ where }),
  ])

  return {
    logs: logs.map((log) => ({
      id: log.id,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      metadata: log.metadata as Record<string, unknown> | null,
      adminName: log.adminUser.name,
      adminEmail: log.adminUser.email,
      createdAt: log.createdAt.toISOString(),
    })),
    total,
  }
}
