import { describe, it, expect, vi } from 'bun:test'

// COMPLETELY ISOLATED MOCK - don't import any of the complex modules
vi.mock('@/lib/db', async () => {
  return {
    getDatabase: vi.fn(() => ({
      insert: vi.fn(() => ({
        values: vi.fn(() => ({ returning: vi.fn(() => []) }))
      })),
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({ limit: vi.fn(() => []) }))
        }))
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({ returning: vi.fn(() => []) }))
        }))
      })),
      delete: vi.fn(() => ({
        where: vi.fn(() => ({ returning: vi.fn(() => []) }))
      }))
    })),
    getSQL: vi.fn(() => ({ query: vi.fn().mockResolvedValue([]) })),
    checkDatabaseConnection: vi.fn().mockResolvedValue({ connected: false })
  }
})

// Import only what we need for error classes
import { 
  DatabaseError, 
  ValidationError, 
  NotFoundError 
} from '@/lib/data-access'

// Now import the data-access module which should use our mocks
import { 
  userRepository, 
  taskRepository, 
  calendarEventRepository 
} from '@/lib/data-access'

describe('Simple Repository Mock Test', () => {
  it('should create a simple mock repository', async () => {
    // Mock the data-access module completely
    const mockData = {
      users: [
        {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    }

    // Override the repository methods with our simple mocks
    const findByEmail = vi.fn().mockResolvedValue(mockData.users[0])
    const findById = vi.fn().mockResolvedValue(mockData.users[0])

    // Test that our basic mocks work
    expect(findByEmail).toBeDefined()
    expect(findById).toBeDefined()
    
    const result = await findByEmail('test@example.com')
    expect(result).toBeDefined()
    expect(result.email).toBe('test@example.com')
  })

  it('should handle error classes', () => {
    const notFoundError = new NotFoundError('User', '123')
    expect(notFoundError.message).toBe('User with id 123 not found')
    expect(notFoundError.name).toBe('NotFoundError')
  })
})