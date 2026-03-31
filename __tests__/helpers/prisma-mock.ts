import { vi } from 'vitest'

// Common Prisma delegate methods to mock
const delegateMethods = [
  'findMany',
  'findUnique',
  'findFirst',
  'create',
  'update',
  'upsert',
  'delete',
  'deleteMany',
  'count',
  'groupBy',
] as const

function createModelMock() {
  const mock: Record<string, ReturnType<typeof vi.fn>> = {}
  for (const method of delegateMethods) {
    mock[method] = vi.fn()
  }
  return mock
}

// All Prisma models from the schema
const modelNames = [
  'organization',
  'user',
  'client',
  'project',
  'projectAssignment',
  'timeEntry',
  'timecard',
  'token',
] as const

export type MockPrismaClient = {
  [K in (typeof modelNames)[number]]: {
    [M in (typeof delegateMethods)[number]]: ReturnType<typeof vi.fn>
  }
} & {
  $transaction: ReturnType<typeof vi.fn>
}

function createMockPrismaClient(): MockPrismaClient {
  const client: Record<string, unknown> = {}
  for (const model of modelNames) {
    client[model] = createModelMock()
  }
  client.$transaction = vi.fn((fn) =>
    typeof fn === 'function' ? fn(client) : Promise.all(fn)
  )
  return client as unknown as MockPrismaClient
}

// Singleton mock instance
export const prismaMock = createMockPrismaClient()

/**
 * Returns the mocked Prisma client. Call this in your tests to get
 * the mock instance and set up return values.
 */
export function mockPrisma(): MockPrismaClient {
  return prismaMock
}

// Replace the real Prisma client with the mock
vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))
