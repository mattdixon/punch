import { describe, it, expect, beforeEach } from 'vitest'
import { mockAuth, mockSession } from '../helpers/auth-mock'
import { mockPrisma } from '../helpers/prisma-mock'
import { getProjects, createProject } from '@/app/actions/projects'

const prisma = mockPrisma()

describe('Project actions - org isolation', () => {
  beforeEach(() => {
    mockAuth(mockSession({ role: 'ADMIN', orgId: 'org-1' }))

    for (const method of Object.values(prisma.project)) {
      if (typeof method === 'function' && 'mockReset' in method) {
        method.mockReset()
      }
    }
    for (const method of Object.values(prisma.client)) {
      if (typeof method === 'function' && 'mockReset' in method) {
        method.mockReset()
      }
    }
  })

  describe('getProjects', () => {
    it('should pass orgId in the where clause', async () => {
      prisma.project.findMany.mockResolvedValue([])

      await getProjects()

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: 'org-1' }),
        })
      )
    })

    it('should pass orgId even when showArchived is true', async () => {
      prisma.project.findMany.mockResolvedValue([])

      await getProjects(true)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: 'org-1' }),
        })
      )
    })
  })

  describe('createProject', () => {
    it('should include orgId in the create data', async () => {
      prisma.project.create.mockResolvedValue({
        id: 'p-new',
        name: 'New Project',
        orgId: 'org-1',
      })

      await createProject({
        name: 'New Project',
        clientId: 'client-1',
        defaultBillCents: 15000,
        paymentTerms: 'Net 30',
      })

      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ orgId: 'org-1' }),
        })
      )
    })

    it('should derive orgId from session, not from client relationship', async () => {
      prisma.project.create.mockResolvedValue({
        id: 'p-new',
        name: 'Test',
        orgId: 'org-1',
      })

      await createProject({
        name: 'Test',
        clientId: 'client-1',
        defaultBillCents: 10000,
        paymentTerms: 'Net 15',
      })

      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ orgId: 'org-1' }),
        })
      )
    })
  })
})
