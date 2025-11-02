// Database TypeScript types based on the enhanced schema
import { z } from 'zod'

// Base types from database schema
export interface DatabaseUser {
  id: string
  email: string
  name?: string
  image?: string
  workosId?: string
  timezone: string
  preferences: {
    theme?: 'light' | 'dark' | 'system'
    notifications?: boolean
    defaultCalendarView?: 'week' | 'month' | 'day'
    [key: string]: any
  }
  createdAt: Date
  updatedAt: Date
}

export interface DatabaseCategory {
  id: string
  name: string
  color: string
  icon?: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface DatabaseTag {
  id: string
  name: string
  color: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface DatabaseTask {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: Date
  completedAt?: Date
  startTime?: Date
  endTime?: Date
  progress: number
  estimatedDuration?: number
  actualDuration?: number
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
  userId: string
  categoryId?: string
  createdAt: Date
  updatedAt: Date
}

export interface DatabaseCalendarEvent {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  isAllDay: boolean
  location?: string
  meetingUrl?: string
  attendees: {
    email: string
    name?: string
    status: 'pending' | 'accepted' | 'declined'
  }[]
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
  userId: string
  categoryId?: string
  createdAt: Date
  updatedAt: Date
}

// Junction table types
export interface DatabaseTaskTag {
  taskId: string
  tagId: string
  createdAt: Date
}

export interface DatabaseEventTag {
  eventId: string
  tagId: string
  createdAt: Date
}

// Enhanced types with relations
export interface DatabaseTaskWithRelations extends DatabaseTask {
  category?: DatabaseCategory
  tags: DatabaseTag[]
}

export interface DatabaseEventWithRelations extends DatabaseCalendarEvent {
  category?: DatabaseCategory
  tags: DatabaseTag[]
}

export interface DatabaseUserWithRelations extends DatabaseUser {
  tasks: DatabaseTask[]
  calendarEvents: DatabaseCalendarEvent[]
  categories: DatabaseCategory[]
  tags: DatabaseTag[]
}

// Form data types
export interface UserFormData {
  email: string
  name?: string
  image?: string
  workosId?: string
  timezone?: string
  preferences?: DatabaseUser['preferences']
}

export interface CategoryFormData {
  name: string
  color: string
  icon?: string
}

export interface TagFormData {
  name: string
  color: string
}

export interface TaskFormData {
  title: string
  description?: string
  status?: DatabaseTask['status']
  priority?: DatabaseTask['priority']
  dueDate?: Date
  startTime?: Date
  endTime?: Date
  progress?: number
  estimatedDuration?: number
  categoryId?: string
  tags?: string[]
  recurrence?: DatabaseTask['recurrence']
  reminder?: DatabaseTask['reminder']
}

export interface EventFormData {
  title: string
  description?: string
  startTime: Date
  endTime: Date
  isAllDay?: boolean
  location?: string
  meetingUrl?: string
  attendees?: DatabaseCalendarEvent['attendees']
  categoryId?: string
  tags?: string[]
  recurrence?: DatabaseCalendarEvent['recurrence']
  reminder?: DatabaseCalendarEvent['reminder']
}

// Filter types
export interface TaskFilter {
  status?: DatabaseTask['status'][]
  priority?: DatabaseTask['priority'][]
  categoryId?: string[]
  tags?: string[]
  dueDateRange?: { start: Date; end: Date }
  dateRange?: { start: Date; end: Date }
  search?: string
}

export interface EventFilter {
  dateRange?: { start: Date; end: Date }
  isAllDay?: boolean
  categoryId?: string[]
  tags?: string[]
  location?: string
  search?: string
}

// Sort types
export interface SortOptions {
  field: string
  direction: 'asc' | 'desc'
}

// Pagination types
export interface PaginationOptions {
  page?: number
  limit?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Repository interfaces
export interface UserRepository {
  create(data: UserFormData): Promise<DatabaseUser>
  findById(id: string): Promise<DatabaseUser | null>
  findByEmail(email: string): Promise<DatabaseUser | null>
  findByWorkosId(workosId: string): Promise<DatabaseUser | null>
  update(id: string, data: Partial<UserFormData>): Promise<DatabaseUser>
  delete(id: string): Promise<void>
  updatePreferences(id: string, preferences: DatabaseUser['preferences']): Promise<DatabaseUser>
}

export interface TaskRepository {
  create(data: TaskFormData): Promise<DatabaseTask>
  findById(id: string): Promise<DatabaseTask | null>
  findMany(
    filters?: TaskFilter,
    sort?: SortOptions,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<DatabaseTask>>
  findByUserId(userId: string): Promise<DatabaseTask[]>
  findWithFilters(userId: string, filters: TaskFilter): Promise<DatabaseTask[]>
  findOverdue(userId: string): Promise<DatabaseTask[]>
  findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<DatabaseTask[]>
  update(id: string, data: Partial<TaskFormData>): Promise<DatabaseTask>
  delete(id: string): Promise<void>
  addTag(taskId: string, tagId: string): Promise<void>
  removeTag(taskId: string, tagId: string): Promise<void>
  getWithTags(taskId: string): Promise<DatabaseTaskWithRelations | null>
}

export interface EventRepository {
  create(data: EventFormData): Promise<DatabaseCalendarEvent>
  findById(id: string): Promise<DatabaseCalendarEvent | null>
  findMany(
    filters?: EventFilter,
    sort?: SortOptions,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<DatabaseCalendarEvent>>
  findByUserId(userId: string): Promise<DatabaseCalendarEvent[]>
  findWithFilters(userId: string, filters: EventFilter): Promise<DatabaseCalendarEvent[]>
  findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<DatabaseCalendarEvent[]>
  findConflicts(
    userId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string
  ): Promise<DatabaseCalendarEvent[]>
  update(id: string, data: Partial<EventFormData>): Promise<DatabaseCalendarEvent>
  delete(id: string): Promise<void>
  addTag(eventId: string, tagId: string): Promise<void>
  removeTag(eventId: string, tagId: string): Promise<void>
  getWithTags(eventId: string): Promise<DatabaseEventWithRelations | null>
}

export interface CategoryRepository {
  create(data: CategoryFormData): Promise<DatabaseCategory>
  findById(id: string): Promise<DatabaseCategory | null>
  findByUserId(userId: string): Promise<DatabaseCategory[]>
  findByName(userId: string, name: string): Promise<DatabaseCategory | null>
  update(id: string, data: Partial<CategoryFormData>): Promise<DatabaseCategory>
  delete(id: string): Promise<void>
}

export interface TagRepository {
  create(data: TagFormData): Promise<DatabaseTag>
  findById(id: string): Promise<DatabaseTag | null>
  findByUserId(userId: string): Promise<DatabaseTag[]>
  searchByName(userId: string, query: string): Promise<DatabaseTag[]>
  update(id: string, data: Partial<TagFormData>): Promise<DatabaseTag>
  delete(id: string): Promise<void>
}

// Sync types
export interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  lastSync: Date | null
  pendingChanges: number
  conflicts: string[]
  errors: string[]
}

export interface SyncOptions {
  batchSize?: number
  timeout?: number
  retryAttempts?: number
  conflictResolution?: 'client' | 'server' | 'manual'
}

export interface SyncResult {
  success: boolean
  errors: string[]
  conflicts: string[]
  syncedItems: number
  duration: number
}

// Error types
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConflictError'
  }
}

export class SyncError extends Error {
  constructor(message: string, public details?: any) {
    super(message)
    this.name = 'SyncError'
  }
}

// Dashboard stats types
export interface DashboardStats {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  overdueTasks: number
  upcomingEvents: number
  tasksByCategory: Record<string, number>
  eventsByMonth: Record<string, number>
  completionRate: number
}

// Data import/export types
export interface ExportData {
  users: DatabaseUser[]
  tasks: DatabaseTask[]
  events: DatabaseCalendarEvent[]
  categories: DatabaseCategory[]
  tags: DatabaseTag[]
  exportedAt: Date
  version: string
}

export interface ImportResult {
  success: boolean
  imported: {
    users: number
    tasks: number
    events: number
    categories: number
    tags: number
  }
  errors: string[]
  warnings: string[]
}

// Cache types
export interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
  version: string
}

export interface CacheConfig {
  ttl: number
  maxSize: number
  version: string
}

// Performance types
export interface PerformanceMetrics {
  queryTime: number
  memoryUsage: number
  cacheHitRate: number
  syncLatency: number
  errorRate: number
}

// Validation schemas for runtime validation
export const userFormSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  image: z.string().url().optional(),
  workosId: z.string().optional(),
  timezone: z.string().optional(),
  preferences: z.record(z.any(), z.any()).optional(),
})

export const taskFormSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.date().optional(),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  progress: z.number().min(0).max(100).optional(),
  estimatedDuration: z.number().min(0).optional(),
  categoryId: z.string().uuid().optional(),
  tags: z.array(z.string().uuid()).optional(),
  recurrence: z.object({
    type: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly']),
    interval: z.number().min(1).optional(),
    endDate: z.date().optional(),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  }).optional(),
  reminder: z.object({
    enabled: z.boolean(),
    minutesBefore: z.number().min(0).max(1440),
  }).optional(),
})

export const eventFormSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  startTime: z.date(),
  endTime: z.date(),
  isAllDay: z.boolean().optional(),
  location: z.string().max(500).optional(),
  meetingUrl: z.string().url().optional(),
  attendees: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
    status: z.enum(['pending', 'accepted', 'declined']),
  })).optional(),
  categoryId: z.string().uuid().optional(),
  tags: z.array(z.string().uuid()).optional(),
  recurrence: z.object({
    type: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly']),
    interval: z.number().min(1).optional(),
    endDate: z.date().optional(),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  }).optional(),
  reminder: z.object({
    enabled: z.boolean(),
    minutesBefore: z.number().min(0).max(1440),
  }).optional(),
})

// Type guards
export const isDatabaseUser = (data: any): data is DatabaseUser => {
  return (
    typeof data.id === 'string' &&
    typeof data.email === 'string' &&
    data.createdAt instanceof Date &&
    data.updatedAt instanceof Date
  )
}

export const isDatabaseTask = (data: any): data is DatabaseTask => {
  return (
    typeof data.id === 'string' &&
    typeof data.title === 'string' &&
    ['pending', 'in_progress', 'completed', 'cancelled'].includes(data.status) &&
    ['low', 'medium', 'high', 'urgent'].includes(data.priority) &&
    data.createdAt instanceof Date &&
    data.updatedAt instanceof Date
  )
}

export const isDatabaseEvent = (data: any): data is DatabaseCalendarEvent => {
  return (
    typeof data.id === 'string' &&
    typeof data.title === 'string' &&
    data.startTime instanceof Date &&
    data.endTime instanceof Date &&
    typeof data.isAllDay === 'boolean' &&
    data.createdAt instanceof Date &&
    data.updatedAt instanceof Date
  )
}

// Utility types
export type DatabaseTableName = 'users' | 'tasks' | 'calendar_events' | 'categories' | 'tags'
export type DatabaseOperation = 'create' | 'read' | 'update' | 'delete'
export type EntityType = 'user' | 'task' | 'event' | 'category' | 'tag'

// Error handling types
export interface ErrorInfo {
  code: string
  message: string
  field?: string
  details?: any
  timestamp: Date
}

export interface ErrorContext {
  operation: DatabaseOperation
  entity: EntityType
  entityId?: string
  userId?: string
  metadata?: Record<string, any>
}

// Configuration types
export interface DatabaseConfig {
  connectionString: string
  poolSize?: number
  timeout?: number
  retryAttempts?: number
  ssl?: boolean
  schema?: string
}

export interface CacheConfig {
  enabled: boolean
  ttl: number
  maxSize: number
  cleanupInterval: number
}

// Export all types
export * from './index'