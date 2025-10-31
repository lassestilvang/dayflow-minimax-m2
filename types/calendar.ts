// Enhanced calendar types for weekly calendar view

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  isAllDay: boolean
  location?: string
  userId: string
  category: CalendarCategory
  createdAt: Date
  updatedAt: Date
}

export interface Task extends BaseTask {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: Date
  completedAt?: Date
  userId: string
  category: CalendarCategory
  startTime?: Date
  endTime?: Date
  isAllDay?: boolean
  location?: string
  createdAt: Date
  updatedAt: Date
}

export interface BaseTask {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: Date
  completedAt?: Date
  userId: string
  category: CalendarCategory
  startTime?: Date
  endTime?: Date
  isAllDay?: boolean
  location?: string
  createdAt: Date
  updatedAt: Date
}

export type CalendarCategory = 'work' | 'family' | 'personal' | 'travel'

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
  category: CalendarCategory
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

// Colors for categories
export const CATEGORY_COLORS = {
  work: 'bg-blue-500/20 border-blue-500 text-blue-100',
  family: 'bg-green-500/20 border-green-500 text-green-100',
  personal: 'bg-orange-500/20 border-orange-500 text-orange-100',
  travel: 'bg-purple-500/20 border-purple-500 text-purple-100',
} as const

export type CategoryColorKey = keyof typeof CATEGORY_COLORS