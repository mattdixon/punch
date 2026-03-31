import { describe, it, expect, beforeEach } from 'vitest'
import { mockAuth, mockSession } from '../helpers/auth-mock'
import { mockPrisma } from '../helpers/prisma-mock'
import {
  getCompanySettings,
  updateCompanySettings,
} from '@/app/actions/settings'

const prisma = mockPrisma()

describe('Settings actions - org isolation', () => {
  beforeEach(() => {
    mockAuth(mockSession({ role: 'ADMIN', orgId: 'org-1' }))

    for (const method of Object.values(prisma.organization)) {
      if (typeof method === 'function' && 'mockReset' in method) {
        method.mockReset()
      }
    }
    // Also reset companySettings mocks since current code uses that model
    if (prisma.companySettings) {
      for (const method of Object.values(
        prisma.companySettings as Record<string, unknown>
      )) {
        if (
          typeof method === 'function' &&
          'mockReset' in (method as object)
        ) {
          ;(method as ReturnType<typeof vi.fn>).mockReset()
        }
      }
    }
  })

  describe('getCompanySettings (getOrganization)', () => {
    it('should fetch settings by orgId from session, not singleton "default"', async () => {
      // After multi-tenancy, settings should be fetched from the organization
      // record using the session orgId, not a hardcoded "default" id
      prisma.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        companyName: 'Test Company',
        defaultPaymentTerms: 'Net 30',
        defaultBillCents: 15000,
        defaultPayCents: 5000,
        defaultCurrency: 'USD',
        fiscalYearStartMonth: 1,
      })

      await getCompanySettings()

      // Should query organization by orgId, NOT companySettings with id: "default"
      expect(prisma.organization.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'org-1' }),
        })
      )
    })

    it('should not use the hardcoded "default" singleton pattern', async () => {
      prisma.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        companyName: 'Org 1 Corp',
      })

      await getCompanySettings()

      // Verify it does NOT query with the old singleton id
      if (prisma.companySettings) {
        expect(
          (prisma.companySettings as Record<string, ReturnType<typeof vi.fn>>)
            .findUnique
        ).not.toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 'default' },
          })
        )
      }
    })
  })

  describe('updateCompanySettings (updateOrganization)', () => {
    it('should update organization using orgId from session', async () => {
      prisma.organization.update.mockResolvedValue({
        id: 'org-1',
        companyName: 'Updated Name',
      })

      await updateCompanySettings({
        companyName: 'Updated Name',
        defaultPaymentTerms: 'Net 30',
        defaultBillCents: 15000,
        defaultPayCents: 5000,
        defaultCurrency: 'USD',
        fiscalYearStartMonth: 1,
      })

      expect(prisma.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'org-1' }),
        })
      )
    })

    it('should not use upsert with hardcoded "default" id', async () => {
      prisma.organization.update.mockResolvedValue({
        id: 'org-1',
        companyName: 'Test',
      })

      await updateCompanySettings({
        companyName: 'Test',
        defaultPaymentTerms: 'Net 30',
        defaultBillCents: 15000,
        defaultPayCents: 5000,
        defaultCurrency: 'USD',
        fiscalYearStartMonth: 1,
      })

      // Should NOT use the old companySettings.upsert pattern
      if (prisma.companySettings) {
        expect(
          (prisma.companySettings as Record<string, ReturnType<typeof vi.fn>>)
            .upsert
        ).not.toHaveBeenCalled()
      }
    })

    it('should scope the update to the session org only', async () => {
      prisma.organization.update.mockResolvedValue({
        id: 'org-1',
        companyName: 'Scoped Update',
      })

      await updateCompanySettings({
        companyName: 'Scoped Update',
        defaultPaymentTerms: 'Due on receipt',
        defaultBillCents: 20000,
        defaultPayCents: 7500,
        defaultCurrency: 'USD',
        fiscalYearStartMonth: 6,
      })

      // The where clause must use the session orgId
      expect(prisma.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'org-1' }),
          data: expect.objectContaining({
            companyName: 'Scoped Update',
          }),
        })
      )
    })
  })
})

import { vi } from 'vitest'
