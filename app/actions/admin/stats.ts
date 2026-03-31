"use server"

import { requireSuperAdmin } from "@/app/actions/_auth-helpers"
import { prisma } from "@/lib/prisma"
import { getWeekString } from "@/lib/utils"

export async function getPlatformStats() {
  await requireSuperAdmin()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const currentWeek = getWeekString(now)

  const [
    orgsByStatus,
    totalUsers,
    archivedUsers,
    newOrgsThisMonth,
    newUsersThisMonth,
    hoursThisWeek,
    hoursThisMonth,
    totalHoursAllTime,
    topOrgs,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.organization.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.user.count({ where: { archivedAt: null } }),
    prisma.user.count({ where: { archivedAt: { not: null } } }),
    prisma.organization.count({
      where: { createdAt: { gte: startOfMonth } },
    }),
    prisma.user.count({
      where: { createdAt: { gte: startOfMonth } },
    }),
    prisma.timeEntry.aggregate({
      _sum: { hours: true },
      where: { week: currentWeek },
    }),
    prisma.timeEntry.aggregate({
      _sum: { hours: true },
      where: { date: { gte: startOfMonth } },
    }),
    prisma.timeEntry.aggregate({
      _sum: { hours: true },
    }),
    prisma.organization.findMany({
      where: { status: "ACTIVE" },
      include: {
        _count: { select: { users: true } },
      },
      orderBy: { users: { _count: "desc" } },
      take: 5,
    }),
    prisma.adminAuditLog.findMany({
      include: { adminUser: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ])

  const orgCounts: Record<string, number> = {}
  for (const g of orgsByStatus) {
    orgCounts[g.status] = g._count
  }

  return {
    orgs: {
      active: orgCounts["ACTIVE"] ?? 0,
      suspended: orgCounts["SUSPENDED"] ?? 0,
      deleted: orgCounts["DELETED"] ?? 0,
      total: Object.values(orgCounts).reduce((a, b) => a + b, 0),
      newThisMonth: newOrgsThisMonth,
    },
    users: {
      active: totalUsers,
      archived: archivedUsers,
      total: totalUsers + archivedUsers,
      newThisMonth: newUsersThisMonth,
    },
    hours: {
      thisWeek: hoursThisWeek._sum.hours?.toNumber() ?? 0,
      thisMonth: hoursThisMonth._sum.hours?.toNumber() ?? 0,
      allTime: totalHoursAllTime._sum.hours?.toNumber() ?? 0,
    },
    topOrgs: topOrgs.map((o) => ({
      id: o.id,
      companyName: o.companyName,
      userCount: o._count.users,
    })),
    recentAuditLogs: recentAuditLogs.map((l) => ({
      id: l.id,
      action: l.action,
      targetType: l.targetType,
      adminName: l.adminUser.name,
      createdAt: l.createdAt.toISOString(),
    })),
  }
}
