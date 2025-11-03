import { describe, it, expect, vi } from 'bun:test'

// Mock database first
vi.mock('@/lib/db', async () => {
  return {
    getDatabase: vi.fn(() => ({
      insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn(() => [{ id: '1' }]) })) })),
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(() => [{ id: '1', email: 'test@example.com' }]) })) })) })),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn(() => [{ id: '1' }]) })) })) })),
      delete: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn(() => [{ id: '1' }]) })) })),
      transaction: vi.fn((cb: any) => cb({}))
    })),
    getSQL: vi.fn(() => ({ query: vi.fn().mockResolvedValue([]) })),
    checkDatabaseConnection: vi.fn().mockResolvedValue({ connected: false })
  }
})

// Mock validations
vi.mock('@/lib/validations/schemas', () => ({
  validateTaskData: vi.fn(() => ({ success: true })),
  validateEventData: vi.fn(() => ({ success: true })),
  validateUserData: vi.fn(() => ({ success: true })),
  validateTaskInsertData: vi.fn(() => ({ success: true })),
  validateEventInsertData: vi.fn(() => ({ success: true })),
  taskInsertSchema: { safeParse: vi.fn(() => ({ success: true })) },
  eventInsertSchema: { safeParse: vi.fn(() => ({ success: true })) },
  userInsertSchema: { safeParse: vi.fn(() => ({ success: true })) },
  taskUpdateSchema: { safeParse: vi.fn(() => ({ success: true })) },
  eventUpdateSchema: { safeParse: vi.fn(() => ({ success: true })) },
  taskFormDataSchema: { safeParse: vi.fn(() => ({ success: true })) },
  eventFormDataSchema: { safeParse: vi.fn(() => ({ success: true })) }
}))

// Mock types
vi.mock('@/types/database', () => ({
  DatabaseUser: {},
  DatabaseTask: {},
  DatabaseCalendarEvent: {},
  DatabaseCategory: {},
  DatabaseTag: {},
  TaskFormData: {},
  EventFormData: {}
}))

// NOW import repositories with mocks in place
import { userRepository } from '@/lib/data-access'

describe('User Repository Test', () => {
  it('should find user by email', async () => {
    const user = await userRepository.findByEmail('test@example.com')
    expect(user).toBeDefined()
    expect(user?.email).toBe('test@example.com')
  })

  it('should find user by id', async () => {
    const user = await userRepository.findById('1')
    expect(user).toBeDefined()
    expect(user?.id).toBe('1')
  })
})