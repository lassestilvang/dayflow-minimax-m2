import { vi } from 'vitest'
import type { DatabaseUser, DatabaseTask, DatabaseCalendarEvent, DatabaseCategory, DatabaseTag } from '@/types/database'

// Core mock database functions - standalone exports
export function createMockDB() {
  return {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => [{ 
          id: 'mock-id', 
          createdAt: new Date(), 
          updatedAt: new Date() 
        }]),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => []),
        })),
        orderBy: vi.fn(() => ({
          limit: vi.fn(() => []),
          offset: vi.fn(() => []),
        })),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => [{ 
            id: 'mock-id', 
            updatedAt: new Date() 
          }]),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(() => [{ id: 'mock-id' }]),
      })),
    })),
    transaction: vi.fn((callback) => callback({
      insert: vi.fn(() => ({ 
        values: vi.fn(() => ({ 
          returning: vi.fn(() => [{ id: 'mock-id' }]) 
        })) 
      })),
      update: vi.fn(() => ({ 
        set: vi.fn(() => ({ 
          where: vi.fn(() => ({ 
            returning: vi.fn(() => [{ id: 'mock-id', updatedAt: new Date() }]) 
          })) 
        })) 
      })),
      delete: vi.fn(() => ({ 
        where: vi.fn(() => ({ 
          returning: vi.fn(() => [{ id: 'mock-id' }]) 
        })) 
      })),
    })),
  }
}

export function resetMockDB(mockDB: any) {
  if (mockDB?.insert) mockDB.insert.mockClear()
  if (mockDB?.select) mockDB.select.mockClear()
  if (mockDB?.update) mockDB.update.mockClear()
  if (mockDB?.delete) mockDB.delete.mockClear()
  if (mockDB?.transaction) mockDB.transaction.mockClear()
}

// Data generation functions - standalone exports
export function createMockUser(overrides: Partial<DatabaseUser> = {}): DatabaseUser {
  return {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    workosId: 'workos-123',
    timezone: 'UTC',
    preferences: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function createMockTask(overrides: Partial<DatabaseTask> = {}): DatabaseTask {
  return {
    id: 'task-1',
    userId: 'user-1',
    title: 'Test Task',
    description: 'Test Description',
    priority: 'high',
    status: 'pending',
    progress: 0,
    dueDate: undefined,
    categoryId: undefined,
    recurrence: { type: 'none' },
    reminder: { enabled: false, minutesBefore: 0 },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function createMockCalendarEvent(overrides: Partial<DatabaseCalendarEvent> = {}): DatabaseCalendarEvent {
  return {
    id: 'event-1',
    userId: 'user-1',
    title: 'Test Event',
    description: 'Test Description',
    startTime: new Date('2024-01-01T10:00:00Z'),
    endTime: new Date('2024-01-01T11:00:00Z'),
    isAllDay: false,
    location: undefined,
    attendees: [],
    recurrence: { type: 'none' },
    reminder: { enabled: false, minutesBefore: 0 },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function createMockCategory(overrides: Partial<DatabaseCategory> = {}): DatabaseCategory {
  return {
    id: 'category-1',
    userId: 'user-1',
    name: 'Test Category',
    color: '#3B82F6',
    icon: 'folder',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function createMockTag(overrides: Partial<DatabaseTag> = {}): DatabaseTag {
  return {
    id: 'tag-1',
    userId: 'user-1',
    name: 'Test Tag',
    color: '#EF4444',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

// Error generation functions
export function createMockDatabaseError(message: string = 'Database error') {
  return new Error(message)
}

export function createMockValidationError(message: string = 'Validation error') {
  return new Error(message)
}

export function createMockNotFoundError(message: string = 'Not found error') {
  return new Error(message)
}

// Complex utility functions
export function createMockDatabase() {
  return createMockDB()
}

export function setupTransactionRollback(mockDB: any) {
  const mockTransaction = (mockDB.transaction as any)
  mockTransaction.mockImplementation((callback: Function) => {
    const mockTx = {
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => [{ id: 'mock-id', error: true }]),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => [{ id: 'mock-id', error: true }]),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => [{ id: 'mock-id', error: true }]),
        })),
      })),
    }
    return callback(mockTx)
  })
}

export function mockDatabaseQuery() {
  return vi.fn((query: string, params?: any) => {
    return Promise.resolve({ rows: [], rowCount: 0 })
  })
}

// Re-export everything as a single object for convenience
export const databaseUtils = {
  createMockDB,
  resetMockDB,
  createMockUser,
  createMockTask,
  createMockCalendarEvent,
  createMockCategory,
  createMockTag,
  createMockDatabase,
  createMockDatabaseError,
  createMockValidationError,
  createMockNotFoundError,
  setupTransactionRollback,
  mockDatabaseQuery,
}

// Legacy alias for compatibility
export const createMockDatabaseStandalone = createMockDatabase