import { describe, it, expect } from 'vitest'
import { Prisma } from '@prisma/client'

describe('Organization model', () => {
  it('should have Organization in Prisma model names', () => {
    expect(Prisma.ModelName).toHaveProperty('Organization')
  })

  it('should have required fields in create input', () => {
    // Test that OrganizationCreateInput type exists and has name field
    const input: Prisma.OrganizationCreateInput = {
      name: 'Test Org',
    }
    expect(input.name).toBe('Test Org')
  })

  it('should have settings fields from CompanySettings', () => {
    const input: Prisma.OrganizationCreateInput = {
      name: 'Test Org',
      defaultBillCents: 15000,
      defaultPayCents: 5000,
      defaultCurrency: 'USD',
      defaultPaymentTerms: 'Net 30',
      fiscalYearStartMonth: 1,
    }
    expect(input.defaultBillCents).toBe(15000)
  })

  it('should have logoBase64 optional field', () => {
    const input: Prisma.OrganizationCreateInput = {
      name: 'Test Org',
      logoBase64: 'data:image/png;base64,abc',
    }
    expect(input.logoBase64).toBeDefined()
  })

  it('should have slug field', () => {
    const input: Prisma.OrganizationCreateInput = {
      name: 'Test Org',
      slug: 'test-org',
    }
    expect(input.slug).toBe('test-org')
  })
})
