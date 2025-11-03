import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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

interface WeeklyCalendarStore {
  // Current week state
  currentWeek: CalendarWeek
  selectedEvent: EventOrTask | null
  
  // Events and tasks
  events: CalendarEvent[]
  tasks: Task[]
  
  // View settings
  viewSettings: CalendarViewSettings
  
  // UI state
  isLoading: boolean
  error: string | null
  
  // Actions - Week Navigation
  setCurrentWeek: (week: CalendarWeek) => void
  goToPreviousWeek: () => void
  goToNextWeek: () => void
  goToCurrentWeek: () => void
  
  // Actions - Event Management
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void
  deleteEvent: (id: string) => void
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  moveEvent: (eventId: string, newStartTime: Date, newEndTime: Date) => Promise<boolean>
  
  // Actions - Data Access
  getEventsForCurrentWeek: () => EventOrTask[]
  getEventsForDay: (dayIndex: number) => EventOrTask[]
  getAllEvents: () => EventOrTask[]
  getEventConflicts: (event: EventOrTask) => CalendarConflict[]
  checkEventCanMove: (eventId: string, newStartTime: Date, newEndTime: Date) => boolean
  
  // Actions - UI State
  selectEvent: (event: EventOrTask | null) => void
  setViewSettings: (settings: Partial<CalendarViewSettings>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Actions - Demo Data
  initializeWithDemoData: () => void
  clearAllData: () => void
}

export const useWeeklyCalendarStore = create<WeeklyCalendarStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentWeek: {
        startDate: new Date('2024-01-01T00:00:00Z'),
        endDate: new Date('2024-01-07T23:59:59Z'),
        days: [
          { date: new Date('2024-01-01'), dayOfWeek: 1, dayName: 'Mon', events: [], isToday: false, isCurrentWeek: true },
          { date: new Date('2024-01-02'), dayOfWeek: 2, dayName: 'Tue', events: [], isToday: false, isCurrentWeek: true },
          { date: new Date('2024-01-03'), dayOfWeek: 3, dayName: 'Wed', events: [], isToday: false, isCurrentWeek: true },
          { date: new Date('2024-01-04'), dayOfWeek: 4, dayName: 'Thu', events: [], isToday: false, isCurrentWeek: true },
          { date: new Date('2024-01-05'), dayOfWeek: 5, dayName: 'Fri', events: [], isToday: false, isCurrentWeek: true },
          { date: new Date('2024-01-06'), dayOfWeek: 6, dayName: 'Sat', events: [], isToday: false, isCurrentWeek: true },
          { date: new Date('2024-01-07'), dayOfWeek: 0, dayName: 'Sun', events: [], isToday: false, isCurrentWeek: true },
        ]
      },
      selectedEvent: null,
      events: [],
      tasks: [],
      viewSettings: DEFAULT_VIEW_SETTINGS,
      isLoading: false,
      error: null,
      
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
      
      // Event management
      addEvent: (eventData) => {
        const newEvent: CalendarEvent = {
          ...eventData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        
        // Check for collisions
        const { events, tasks } = get()
        const allEvents = [...events, ...tasks]
        if (checkEventCollision(newEvent, allEvents)) {
          set({ error: 'Event time conflicts with existing event' })
          return
        }
        
        set((state) => ({
          events: [...state.events, newEvent],
          error: null,
        }))
      },
      
      updateEvent: (id, updates) => {
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id
              ? { ...event, ...updates, updatedAt: new Date() }
              : event
          ),
        }))
      },
      
      deleteEvent: (id) => {
        set((state) => ({
          events: state.events.filter((event) => event.id !== id),
          selectedEvent: state.selectedEvent?.id === id ? null : state.selectedEvent,
        }))
      },
      
      // Task management
      addTask: (taskData) => {
        const newTask: Task = {
          ...taskData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        
        // Check for collisions if task has time
        if (newTask.startTime && newTask.endTime) {
          const { events, tasks } = get()
          const allEvents = [...events, ...tasks]
          if (checkEventCollision(newTask, allEvents)) {
            set({ error: 'Task time conflicts with existing event' })
            return
          }
        }
        
        set((state) => ({
          tasks: [...state.tasks, newTask],
          error: null,
        }))
      },
      
      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, ...updates, updatedAt: new Date() }
              : task
          ),
        }))
      },
      
      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
          selectedEvent: state.selectedEvent?.id === id ? null : state.selectedEvent,
        }))
      },
      
      // Move event with collision detection
      moveEvent: async (eventId, newStartTime, newEndTime) => {
        const { events, tasks } = get()
        const allEvents = [...events, ...tasks]
        const eventToMove = allEvents.find(e => e.id === eventId)
        
        if (!eventToMove) {
          set({ error: 'Event not found' })
          return false
        }
        
        // Create updated event
        const updatedEvent = {
          ...eventToMove,
          startTime: newStartTime,
          endTime: newEndTime,
          updatedAt: new Date(),
        }
        
        // Check for collisions
        if (checkEventCollision(updatedEvent, allEvents, eventId)) {
          set({ error: 'Cannot move event: time conflict detected' })
          return false
        }
        
        // Update the event
        if ('isAllDay' in eventToMove) {
          // It's a CalendarEvent
          get().updateEvent(eventId, { startTime: newStartTime, endTime: newEndTime })
        } else {
          // It's a Task
          get().updateTask(eventId, { startTime: newStartTime, endTime: newEndTime })
        }
        
        set({ error: null })
        return true
      },
      
      // Data access methods
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
      
      // Demo data
      initializeWithDemoData: () => {
        const demoEvents = createDefaultEvents()
        const demoTasks: Task[] = [] // Can add demo tasks here if needed
        
        set((state) => ({
          events: demoEvents.filter(e => 'isAllDay' in e) as CalendarEvent[],
          tasks: demoTasks,
          error: null,
        }))
      },
      
      clearAllData: () => {
        set({
          events: [],
          tasks: [],
          selectedEvent: null,
          error: null,
        })
      },
    }),
    {
      name: 'weekly-calendar-store',
      partialize: (state) => ({
        events: state.events,
        tasks: state.tasks,
        viewSettings: state.viewSettings,
        currentWeek: state.currentWeek,
      }),
      // Use custom storage to handle date deserialization
      storage: {
        getItem: (name) => {
          const value = localStorage.getItem(name)
          if (!value) return null
          
          try {
            const parsed = JSON.parse(value)
            // Transform persisted data to ensure Date objects are properly restored
            if (parsed && parsed.state && parsed.state.currentWeek) {
              const week = parsed.state.currentWeek
              return {
                ...parsed,
                state: {
                  ...parsed.state,
                  currentWeek: {
                    ...week,
                    startDate: new Date(week.startDate),
                    endDate: new Date(week.endDate),
                    days: week.days ? week.days.map((day: any) => ({
                      ...day,
                      date: new Date(day.date),
                    })) : [],
                  },
                },
              }
            }
            return parsed
          } catch {
            return value
          }
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value))
        },
        removeItem: (name) => {
          localStorage.removeItem(name)
        },
      },
    }
  )
)

// Selectors for common use cases
export const useCurrentWeekEvents = () => useWeeklyCalendarStore(state => state.getEventsForCurrentWeek())
export const useCalendarEvents = () => useWeeklyCalendarStore(state => state.events)
export const useCalendarTasks = () => useWeeklyCalendarStore(state => state.tasks)
export const useCurrentWeek = () => useWeeklyCalendarStore(state => state.currentWeek)
export const useViewSettings = () => useWeeklyCalendarStore(state => state.viewSettings)
export const useSelectedEvent = () => useWeeklyCalendarStore(state => state.selectedEvent)
export const useCalendarError = () => useWeeklyCalendarStore(state => state.error)