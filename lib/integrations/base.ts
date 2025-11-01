/**
 * Base Integration Framework
 * Defines interfaces and types for external service integrations
 */

import { UserIntegration, SyncOperation, SyncQueueItem, ExternalItem } from '../db/integrations-schema'
import { Task, CalendarEvent } from '../db/schema'

export type IntegrationType = 'task_management' | 'calendar'
export type SyncDirection = 'one_way' | 'two_way' | 'manual'
export type ConflictResolution = 'manual' | 'latest' | 'source' | 'merge'

// Base integration interface
export interface BaseIntegration {
  // Service identification
  readonly serviceName: string
  readonly displayName: string
  readonly type: IntegrationType
  
  // OAuth configuration
  readonly clientId?: string
  readonly scopes: string[]
  readonly authUrl: string
  readonly tokenUrl: string
  
  // API configuration
  readonly apiBaseUrl: string
  readonly rateLimits?: {
    requestsPerMinute: number
    requestsPerHour: number
  }

  // Core integration methods
  initialize(): Promise<void>
  authenticate(accessToken: string, refreshToken?: string, expiresAt?: Date): Promise<void>
  testConnection(): Promise<boolean>
  refreshToken(): Promise<void>

  // Data synchronization methods
  syncTasks(): Promise<SyncResult>
  syncEvents(): Promise<SyncResult>
  fullSync(): Promise<SyncResult>
  
  // Item operations
  createTask(task: TaskData): Promise<ExternalTask>
  updateTask(externalId: string, task: TaskData): Promise<ExternalTask>
  deleteTask(externalId: string): Promise<void>
  getTask(externalId: string): Promise<ExternalTask | null>
  
  createEvent(event: EventData): Promise<ExternalEvent>
  updateEvent(externalId: string, event: EventData): Promise<ExternalEvent>
  deleteEvent(externalId: string): Promise<void>
  getEvent(externalId: string): Promise<ExternalEvent | null>

  // Webhook handling
  handleWebhook(payload: any, signature?: string): Promise<void>
  registerWebhook(webhookUrl: string): Promise<WebhookRegistration>
  unregisterWebhook(webhookId: string): Promise<void>

  // Cleanup
  disconnect(): Promise<void>
}

// Data structures for external services
export interface TaskData {
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: Date
  completedAt?: Date
  startTime?: Date
  endTime?: Date
  tags?: string[]
  category?: string
  externalId?: string
  externalData?: Record<string, any>
}

export interface EventData {
  title: string
  description?: string
  startTime: Date
  endTime: Date
  isAllDay: boolean
  location?: string
  attendees?: Array<{
    email: string
    name?: string
    status?: 'pending' | 'accepted' | 'declined'
  }>
  recurrence?: {
    type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval?: number
    endDate?: Date
    daysOfWeek?: number[]
  }
  externalId?: string
  externalData?: Record<string, any>
}

export interface ExternalTask {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  dueDate?: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
  tags?: string[]
  url?: string
  data: Record<string, any>
}

export interface ExternalEvent {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  isAllDay: boolean
  location?: string
  attendees?: Array<{
    email: string
    name?: string
    status?: string
  }>
  recurrence?: {
    type: string
    interval?: number
    endDate?: Date
    daysOfWeek?: number[]
  }
  url?: string
  data: Record<string, any>
}

// Sync result types
export interface SyncResult {
  operationId: string
  status: 'success' | 'error' | 'partial_success'
  itemsProcessed: number
  itemsCreated: number
  itemsUpdated: number
  itemsDeleted: number
  conflicts: SyncConflict[]
  errors: SyncError[]
  startedAt: Date
  completedAt?: Date
}

export interface SyncConflict {
  type: 'title_mismatch' | 'description_mismatch' | 'status_mismatch' | 'date_mismatch' | 'duplicate'
  dayflowItem: Task | CalendarEvent
  externalItem: ExternalTask | ExternalEvent
  conflict: any
  resolution?: 'keep_dayflow' | 'keep_external' | 'merge' | 'manual'
}

export interface SyncError {
  type: 'network_error' | 'api_error' | 'validation_error' | 'rate_limit_error'
  message: string
  details?: any
  item?: Task | CalendarEvent | ExternalTask | ExternalEvent
}

// Webhook types
export interface WebhookRegistration {
  id: string
  url: string
  secret?: string
  events: string[]
  active: boolean
  createdAt: Date
}

export interface WebhookEvent {
  id: string
  type: string
  action: string
  resource: string
  resourceId: string
  timestamp: Date
  data: any
}

// OAuth token management
export interface OAuthToken {
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
  scope?: string[]
  tokenType?: string
}

// Integration configuration
export interface IntegrationConfig {
  autoSync: boolean
  syncInterval: number // minutes
  syncDirection: SyncDirection
  syncTasks: boolean
  syncEvents: boolean
  conflictResolution: ConflictResolution
  fieldMapping: Record<string, string>
  filters: {
    status?: string[]
    priorities?: string[]
    tags?: string[]
    dateRange?: {
      start: Date
      end: Date
    }
  }
}

// Rate limiting configuration
export interface RateLimitConfig {
  requestsPerMinute: number
  requestsPerHour: number
  burstLimit: number
  backoffStrategy: 'exponential' | 'linear' | 'fixed'
  maxRetries: number
}

// API error types
export class IntegrationError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message)
    this.name = 'IntegrationError'
  }
}

export class RateLimitError extends IntegrationError {
  constructor(message: string, public retryAfter?: number) {
    super(message, 'RATE_LIMIT_EXCEEDED')
    this.name = 'RateLimitError'
  }
}

export class AuthenticationError extends IntegrationError {
  constructor(message: string) {
    super(message, 'AUTHENTICATION_FAILED', 401)
    this.name = 'AuthenticationError'
  }
}

export class ValidationError extends IntegrationError {
  constructor(message: string, public field?: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details)
    this.name = 'ValidationError'
  }
}

// Base abstract class for integrations
export abstract class BaseIntegrationService implements BaseIntegration {
  abstract readonly serviceName: string
  abstract readonly displayName: string
  abstract readonly type: IntegrationType
  abstract readonly scopes: string[]
  abstract readonly authUrl: string
  abstract readonly tokenUrl: string
  abstract readonly apiBaseUrl: string

  protected accessToken?: string
  protected _refreshToken?: string
  protected expiresAt?: Date
  protected config?: IntegrationConfig
  protected rateLimitConfig: RateLimitConfig

  constructor(config: Partial<IntegrationConfig> = {}) {
    this.config = {
      autoSync: true,
      syncInterval: 15,
      syncDirection: 'two_way',
      syncTasks: true,
      syncEvents: true,
      conflictResolution: 'manual' as const,
      fieldMapping: {},
      filters: {},
      ...config
    }
    this.rateLimitConfig = {
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      burstLimit: 10,
      backoffStrategy: 'exponential',
      maxRetries: 3
    }
  }

  get refreshTokenValue(): string | undefined {
    return this._refreshToken
  }

  set refreshTokenValue(token: string | undefined) {
    this._refreshToken = token
  }

  abstract initialize(): Promise<void>
  abstract authenticate(accessToken: string, refreshToken?: string, expiresAt?: Date): Promise<void>
  abstract testConnection(): Promise<boolean>
  abstract refreshToken(): Promise<void>

  abstract syncTasks(): Promise<SyncResult>
  abstract syncEvents(): Promise<SyncResult>
  abstract fullSync(): Promise<SyncResult>

  abstract createTask(task: TaskData): Promise<ExternalTask>
  abstract updateTask(externalId: string, task: TaskData): Promise<ExternalTask>
  abstract deleteTask(externalId: string): Promise<void>
  abstract getTask(externalId: string): Promise<ExternalTask | null>

  abstract createEvent(event: EventData): Promise<ExternalEvent>
  abstract updateEvent(externalId: string, event: EventData): Promise<ExternalEvent>
  abstract deleteEvent(externalId: string): Promise<void>
  abstract getEvent(externalId: string): Promise<ExternalEvent | null>

  abstract handleWebhook(payload: any, signature?: string): Promise<void>
  abstract registerWebhook(webhookUrl: string): Promise<WebhookRegistration>
  abstract unregisterWebhook(webhookId: string): Promise<void>

  abstract disconnect(): Promise<void>

  // Common utility methods
  protected isTokenExpired(): boolean {
    if (!this.expiresAt) return false
    return new Date() >= this.expiresAt
  }

  protected async ensureAuthenticated(): Promise<void> {
    if (this.isTokenExpired()) {
      await (this as any).refreshToken()
    }
  }

  protected validateTaskData(task: TaskData): void {
    if (!task.title?.trim()) {
      throw new ValidationError('Task title is required', 'title')
    }
    if (task.dueDate && task.startTime && task.dueDate < task.startTime) {
      throw new ValidationError('Due date cannot be before start time', 'dueDate')
    }
  }

  protected validateEventData(event: EventData): void {
    if (!event.title?.trim()) {
      throw new ValidationError('Event title is required', 'title')
    }
    if (event.endTime <= event.startTime) {
      throw new ValidationError('End time must be after start time', 'endTime')
    }
  }

  protected mapTaskStatus(externalStatus: string): TaskData['status'] {
    const statusMap: Record<string, TaskData['status']> = {
      'pending': 'pending',
      'open': 'pending',
      'todo': 'pending',
      'not_started': 'pending',
      'in_progress': 'in_progress',
      'active': 'in_progress',
      'doing': 'in_progress',
      'completed': 'completed',
      'done': 'completed',
      'finished': 'completed',
      'cancelled': 'cancelled',
      'canceled': 'cancelled',
      'closed': 'cancelled'
    }
    return statusMap[externalStatus.toLowerCase()] || 'pending'
  }

  protected mapPriority(externalPriority: string): TaskData['priority'] {
    const priorityMap: Record<string, TaskData['priority']> = {
      'lowest': 'low',
      'low': 'low',
      'medium': 'medium',
      'normal': 'medium',
      'high': 'high',
      'highest': 'urgent',
      'urgent': 'urgent'
    }
    return priorityMap[externalPriority.toLowerCase()] || 'medium'
  }
}