// Enhanced calendar types for weekly calendar view

export interface CalendarEvent {
  id: string
  title: string
  description?: string | null
  startTime: Date
  endTime: Date
  isAllDay: boolean
  location?: string | null
  userId: string
  categoryId?: string | null
  recurrence: {
    type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval?: number
    endDate?: Date
    daysOfWeek?: number[]
  }
  reminder: {
    enabled: boolean
    minutesBefore: number
  }
  createdAt: Date
  updatedAt: Date
}

export interface Task {
  id: string
  title: string
  description?: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: Date | null
  completedAt?: Date | null
  userId: string
  categoryId?: string | null
  startTime?: Date | null
  endTime?: Date | null
  isAllDay?: boolean
  location?: string | null
  progress: number
  estimatedDuration?: number | null
  actualDuration?: number | null
  recurrence: {
    type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval?: number
    endDate?: Date
    daysOfWeek?: number[]
  }
  reminder: {
    enabled: boolean
    minutesBefore: number
  }
  createdAt: Date
  updatedAt: Date
}

export interface BaseTask {
  id: string
  title: string
  description?: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: Date | null
  completedAt?: Date | null
  userId: string
  categoryId?: string | null
  startTime?: Date | null
  endTime?: Date | null
  isAllDay?: boolean
  location?: string | null
  progress: number
  estimatedDuration?: number | null
  actualDuration?: number | null
  recurrence: {
    type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval?: number
    endDate?: Date
    daysOfWeek?: number[]
  }
  reminder: {
    enabled: boolean
    minutesBefore: number
  }
  createdAt: Date
  updatedAt: Date
}

export interface CalendarGridSlot {
  id: string
  date: Date
  hour: number
  day: number // 0-6 for days of week
  events: (CalendarEvent | Task)[]
}

export interface CalendarDragDropData {
  eventId: string
  newStartTime: Date
  newEndTime: Date
  newDay?: number
}

export interface CalendarWeek {
  startDate: Date
  endDate: Date
  days: CalendarDay[]
}

export interface CalendarDay {
  date: Date
  dayOfWeek: number
  dayName: string
  events: (CalendarEvent | Task)[]
  isToday: boolean
  isCurrentWeek: boolean
}

export interface CalendarConflict {
  eventId: string
  conflictingEventId: string
  startTime: Date
  endTime: Date
}

export interface CalendarViewSettings {
  startHour: number
  endHour: number
  showWeekends: boolean
  timeFormat: '12h' | '24h'
  defaultView: 'week' | 'month' | 'day'
}

export interface CalendarFormData {
  title: string
  description?: string
  startTime: Date
  endTime: Date
  isAllDay: boolean
  location?: string
  categoryId?: string
  priority?: Task['priority']
}

export type TaskStatus = Task['status']
export type TaskPriority = Task['priority']

export interface CalendarEventFormData extends CalendarFormData {
  // Event-specific fields can be added here
}

export interface TaskFormData extends Omit<CalendarFormData, 'isAllDay'> {
  status: TaskStatus
  priority: TaskPriority
  dueDate?: Date
}

// Utility types for calendar operations
export type EventOrTask = CalendarEvent | Task

export interface TimeSlot {
  hour: number
  minute: number
  label: string
}

export interface CalendarPosition {
  x: number
  y: number
  width: number
  height: number
}

// Collision detection
export interface CollisionResult {
  hasCollision: boolean
  collisions: CalendarConflict[]
}

export interface WeeklyCalendarProps {
  currentWeek: CalendarWeek
  onWeekChange: (week: CalendarWeek) => void
  onEventClick?: (event: EventOrTask) => void
  onTimeSlotClick?: (date: Date, hour: number) => void
  onEventMove?: (eventId: string, newStartTime: Date, newEndTime: Date) => void
  events: EventOrTask[]
  viewSettings: CalendarViewSettings
  className?: string
}

export interface CategoryColors {
  [key: string]: string
}

export const DEFAULT_CATEGORY_COLORS: CategoryColors = {
  default: 'bg-gray-500/20 border-gray-500 text-gray-100',
  work: 'bg-blue-500/20 border-blue-500 text-blue-100',
  personal: 'bg-orange-500/20 border-orange-500 text-orange-100',
}