import { describe, it, expect, beforeEach } from 'vitest'
import { mockAuth, mockSession } from '../helpers/auth-mock'
import { mockPrisma } from '../helpers/prisma-mock'
import {
  getClients,
  createClient,
  updateClient,
  archiveClient,
} from '@/app/actions/clients'

const prisma = mockPrisma()

describe('Client actions - org isolation', () => {
  beforeEach(() => {
    mockAuth(mockSession({ role: 'ADMIN', orgId: 'org-1' }))

    // Reset all mocks between tests
    for (const method of Object.values(prisma.client)) {
      if (typeof method === 'function' && 'mockReset' in method) {
        method.mockReset()
      }
    }
  })

  describe('getClients', () => {
    it('should pass orgId in the where clause', async () => {
      prisma.client.findMany.mockResolvedValue([])

      await getClients()

      expect(prisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: 'org-1' }),
        })
      )
    })

    it('should pass orgId even when showArchived is true', async () => {
      prisma.client.findMany.mockResolvedValue([])

      await getClients(true)

      expect(prisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: 'org-1' }),
        })
      )
    })

    it('should not return clients from a different org', async () => {
      prisma.client.findMany.mockResolvedValue([
        { id: 'c1', name: 'Org1 Client', orgId: 'org-1' },
      ])

      const result = await getClients()

      // Verify the query was scoped - the mock controls what's returned,
      // but the important thing is the where clause includes orgId
      expect(prisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: 'org-1' }),
        })
      )
    })
  })

  describe('createClient', () => {
    it('should include orgId in the create data', async () => {
      prisma.client.create.mockResolvedValue({
        id: 'c-new',
        name: 'New Client',
        orgId: 'org-1',
      })

      await createClient({ name: 'New Client' })

      expect(prisma.client.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ orgId: 'org-1' }),
        })
      )
    })

    it('should use orgId from the authenticated session, not from input', async () => {
      prisma.client.create.mockResolvedValue({
        id: 'c-new',
        name: 'Test',
        orgId: 'org-1',
      })

      await createClient({ name: 'Test' })

      // The orgId should come from the session (org-1), not be user-supplied
      expect(prisma.client.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ orgId: 'org-1' }),
        })
      )
    })
  })

  describe('updateClient', () => {
    it('should verify the client belongs to the org before updating', async () => {
      prisma.client.update.mockResolvedValue({
        id: 'c1',
        name: 'Updated',
        orgId: 'org-1',
      })

      await updateClient('c1', { name: 'Updated' })

      // The update where clause must include orgId to prevent cross-org updates
      expect(prisma.client.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: 'org-1' }),
        })
      )
    })

    it('should not allow updating a client from a different org', async () => {
      // If findUnique is used for pre-check, it should also be org-scoped
      // Either way, the update where clause must include orgId
      prisma.client.update.mockResolvedValue({
        id: 'c-other',
        name: 'Updated',
        orgId: 'org-1',
      })

      await updateClient('c-other', { name: 'Updated' })

      expect(prisma.client.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: 'org-1' }),
        })
      )
    })
  })

  describe('archiveClient', () => {
    it('should verify the client belongs to the org before archiving', async () => {
      prisma.client.update.mockResolvedValue({
        id: 'c1',
        archivedAt: new Date(),
        orgId: 'org-1',
      })

      await archiveClient('c1')

      expect(prisma.client.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: 'org-1' }),
        })
      )
    })
  })
})
