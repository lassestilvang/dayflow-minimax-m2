export interface User {
  id: string
  email: string
  name?: string
  image?: string
  workosId?: string
  createdAt: Date
  updatedAt: Date
}

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
  progress: number
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

// Combined type for either Task or CalendarEvent
export type EventOrTask = Task | CalendarEvent

export type TaskStatus = Task['status']
export type TaskPriority = Task['priority']
export type EventStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled'

export interface TaskFormData {
  title: string
  description?: string
  priority: TaskPriority
  dueDate?: Date
}

export interface CalendarEventFormData {
  title: string
  description?: string
  startTime: Date
  endTime: Date
  isAllDay: boolean
  location?: string
}

export interface DashboardStats {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  overdueTasks: number
  upcomingEvents: number
}