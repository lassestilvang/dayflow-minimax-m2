import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { subscribeWithSelector } from 'zustand/middleware'
import { 
  CalendarWeek,
  CalendarEvent,
  Task,
  EventOrTask,
  CalendarConflict,
  CalendarViewSettings,
  CalendarDragDropData,
} from '@/types/calendar'
import {
  getCurrentWeek,
  getPreviousWeek,
  getNextWeek,
  getEventsForWeek,
  detectEventCollisions,
  checkEventCollision,
  getEventsForDay,
  sortEventsByTime,
  DEFAULT_VIEW_SETTINGS,
  createDefaultEvents,
} from '@/lib/date-utils'
import {
  userRepository,
  taskRepository,
  calendarEventRepository,
  categoryRepository,
  tagRepository,
  DatabaseError,
  ValidationError,
  NotFoundError,
  ConflictError,
} from '@/lib/data-access'
import { validateTaskFormData, validateEventFormData } from '@/lib/validations/schemas'

// Enhanced store with database synchronization
interface EnhancedCalendarStore {
  // Current week state
  currentWeek: CalendarWeek
  selectedEvent: EventOrTask | null
  
  // Events and tasks
  events: CalendarEvent[]
  tasks: Task[]
  
  // Data management
  categories: { id: string; name: string; color: string; icon?: string }[]
  tags: { id: string; name: string; color: string }[]
  
  // View settings
  viewSettings: CalendarViewSettings
  
  // Database sync state
  isLoading: boolean
  isSyncing: boolean
  error: string | null
  lastSync: Date | null
  isOnline: boolean
  
  // Optimistic updates tracking
  optimisticUpdates: Map<string, { 
    type: 'create' | 'update' | 'delete'
    entity: 'event' | 'task'
    data?: any
    timestamp: number
  }>
  
  // Actions - Week Navigation
  setCurrentWeek: (week: CalendarWeek) => void
  goToPreviousWeek: () => void
  goToNextWeek: () => void
  goToCurrentWeek: () => void
  
  // Actions - Event Management with Database Sync
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<boolean>
  deleteEvent: (id: string) => Promise<boolean>
  
  // Actions - Task Management with Database Sync
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>
  updateTask: (id: string, updates: Partial<Task>) => Promise<boolean>
  deleteTask: (id: string) => Promise<boolean>
  
  // Actions - Category and Tag Management
  addCategory: (category: { name: string; color: string; icon?: string }) => Promise<boolean>
  updateCategory: (id: string, updates: { name?: string; color?: string; icon?: string }) => Promise<boolean>
  deleteCategory: (id: string) => Promise<boolean>
  addTag: (tag: { name: string; color: string }) => Promise<boolean>
  updateTag: (id: string, updates: { name?: string; color?: string }) => Promise<boolean>
  deleteTag: (id: string) => Promise<boolean>
  
  // Actions - Data Access
  getEventsForCurrentWeek: () => EventOrTask[]
  getEventsForDay: (dayIndex: number) => EventOrTask[]
  getAllEvents: () => EventOrTask[]
  getEventConflicts: (event: EventOrTask) => CalendarConflict[]
  checkEventCanMove: (eventId: string, newStartTime: Date, newEndTime: Date) => boolean
  
  // Actions - Database Synchronization
  syncWithDatabase: (userId: string) => Promise<boolean>
  loadFromDatabase: (userId: string) => Promise<boolean>
  saveToDatabase: (userId: string) => Promise<boolean>
  
  // Actions - Optimistic Updates
  executeOptimisticUpdate: (
    id: string,
    type: 'create' | 'update' | 'delete',
    entity: 'event' | 'task',
    data?: any
  ) => Promise<boolean>
  rollbackOptimisticUpdate: (id: string) => void
  
  // Actions - Conflict Resolution
  resolveConflicts: (conflicts: CalendarConflict[]) => Promise<boolean>
  
  // Actions - UI State
  selectEvent: (event: EventOrTask | null) => void
  setViewSettings: (settings: Partial<CalendarViewSettings>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setOnlineStatus: (isOnline: boolean) => void
  
  // Actions - Demo Data
  initializeWithDemoData: () => void
  clearAllData: () => void
  
  // Actions - Search and Filter
  searchEvents: (query: string) => EventOrTask[]
  filterEvents: (filters: {
    categories?: string[]
    tags?: string[]
    dateRange?: { start: Date; end: Date }
    status?: string[]
  }) => EventOrTask[]
  
  // Actions - Data Import/Export
  exportData: () => Promise<{
    events: CalendarEvent[]
    tasks: Task[]
    categories: any[]
    tags: any[]
  }>
  importData: (data: {
    events?: CalendarEvent[]
    tasks?: Task[]
    categories?: any[]
    tags?: any[]
  }) => Promise<boolean>
}

export const useEnhancedCalendarStore = create<EnhancedCalendarStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        currentWeek: getCurrentWeek(),
        selectedEvent: null,
        events: [],
        tasks: [],
        categories: [],
        tags: [],
        viewSettings: DEFAULT_VIEW_SETTINGS,
        isLoading: false,
        isSyncing: false,
        error: null,
        lastSync: null,
        isOnline: navigator.onLine,
        optimisticUpdates: new Map(),
        
        // Week navigation
        setCurrentWeek: (week) => {
          set({ currentWeek: week })
        },
        
        goToPreviousWeek: () => {
          const { currentWeek } = get()
          set({ currentWeek: getPreviousWeek(currentWeek) })
        },
        
        goToNextWeek: () => {
          const { currentWeek } = get()
          set({ currentWeek: getNextWeek(currentWeek) })
        },
        
        goToCurrentWeek: () => {
          set({ currentWeek: getCurrentWeek() })
        },
        
        // Event management with database sync
        addEvent: async (eventData) => {
          const { userId = 'demo-user' } = eventData
          
          // Optimistic update
          const optimisticId = `event_${Date.now()}`
          const optimisticEvent = {
            ...eventData,
            id: optimisticId,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          
          set((state) => ({
            events: [...state.events, optimisticEvent as CalendarEvent],
            error: null,
            optimisticUpdates: new Map(state.optimisticUpdates).set(optimisticId, {
              type: 'create',
              entity: 'event',
              data: eventData,
              timestamp: Date.now(),
            }),
          }))

          try {
            const validation = validateEventFormData(eventData)
            if (!validation.success) {
              throw new ValidationError('Invalid event data', validation.error?.message)
            }

            const result = await calendarEventRepository.create({
              ...eventData,
              userId,
            })

            // Replace optimistic update with real data
            set((state) => ({
              events: state.events.map(e => 
                e.id === optimisticId ? result : e
              ),
              optimisticUpdates: new Map(state.optimisticUpdates).delete(optimisticId),
            }))

            return true
          } catch (error: any) {
            // Rollback optimistic update
            set((state) => ({
              events: state.events.filter(e => e.id !== optimisticId),
              optimisticUpdates: new Map(state.optimisticUpdates).delete(optimisticId),
              error: error.message || 'Failed to create event',
            }))
            return false
          }
        },
        
        updateEvent: async (id, updates) => {
          // Optimistic update
          const optimisticUpdateId = `event_update_${id}_${Date.now()}`
          
          set((state) => ({
            events: state.events.map(event =>
              event.id === id
                ? { ...event, ...updates, updatedAt: new Date() }
                : event
            ),
            optimisticUpdates: new Map(state.optimisticUpdates).set(optimisticUpdateId, {
              type: 'update',
              entity: 'event',
              data: { id, updates },
              timestamp: Date.now(),
            }),
            error: null,
          }))

          try {
            const result = await calendarEventRepository.update(id, updates)
            
            // Update with real data
            set((state) => ({
              events: state.events.map(event =>
                event.id === id ? result : event
              ),
              optimisticUpdates: new Map(state.optimisticUpdates).delete(optimisticUpdateId),
            }))

            return true
          } catch (error: any) {
            // Rollback optimistic update
            set((state) => ({
              events: state.events.map(event => 
                event.id === id ? state.events.find(e => e.id === id) || event : event
              ),
              optimisticUpdates: new Map(state.optimisticUpdates).delete(optimisticUpdateId),
              error: error.message || 'Failed to update event',
            }))
            return false
          }
        },
        
        deleteEvent: async (id) => {
          // Store current event for rollback
          const currentEvent = get().events.find(e => e.id === id)
          
          // Optimistic update
          const optimisticDeleteId = `event_delete_${id}_${Date.now()}`
          
          set((state) => ({
            events: state.events.filter(event => event.id !== id),
            selectedEvent: state.selectedEvent?.id === id ? null : state.selectedEvent,
            optimisticUpdates: new Map(state.optimisticUpdates).set(optimisticDeleteId, {
              type: 'delete',
              entity: 'event',
              data: currentEvent,
              timestamp: Date.now(),
            }),
            error: null,
          }))

          try {
            await calendarEventRepository.delete(id)
            
            // Confirm deletion
            set((state) => ({
              optimisticUpdates: new Map(state.optimisticUpdates).delete(optimisticDeleteId),
            }))

            return true
          } catch (error: any) {
            // Rollback optimistic update
            set((state) => ({
              events: currentEvent ? [...state.events, currentEvent] : state.events,
              optimisticUpdates: new Map(state.optimisticUpdates).delete(optimisticDeleteId),
              error: error.message || 'Failed to delete event',
            }))
            return false
          }
        },
        
        // Task management with database sync
        addTask: async (taskData) => {
          const { userId = 'demo-user' } = taskData
          
          // Optimistic update
          const optimisticId = `task_${Date.now()}`
          const optimisticTask = {
            ...taskData,
            id: optimisticId,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          
          set((state) => ({
            tasks: [...state.tasks, optimisticTask as Task],
            error: null,
            optimisticUpdates: new Map(state.optimisticUpdates).set(optimisticId, {
              type: 'create',
              entity: 'task',
              data: taskData,
              timestamp: Date.now(),
            }),
          }))

          try {
            const validation = validateTaskFormData(taskData)
            if (!validation.success) {
              throw new ValidationError('Invalid task data', validation.error?.message)
            }

            const result = await taskRepository.create({
              ...taskData,
              userId,
            })

            // Replace optimistic update with real data
            set((state) => ({
              tasks: state.tasks.map(t => 
                t.id === optimisticId ? result : t
              ),
              optimisticUpdates: new Map(state.optimisticUpdates).delete(optimisticId),
            }))

            return true
          } catch (error: any) {
            // Rollback optimistic update
            set((state) => ({
              tasks: state.tasks.filter(t => t.id !== optimisticId),
              optimisticUpdates: new Map(state.optimisticUpdates).delete(optimisticId),
              error: error.message || 'Failed to create task',
            }))
            return false
          }
        },
        
        updateTask: async (id, updates) => {
          // Optimistic update
          const optimisticUpdateId = `task_update_${id}_${Date.now()}`
          
          set((state) => ({
            tasks: state.tasks.map(task =>
              task.id === id
                ? { ...task, ...updates, updatedAt: new Date() }
                : task
            ),
            optimisticUpdates: new Map(state.optimisticUpdates).set(optimisticUpdateId, {
              type: 'update',
              entity: 'task',
              data: { id, updates },
              timestamp: Date.now(),
            }),
            error: null,
          }))

          try {
            const result = await taskRepository.update(id, updates)
            
            // Update with real data
            set((state) => ({
              tasks: state.tasks.map(task =>
                task.id === id ? result : task
              ),
              optimisticUpdates: new Map(state.optimisticUpdates).delete(optimisticUpdateId),
            }))

            return true
          } catch (error: any) {
            // Rollback optimistic update
            set((state) => ({
              tasks: state.tasks.map(task => 
                task.id === id ? state.tasks.find(t => t.id === id) || task : task
              ),
              optimisticUpdates: new Map(state.optimisticUpdates).delete(optimisticUpdateId),
              error: error.message || 'Failed to update task',
            }))
            return false
          }
        },
        
        deleteTask: async (id) => {
          // Store current task for rollback
          const currentTask = get().tasks.find(t => t.id === id)
          
          // Optimistic update
          const optimisticDeleteId = `task_delete_${id}_${Date.now()}`
          
          set((state) => ({
            tasks: state.tasks.filter(task => task.id !== id),
            selectedEvent: state.selectedEvent?.id === id ? null : state.selectedEvent,
            optimisticUpdates: new Map(state.optimisticUpdates).set(optimisticDeleteId, {
              type: 'delete',
              entity: 'task',
              data: currentTask,
              timestamp: Date.now(),
            }),
            error: null,
          }))

          try {
            await taskRepository.delete(id)
            
            // Confirm deletion
            set((state) => ({
              optimisticUpdates: new Map(state.optimisticUpdates).delete(optimisticDeleteId),
            }))

            return true
          } catch (error: any) {
            // Rollback optimistic update
            set((state) => ({
              tasks: currentTask ? [...state.tasks, currentTask] : state.tasks,
              optimisticUpdates: new Map(state.optimisticUpdates).delete(optimisticDeleteId),
              error: error.message || 'Failed to delete task',
            }))
            return false
          }
        },

        // Category and Tag management
        addCategory: async (categoryData) => {
          const { userId = 'demo-user' } = categoryData
          
          try {
            const result = await categoryRepository.create({
              ...categoryData,
              userId,
            })
            
            set((state) => ({
              categories: [...state.categories, result],
              error: null,
            }))
            
            return true
          } catch (error: any) {
            set({ error: error.message || 'Failed to create category' })
            return false
          }
        },

        updateCategory: async (id, updates) => {
          try {
            const result = await categoryRepository.update(id, updates)
            
            set((state) => ({
              categories: state.categories.map(cat =>
                cat.id === id ? result : cat
              ),
              error: null,
            }))
            
            return true
          } catch (error: any) {
            set({ error: error.message || 'Failed to update category' })
            return false
          }
        },

        deleteCategory: async (id) => {
          try {
            await categoryRepository.delete(id)
            
            set((state) => ({
              categories: state.categories.filter(cat => cat.id !== id),
              error: null,
            }))
            
            return true
          } catch (error: any) {
            set({ error: error.message || 'Failed to delete category' })
            return false
          }
        },

        addTag: async (tagData) => {
          const { userId = 'demo-user' } = tagData
          
          try {
            const result = await tagRepository.create({
              ...tagData,
              userId,
            })
            
            set((state) => ({
              tags: [...state.tags, result],
              error: null,
            }))
            
            return true
          } catch (error: any) {
            set({ error: error.message || 'Failed to create tag' })
            return false
          }
        },

        updateTag: async (id, updates) => {
          try {
            const result = await tagRepository.update(id, updates)
            
            set((state) => ({
              tags: state.tags.map(tag =>
                tag.id === id ? result : tag
              ),
              error: null,
            }))
            
            return true
          } catch (error: any) {
            set({ error: error.message || 'Failed to update tag' })
            return false
          }
        },

        deleteTag: async (id) => {
          try {
            await tagRepository.delete(id)
            
            set((state) => ({
              tags: state.tags.filter(tag => tag.id !== id),
              error: null,
            }))
            
            return true
          } catch (error: any) {
            set({ error: error.message || 'Failed to delete tag' })
            return false
          }
        },
        
        // Data access methods (unchanged from original)
        getEventsForCurrentWeek: () => {
          const { currentWeek, events, tasks } = get()
          const weekEvents = getEventsForWeek(currentWeek, [...events, ...tasks])
          return sortEventsByTime(weekEvents)
        },
        
        getEventsForDay: (dayIndex) => {
          const { currentWeek, events, tasks } = get()
          const day = currentWeek.days[dayIndex]
          if (!day) return []
          
          const allEvents = [...events, ...tasks]
          const dayEvents = getEventsForDay(allEvents, day.date)
          return sortEventsByTime(dayEvents)
        },
        
        getAllEvents: () => {
          const { events, tasks } = get()
          return sortEventsByTime([...events, ...tasks])
        },
        
        getEventConflicts: (event) => {
          const { events, tasks } = get()
          const allEvents = [...events, ...tasks]
          const otherEvents = allEvents.filter(e => e.id !== event.id)
          return detectEventCollisions([event, ...otherEvents]).filter(
            conflict => conflict.eventId === event.id || conflict.conflictingEventId === event.id
          )
        },
        
        checkEventCanMove: (eventId, newStartTime, newEndTime) => {
          const { events, tasks } = get()
          const allEvents = [...events, ...tasks]
          const eventToMove = allEvents.find(e => e.id === eventId)
          
          if (!eventToMove) return false
          
          const updatedEvent = {
            ...eventToMove,
            startTime: newStartTime,
            endTime: newEndTime,
          }
          
          return !checkEventCollision(updatedEvent, allEvents, eventId)
        },

        // Database synchronization
        syncWithDatabase: async (userId) => {
          set({ isSyncing: true, error: null })
          
          try {
            const [events, tasks, categories, tags] = await Promise.all([
              calendarEventRepository.findByUserId(userId),
              taskRepository.findByUserId(userId),
              categoryRepository.findByUserId(userId),
              tagRepository.findByUserId(userId),
            ])
            
            set({
              events,
              tasks,
              categories,
              tags,
              lastSync: new Date(),
              isSyncing: false,
              error: null,
            })
            
            return true
          } catch (error: any) {
            set({
              isSyncing: false,
              error: error.message || 'Failed to sync with database',
            })
            return false
          }
        },

        loadFromDatabase: async (userId) => {
          set({ isLoading: true, error: null })
          
          try {
            const result = await get().syncWithDatabase(userId)
            set({ isLoading: false })
            return result
          } catch (error: any) {
            set({
              isLoading: false,
              error: error.message || 'Failed to load data',
            })
            return false
          }
        },

        saveToDatabase: async (userId) => {
          set({ isSyncing: true, error: null })
          
          try {
            // For now, this is handled automatically by the optimistic updates
            // In a real implementation, you'd batch all pending changes
            set({
              isSyncing: false,
              lastSync: new Date(),
              error: null,
            })
            return true
          } catch (error: any) {
            set({
              isSyncing: false,
              error: error.message || 'Failed to save to database',
            })
            return false
          }
        },

        // Optimistic update management
        executeOptimisticUpdate: async (id, type, entity, data) => {
          set((state) => ({
            optimisticUpdates: new Map(state.optimisticUpdates).set(id, {
              type,
              entity,
              data,
              timestamp: Date.now(),
            }),
          }))
          
          return true
        },

        rollbackOptimisticUpdate: (id) => {
          const update = get().optimisticUpdates.get(id)
          if (!update) return
          
          // Rollback logic based on update type
          switch (update.type) {
            case 'create':
              if (update.entity === 'event') {
                set((state) => ({
                  events: state.events.filter(e => e.id !== id),
                }))
              } else {
                set((state) => ({
                  tasks: state.tasks.filter(t => t.id !== id),
                }))
              }
              break
            case 'delete':
              if (update.entity === 'event' && update.data) {
                set((state) => ({
                  events: [...state.events, update.data],
                }))
              } else if (update.entity === 'task' && update.data) {
                set((state) => ({
                  tasks: [...state.tasks, update.data],
                }))
              }
              break
            // Update rollback would require storing previous state
          }
          
          set((state) => ({
            optimisticUpdates: new Map(state.optimisticUpdates).delete(id),
          }))
        },

        // Conflict resolution
        resolveConflicts: async (conflicts) => {
          // Implement conflict resolution logic
          // For now, we'll just return true
          return true
        },

        // UI state management
        selectEvent: (event) => {
          set({ selectedEvent: event })
        },
        
        setViewSettings: (settings) => {
          set((state) => ({
            viewSettings: { ...state.viewSettings, ...settings },
          }))
        },
        
        setLoading: (loading) => {
          set({ isLoading: loading })
        },
        
        setError: (error) => {
          set({ error })
        },

        setOnlineStatus: (isOnline) => {
          set({ isOnline })
        },
        
        // Demo data
        initializeWithDemoData: () => {
          const demoEvents = createDefaultEvents()
          const demoTasks: Task[] = []
          
          set((state) => ({
            events: demoEvents.filter(e => 'isAllDay' in e) as CalendarEvent[],
            tasks: demoTasks,
            categories: [
              { id: 'work', name: 'Work', color: '#3b82f6', icon: 'briefcase' },
              { id: 'personal', name: 'Personal', color: '#10b981', icon: 'user' },
              { id: 'health', name: 'Health', color: '#f59e0b', icon: 'heart' },
            ],
            tags: [
              { id: 'important', name: 'Important', color: '#ef4444' },
              { id: 'urgent', name: 'Urgent', color: '#dc2626' },
              { id: 'meeting', name: 'Meeting', color: '#6366f1' },
            ],
            error: null,
          }))
        },
        
        clearAllData: () => {
          set({
            events: [],
            tasks: [],
            categories: [],
            tags: [],
            selectedEvent: null,
            error: null,
            optimisticUpdates: new Map(),
          })
        },

        // Search and filter
        searchEvents: (query) => {
          const { events, tasks } = get()
          const allEvents = [...events, ...tasks]
          
          return allEvents.filter(event =>
            event.title.toLowerCase().includes(query.toLowerCase()) ||
            (event.description && event.description.toLowerCase().includes(query.toLowerCase()))
          )
        },

        filterEvents: (filters) => {
          const { events, tasks, categories, tags } = get()
          let allEvents = [...events, ...tasks]
          
          if (filters.categories?.length) {
            const categoryIds = new Set(filters.categories)
            allEvents = allEvents.filter(event => 
              'categoryId' in event && categoryIds.has(event.categoryId)
            )
          }
          
          if (filters.dateRange) {
            allEvents = allEvents.filter(event => {
              const eventDate = 'startTime' in event ? event.startTime : event.dueDate
              return eventDate && 
                eventDate >= filters.dateRange!.start && 
                eventDate <= filters.dateRange!.end
            })
          }
          
          return allEvents
        },

        // Data import/export
        exportData: async () => {
          const { events, tasks, categories, tags } = get()
          return { events, tasks, categories, tags }
        },

        importData: async (data) => {
          set({ isLoading: true, error: null })
          
          try {
            set((state) => ({
              events: data.events || state.events,
              tasks: data.tasks || state.tasks,
              categories: data.categories || state.categories,
              tags: data.tags || state.tags,
              isLoading: false,
            }))
            return true
          } catch (error: any) {
            set({
              isLoading: false,
              error: error.message || 'Failed to import data',
            })
            return false
          }
        },
      }),
      {
        name: 'enhanced-calendar-store',
        partialize: (state) => ({
          events: state.events,
          tasks: state.tasks,
          categories: state.categories,
          tags: state.tags,
          viewSettings: state.viewSettings,
          currentWeek: state.currentWeek,
        }),
      }
    )
  )
)

// Enhanced selectors with database sync awareness
export const useCurrentWeekEvents = () => useEnhancedCalendarStore(state => state.getEventsForCurrentWeek())
export const useCalendarEvents = () => useEnhancedCalendarStore(state => state.events)
export const useCalendarTasks = () => useEnhancedCalendarStore(state => state.tasks)
export const useCurrentWeek = () => useEnhancedCalendarStore(state => state.currentWeek)
export const useViewSettings = () => useEnhancedCalendarStore(state => state.viewSettings)
export const useSelectedEvent = () => useEnhancedCalendarStore(state => state.selectedEvent)
export const useCalendarError = () => useEnhancedCalendarStore(state => state.error)
export const useSyncStatus = () => useEnhancedCalendarStore(state => ({
  isSyncing: state.isSyncing,
  lastSync: state.lastSync,
  isOnline: state.isOnline,
  optimisticUpdates: state.optimisticUpdates.size,
}))

// React to online/offline status
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useEnhancedCalendarStore.getState().setOnlineStatus(true)
  })
  
  window.addEventListener('offline', () => {
    useEnhancedCalendarStore.getState().setOnlineStatus(false)
  })
}