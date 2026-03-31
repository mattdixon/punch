import { describe, it, expect, beforeEach } from 'vitest'
import { mockAuth, mockSession } from '../helpers/auth-mock'
import { mockPrisma } from '../helpers/prisma-mock'
import {
  getPendingTimecards,
  approveTimecard,
} from '@/app/actions/approvals'

const prisma = mockPrisma()

describe('Approval actions - org isolation', () => {
  beforeEach(() => {
    mockAuth(mockSession({ role: 'ADMIN', orgId: 'org-1' }))

    for (const method of Object.values(prisma.timecard)) {
      if (typeof method === 'function' && 'mockReset' in method) {
        method.mockReset()
      }
    }
    for (const method of Object.values(prisma.user)) {
      if (typeof method === 'function' && 'mockReset' in method) {
        method.mockReset()
      }
    }
  })

  describe('getPendingTimecards', () => {
    it('should filter timecards by org through user.orgId', async () => {
      prisma.timecard.findMany.mockResolvedValue([])

      await getPendingTimecards()

      // After multi-tenancy, the query must scope to the org.
      // This can be done via a direct orgId on timecard, or through
      // a nested where on user.orgId. Either approach is valid.
      const call = prisma.timecard.findMany.mock.calls[0][0]

      const hasDirectOrgId = call?.where?.orgId === 'org-1'
      const hasNestedUserOrgId =
        call?.where?.user?.orgId === 'org-1'

      expect(hasDirectOrgId || hasNestedUserOrgId).toBe(true)
    })

    it('should not return timecards from users in other orgs', async () => {
      prisma.timecard.findMany.mockResolvedValue([
        {
          id: 'tc-1',
          status: 'SUBMITTED',
          user: { id: 'u1', name: 'Org1 User', orgId: 'org-1' },
        },
      ])

      const result = await getPendingTimecards()

      // Verify org scoping in the query
      const call = prisma.timecard.findMany.mock.calls[0][0]
      const hasDirectOrgId = call?.where?.orgId === 'org-1'
      const hasNestedUserOrgId =
        call?.where?.user?.orgId === 'org-1'

      expect(hasDirectOrgId || hasNestedUserOrgId).toBe(true)
    })
  })

  describe('approveTimecard', () => {
    it('should verify the timecard belongs to the same org before approving', async () => {
      // The findUnique call to fetch the timecard should be org-scoped
      prisma.timecard.findUnique.mockResolvedValue({
        id: 'tc-1',
        status: 'SUBMITTED',
        userId: 'u1',
        orgId: 'org-1',
      })
      prisma.timecard.update.mockResolvedValue({
        id: 'tc-1',
        status: 'APPROVED',
      })

      await approveTimecard('tc-1')

      // Either the findUnique or the update must include org scoping
      const findCall = prisma.timecard.findUnique.mock.calls[0][0]
      const updateCall = prisma.timecard.update.mock.calls[0][0]

      const findHasOrgId = findCall?.where?.orgId === 'org-1'
      const updateHasOrgId = updateCall?.where?.orgId === 'org-1'

      // At minimum, the lookup must be org-scoped to prevent
      // approving timecards from other organizations
      expect(findHasOrgId || updateHasOrgId).toBe(true)
    })

    it('should not allow approving a timecard from a different org', async () => {
      // Simulate: timecard exists but belongs to org-2
      // After multi-tenancy, the findUnique with orgId: 'org-1' should
      // return null, causing a "not found" error
      prisma.timecard.findUnique.mockResolvedValue(null)

      await expect(approveTimecard('tc-other-org')).rejects.toThrow(
        'Timecard not found'
      )

      // Verify the lookup was org-scoped
      expect(prisma.timecard.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: 'org-1' }),
        })
      )
    })

    it('should use approvedById from the authenticated session', async () => {
      prisma.timecard.findUnique.mockResolvedValue({
        id: 'tc-1',
        status: 'SUBMITTED',
        userId: 'u1',
        orgId: 'org-1',
      })
      prisma.timecard.update.mockResolvedValue({
        id: 'tc-1',
        status: 'APPROVED',
      })

      await approveTimecard('tc-1')

      expect(prisma.timecard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'APPROVED',
            approvedById: 'user-1',
          }),
        })
      )
    })
  })
})
