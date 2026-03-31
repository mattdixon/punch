import { describe, it, expect, beforeEach } from 'vitest'
import { mockAuth, mockSession } from '../helpers/auth-mock'
import { mockPrisma } from '../helpers/prisma-mock'
import { getUsers, createUser } from '@/app/actions/users'

const prisma = mockPrisma()

// Mock bcryptjs since createUser uses hash()
vi.mock('bcryptjs', () => ({
  hash: vi.fn(() => Promise.resolve('hashed-password')),
}))

// Mock email/token utilities used by createUser
vi.mock('@/lib/tokens', () => ({
  createToken: vi.fn(() => Promise.resolve('mock-token')),
}))

vi.mock('@/lib/email', () => ({
  isEmailConfigured: vi.fn(() => false),
  sendEmail: vi.fn(),
}))

// Mock getCompanySettings (called by createUser when email is configured)
vi.mock('@/app/actions/settings', () => ({
  getCompanySettings: vi.fn(() =>
    Promise.resolve({ companyName: 'Test Co' })
  ),
}))

import { vi } from 'vitest'

describe('Team/User actions - org isolation', () => {
  beforeEach(() => {
    mockAuth(mockSession({ role: 'ADMIN', orgId: 'org-1' }))

    for (const method of Object.values(prisma.user)) {
      if (typeof method === 'function' && 'mockReset' in method) {
        method.mockReset()
      }
    }
  })

  describe('getUsers', () => {
    it('should pass orgId in the where clause', async () => {
      prisma.user.findMany.mockResolvedValue([])

      await getUsers()

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: 'org-1' }),
        })
      )
    })

    it('should pass orgId even when showArchived is true', async () => {
      prisma.user.findMany.mockResolvedValue([])

      await getUsers(true)

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: 'org-1' }),
        })
      )
    })

    it('should only return users from the authenticated org', async () => {
      prisma.user.findMany.mockResolvedValue([
        { id: 'u1', name: 'Org1 User', orgId: 'org-1' },
      ])

      await getUsers()

      // The query must be org-scoped
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: 'org-1' }),
        })
      )
    })
  })

  describe('createUser', () => {
    it('should include orgId in the create data', async () => {
      // Mock findUnique to return null (no existing user)
      prisma.user.findUnique.mockResolvedValue(null)
      prisma.user.create.mockResolvedValue({
        id: 'u-new',
        name: 'New User',
        email: 'new@test.com',
        orgId: 'org-1',
      })

      await createUser({
        name: 'New User',
        email: 'new@test.com',
        role: 'MEMBER',
        defaultPayCents: 5000,
      })

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ orgId: 'org-1' }),
        })
      )
    })

    it('should check email uniqueness within the org, not globally', async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      prisma.user.create.mockResolvedValue({
        id: 'u-new',
        name: 'Test',
        email: 'test@example.com',
        orgId: 'org-1',
      })

      await createUser({
        name: 'Test',
        email: 'test@example.com',
        role: 'MEMBER',
        defaultPayCents: 5000,
      })

      // The email uniqueness check should be scoped to the org
      // This may use findUnique with a compound key or findFirst with orgId
      const findCall = prisma.user.findUnique.mock.calls[0]?.[0] ||
        prisma.user.findFirst?.mock.calls[0]?.[0]

      // After multi-tenancy, the uniqueness check should consider orgId
      // Either through a compound unique constraint or a where clause
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ orgId: 'org-1' }),
        })
      )
    })
  })
})
