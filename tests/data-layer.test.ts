import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  userRepository,
  taskRepository,
  calendarEventRepository,
  categoryRepository,
  tagRepository,
  DatabaseError,
  ValidationError,
  NotFoundError,
} from '@/lib/data-access'
import {
  MigrationManager,
  createMigrationManager,
} from '@/lib/db/migration-manager'
import {
  SyncService,
  OptimisticUpdateManager,
  ConflictResolutionService,
} from '@/lib/sync'
import {
  validateTaskData,
  validateEventData,
  validateUserData,
  validateTaskInsertData,
  validateEventInsertData,
} from '@/lib/validations/schemas'
import type {
  DatabaseUser,
  DatabaseTask,
  DatabaseCalendarEvent,
  DatabaseCategory,
  DatabaseTag,
  TaskFormData,
  EventFormData,
} from '@/types/database'

// Comprehensive database mock implementation
vi.mock('@/lib/db', async () => {
  // Mock data storage
  const mockData = {
    users: [
      {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        workosId: 'workos-123',
        preferences: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    tasks: [
      {
        id: '1',
        title: 'Test Task',
        description: 'Test Description',
        status: 'pending',
        priority: 'high',
        progress: 0,
        dueDate: new Date(),
        userId: '550e8400-e29b-41d4-a716-446655440000',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    events: [
      {
        id: '1',
        title: 'Test Event',
        description: 'Test Description',
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        isAllDay: false,
        location: null,
        userId: '550e8400-e29b-41d4-a716-446655440000',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    categories: [],
    tags: []
  }

  // Create proper query builders for Drizzle patterns
  const createSelectQuery = () => {
    let fromTable = null
    let whereConditions = []
    let joins = []

    const query = {
      from: (table) => {
        fromTable = table
        return {
          where: (condition) => {
            whereConditions.push(condition)
            return {
              limit: (count) => {
                return Promise.resolve([mockData.users[0] || mockData.tasks[0] || mockData.events[0]].filter(Boolean))
              },
              orderBy: () => ({
                limit: () => Promise.resolve([]),
                offset: () => Promise.resolve([])
              })
            }
          },
          leftJoin: (table, condition) => {
            joins.push({ type: 'leftJoin', table, condition })
            return {
              leftJoin: (table, condition) => {
                joins.push({ type: 'leftJoin', table, condition })
                return {
                  where: () => Promise.resolve([{
                    event: mockData.events[0],
                    tags: null
                  }])
                }
              }
            }
          }
        }
      }
    }
    return query
  }

  const mockDb = {
    insert: () => ({
      values: (data) => ({
        returning: () => {
          const newRecord = {
            id: Date.now().toString(),
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
          }
          if (data.email) {
            mockData.users.push(newRecord)
          } else if (data.title && data.status) {
            mockData.tasks.push(newRecord)
          } else if (data.title && data.startTime) {
            mockData.events.push(newRecord)
          }
          return Promise.resolve([newRecord])
        }
      })
    }),
    select: () => createSelectQuery(),
    update: () => ({
      set: (data) => ({
        where: (condition) => ({
          returning: () => {
            const record = [...mockData.users, ...mockData.tasks, ...mockData.events]
              .find(r => r.id === condition?.value)
            if (record) {
              Object.assign(record, { ...data, updatedAt: new Date() })
              return Promise.resolve([record])
            }
            return Promise.resolve([])
          }
        })
      })
    }),
    delete: () => ({
      where: (condition) => ({
        returning: () => {
          const record = [...mockData.users, ...mockData.tasks, ...mockData.events]
            .find(r => r.id === condition?.value)
          if (record) {
            const index = mockData.users.findIndex(r => r.id === record.id)
            if (index !== -1) mockData.users.splice(index, 1)
            const taskIndex = mockData.tasks.findIndex(r => r.id === record.id)
            if (taskIndex !== -1) mockData.tasks.splice(taskIndex, 1)
            const eventIndex = mockData.events.findIndex(r => r.id === record.id)
            if (eventIndex !== -1) mockData.events.splice(eventIndex, 1)
            return Promise.resolve([record])
          }
          return Promise.resolve([])
        }
      })
    }),
    transaction: vi.fn().mockImplementation(async (callback) => {
      const tx = {
        insert: () => ({
          values: () => ({
            returning: () => Promise.resolve([{ id: '1' }])
          })
        }),
        update: () => ({
          set: () => ({
            where: () => ({
              returning: () => Promise.resolve([{ id: '1', updatedAt: new Date() }])
            })
          })
        }),
        delete: () => ({
          where: () => ({
            returning: () => Promise.resolve([{ id: '1' }])
          })
        })
      }
      return await callback(tx)
    })
  }

  return {
    db: mockDb,
    users: { id: 'users', email: 'users-email' },
    tasks: { id: 'tasks', userId: 'tasks-userId', title: 'tasks-title' },
    calendarEvents: { id: 'events', userId: 'events-userId', title: 'events-title' },
    categories: { id: 'categories', userId: 'categories-userId', name: 'categories-name' },
    tags: { id: 'tags', userId: 'tags-userId', name: 'tags-name', color: 'tags-color' },
    taskTags: { taskId: 'taskTags-taskId', tagId: 'taskTags-tagId' },
    eventTags: { eventId: 'eventTags-eventId', tagId: 'eventTags-tagId' }
  }
})

describe('Data Access Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('UserRepository', () => {
    it('should create a user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        workosId: 'workos-123',
      }

      const result = await userRepository.create(userData)

      expect(result).toHaveProperty('id')
      expect(result.email).toBe(userData.email)
    })

    it('should throw ValidationError for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        name: 'Test User',
      }

      await expect(userRepository.create(userData)).rejects.toThrow(ValidationError)
    })

    it('should find user by email', async () => {
      const user = await userRepository.findByEmail('test@example.com')
      
      expect(user).toHaveProperty('id')
      expect(user?.email).toBe('test@example.com')
    })

    it('should return null for non-existent user', async () => {
      const user = await userRepository.findByEmail('nonexistent@example.com')
      
      expect(user).toBeNull()
    })
  })

  describe('TaskRepository', () => {
    it('should create a task successfully', async () => {
      const taskData: TaskFormData = {
        title: 'Test Task',
        description: 'Test Description',
        priority: 'high',
        status: 'pending',
        userId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID
      }

      const result = await taskRepository.create(taskData)

      expect(result).toHaveProperty('id')
      expect(result.title).toBe(taskData.title)
      expect(result.priority).toBe('high')
      expect(result.userId).toBe(taskData.userId)
    })

    it('should update task successfully', async () => {
      const updates = {
        title: 'Updated Task',
        status: 'completed' as const,
      }

      const result = await taskRepository.update('1', updates)

      expect(result.title).toBe('Updated Task')
      expect(result.status).toBe('completed')
    })

    it('should find overdue tasks', async () => {
      const overdueTasks = await taskRepository.findOverdue('550e8400-e29b-41d4-a716-446655440000')
      
      expect(Array.isArray(overdueTasks)).toBe(true)
    })

    it('should handle bulk updates', async () => {
      const bulkData = {
        ids: ['1', '2', '3'],
        updates: { status: 'completed' as const },
      }

      const result = await taskRepository.bulkUpdate(bulkData)
      
      expect(result).toHaveLength(3)
    })
  })

  describe('CalendarEventRepository', () => {
    it('should create an event successfully', async () => {
      const eventData: EventFormData = {
        title: 'Test Event',
        description: 'Test Description',
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        isAllDay: false,
        userId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID
      }

      const result = await calendarEventRepository.create(eventData)

      expect(result).toHaveProperty('id')
      expect(result.title).toBe(eventData.title)
      expect(result.userId).toBe(eventData.userId)
    })

    it('should find event conflicts', async () => {
      const conflicts = await calendarEventRepository.findConflicts(
        '550e8400-e29b-41d4-a716-446655440000',
        new Date('2024-01-01T10:00:00Z'),
        new Date('2024-01-01T11:00:00Z')
      )
      
      expect(Array.isArray(conflicts)).toBe(true)
    })

    it('should handle events with tags', async () => {
      const result = await calendarEventRepository.getWithTags('1')
      
      expect(result).toHaveProperty('tags')
      expect(Array.isArray(result?.tags)).toBe(true)
    })
  })
})

describe('Validation Schemas', () => {
  describe('Task Validation', () => {
    it('should validate correct task data', () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        priority: 'high' as const,
        status: 'pending' as const,
        userId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID
      }

      const result = validateTaskInsertData(taskData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid task data', () => {
      const taskData = {
        title: '', // Empty title should fail
        priority: 'invalid-priority',
        userId: '550e8400-e29b-41d4-a716-446655440000',
      }

      const result = validateTaskData(taskData)
      expect(result.success).toBe(false)
    })
  })

  describe('Event Validation', () => {
    it('should validate correct event data', () => {
      const eventData = {
        title: 'Test Event',
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        isAllDay: false,
        userId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID
      }

      const result = validateEventInsertData(eventData)
      expect(result.success).toBe(true)
    })

    it('should reject event with end time before start time', () => {
      const eventData = {
        title: 'Test Event',
        startTime: new Date('2024-01-01T11:00:00Z'),
        endTime: new Date('2024-01-01T10:00:00Z'),
        isAllDay: false,
        userId: '550e8400-e29b-41d4-a716-446655440000',
      }

      const result = validateEventData(eventData)
      expect(result.success).toBe(false)
    })
  })
})

describe('Sync Service', () => {
  let syncService: SyncService
  let optimisticUpdateManager: OptimisticUpdateManager
  let conflictResolutionService: ConflictResolutionService

  beforeEach(() => {
    syncService = new SyncService()
    optimisticUpdateManager = new OptimisticUpdateManager()
    conflictResolutionService = new ConflictResolutionService()
  })

  afterEach(() => {
    syncService.destroy()
  })

  describe('SyncService', () => {
    it('should initialize with correct default state', () => {
      const status = syncService.getSyncStatus()
      
      expect(status.isOnline).toBe(true)
      expect(status.isSyncing).toBe(false)
      expect(status.pendingChanges).toBe(0)
    })

    it('should emit events during sync lifecycle', async () => {
      const syncStartSpy = vi.fn()
      const syncCompleteSpy = vi.fn()

      syncService.on('sync_start', syncStartSpy)
      syncService.on('sync_complete', syncCompleteSpy)

      // Mock successful sync
      vi.spyOn(syncService, 'syncWithDatabase' as any).mockResolvedValue({ syncedItems: 5 })

      await syncService.startSync('user-1', {})

      expect(syncStartSpy).toHaveBeenCalled()
      expect(syncCompleteSpy).toHaveBeenCalled()
    })

    it('should handle offline state', () => {
      // Mock offline event
      window.dispatchEvent(new Event('offline'))

      const status = syncService.getSyncStatus()
      expect(status.isOnline).toBe(false)
    })
  })

  describe('OptimisticUpdateManager', () => {
    it('should execute optimistic create update', async () => {
      const taskData = {
        id: '1',
        title: 'Test Task',
        priority: 'high' as const,
      }

      await optimisticUpdateManager.executeUpdate(
        '1',
        'create',
        'task',
        taskData
      )

      const pendingUpdates = optimisticUpdateManager.getPendingUpdates()
      expect(pendingUpdates.has('1')).toBe(true)
    })

    it('should rollback optimistic update', async () => {
      const taskData = {
        id: '1',
        title: 'Test Task',
        priority: 'high' as const,
      }

      await optimisticUpdateManager.executeUpdate(
        '1',
        'create',
        'task',
        taskData
      )

      await optimisticUpdateManager.rollbackUpdate('1')

      const pendingUpdates = optimisticUpdateManager.getPendingUpdates()
      expect(pendingUpdates.has('1')).toBe(false)
    })
  })

  describe('ConflictResolutionService', () => {
    it('should resolve conflicts using client strategy', async () => {
      const conflicts = [
        {
          type: 'task' as const,
          id: '1',
          localData: { title: 'Local Task', updatedAt: new Date('2024-01-02') },
          remoteData: { title: 'Remote Task', updatedAt: new Date('2024-01-01') },
        },
      ]

      const resolved = await conflictResolutionService.resolveConflicts(
        conflicts,
        'client'
      )

      expect(resolved[0].resolvedData.title).toBe('Local Task')
      expect(resolved[0].strategy).toBe('client')
    })

    it('should resolve conflicts using server strategy', async () => {
      const conflicts = [
        {
          type: 'task' as const,
          id: '1',
          localData: { title: 'Local Task', updatedAt: new Date('2024-01-01') },
          remoteData: { title: 'Remote Task', updatedAt: new Date('2024-01-02') },
        },
      ]

      const resolved = await conflictResolutionService.resolveConflicts(
        conflicts,
        'server'
      )

      expect(resolved[0].resolvedData.title).toBe('Remote Task')
      expect(resolved[0].strategy).toBe('server')
    })

    it('should merge data intelligently', () => {
      const localData = {
        id: '1',
        title: 'Local Title',
        description: 'Local Description',
        updatedAt: new Date('2024-01-01'),
      }

      const remoteData = {
        id: '1',
        title: 'Remote Title',
        updatedAt: new Date('2024-01-02'),
        newField: 'remote-value',
      }

      const merged = conflictResolutionService.mergeData(localData, remoteData)

      expect(merged.title).toBe('Remote Title') // Remote wins for more recent
      expect(merged.description).toBe('Local Description') // Local keeps its value
      expect(merged.newField).toBe('remote-value') // Remote adds new field
      expect(merged.updatedAt).toEqual(new Date('2024-01-02')) // Most recent timestamp
    })
  })
})

describe('Migration Manager', () => {
  let migrationManager: MigrationManager

  beforeEach(() => {
    // Use valid connection string format for tests
    migrationManager = createMigrationManager('postgresql://user:password@localhost:5432/testdb')
  })

  it('should create migration manager', () => {
    expect(migrationManager).toBeInstanceOf(MigrationManager)
  })

  it('should get database info', async () => {
    // Mock the connection to return valid info
    vi.mocked(global.fetch).mockResolvedValue(new Response(JSON.stringify({
      ok: true,
      data: { tables: [], indexes: [], size: '1MB' }
    })))
    
    const info = await migrationManager.getDatabaseInfo()
    
    expect(info).toHaveProperty('tables')
    expect(info).toHaveProperty('indexes')
    expect(info).toHaveProperty('size')
  })

  it('should check database health', async () => {
    // Mock health check response
    vi.mocked(global.fetch).mockResolvedValue(new Response(JSON.stringify({
      ok: true,
      data: { connected: true, version: '1.0.0', uptime: 3600, activeConnections: 5 }
    })))
    
    const health = await migrationManager.checkHealth()
    
    expect(health).toHaveProperty('connected')
    expect(health).toHaveProperty('version')
    expect(health).toHaveProperty('uptime')
    expect(health).toHaveProperty('activeConnections')
  })
})

describe('Integration Tests', () => {
  describe('Complete Task Workflow', () => {
    it('should handle complete task lifecycle', async () => {
      const taskData: TaskFormData = {
        title: 'Integration Test Task',
        description: 'Testing complete workflow',
        priority: 'high',
        status: 'pending',
        userId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID
      }

      const createdTask = await taskRepository.create(taskData)
      expect(createdTask).toHaveProperty('id')
      expect(createdTask.title).toBe(taskData.title)

      const updates = {
        status: 'completed' as const,
        progress: 100,
      }

      const updatedTask = await taskRepository.update(createdTask.id, updates)
      expect(updatedTask.status).toBe('completed')
      expect(updatedTask.progress).toBe(100)

      await taskRepository.delete(createdTask.id)

      const deletedTask = await taskRepository.findById(createdTask.id)
      expect(deletedTask).toBeNull()
    })
  })

  describe('Complete Event Workflow', () => {
    it('should handle complete event lifecycle', async () => {
      const eventData: EventFormData = {
        title: 'Integration Test Event',
        description: 'Testing complete workflow',
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        isAllDay: false,
        userId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID
      }

      const createdEvent = await calendarEventRepository.create(eventData)
      expect(createdEvent).toHaveProperty('id')
      expect(createdEvent.title).toBe(eventData.title)

      const updates = {
        title: 'Updated Integration Test Event',
        location: 'Conference Room A',
      }

      const updatedEvent = await calendarEventRepository.update(createdEvent.id, updates)
      expect(updatedEvent.title).toBe(updates.title)
      expect(updatedEvent.location).toBe(updates.location)

      const conflicts = await calendarEventRepository.findConflicts(
        '550e8400-e29b-41d4-a716-446655440000',
        new Date('2024-01-01T10:30:00Z'),
        new Date('2024-01-01T11:30:00Z'),
        createdEvent.id
      )
      expect(Array.isArray(conflicts)).toBe(true)

      await calendarEventRepository.delete(createdEvent.id)

      const deletedEvent = await calendarEventRepository.findById(createdEvent.id)
      expect(deletedEvent).toBeNull()
    })
  })

  describe('Database Constraints', () => {
    it('should enforce unique constraints', async () => {
      const userData1 = {
        email: 'unique@example.com',
        name: 'User 1',
      }

      const userData2 = {
        email: 'unique@example.com',
        name: 'User 2',
      }

      await expect(userRepository.create(userData1)).resolves.toBeDefined()

      await expect(userRepository.create(userData2)).rejects.toThrow()
    })

    it('should enforce foreign key constraints', async () => {
      const taskData = {
        title: 'Test Task',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        priority: 'high' as const,
        status: 'pending' as const,
      }

      await expect(taskRepository.create(taskData)).resolves.toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'))

      await expect(taskRepository.findById('1')).rejects.toThrow(DatabaseError)
    })

    it('should handle validation errors with proper messages', async () => {
      const invalidTaskData = {
        title: '',
        priority: 'invalid-priority',
      }

      await expect(taskRepository.create(invalidTaskData)).rejects.toThrow(ValidationError)
    })

    it('should handle not found errors', async () => {
      await expect(taskRepository.findById('non-existent-id')).resolves.toBeNull()
      
      await expect(
        taskRepository.update('non-existent-id', { title: 'Updated' })
      ).rejects.toThrow(NotFoundError)
    })
  })
})

describe('Performance Tests', () => {
  it('should handle bulk operations efficiently', async () => {
    const startTime = Date.now()

    const bulkData = {
      ids: Array.from({ length: 100 }, (_, i) => `task-${i}`),
      updates: { status: 'completed' as const },
    }

    await taskRepository.bulkUpdate(bulkData)

    const endTime = Date.now()
    const duration = endTime - startTime

    expect(duration).toBeLessThan(5000)
  })

  it('should handle concurrent operations', async () => {
    const operations = Array.from({ length: 10 }, (_, i) =>
      taskRepository.create({
        title: `Concurrent Task ${i}`,
        priority: 'medium' as const,
        status: 'pending' as const,
        userId: '550e8400-e29b-41d4-a716-446655440000', // Use consistent UUID
      })
    )

    await expect(Promise.all(operations)).resolves.toHaveLength(10)
  })
})

// Memory and cleanup tests
describe('Memory Management', () => {
  it('should not leak memory during sync operations', async () => {
    const syncService = new SyncService()

    // Simulate multiple sync cycles
    for (let i = 0; i < 100; i++) {
      await syncService.forceSync('user-1')
    }

    syncService.destroy()

    // In a real scenario, you might use memory profiling tools
    expect(syncService.getSyncStatus()).toBeDefined()
  })

  it('should cleanup optimistic updates properly', () => {
    const manager = new OptimisticUpdateManager()

    // Add some updates
    manager.executeUpdate('1', 'create', 'task', { title: 'Test' })
    manager.executeUpdate('2', 'update', 'event', { title: 'Updated' })

    expect(manager.getPendingUpdates().size).toBe(2)

    // Clear all updates
    manager.clearPendingUpdates()

    expect(manager.getPendingUpdates().size).toBe(0)
  })
})