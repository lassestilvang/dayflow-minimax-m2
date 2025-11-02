import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
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

// COMPREHENSIVE DATABASE MOCK - simplified approach with direct method mocking
vi.mock('@/lib/db', async () => {
  // Mock data storage with proper structure
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

  // Mock Drizzle functions
  const mockEq = (column: any, value: any) => ({ type: 'eq', column, value })
  const mockLte = (column: any, value: any) => ({ type: 'lte', column, value })
  const mockGte = (column: any, value: any) => ({ type: 'gte', column, value })
  const mockAnd = (...conditions: any[]) => ({ type: 'and', conditions })
  const mockBetween = (column: any, start: any, end: any) => ({ type: 'between', column, start, end })
  const mockIlike = (column: any, pattern: any) => ({ type: 'ilike', column, pattern })
  const mockDesc = (column: any) => ({ type: 'desc', column })
  const mockAsc = (column: any) => ({ type: 'asc', column })
  const mockSQL = (strings: TemplateStringsArray, ...values: any[]) => ({ type: 'sql', strings, values })

  // Simplified mock tables
  const users = {
    id: { name: 'id' },
    email: { name: 'email' },
    workosId: { name: 'workosId' },
    name: { name: 'name' },
    preferences: { name: 'preferences' }
  }
  const tasks = {
    id: { name: 'id' },
    userId: { name: 'userId' },
    title: { name: 'title' },
    description: { name: 'description' },
    status: { name: 'status' },
    priority: { name: 'priority' },
    progress: { name: 'progress' },
    dueDate: { name: 'dueDate' },
    categoryId: { name: 'categoryId' }
  }
  const calendarEvents = {
    id: { name: 'id' },
    userId: { name: 'userId' },
    title: { name: 'title' },
    description: { name: 'description' },
    startTime: { name: 'startTime' },
    endTime: { name: 'endTime' },
    isAllDay: { name: 'isAllDay' },
    location: { name: 'location' }
  }
  const categories = { id: { name: 'id' }, userId: { name: 'userId' }, name: { name: 'name' }, color: { name: 'color' }, icon: { name: 'icon' } }
  const tags = { id: { name: 'id' }, userId: { name: 'userId' }, name: { name: 'name' }, color: { name: 'color' } }
  const taskTags = { taskId: { name: 'taskId' }, tagId: { name: 'tagId' } }
  const eventTags = { eventId: { name: 'eventId' }, tagId: { name: 'tagId' } }

  // Mock database with direct method implementations
  const mockDb = {
    insert: (table: any) => ({
      values: (data: any) => ({
        returning: async () => {
          const newRecord = {
            id: Date.now().toString(),
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
          }
          
          // Store in the correct table based on data type
          if (table === users) {
            // Check for unique constraint violations
            if (data.email && mockData.users.some(u => u.email === data.email)) {
              const error = new Error('duplicate key value violates unique constraint "users_email_unique"') as any
              error.code = '23505'
              throw error
            }
            mockData.users.push(newRecord)
          } else if (table === tasks) {
            mockData.tasks.push(newRecord)
          } else if (table === calendarEvents) {
            mockData.events.push(newRecord)
          }
          
          return [newRecord]
        }
      })
    }),
    
    select: () => ({
      from: (table: any) => {
        const getTableData = () => {
          if (table === users) return mockData.users
          if (table === tasks) return mockData.tasks
          if (table === calendarEvents) return mockData.events
          return []
        }
        
        return {
          where: (condition: any) => {
            const data = getTableData()
            
            // Simple direct filtering based on condition structure
            if (condition?.type === 'eq') {
              const columnName = condition.column?.name || condition.column
              return Promise.resolve(data.filter(item => item[columnName] === condition.value))
            }
            
            if (condition?.type === 'and') {
              return Promise.resolve(data.filter(item => {
                return condition.conditions.every((cond: any) => {
                  const columnName = cond.column?.name || cond.column
                  
                  if (cond.type === 'eq') {
                    return item[columnName] === cond.value
                  }
                  if (cond.type === 'lte') {
                    const val = item[columnName]
                    return val && new Date(val) <= new Date(cond.value)
                  }
                  if (cond.type === 'gte') {
                    const val = item[columnName]
                    return val && new Date(val) >= new Date(cond.value)
                  }
                  if (cond.type === 'between') {
                    const val = item[columnName]
                    return val && new Date(val) >= new Date(cond.start) && new Date(val) <= new Date(cond.end)
                  }
                  if (cond.type === 'sql') {
                    // Handle != operator for conflicts
                    const sqlText = cond.strings?.[0] || ''
                    if (sqlText.includes('!=')) {
                      return item.id !== cond.values?.[0]
                    }
                  }
                  return true
                })
              }))
            }
            
            return Promise.resolve(data)
          },
          leftJoin: () => ({
            leftJoin: () => ({
              where: () => Promise.resolve([{ event: data[0] || {}, tags: [] }])
            })
          }),
          orderBy: () => ({
            limit: (count: number) => ({
              offset: () => Promise.resolve(data.slice(0, count))
            })
          }),
          limit: (count: number) => Promise.resolve(count ? data.slice(0, count) : data)
        }
      }
    }),
    
    update: (table: any) => ({
      set: (data: any) => ({
        where: (condition: any) => ({
          returning: async () => {
            const tableData = table === users ? mockData.users : 
                             table === tasks ? mockData.tasks : 
                             table === calendarEvents ? mockData.events : []
            
            const columnName = condition.column?.name || 'id'
            const value = condition.value
            
            const record = tableData.find(r => r[columnName] === value)
            
            if (record) {
              Object.assign(record, { ...data, updatedAt: new Date() })
              return [record]
            }
            
            return []
          }
        })
      })
    }),
    
    delete: (table: any) => ({
      where: (condition: any) => ({
        returning: async () => {
          const tableData = table === users ? mockData.users : 
                           table === tasks ? mockData.tasks : 
                           table === calendarEvents ? mockData.events : []
          
          const columnName = condition.column?.name || 'id'
          const value = condition.value
          
          const index = tableData.findIndex(r => r[columnName] === value)
          
          if (index !== -1) {
            const [deleted] = tableData.splice(index, 1)
            return [deleted]
          }
          
          return []
        }
      })
    }),
    
    transaction: async (callback: (tx: any) => Promise<any>) => {
      const tx = {
        update: (table: any) => ({
          set: (data: any) => ({
            where: (condition: any) => ({
              returning: async () => {
                const tableData = table === users ? mockData.users : 
                                table === tasks ? mockData.tasks : 
                                table === calendarEvents ? mockData.events : []
                
                const columnName = condition.column?.name || 'id'
                const value = condition.value
                
                const record = tableData.find(r => r[columnName] === value)
                
                if (record) {
                  Object.assign(record, { ...data, updatedAt: new Date() })
                  return [record]
                }
                
                return []
              }
            })
          })
        })
      }
      return await callback(tx)
    }
  }

  return {
    db: mockDb,
    getDatabase: () => mockDb,
    getSQL: () => ({ query: () => ({ text: 'SELECT 1' }) }),
    users,
    tasks,
    calendarEvents,
    categories,
    tags,
    taskTags,
    eventTags,
    eq: mockEq,
    lte: mockLte,
    gte: mockGte,
    and: mockAnd,
    between: mockBetween,
    ilike: mockIlike,
    desc: mockDesc,
    asc: mockAsc,
    sql: mockSQL,
    type: {
      User: {},
      UserInsert: {},
      Task: {},
      TaskInsert: {},
      CalendarEvent: {},
      CalendarEventInsert: {},
      Tables: {}
    },
    schema: {},
    checkDatabaseConnection: async () => ({ connected: true })
  }
})

describe('Data Access Layer - Fixed Mock', () => {
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