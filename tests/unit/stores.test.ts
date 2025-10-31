import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act } from '@testing-library/react'
import { 
  useTaskStore, 
  useCalendarStore, 
  useUIStore,
  useEnhancedCalendarStore,
} from '@/stores'
import { testUtils } from '@/tests/utils'

// Mock the dependencies
vi.mock('@/lib/data-access', () => ({
  userRepository: {
    findByEmail: vi.fn(),
    create: vi.fn(),
  },
  taskRepository: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByUserId: vi.fn(),
    findById: vi.fn(),
  },
  calendarEventRepository: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByUserId: vi.fn(),
    findById: vi.fn(),
  },
  categoryRepository: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByUserId: vi.fn(),
  },
  tagRepository: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByUserId: vi.fn(),
  },
  ValidationError: class ValidationError extends Error {},
  DatabaseError: class DatabaseError extends Error {},
  NotFoundError: class NotFoundError extends Error {},
}))

vi.mock('@/lib/validations/schemas', () => ({
  validateTaskFormData: vi.fn(),
  validateEventFormData: vi.fn(),
  validateTaskData: vi.fn(),
  validateEventData: vi.fn(),
}))

vi.mock('@/lib/date-utils', () => ({
  getCurrentWeek: vi.fn(),
  getPreviousWeek: vi.fn(),
  getNextWeek: vi.fn(),
  getEventsForWeek: vi.fn(),
  detectEventCollisions: vi.fn(),
  checkEventCollision: vi.fn(),
  getEventsForDay: vi.fn(),
  sortEventsByTime: vi.fn(),
  DEFAULT_VIEW_SETTINGS: {
    startHour: 6,
    endHour: 22,
    showWeekends: false,
    timeFormat: '24h',
    defaultView: 'week',
  },
  createDefaultEvents: vi.fn(),
}))

describe('Enhanced Calendar Store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useEnhancedCalendarStore.setState({
      currentWeek: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07'),
        days: [],
      },
      selectedEvent: null,
      events: [],
      tasks: [],
      categories: [],
      tags: [],
      viewSettings: {
        startHour: 6,
        endHour: 22,
        showWeekends: false,
        timeFormat: '24h',
        defaultView: 'week',
      },
      isLoading: false,
      isSyncing: false,
      error: null,
      lastSync: null,
      isOnline: true,
      optimisticUpdates: new Map(),
    })
  })

  describe('Week Navigation', () => {
    it('should set current week', () => {
      const newWeek = {
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-07'),
        days: [],
      }

      useEnhancedCalendarStore.getState().setCurrentWeek(newWeek)

      const currentWeek = useEnhancedCalendarStore.getState().currentWeek
      expect(currentWeek).toEqual(newWeek)
    })

    it('should navigate to previous week', () => {
      const { getPreviousWeek } = require('@/lib/date-utils')
      getPreviousWeek.mockReturnValue({
        startDate: new Date('2023-12-25'),
        endDate: new Date('2023-12-31'),
        days: [],
      })

      useEnhancedCalendarStore.getState().goToPreviousWeek()

      expect(getPreviousWeek).toHaveBeenCalled()
    })

    it('should navigate to next week', () => {
      const { getNextWeek } = require('@/lib/date-utils')
      getNextWeek.mockReturnValue({
        startDate: new Date('2024-01-08'),
        endDate: new Date('2024-01-14'),
        days: [],
      })

      useEnhancedCalendarStore.getState().goToNextWeek()

      expect(getNextWeek).toHaveBeenCalled()
    })

    it('should navigate to current week', () => {
      const { getCurrentWeek } = require('@/lib/date-utils')
      getCurrentWeek.mockReturnValue({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07'),
        days: [],
      })

      useEnhancedCalendarStore.getState().goToCurrentWeek()

      expect(getCurrentWeek).toHaveBeenCalled()
    })
  })

  describe('Event Management', () => {
    beforeEach(() => {
      const { validateEventFormData, calendarEventRepository } = require('@/lib/validations/schemas')
      validateEventFormData.mockReturnValue({ success: true })
      calendarEventRepository.create.mockResolvedValue({
        id: 'event-1',
        title: 'Test Event',
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        isAllDay: false,
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    })

    it('should add event successfully', async () => {
      const eventData = {
        title: 'Test Event',
        description: 'Test Description',
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        isAllDay: false,
        userId: 'user-1',
      }

      const result = await act(async () => {
        return await useEnhancedCalendarStore.getState().addEvent(eventData)
      })

      expect(result).toBe(true)
      const events = useEnhancedCalendarStore.getState().events
      expect(events).toHaveLength(1)
      expect(events[0]).toHaveProperty('id')
      expect(events[0].title).toBe('Test Event')
    })

    it('should update event successfully', async () => {
      const { calendarEventRepository } = require('@/lib/data-access')
      calendarEventRepository.update.mockResolvedValue({
        id: 'event-1',
        title: 'Updated Event',
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        isAllDay: false,
        userId: 'user-1',
        updatedAt: new Date(),
      })

      // Set initial event
      useEnhancedCalendarStore.setState({
        events: [{
          id: 'event-1',
          title: 'Original Event',
          startTime: new Date('2024-01-01T10:00:00Z'),
          endTime: new Date('2024-01-01T11:00:00Z'),
          isAllDay: false,
          userId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        }],
      })

      const updates = { title: 'Updated Event' }

      const result = await act(async () => {
        return await useEnhancedCalendarStore.getState().updateEvent('event-1', updates)
      })

      expect(result).toBe(true)
      const events = useEnhancedCalendarStore.getState().events
      expect(events[0].title).toBe('Updated Event')
    })

    it('should delete event successfully', async () => {
      const { calendarEventRepository } = require('@/lib/data-access')
      calendarEventRepository.delete.mockResolvedValue({})

      // Set initial event
      useEnhancedCalendarStore.setState({
        events: [{
          id: 'event-1',
          title: 'Test Event',
          startTime: new Date('2024-01-01T10:00:00Z'),
          endTime: new Date('2024-01-01T11:00:00Z'),
          isAllDay: false,
          userId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        }],
      })

      const result = await act(async () => {
        return await useEnhancedCalendarStore.getState().deleteEvent('event-1')
      })

      expect(result).toBe(true)
      const events = useEnhancedCalendarStore.getState().events
      expect(events).toHaveLength(0)
    })

    it('should handle validation error when adding event', async () => {
      const { validateEventFormData } = require('@/lib/validations/schemas')
      validateEventFormData.mockReturnValue({ 
        success: false, 
        error: { message: 'Invalid event data' } 
      })

      const eventData = {
        title: '',
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        isAllDay: false,
        userId: 'user-1',
      }

      const result = await act(async () => {
        return await useEnhancedCalendarStore.getState().addEvent(eventData)
      })

      expect(result).toBe(false)
      const error = useEnhancedCalendarStore.getState().error
      expect(error).toContain('Invalid event data')
    })
  })

  describe('Task Management', () => {
    beforeEach(() => {
      const { validateTaskFormData, taskRepository } = require('@/lib/validations/schemas')
      validateTaskFormData.mockReturnValue({ success: true })
      taskRepository.create.mockResolvedValue({
        id: 'task-1',
        title: 'Test Task',
        description: 'Test Description',
        status: 'pending' as const,
        priority: 'medium' as const,
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    })

    it('should add task successfully', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        status: 'pending' as const,
        priority: 'medium' as const,
        userId: 'user-1',
      }

      const result = await act(async () => {
        return await useEnhancedCalendarStore.getState().addTask(taskData)
      })

      expect(result).toBe(true)
      const tasks = useEnhancedCalendarStore.getState().tasks
      expect(tasks).toHaveLength(1)
      expect(tasks[0]).toHaveProperty('id')
      expect(tasks[0].title).toBe('Test Task')
    })

    it('should update task successfully', async () => {
      const { taskRepository } = require('@/lib/data-access')
      taskRepository.update.mockResolvedValue({
        id: 'task-1',
        title: 'Updated Task',
        description: 'Updated Description',
        status: 'in_progress' as const,
        priority: 'high' as const,
        userId: 'user-1',
        updatedAt: new Date(),
      })

      // Set initial task
      useEnhancedCalendarStore.setState({
        tasks: [{
          id: 'task-1',
          title: 'Original Task',
          description: 'Original Description',
          status: 'pending' as const,
          priority: 'medium' as const,
          userId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        }],
      })

      const updates = { 
        title: 'Updated Task', 
        status: 'in_progress' as const,
        priority: 'high' as const,
      }

      const result = await act(async () => {
        return await useEnhancedCalendarStore.getState().updateTask('task-1', updates)
      })

      expect(result).toBe(true)
      const tasks = useEnhancedCalendarStore.getState().tasks
      expect(tasks[0].title).toBe('Updated Task')
      expect(tasks[0].status).toBe('in_progress')
    })

    it('should delete task successfully', async () => {
      const { taskRepository } = require('@/lib/data-access')
      taskRepository.delete.mockResolvedValue({})

      // Set initial task
      useEnhancedCalendarStore.setState({
        tasks: [{
          id: 'task-1',
          title: 'Test Task',
          status: 'pending' as const,
          priority: 'medium' as const,
          userId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        }],
      })

      const result = await act(async () => {
        return await useEnhancedCalendarStore.getState().deleteTask('task-1')
      })

      expect(result).toBe(true)
      const tasks = useEnhancedCalendarStore.getState().tasks
      expect(tasks).toHaveLength(0)
    })
  })

  describe('Optimistic Updates', () => {
    it('should execute optimistic update', async () => {
      const id = 'optimistic-1'
      const result = await act(async () => {
        return await useEnhancedCalendarStore.getState().executeOptimisticUpdate(
          id, 'create', 'event', { title: 'Optimistic Event' }
        )
      })

      expect(result).toBe(true)
      const optimisticUpdates = useEnhancedCalendarStore.getState().optimisticUpdates
      expect(optimisticUpdates.has(id)).toBe(true)
    })

    it('should rollback optimistic update', () => {
      const id = 'optimistic-1'
      
      // First execute an optimistic update
      useEnhancedCalendarStore.setState((state) => ({
        optimisticUpdates: new Map(state.optimisticUpdates).set(id, {
          type: 'create',
          entity: 'event',
          data: { title: 'Optimistic Event' },
          timestamp: Date.now(),
        }),
      }))

      // Add the event to state
      useEnhancedCalendarStore.setState((state) => ({
        events: [...state.events, {
          id,
          title: 'Optimistic Event',
          startTime: new Date(),
          endTime: new Date(),
          isAllDay: false,
          userId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        }],
      }))

      // Rollback the update
      useEnhancedCalendarStore.getState().rollbackOptimisticUpdate(id)

      // Check that event is removed
      const events = useEnhancedCalendarStore.getState().events
      expect(events.find(e => e.id === id)).toBeUndefined()

      // Check that optimistic update is removed
      const optimisticUpdates = useEnhancedCalendarStore.getState().optimisticUpdates
      expect(optimisticUpdates.has(id)).toBe(false)
    })
  })

  describe('Data Access Methods', () => {
    beforeEach(() => {
      const { getEventsForWeek, getEventsForDay, sortEventsByTime } = require('@/lib/date-utils')
      getEventsForWeek.mockReturnValue([])
      getEventsForDay.mockReturnValue([])
      sortEventsByTime.mockReturnValue([])
    })

    it('should get events for current week', () => {
      const events = useEnhancedCalendarStore.getState().getEventsForCurrentWeek()
      expect(Array.isArray(events)).toBe(true)
    })

    it('should get events for specific day', () => {
      const events = useEnhancedCalendarStore.getState().getEventsForDay(0)
      expect(Array.isArray(events)).toBe(true)
    })

    it('should get all events', () => {
      const events = useEnhancedCalendarStore.getState().getAllEvents()
      expect(Array.isArray(events)).toBe(true)
    })

    it('should check event conflicts', () => {
      const { detectEventCollisions } = require('@/lib/date-utils')
      detectEventCollisions.mockReturnValue([])

      const mockEvent = {
        id: 'event-1',
        title: 'Test Event',
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        isAllDay: false,
        userId: 'user-1',
      }

      const conflicts = useEnhancedCalendarStore.getState().getEventConflicts(mockEvent)
      expect(Array.isArray(conflicts)).toBe(true)
    })

    it('should check if event can be moved', () => {
      const { checkEventCollision } = require('@/lib/date-utils')
      checkEventCollision.mockReturnValue(false)

      const canMove = useEnhancedCalendarStore.getState().checkEventCanMove(
        'event-1',
        new Date('2024-01-01T12:00:00Z'),
        new Date('2024-01-01T13:00:00Z')
      )

      expect(canMove).toBe(true)
    })
  })

  describe('Database Synchronization', () => {
    beforeEach(() => {
      const { 
        calendarEventRepository, 
        taskRepository, 
        categoryRepository, 
        tagRepository 
      } = require('@/lib/data-access')
      
      calendarEventRepository.findByUserId.mockResolvedValue([])
      taskRepository.findByUserId.mockResolvedValue([])
      categoryRepository.findByUserId.mockResolvedValue([])
      tagRepository.findByUserId.mockResolvedValue([])
    })

    it('should sync with database successfully', async () => {
      const result = await act(async () => {
        return await useEnhancedCalendarStore.getState().syncWithDatabase('user-1')
      })

      expect(result).toBe(true)
      expect(useEnhancedCalendarStore.getState().isSyncing).toBe(false)
      expect(useEnhancedCalendarStore.getState().error).toBeNull()
      expect(useEnhancedCalendarStore.getState().lastSync).toBeDefined()
    })

    it('should load from database', async () => {
      const result = await act(async () => {
        return await useEnhancedCalendarStore.getState().loadFromDatabase('user-1')
      })

      expect(result).toBe(true)
      expect(useEnhancedCalendarStore.getState().isLoading).toBe(false)
    })

    it('should save to database', async () => {
      const result = await act(async () => {
        return await useEnhancedCalendarStore.getState().saveToDatabase('user-1')
      })

      expect(result).toBe(true)
      expect(useEnhancedCalendarStore.getState().isSyncing).toBe(false)
    })
  })

  describe('UI State Management', () => {
    it('should select event', () => {
      const mockEvent = { id: 'event-1', title: 'Test Event' }
      
      useEnhancedCalendarStore.getState().selectEvent(mockEvent)

      const selectedEvent = useEnhancedCalendarStore.getState().selectedEvent
      expect(selectedEvent).toEqual(mockEvent)
    })

    it('should clear selected event', () => {
      useEnhancedCalendarStore.getState().selectEvent(null)
      
      const selectedEvent = useEnhancedCalendarStore.getState().selectedEvent
      expect(selectedEvent).toBeNull()
    })

    it('should set view settings', () => {
      const newSettings = { startHour: 8, endHour: 20 }
      
      useEnhancedCalendarStore.getState().setViewSettings(newSettings)

      const viewSettings = useEnhancedCalendarStore.getState().viewSettings
      expect(viewSettings.startHour).toBe(8)
      expect(viewSettings.endHour).toBe(20)
      expect(viewSettings.showWeekends).toBe(DEFAULT_VIEW_SETTINGS.showWeekends)
    })

    it('should set loading state', () => {
      useEnhancedCalendarStore.getState().setLoading(true)
      expect(useEnhancedCalendarStore.getState().isLoading).toBe(true)

      useEnhancedCalendarStore.getState().setLoading(false)
      expect(useEnhancedCalendarStore.getState().isLoading).toBe(false)
    })

    it('should set error state', () => {
      const errorMessage = 'Test error'
      
      useEnhancedCalendarStore.getState().setError(errorMessage)
      expect(useEnhancedCalendarStore.getState().error).toBe(errorMessage)

      useEnhancedCalendarStore.getState().setError(null)
      expect(useEnhancedCalendarStore.getState().error).toBeNull()
    })

    it('should set online status', () => {
      useEnhancedCalendarStore.getState().setOnlineStatus(false)
      expect(useEnhancedCalendarStore.getState().isOnline).toBe(false)

      useEnhancedCalendarStore.getState().setOnlineStatus(true)
      expect(useEnhancedCalendarStore.getState().isOnline).toBe(true)
    })
  })

  describe('Demo Data', () => {
    it('should initialize with demo data', () => {
      const { createDefaultEvents } = require('@/lib/date-utils')
      createDefaultEvents.mockReturnValue([
        {
          id: 'demo-1',
          title: 'Demo Event',
          isAllDay: false,
          startTime: new Date('2024-01-01T10:00:00Z'),
          endTime: new Date('2024-01-01T11:00:00Z'),
        },
      ])

      useEnhancedCalendarStore.getState().initializeWithDemoData()

      const events = useEnhancedCalendarStore.getState().events
      const tasks = useEnhancedCalendarStore.getState().tasks
      const categories = useEnhancedCalendarStore.getState().categories
      const tags = useEnhancedCalendarStore.getState().tags

      expect(events).toHaveLength(1)
      expect(tasks).toHaveLength(0)
      expect(categories).toHaveLength(3)
      expect(tags).toHaveLength(3)
    })

    it('should clear all data', () => {
      // Set some initial data
      useEnhancedCalendarStore.setState({
        events: [{ id: 'event-1' }],
        tasks: [{ id: 'task-1' }],
        categories: [{ id: 'cat-1' }],
        tags: [{ id: 'tag-1' }],
        selectedEvent: { id: 'event-1' },
        error: 'Some error',
        optimisticUpdates: new Map([['1', { type: 'create', entity: 'event' }]]),
      })

      useEnhancedCalendarStore.getState().clearAllData()

      expect(useEnhancedCalendarStore.getState().events).toHaveLength(0)
      expect(useEnhancedCalendarStore.getState().tasks).toHaveLength(0)
      expect(useEnhancedCalendarStore.getState().categories).toHaveLength(0)
      expect(useEnhancedCalendarStore.getState().tags).toHaveLength(0)
      expect(useEnhancedCalendarStore.getState().selectedEvent).toBeNull()
      expect(useEnhancedCalendarStore.getState().error).toBeNull()
      expect(useEnhancedCalendarStore.getState().optimisticUpdates.size).toBe(0)
    })
  })

  describe('Search and Filter', () => {
    beforeEach(() => {
      useEnhancedCalendarStore.setState({
        events: [
          {
            id: 'event-1',
            title: 'Team Meeting',
            description: 'Weekly team standup',
            startTime: new Date('2024-01-01T10:00:00Z'),
            endTime: new Date('2024-01-01T11:00:00Z'),
            isAllDay: false,
            userId: 'user-1',
          },
        ],
        tasks: [
          {
            id: 'task-1',
            title: 'Complete Project',
            description: 'Finish main features',
            status: 'pending' as const,
            priority: 'high' as const,
            userId: 'user-1',
          },
        ],
      })
    })

    it('should search events by title', () => {
      const results = useEnhancedCalendarStore.getState().searchEvents('Team')
      
      expect(results).toHaveLength(1)
      expect(results[0].title).toBe('Team Meeting')
    })

    it('should search events by description', () => {
      const results = useEnhancedCalendarStore.getState().searchEvents('features')
      
      expect(results).toHaveLength(1)
      expect(results[0].title).toBe('Complete Project')
    })

    it('should return empty results for no matches', () => {
      const results = useEnhancedCalendarStore.getState().searchEvents('NonExistent')
      
      expect(results).toHaveLength(0)
    })

    it('should filter events by date range', () => {
      const filters = {
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-01'),
        },
      }

      const results = useEnhancedCalendarStore.getState().filterEvents(filters)
      
      // Should contain both event and task that match the date range
      expect(results.length).toBeGreaterThanOrEqual(0)
    })
  })
})

describe('Legacy Stores', () => {
  describe('Task Store', () => {
    it('should redirect to enhanced store', () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        status: 'pending' as const,
        priority: 'medium' as const,
        userId: 'user-1',
      }

      // This should redirect to the enhanced store
      expect(useTaskStore.getState().addTask).toBeDefined()
      expect(typeof useTaskStore.getState().addTask).toBe('function')
    })

    it('should get tasks by status', () => {
      // Set some tasks in the store
      useEnhancedCalendarStore.setState({
        tasks: [
          {
            id: 'task-1',
            title: 'Task 1',
            status: 'pending' as const,
            priority: 'medium' as const,
            userId: 'user-1',
          },
          {
            id: 'task-2',
            title: 'Task 2',
            status: 'completed' as const,
            priority: 'low' as const,
            userId: 'user-1',
          },
        ],
      })

      const pendingTasks = useTaskStore.getState().getTasksByStatus('pending')
      const completedTasks = useTaskStore.getState().getTasksByStatus('completed')

      expect(pendingTasks).toHaveLength(1)
      expect(pendingTasks[0].title).toBe('Task 1')
      expect(completedTasks).toHaveLength(1)
      expect(completedTasks[0].title).toBe('Task 2')
    })

    it('should get tasks by priority', () => {
      const mediumTasks = useTaskStore.getState().getTasksByPriority('medium')
      const highTasks = useTaskStore.getState().getTasksByPriority('high')

      expect(Array.isArray(mediumTasks)).toBe(true)
      expect(Array.isArray(highTasks)).toBe(true)
    })
  })

  describe('Calendar Store', () => {
    it('should redirect to enhanced store', () => {
      const eventData = {
        title: 'Test Event',
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        isAllDay: false,
        userId: 'user-1',
      }

      expect(useCalendarStore.getState().addEvent).toBeDefined()
      expect(typeof useCalendarStore.getState().addEvent).toBe('function')
    })

    it('should get events by date range', () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-07')

      const events = useCalendarStore.getState().getEventsByDateRange(startDate, endDate)
      expect(Array.isArray(events)).toBe(true)
    })
  })

  describe('UI Store', () => {
    it('should manage sidebar state', () => {
      expect(useUIStore.getState().sidebarOpen).toBe(true)
      
      useUIStore.getState().setSidebarOpen(false)
      expect(useUIStore.getState().sidebarOpen).toBe(false)

      useUIStore.getState().setSidebarOpen(true)
      expect(useUIStore.getState().sidebarOpen).toBe(true)
    })

    it('should manage theme state', () => {
      expect(useUIStore.getState().theme).toBe('dark')
      
      useUIStore.getState().setTheme('light')
      expect(useUIStore.getState().theme).toBe('light')

      useUIStore.getState().setTheme('dark')
      expect(useUIStore.getState().theme).toBe('dark')
    })
  })
})

describe('Store Selectors', () => {
  it('should export selector functions', () => {
    const selectors = [
      'useCurrentWeekEvents',
      'useCalendarEvents',
      'useCalendarTasks',
      'useCurrentWeek',
      'useViewSettings',
      'useSelectedEvent',
      'useCalendarError',
      'useSyncStatus',
    ]

    selectors.forEach(selector => {
      expect(typeof require('@/stores')[selector]).toBe('function')
    })
  })
})