import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Import enhanced store and types
import { useEnhancedCalendarStore } from './enhancedStore'
import type { Task, CalendarEvent } from '@/types/calendar'

interface TaskStore {
  tasks: Task[]
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>
  updateTask: (id: string, updates: Partial<Task>) => Promise<boolean>
  deleteTask: (id: string) => Promise<boolean>
  getTasksByStatus: (status: Task['status']) => Task[]
  getTasksByPriority: (priority: Task['priority']) => Task[]
}

interface CalendarStore {
  events: CalendarEvent[]
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<boolean>
  deleteEvent: (id: string) => Promise<boolean>
  getEventsByDateRange: (startDate: Date, endDate: Date) => CalendarEvent[]
}

interface UIStore {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
}

// Legacy stores for backward compatibility (redirect to enhanced store)
export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      addTask: async (task) => {
        // Redirect to enhanced store
        const { addTask } = useEnhancedCalendarStore.getState()
        return await addTask(task)
        
        // Also add to local state for immediate access
        const newTask = {
          ...task,
          id: `task_${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        set((state) => ({
          tasks: [...state.tasks, newTask]
        }))
      },
      updateTask: async (id, updates) => {
        // Redirect to enhanced store
        const { updateTask } = useEnhancedCalendarStore.getState()
        return await updateTask(id, updates)
        
        // Also update local state
        set((state) => ({
          tasks: state.tasks.map(task =>
            task.id === id ? { ...task, ...updates, updatedAt: new Date() } : task
          )
        }))
      },
      deleteTask: async (id) => {
        // Redirect to enhanced store
        const { deleteTask } = useEnhancedCalendarStore.getState()
        return await deleteTask(id)
        
        // Also remove from local state
        set((state) => ({
          tasks: state.tasks.filter(task => task.id !== id)
        }))
      },
      getTasksByStatus: (status) => {
        // Get tasks from enhanced store for consistency
        const { tasks } = useEnhancedCalendarStore.getState()
        return tasks.filter((task) => task.status === status)
      },
      getTasksByPriority: (priority) => {
        // Get tasks from enhanced store for consistency
        const { tasks } = useEnhancedCalendarStore.getState()
        return tasks.filter((task) => task.priority === priority)
      },
    }),
    {
      name: 'task-store',
      partialize: (state) => ({ tasks: state.tasks }),
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            // Sync with enhanced store when rehydrating
            const { tasks } = useEnhancedCalendarStore.getState()
            if (tasks.length > state.tasks.length) {
              useTaskStore.setState({ tasks })
            }
          }
        }
      },
    }
  )
)

export const useCalendarStore = create<CalendarStore>()(
  persist(
    (set, get) => ({
      events: [],
      addEvent: async (event) => {
        // Redirect to enhanced store
        const { addEvent } = useEnhancedCalendarStore.getState()
        return await addEvent(event)
        
        // Also add to local state for immediate access
        const newEvent = {
          ...event,
          id: `event_${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        set((state) => ({
          events: [...state.events, newEvent]
        }))
      },
      updateEvent: async (id, updates) => {
        // Redirect to enhanced store
        const { updateEvent } = useEnhancedCalendarStore.getState()
        return await updateEvent(id, updates)
        
        // Also update local state
        set((state) => ({
          events: state.events.map(event =>
            event.id === id ? { ...event, ...updates, updatedAt: new Date() } : event
          )
        }))
      },
      deleteEvent: async (id) => {
        // Redirect to enhanced store
        const { deleteEvent } = useEnhancedCalendarStore.getState()
        return await deleteEvent(id)
        
        // Also remove from local state
        set((state) => ({
          events: state.events.filter(event => event.id !== id)
        }))
      },
      getEventsByDateRange: (startDate, endDate) => {
        // Get events from enhanced store for consistency
        const { events } = useEnhancedCalendarStore.getState()
        return events.filter((event) => {
          const eventStart = new Date(event.startTime)
          return eventStart >= startDate && eventStart <= endDate
        })
      },
    }),
    {
      name: 'calendar-store',
      partialize: (state) => ({ events: state.events }),
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            // Sync with enhanced store when rehydrating
            const { events } = useEnhancedCalendarStore.getState()
            if (events.length > state.events.length) {
              useCalendarStore.setState({ events })
            }
          }
        }
      },
    }
  )
)

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'ui-store',
    }
  )
)

// Re-export the enhanced store for new features
export { useEnhancedCalendarStore }

// Re-export weekly calendar store (legacy)
export * from './calendarStore'