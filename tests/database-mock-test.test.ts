import { describe, it, expect, vi } from 'bun:test'

// MOCK DATABASE MODULE FIRST - prevent any database connections during import
vi.mock('@/lib/db', async () => {
  return {
    // Prevent any database connection attempts
    getDatabase: vi.fn(() => {
      // Return a completely mocked database object
      return {
        insert: vi.fn(() => ({
          values: vi.fn(() => ({ returning: vi.fn(() => []) }))
        })),
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn(() => []),
              orderBy: vi.fn(() => ({ limit: vi.fn(() => []) })),
              offset: vi.fn(() => ({ limit: vi.fn(() => []) })),
            })),
            limit: vi.fn(() => [])
          }))
        })),
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn(() => ({
              returning: vi.fn(() => [])
            }))
          }))
        })),
        delete: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => [])
          }))
        })),
        transaction: vi.fn((callback: any) => callback({
          update: vi.fn(() => ({ returning: vi.fn(() => []) })),
        }))
      }
    }),
    getSQL: vi.fn(() => ({
      query: vi.fn().mockResolvedValue([]),
      querySingle: vi.fn().mockResolvedValue([])
    })),
    // Mock all other exports
    checkDatabaseConnection: vi.fn().mockResolvedValue({ connected: false })
  }
})

// Import after the mock
import { getDatabase } from '@/lib/db'

describe('Database Mock Test', () => {
  it('should not hang when importing database', async () => {
    const db = getDatabase()
    expect(db).toBeDefined()
    expect(typeof db.insert).toBe('function')
  })
})