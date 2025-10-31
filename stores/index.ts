import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Import enhanced store and types
import { useEnhancedCalendarStore } from './enhancedStore'

// Legacy interfaces for backward compatibility
export interface Task {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: Date
  completedAt?: Date
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  isAllDay: boolean
  location?: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

interface TaskStore {
  tasks: Task[]
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  getTasksByStatus: (status: Task['status']) => Task[]
  getTasksByPriority: (priority: Task['priority']) => Task[]
}

interface CalendarStore {
  events: CalendarEvent[]
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void
  deleteEvent: (id: string) => void
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
      addTask: (task) => {
        // Redirect to enhanced store
        const { addTask } = useEnhancedCalendarStore.getState()
        addTask(task)
      },
      updateTask: (id, updates) => {
        // Redirect to enhanced store
        const { updateTask } = useEnhancedCalendarStore.getState()
        updateTask(id, updates)
      },
      deleteTask: (id) => {
        // Redirect to enhanced store
        const { deleteTask } = useEnhancedCalendarStore.getState()
        deleteTask(id)
      },
      getTasksByStatus: (status) => {
        // Use enhanced store data
        return get().tasks.filter((task) => task.status === status)
      },
      getTasksByPriority: (priority) => {
        // Use enhanced store data
        return get().tasks.filter((task) => task.priority === priority)
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
      addEvent: (event) => {
        // Redirect to enhanced store
        const { addEvent } = useEnhancedCalendarStore.getState()
        addEvent(event)
      },
      updateEvent: (id, updates) => {
        // Redirect to enhanced store
        const { updateEvent } = useEnhancedCalendarStore.getState()
        updateEvent(id, updates)
      },
      deleteEvent: (id) => {
        // Redirect to enhanced store
        const { deleteEvent } = useEnhancedCalendarStore.getState()
        deleteEvent(id)
      },
      getEventsByDateRange: (startDate, endDate) => {
        // Use enhanced store data
        return get().events.filter((event) => {
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