import { vi } from 'vitest'
import type { DatabaseUser, DatabaseTask, DatabaseCalendarEvent, DatabaseCategory, DatabaseTag } from '@/types/database'

// Mock database utilities
export const databaseUtils = {
  // Create mock database connection
  createMockDB() {
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
  },

  // Create mock user data
  createMockUser(overrides: Partial<DatabaseUser> = {}): DatabaseUser {
    return {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      workosId: 'workos-123',
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }
  },

  // Create mock task data
  createMockTask(overrides: Partial<DatabaseTask> = {}): DatabaseTask {
    return {
      id: 'task-1',
      userId: 'user-1',
      title: 'Test Task',
      description: 'Test Description',
      priority: 'high',
      status: 'pending',
      progress: 0,
      dueDate: null,
      categoryId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }
  },

  // Create mock event data
  createMockEvent(overrides: Partial<DatabaseCalendarEvent> = {}): DatabaseCalendarEvent {
    return {
      id: 'event-1',
      userId: 'user-1',
      title: 'Test Event',
      description: 'Test Description',
      startTime: new Date('2024-01-01T10:00:00Z'),
      endTime: new Date('2024-01-01T11:00:00Z'),
      isAllDay: false,
      location: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }
  },

  // Create mock category data
  createMockCategory(overrides: Partial<DatabaseCategory> = {}): DatabaseCategory {
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
  },

  // Create mock tag data
  createMockTag(overrides: Partial<DatabaseTag> = {}): DatabaseTag {
    return {
      id: 'tag-1',
      userId: 'user-1',
      name: 'Test Tag',
      color: '#EF4444',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }
  },

  // Mock database errors
  createMockDatabaseError(message: string = 'Database error') {
    return new Error(message)
  },

  createMockValidationError(message: string = 'Validation error') {
    return new Error(message)
  },

  createMockNotFoundError(message: string = 'Not found error') {
    return new Error(message)
  },

  // Reset all mock calls
  resetMockDB(mockDB: any) {
    Object.values(mockDB).forEach((mock: any) => {
      if (typeof mock === 'function' && mock.mockReset) {
        mock.mockReset()
      }
    })
  },

  // Setup mock for transaction rollback
  setupTransactionRollback(mockDB: any) {
    const mockTransaction = mockDB.transaction as vi.MockedFunction<any>
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
  },
}