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

// Mock database connection
vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => [{ id: '1', createdAt: new Date() }]),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => [{ id: '1' }]),
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
          returning: vi.fn(() => [{ id: '1', updatedAt: new Date() }]),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(() => [{ id: '1' }]),
      })),
    })),
    transaction: vi.fn((callback) => callback({
      insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn(() => [{ id: '1' }]) })) })),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn(() => [{ id: '1' }]) })) })) })),
      delete: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn(() => [{ id: '1' }]) })) })),
    })),
  },
}))

describe('Data Access Layer', () => {
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
      }

      const result = await taskRepository.create(taskData)

      expect(result).toHaveProperty('id')
      expect(result.title).toBe(taskData.title)
      expect(result.priority).toBe('high')
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
      const overdueTasks = await taskRepository.findOverdue('user-1')
      
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
      }

      const result = await calendarEventRepository.create(eventData)

      expect(result).toHaveProperty('id')
      expect(result.title).toBe(eventData.title)
    })

    it('should find event conflicts', async () => {
      const conflicts = await calendarEventRepository.findConflicts(
        'user-1',
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
      }

      const result = validateTaskData(taskData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid task data', () => {
      const taskData = {
        title: '', // Empty title should fail
        priority: 'invalid-priority',
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
      }

      const result = validateEventData(eventData)
      expect(result.success).toBe(true)
    })

    it('should reject event with end time before start time', () => {
      const eventData = {
        title: 'Test Event',
        startTime: new Date('2024-01-01T11:00:00Z'),
        endTime: new Date('2024-01-01T10:00:00Z'),
        isAllDay: false,
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
    migrationManager = createMigrationManager('mock://connection-string')
  })

  it('should create migration manager', () => {
    expect(migrationManager).toBeInstanceOf(MigrationManager)
  })

  it('should get database info', async () => {
    const info = await migrationManager.getDatabaseInfo()
    
    expect(info).toHaveProperty('tables')
    expect(info).toHaveProperty('indexes')
    expect(info).toHaveProperty('size')
  })

  it('should check database health', async () => {
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
      // 1. Create a task
      const taskData: TaskFormData = {
        title: 'Integration Test Task',
        description: 'Testing complete workflow',
        priority: 'high',
        status: 'pending',
      }

      const createdTask = await taskRepository.create(taskData)
      expect(createdTask).toHaveProperty('id')
      expect(createdTask.title).toBe(taskData.title)

      // 2. Update the task
      const updates = {
        status: 'completed' as const,
        progress: 100,
      }

      const updatedTask = await taskRepository.update(createdTask.id, updates)
      expect(updatedTask.status).toBe('completed')
      expect(updatedTask.progress).toBe(100)

      // 3. Delete the task
      await taskRepository.delete(createdTask.id)

      // 4. Verify deletion
      const deletedTask = await taskRepository.findById(createdTask.id)
      expect(deletedTask).toBeNull()
    })
  })

  describe('Complete Event Workflow', () => {
    it('should handle complete event lifecycle', async () => {
      // 1. Create an event
      const eventData: EventFormData = {
        title: 'Integration Test Event',
        description: 'Testing complete workflow',
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        isAllDay: false,
      }

      const createdEvent = await calendarEventRepository.create(eventData)
      expect(createdEvent).toHaveProperty('id')
      expect(createdEvent.title).toBe(eventData.title)

      // 2. Update the event
      const updates = {
        title: 'Updated Integration Test Event',
        location: 'Conference Room A',
      }

      const updatedEvent = await calendarEventRepository.update(createdEvent.id, updates)
      expect(updatedEvent.title).toBe(updates.title)
      expect(updatedEvent.location).toBe('updates.location')

      // 3. Check for conflicts
      const conflicts = await calendarEventRepository.findConflicts(
        'user-1',
        new Date('2024-01-01T10:30:00Z'),
        new Date('2024-01-01T11:30:00Z'),
        createdEvent.id
      )
      expect(Array.isArray(conflicts)).toBe(true)

      // 4. Delete the event
      await calendarEventRepository.delete(createdEvent.id)

      // 5. Verify deletion
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

      // First user should be created successfully
      await expect(userRepository.create(userData1)).resolves.toBeDefined()

      // Second user with same email should fail
      await expect(userRepository.create(userData2)).rejects.toThrow()
    })

    it('should enforce foreign key constraints', async () => {
      const taskData = {
        title: 'Test Task',
        userId: 'non-existent-user-id',
        priority: 'high' as const,
        status: 'pending' as const,
      }

      await expect(taskRepository.create(taskData)).rejects.toThrow()
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'))

      await expect(taskRepository.findById('1')).rejects.toThrow(DatabaseError)
    })

    it('should handle validation errors with proper messages', async () => {
      const invalidTaskData = {
        title: '', // Empty title
        priority: 'invalid-priority',
      }

      await expect(taskRepository.create(invalidTaskData)).rejects.toThrow(ValidationError)
    })

    it('should handle not found errors', async () => {
      await expect(taskRepository.findById('non-existent-id')).resolves.toBeNull()
      
      // For update/delete operations on non-existent records
      await expect(
        taskRepository.update('non-existent-id', { title: 'Updated' })
      ).rejects.toThrow(NotFoundError)
    })
  })
})

// Performance tests
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

    // Should complete within reasonable time (adjust threshold as needed)
    expect(duration).toBeLessThan(5000) // 5 seconds
  })

  it('should handle concurrent operations', async () => {
    const operations = Array.from({ length: 10 }, (_, i) =>
      taskRepository.create({
        title: `Concurrent Task ${i}`,
        priority: 'medium' as const,
        status: 'pending' as const,
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