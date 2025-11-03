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

// NOW import all repositories with mocks in place
import {
  userRepository,
  taskRepository,
  calendarEventRepository,
} from '@/lib/data-access'

describe('Full Repository Test', () => {
  it('should find user by email', async () => {
    const user = await userRepository.findByEmail('test@example.com')
    expect(user).toBeDefined()
    expect(user?.email).toBe('test@example.com')
  })

  it('should handle task operations', async () => {
    const task = await taskRepository.findById('1')
    expect(task).toBeDefined()
  })

  it('should handle event operations', async () => {
    const event = await calendarEventRepository.findById('1')
    expect(event).toBeDefined()
  })

  it('should test task lifecycle', async () => {
    const created = await taskRepository.create({ 
      title: 'Test Task',
      userId: '550e8400-e29b-41d4-a716-446655440000'
    })
    expect(created).toBeDefined()
    
    const updated = await taskRepository.update('1', { status: 'completed' })
    expect(updated).toBeDefined()
  })
})