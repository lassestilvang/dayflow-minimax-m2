/**
 * Integration Utilities
 * Common utilities for rate limiting, error handling, data transformation, and sync operations
 */

import { BaseIntegration, IntegrationError, RateLimitError, ValidationError, ExternalTask, ExternalEvent, Task, CalendarEvent } from './base'

// Rate Limiting
export class RateLimiter {
  private requests: number[] = []
  private hourlyRequests: number[] = []

  constructor(
    private requestsPerMinute: number,
    private requestsPerHour: number
  ) {}

  async acquire(): Promise<void> {
    const now = Date.now()
    const oneMinuteAgo = now - 60000
    const oneHourAgo = now - 3600000

    // Clean up old requests
    this.requests = this.requests.filter(t => t > oneMinuteAgo)
    this.hourlyRequests = this.hourlyRequests.filter(t => t > oneHourAgo)

    // Check rate limits
    if (this.requests.length >= this.requestsPerMinute) {
      throw new RateLimitError('Rate limit exceeded: too many requests per minute')
    }

    if (this.hourlyRequests.length >= this.requestsPerHour) {
      throw new RateLimitError('Rate limit exceeded: too many requests per hour')
    }

    // Record this request
    this.requests.push(now)
    this.hourlyRequests.push(now)
  }
}

// Data transformation utilities
export class DataTransformer {
  // Transform external task to DayFlow task format
  static externalTaskToTask(externalTask: ExternalTask, userId: string): Partial<Task> {
    const task: Partial<Task> = {
      title: externalTask.title,
      description: externalTask.description,
      status: DataTransformer.mapExternalStatus(externalTask.status),
      priority: DataTransformer.mapExternalPriority(externalTask.priority),
      dueDate: externalTask.dueDate,
      completedAt: externalTask.completedAt,
      userId,
      startTime: externalTask.data?.startTime,
      endTime: externalTask.data?.endTime,
    }

    return task
  }

  // Transform DayFlow task to external format
  static taskToExternalTask(task: Task, serviceName: string): ExternalTask {
    return {
      id: task.id,
      title: task.title,
      description: task.description || undefined,
      status: DataTransformer.mapDayFlowStatus(task.status, serviceName),
      priority: DataTransformer.mapDayFlowPriority(task.priority, serviceName),
      dueDate: task.dueDate || undefined,
      completedAt: task.completedAt || undefined,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      tags: task.data?.tags,
      url: task.data?.url,
      data: {
        ...task.data,
        dayflowId: task.id,
        userId: task.userId,
      }
    }
  }

  // Transform external event to DayFlow event format
  static externalEventToEvent(externalEvent: ExternalEvent, userId: string): Partial<CalendarEvent> {
    const event: Partial<CalendarEvent> = {
      title: externalEvent.title,
      description: externalEvent.description,
      startTime: externalEvent.startTime,
      endTime: externalEvent.endTime,
      isAllDay: externalEvent.isAllDay,
      location: externalEvent.location,
      attendees: externalEvent.attendees,
      recurrence: externalEvent.recurrence,
      userId,
    }

    return event
  }

  // Transform DayFlow event to external format
  static eventToExternalEvent(event: CalendarEvent, serviceName: string): ExternalEvent {
    return {
      id: event.id,
      title: event.title,
      description: event.description || undefined,
      startTime: event.startTime,
      endTime: event.endTime,
      isAllDay: event.isAllDay,
      location: event.location || undefined,
      attendees: event.attendees,
      recurrence: event.recurrence,
      url: event.data?.url,
      data: {
        ...event.data,
        dayflowId: event.id,
        userId: event.userId,
      }
    }
  }

  private static mapExternalStatus(externalStatus: string): Task['status'] {
    const statusMap: Record<string, Task['status']> = {
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

  private static mapDayFlowStatus(status: Task['status'], serviceName: string): string {
    const statusMaps: Record<string, Record<Task['status'], string>> = {
      notion: {
        pending: 'Not started',
        in_progress: 'In progress',
        completed: 'Done',
        cancelled: 'Cancelled'
      },
      clickup: {
        pending: 'Open',
        in_progress: 'In Progress',
        completed: 'Done',
        cancelled: 'Cancelled'
      },
      linear: {
        pending: 'Backlog',
        in_progress: 'In Progress',
        completed: 'Done',
        cancelled: 'Cancelled'
      },
      todoist: {
        pending: 'pending',
        in_progress: 'in_progress',
        completed: 'completed',
        cancelled: 'cancelled'
      }
    }

    const serviceMap = statusMaps[serviceName]
    if (!serviceMap) {
      return status
    }

    return serviceMap[status] || status
  }

  private static mapExternalPriority(externalPriority: string): Task['priority'] {
    const priorityMap: Record<string, Task['priority']> = {
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

  private static mapDayFlowPriority(priority: Task['priority'], serviceName: string): string {
    const priorityMaps: Record<string, Record<Task['priority'], string>> = {
      notion: {
        low: 'Low',
        medium: 'Normal',
        high: 'High',
        urgent: 'Urgent'
      },
      clickup: {
        low: '3 - Low',
        medium: '2 - Normal',
        high: '1 - High',
        urgent: '0 - Urgent'
      },
      linear: {
        low: '1',
        medium: '2',
        high: '3',
        urgent: '4'
      },
      todoist: {
        low: '1',
        medium: '2',
        high: '3',
        urgent: '4'
      }
    }

    const serviceMap = priorityMaps[serviceName]
    if (!serviceMap) {
      return priority
    }

    return serviceMap[priority] || priority
  }
}

// Conflict detection utilities
export class ConflictDetector {
  static detectTaskConflicts(
    dayflowTask: Task,
    externalTask: ExternalTask
  ): { conflicts: string[]; similarity: number } {
    const conflicts: string[] = []
    let similarity = 0
    let comparisonCount = 0

    // Title similarity (40% weight)
    const titleSimilarity = this.calculateSimilarity(dayflowTask.title, externalTask.title)
    if (titleSimilarity < 0.8) {
      conflicts.push('title_mismatch')
    }
    similarity += titleSimilarity * 0.4
    comparisonCount++

    // Description similarity (30% weight) - only if both have descriptions
    if (dayflowTask.description && externalTask.description) {
      const descSimilarity = this.calculateSimilarity(dayflowTask.description, externalTask.description)
      if (descSimilarity < 0.7) {
        conflicts.push('description_mismatch')
      }
      similarity += descSimilarity * 0.3
      comparisonCount++
    } else if (dayflowTask.description || externalTask.description) {
      conflicts.push('description_mismatch')
      comparisonCount++
    }

    // Due date similarity (20% weight)
    const dayflowDue = dayflowTask.dueDate ? new Date(dayflowTask.dueDate).toDateString() : null
    const externalDue = externalTask.dueDate ? externalTask.dueDate.toDateString() : null
    
    if (dayflowDue !== externalDue) {
      conflicts.push('date_mismatch')
    }
    similarity += (dayflowDue === externalDue ? 1 : 0) * 0.2
    comparisonCount++

    // Status similarity (10% weight)
    const dayflowStatus = this.normalizeStatus(dayflowTask.status)
    const externalStatus = this.normalizeStatus(externalTask.status)
    if (dayflowStatus !== externalStatus) {
      conflicts.push('status_mismatch')
    }
    similarity += (dayflowStatus === externalStatus ? 1 : 0) * 0.1
    comparisonCount++

    return { conflicts, similarity: comparisonCount > 0 ? similarity / comparisonCount : 0 }
  }

  static detectEventConflicts(
    dayflowEvent: CalendarEvent,
    externalEvent: ExternalEvent
  ): { conflicts: string[]; similarity: number } {
    const conflicts: string[] = []
    let similarity = 0
    let comparisonCount = 0

    // Title similarity (40% weight)
    const titleSimilarity = this.calculateSimilarity(dayflowEvent.title, externalEvent.title)
    if (titleSimilarity < 0.8) {
      conflicts.push('title_mismatch')
    }
    similarity += titleSimilarity * 0.4
    comparisonCount++

    // Time overlap (30% weight)
    const hasTimeConflict = this.hasTimeOverlap(dayflowEvent, externalEvent)
    if (!hasTimeConflict) {
      conflicts.push('time_mismatch')
    }
    similarity += (hasTimeConflict ? 1 : 0) * 0.3
    comparisonCount++

    // Description similarity (30% weight)
    if (dayflowEvent.description && externalEvent.description) {
      const descSimilarity = this.calculateSimilarity(dayflowEvent.description, externalEvent.description)
      if (descSimilarity < 0.7) {
        conflicts.push('description_mismatch')
      }
      similarity += descSimilarity * 0.3
      comparisonCount++
    } else if (dayflowEvent.description || externalEvent.description) {
      conflicts.push('description_mismatch')
      comparisonCount++
    }

    return { conflicts, similarity: comparisonCount > 0 ? similarity / comparisonCount : 0 }
  }

  private static calculateSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0
    
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const distance = this.levenshteinDistance(longer, shorter)
    return (longer.length - distance) / longer.length
  }

  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  private static normalizeStatus(status: string): string {
    return status.toLowerCase().replace(/[^a-z]/g, '')
  }

  private static hasTimeOverlap(event1: CalendarEvent, event2: ExternalEvent): boolean {
    return (
      event1.startTime <= event2.endTime &&
      event1.endTime >= event2.startTime
    )
  }
}

// Retry utilities
export class RetryHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    backoffStrategy: 'exponential' | 'linear' = 'exponential'
  ): Promise<T> {
    let lastError: Error
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        
        if (attempt === maxRetries) {
          throw lastError
        }

        // Don't retry on validation errors or authentication errors
        if (error instanceof ValidationError || error instanceof AuthenticationError) {
          throw error
        }

        // Calculate delay
        let delay = baseDelay
        if (backoffStrategy === 'exponential') {
          delay = baseDelay * Math.pow(2, attempt)
        } else {
          delay = baseDelay * (attempt + 1)
        }

        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError!
  }
}

// Validation utilities
export class ValidationUtils {
  static validateExternalId(externalId: string): void {
    if (!externalId || typeof externalId !== 'string' || externalId.trim().length === 0) {
      throw new ValidationError('External ID is required', 'externalId')
    }
  }

  static validateWebhookPayload(payload: any): void {
    if (!payload || typeof payload !== 'object') {
      throw new ValidationError('Webhook payload must be a valid object', 'payload')
    }

    if (!payload.type || !payload.action) {
      throw new ValidationError('Webhook payload must contain type and action', 'payload')
    }
  }

  static sanitizeText(text: string, maxLength: number = 1000): string {
    if (!text) return ''
    
    return text
      .trim()
      .substring(0, maxLength)
      .replace(/[<>]/g, '') // Remove potential HTML tags
  }
}

// Webhook utilities
export class WebhookUtils {
  static generateWebhookSecret(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  static generateWebhookId(): string {
    return 'wh_' + Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  static verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    // Simple HMAC-SHA256 verification
    const encoder = new TextEncoder()
    const key = encoder.encode(secret)
    const data = encoder.encode(payload)
    
    return crypto.subtle.sign('HMAC', key, data)
      .then(signatureBuf => {
        const expectedSignature = Array.from(new Uint8Array(signatureBuf))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
        
        return signature === expectedSignature
      })
      .catch(() => false)
  }
}

// OAuth utilities
export class OAuthUtils {
  static generateStateParameter(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  static isTokenExpired(expiresAt: Date): boolean {
    // Consider token expired if it expires within the next 5 minutes
    const buffer = 5 * 60 * 1000 // 5 minutes in milliseconds
    return new Date() >= new Date(expiresAt.getTime() - buffer)
  }

  static getAuthorizationUrl(
    authUrl: string,
    clientId: string,
    redirectUri: string,
    state: string,
    scope: string[]
  ): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scope.join(' '),
      state: state,
    })

    return `${authUrl}?${params.toString()}`
  }
}