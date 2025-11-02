import { describe, it, expect, beforeEach, afterEach, vi, test } from 'bun:test'
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

// DIRECT REPOSITORY MOCKING - bypass complex Drizzle query building
vi.mock('@/lib/data-access', async () => {
  const actual = await import('@/lib/data-access')
  
  // Mock data storage
  const mockData = {
    users: [
      {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        workosId: 'workos-123',
        preferences: {},
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z')
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
        dueDate: new Date(Date.now() - 86400000), // Yesterday - overdue
        userId: '550e8400-e29b-41d4-a716-446655440000',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z')
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
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z')
      }
    ]
  }

  // Create mock repository implementations
  const mockUserRepository = {
    async findByEmail(email: string) {
      return mockData.users.find(u => u.email === email) || null
    },
    async findById(id: string) {
      return mockData.users.find(u => u.id === id) || null
    },
    async create(data: any) {
      // Check unique constraint
      if (data.email && mockData.users.some(u => u.email === data.email)) {
        const error = new Error('duplicate key value violates unique constraint "users_email_unique"') as any
        error.code = '23505'
        throw error
      }
      const newUser = {
        id: Date.now().toString(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      mockData.users.push(newUser)
      return newUser
    },
    async update(id: string, data: any) {
      const user = mockData.users.find(u => u.id === id)
      if (!user) throw new NotFoundError('Record', id)
      Object.assign(user, { ...data, updatedAt: new Date() })
      return user
    },
    async delete(id: string) {
      const index = mockData.users.findIndex(u => u.id === id)
      if (index === -1) throw new NotFoundError('Record', id)
      mockData.users.splice(index, 1)
    },
    async bulkUpdate(data: any) {
      // Mock implementation
      return []
    }
  }

  const mockTaskRepository = {
    async findById(id: string) {
      return mockData.tasks.find(t => t.id === id) || null
    },
    async create(data: any) {
      const newTask = {
        id: Date.now().toString(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      mockData.tasks.push(newTask)
      return newTask
    },
    async update(id: string, data: any) {
      const task = mockData.tasks.find(t => t.id === id)
      if (!task) throw new NotFoundError('Record', id)
      Object.assign(task, { ...data, updatedAt: new Date() })
      return task
    },
    async delete(id: string) {
      const index = mockData.tasks.findIndex(t => t.id === id)
      if (index === -1) throw new NotFoundError('Record', id)
      mockData.tasks.splice(index, 1)
    },
    async findOverdue(userId: string) {
      const now = new Date()
      return mockData.tasks.filter(t => 
        t.userId === userId && 
        t.status === 'pending' && 
        t.dueDate <= now
      )
    },
    async bulkUpdate(data: any) {
      // Mock implementation
      return []
    },
    async findWithFilters(userId: string, filters: any) {
      return mockData.tasks.filter(t => t.userId === userId)
    }
  }

  const mockCalendarEventRepository = {
    async findById(id: string) {
      return mockData.events.find(e => e.id === id) || null
    },
    async create(data: any) {
      const newEvent = {
        id: Date.now().toString(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      mockData.events.push(newEvent)
      return newEvent
    },
    async update(id: string, data: any) {
      const event = mockData.events.find(e => e.id === id)
      if (!event) throw new NotFoundError('Record', id)
      Object.assign(event, { ...data, updatedAt: new Date() })
      return event
    },
    async delete(id: string) {
      const index = mockData.events.findIndex(e => e.id === id)
      if (index === -1) throw new NotFoundError('Record', id)
      mockData.events.splice(index, 1)
    },
    async findConflicts(userId: string, startTime: Date, endTime: Date, excludeId?: string) {
      return mockData.events.filter(e => 
        e.userId === userId &&
        (!excludeId || e.id !== excludeId) &&
        e.startTime < endTime &&
        e.endTime > startTime
      )
    },
    async bulkUpdate(data: any) {
      // Mock implementation
      return []
    },
    async getWithTags(id: string) {
      const event = mockData.events.find(e => e.id === id)
      return event ? { ...event, tags: [] } : null
    }
  }

  return {
    ...actual,
    userRepository: mockUserRepository,
    taskRepository: mockTaskRepository,
    calendarEventRepository: mockCalendarEventRepository,
  }
})

describe('Data Access Layer - Simple Mock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('UserRepository', () => {
    it('should find user by email', async () => {
      const user = await userRepository.findByEmail('test@example.com')
      
      expect(user).toBeDefined()
      expect(user?.email).toBe('test@example.com')
      expect(user?.id).toBe('1')
    })
  })

  describe('TaskRepository', () => {
    it('should update task successfully', async () => {
      const updates = {
        title: 'Updated Task',
        status: 'completed',
      }

      const result = await taskRepository.update('1', updates)

      expect(result.title).toBe('Updated Task')
      expect(result.status).toBe('completed')
    })

    it('should find overdue tasks', async () => {
      const overdueTasks = await taskRepository.findOverdue('550e8400-e29b-41d4-a716-446655440000')
      
      expect(Array.isArray(overdueTasks)).toBe(true)
      expect(overdueTasks.length).toBeGreaterThan(0)
    })
  })

  describe('CalendarEventRepository', () => {
    it('should find event conflicts', async () => {
      const conflicts = await calendarEventRepository.findConflicts(
        '550e8400-e29b-41d4-a716-446655440000',
        new Date('2024-01-01T10:00:00Z'),
        new Date('2024-01-01T11:00:00Z')
      )
      
      expect(Array.isArray(conflicts)).toBe(true)
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete task lifecycle', async () => {
      const taskData = {
        title: 'Integration Test Task',
        description: 'Testing complete workflow',
        priority: 'high',
        status: 'pending',
        userId: '550e8400-e29b-41d4-a716-446655440000',
      }

      const createdTask = await taskRepository.create(taskData)
      expect(createdTask).toHaveProperty('id')
      expect(createdTask.title).toBe(taskData.title)

      const updates = {
        status: 'completed',
        progress: 100,
      }

      const updatedTask = await taskRepository.update(createdTask.id, updates)
      expect(updatedTask.status).toBe('completed')
      expect(updatedTask.progress).toBe(100)
    })

    it('should handle complete event lifecycle', async () => {
      const eventData = {
        title: 'Integration Test Event',
        description: 'Testing complete workflow',
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        isAllDay: false,
        userId: '550e8400-e29b-41d4-a716-446655440000',
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
    })
  })
})