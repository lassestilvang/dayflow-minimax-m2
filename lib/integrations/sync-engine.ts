/**
 * Synchronization Engine with Conflict Resolution
 * Handles two-way synchronization between DayFlow and external services
 */

import { BaseIntegration, SyncResult, SyncConflict, ExternalTask, ExternalEvent, ConflictResolution } from './base'
import { DataTransformer, ConflictDetector, RetryHandler, ValidationUtils } from './utils'
import { UserIntegration, SyncOperation, SyncQueueItem, ExternalItem } from '../db/integrations-schema'
import { taskRepository, calendarEventRepository } from '../data-access'
import { db } from '../db'
import { and, eq, gt, lte, sql } from 'drizzle-orm'
import { userIntegrations, externalItems } from '../db/integrations-schema'
import { NotionIntegration } from './notion'
import { ClickUpIntegration } from './clickup'
import { LinearIntegration } from './linear'
import { TodoistIntegration } from './todoist'
import { GoogleCalendarIntegration } from './google-calendar'
import { OutlookCalendarIntegration } from './outlook'
import { AppleCalendarIntegration } from './apple-calendar'
import { FastmailCalendarIntegration } from './fastmail'

// Import Task and CalendarEvent from schema
import type { Task, CalendarEvent } from '../db/schema'

interface SyncJob {
  id: string
  userIntegrationId: string
  operation: 'full_sync' | 'incremental_sync' | 'task_sync' | 'event_sync'
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  startedAt: Date
  completedAt?: Date
  conflicts: SyncConflict[]
  errors: any[]
  result?: SyncResult
}

interface ConflictResolutionRequest {
  conflictId: string
  dayflowItemId: string
  externalItemId: string
  resolution: 'keep_dayflow' | 'keep_external' | 'merge' | 'manual'
  mergedData?: any
  notes?: string
}

export class SyncEngine {
  private activeJobs = new Map<string, SyncJob>()
  private integrationFactories: Map<string, () => BaseIntegration> = new Map()

  constructor() {
    this.initializeIntegrationFactories()
  }

  private initializeIntegrationFactories(): void {
    this.integrationFactories.set('notion', () => new NotionIntegration())
    this.integrationFactories.set('clickup', () => new ClickUpIntegration())
    this.integrationFactories.set('linear', () => new LinearIntegration())
    this.integrationFactories.set('todoist', () => new TodoistIntegration())
    this.integrationFactories.set('google-calendar', () => new GoogleCalendarIntegration())
    this.integrationFactories.set('outlook', () => new OutlookCalendarIntegration())
    this.integrationFactories.set('apple-calendar', () => new AppleCalendarIntegration())
    this.integrationFactories.set('fastmail', () => new FastmailCalendarIntegration())
  }

  /**
   * Start a full synchronization job for a user integration
   */
  async startFullSync(
    userIntegration: UserIntegration,
    options: {
      syncTasks?: boolean
      syncEvents?: boolean
      conflictResolution?: ConflictResolution
      batchSize?: number
    } = {}
  ): Promise<string> {
    const jobId = this.generateJobId()
    const job: SyncJob = {
      id: jobId,
      userIntegrationId: userIntegration.id,
      operation: 'full_sync',
      status: 'pending',
      startedAt: new Date(),
      conflicts: [],
      errors: []
    }

    this.activeJobs.set(jobId, job)

    // Execute sync in background
    this.executeSyncJob(job, userIntegration, options)

    return jobId
  }

  /**
   * Start incremental synchronization (based on last sync timestamp)
   */
  async startIncrementalSync(
    userIntegration: UserIntegration,
    options: {
      syncTasks?: boolean
      syncEvents?: boolean
      conflictResolution?: ConflictResolution
      batchSize?: number
    } = {}
  ): Promise<string> {
    const jobId = this.generateJobId()
    const job: SyncJob = {
      id: jobId,
      userIntegrationId: userIntegration.id,
      operation: 'incremental_sync',
      status: 'pending',
      startedAt: new Date(),
      conflicts: [],
      errors: []
    }

    this.activeJobs.set(jobId, job)

    // Execute sync in background
    this.executeSyncJob(job, userIntegration, options)

    return jobId
  }

  /**
   * Start task-only synchronization
   */
  async startTaskSync(
    userIntegration: UserIntegration,
    options: {
      conflictResolution?: ConflictResolution
      batchSize?: number
      taskIds?: string[]
    } = {}
  ): Promise<string> {
    const jobId = this.generateJobId()
    const job: SyncJob = {
      id: jobId,
      userIntegrationId: userIntegration.id,
      operation: 'task_sync',
      status: 'pending',
      startedAt: new Date(),
      conflicts: [],
      errors: []
    }

    this.activeJobs.set(jobId, job)

    // Execute task sync in background
    this.executeTaskSyncJob(job, userIntegration, options)

    return jobId
  }

  /**
   * Start event-only synchronization
   */
  async startEventSync(
    userIntegration: UserIntegration,
    options: {
      conflictResolution?: ConflictResolution
      batchSize?: number
      eventIds?: string[]
    } = {}
  ): Promise<string> {
    const jobId = this.generateJobId()
    const job: SyncJob = {
      id: jobId,
      userIntegrationId: userIntegration.id,
      operation: 'event_sync',
      status: 'pending',
      startedAt: new Date(),
      conflicts: [],
      errors: []
    }

    this.activeJobs.set(jobId, job)

    // Execute event sync in background
    this.executeEventSyncJob(job, userIntegration, options)

    return jobId
  }

  /**
   * Get sync job status
   */
  getJobStatus(jobId: string): SyncJob | null {
    return this.activeJobs.get(jobId) || null
  }

  /**
   * Cancel a running sync job
   */
  cancelJob(jobId: string): boolean {
    const job = this.activeJobs.get(jobId)
    if (job && job.status === 'running') {
      job.status = 'cancelled'
      job.completedAt = new Date()
      return true
    }
    return false
  }

  /**
   * Get all active jobs for a user integration
   */
  getActiveJobsForIntegration(userIntegrationId: string): SyncJob[] {
    return Array.from(this.activeJobs.values()).filter(job => 
      job.userIntegrationId === userIntegrationId && 
      (job.status === 'pending' || job.status === 'running')
    )
  }

  /**
   * Apply conflict resolution
   */
  async applyConflictResolution(
    resolution: ConflictResolutionRequest
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the job and conflict details
      const job = this.findJobByConflict(resolution.conflictId)
      if (!job) {
        return { success: false, error: 'Sync job not found' }
      }

      // Get the items being resolved
      const dayflowItem = await this.getDayFlowItem(resolution.dayflowItemId)
      const externalItem = await this.getExternalItem(resolution.externalItemId)

      if (!dayflowItem || !externalItem) {
        return { success: false, error: 'Items not found' }
      }

      // Apply resolution based on choice
      switch (resolution.resolution) {
        case 'keep_dayflow':
          await this.keepDayFlowItem(dayflowItem, externalItem)
          break
        case 'keep_external':
          await this.keepExternalItem(dayflowItem, externalItem)
          break
        case 'merge':
          await this.mergeItems(dayflowItem, externalItem, resolution.mergedData)
          break
        case 'manual':
          await this.applyManualResolution(dayflowItem, externalItem, resolution.mergedData)
          break
      }

      // Remove conflict from job
      job.conflicts = job.conflicts.filter(c => c !== undefined)

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Get conflict summary for a job
   */
  getConflictSummary(jobId: string): {
    total: number
    taskConflicts: number
    eventConflicts: number
    unresolved: number
  } {
    const job = this.activeJobs.get(jobId)
    if (!job) {
      return { total: 0, taskConflicts: 0, eventConflicts: 0, unresolved: 0 }
    }

    const taskConflicts = job.conflicts.filter(c => 
      'status' in c.dayflowItem // Task conflicts have status
    ).length

    const eventConflicts = job.conflicts.filter(c => 
      'startTime' in c.dayflowItem // Event conflicts have startTime
    ).length

    return {
      total: job.conflicts.length,
      taskConflicts,
      eventConflicts,
      unresolved: job.conflicts.length
    }
  }

  // Private methods

  private async executeSyncJob(
    job: SyncJob,
    userIntegration: UserIntegration,
    options: any
  ): Promise<void> {
    job.status = 'running'

    try {
      const integration = await this.createIntegration(userIntegration)
      
      // Determine sync scope
      const shouldSyncTasks = options.syncTasks !== false && (userIntegration.syncSettings?.syncTasks ?? true)
      const shouldSyncEvents = options.syncEvents !== false && (userIntegration.syncSettings?.syncEvents ?? true)

      // Create sync result
      const result: SyncResult = {
        operationId: job.id,
        status: 'success',
        itemsProcessed: 0,
        itemsCreated: 0,
        itemsUpdated: 0,
        itemsDeleted: 0,
        conflicts: [],
        errors: [],
        startedAt: job.startedAt,
        completedAt: new Date()
      }

      // Sync tasks if applicable
      if (shouldSyncTasks) {
        const taskResult = await this.syncTasks(integration, userIntegration, options)
        this.mergeSyncResult(result, taskResult)
      }

      // Sync events if applicable
      if (shouldSyncEvents) {
        const eventResult = await this.syncEvents(integration, userIntegration, options)
        this.mergeSyncResult(result, eventResult)
      }

      // Apply conflict resolution if configured
      if (userIntegration.syncSettings?.conflictResolution && userIntegration.syncSettings.conflictResolution !== 'manual') {
        await this.applyAutoConflictResolution(job, result, userIntegration.syncSettings.conflictResolution)
      }

      job.result = result
      job.status = 'completed'
      job.completedAt = new Date()

      // Update last sync timestamp
      await this.updateLastSyncTimestamp(userIntegration.id)

    } catch (error) {
      job.status = 'failed'
      job.completedAt = new Date()
      job.errors.push(error)
      console.error(`Sync job ${job.id} failed:`, error)
    }
  }

  private async executeTaskSyncJob(
    job: SyncJob,
    userIntegration: UserIntegration,
    options: any
  ): Promise<void> {
    job.status = 'running'

    try {
      const integration = await this.createIntegration(userIntegration)
      const result = await this.syncTasks(integration, userIntegration, options)
      
      if (userIntegration.syncSettings?.conflictResolution && userIntegration.syncSettings.conflictResolution !== 'manual') {
        await this.applyAutoConflictResolution(job, result, userIntegration.syncSettings.conflictResolution)
      }

      job.result = result
      job.status = 'completed'
      job.completedAt = new Date()

      await this.updateLastSyncTimestamp(userIntegration.id)

    } catch (error) {
      job.status = 'failed'
      job.completedAt = new Date()
      job.errors.push(error)
      console.error(`Task sync job ${job.id} failed:`, error)
    }
  }

  private async executeEventSyncJob(
    job: SyncJob,
    userIntegration: UserIntegration,
    options: any
  ): Promise<void> {
    job.status = 'running'

    try {
      const integration = await this.createIntegration(userIntegration)
      const result = await this.syncEvents(integration, userIntegration, options)
      
      if (userIntegration.syncSettings?.conflictResolution && userIntegration.syncSettings.conflictResolution !== 'manual') {
        await this.applyAutoConflictResolution(job, result, userIntegration.syncSettings.conflictResolution)
      }

      job.result = result
      job.status = 'completed'
      job.completedAt = new Date()

      await this.updateLastSyncTimestamp(userIntegration.id)

    } catch (error) {
      job.status = 'failed'
      job.completedAt = new Date()
      job.errors.push(error)
      console.error(`Event sync job ${job.id} failed:`, error)
    }
  }

  private async syncTasks(
    integration: BaseIntegration,
    userIntegration: UserIntegration,
    options: any
  ): Promise<SyncResult> {
    // Get external tasks
    const externalTasks = await this.fetchExternalTasks(integration)
    
    const result: SyncResult = {
      operationId: `tasks-${Date.now()}`,
      status: 'success',
      itemsProcessed: externalTasks.length,
      itemsCreated: 0,
      itemsUpdated: 0,
      itemsDeleted: 0,
      conflicts: [],
      errors: [],
      startedAt: new Date(),
      completedAt: new Date()
    }

    for (const externalTask of externalTasks) {
      try {
        // Check for existing DayFlow task
        const dayflowTask = await this.findMatchingDayFlowTask(externalTask, userIntegration)
        
        if (dayflowTask) {
          // Check for conflicts
          const conflictDetection = ConflictDetector.detectTaskConflicts(dayflowTask, externalTask)
          
          if (conflictDetection.conflicts.length > 0) {
            const conflict: SyncConflict = {
              type: conflictDetection.conflicts[0] as any,
              dayflowItem: dayflowTask,
              externalItem: externalTask,
              conflict: conflictDetection
            }
            
            result.conflicts.push(conflict)
          } else {
            // No conflicts, check if update needed
            if (this.isUpdateNeeded(dayflowTask, externalTask)) {
              const updatedTask = await this.updateDayFlowTask(dayflowTask, externalTask, userIntegration)
              if (updatedTask) {
                result.itemsUpdated++
              }
            }
          }
        } else {
          // New task, create it
          const newTask = await this.createDayFlowTask(externalTask, userIntegration)
          if (newTask) {
            result.itemsCreated++
            await this.trackExternalItem(userIntegration.id, externalTask.id, 'task', newTask.id)
          }
        }
      } catch (error) {
        result.errors.push({
          type: 'api_error' as const,
          message: error instanceof Error ? error.message : 'Unknown error',
          item: externalTask
        })
      }
    }

    return result
  }

  private async syncEvents(
    integration: BaseIntegration,
    userIntegration: UserIntegration,
    options: any
  ): Promise<SyncResult> {
    // Get external events
    const externalEvents = await this.fetchExternalEvents(integration)
    
    const result: SyncResult = {
      operationId: `events-${Date.now()}`,
      status: 'success',
      itemsProcessed: externalEvents.length,
      itemsCreated: 0,
      itemsUpdated: 0,
      itemsDeleted: 0,
      conflicts: [],
      errors: [],
      startedAt: new Date(),
      completedAt: new Date()
    }

    for (const externalEvent of externalEvents) {
      try {
        // Check for existing DayFlow event
        const dayflowEvent = await this.findMatchingDayFlowEvent(externalEvent, userIntegration)
        
        if (dayflowEvent) {
          // Check for conflicts
          const conflictDetection = ConflictDetector.detectEventConflicts(dayflowEvent, externalEvent)
          
          if (conflictDetection.conflicts.length > 0) {
            const conflict: SyncConflict = {
              type: conflictDetection.conflicts[0] as any,
              dayflowItem: dayflowEvent,
              externalItem: externalEvent,
              conflict: conflictDetection
            }
            
            result.conflicts.push(conflict)
          } else {
            // No conflicts, check if update needed
            if (this.isUpdateNeeded(dayflowEvent, externalEvent)) {
              const updatedEvent = await this.updateDayFlowEvent(dayflowEvent, externalEvent, userIntegration)
              if (updatedEvent) {
                result.itemsUpdated++
              }
            }
          }
        } else {
          // New event, create it
          const newEvent = await this.createDayFlowEvent(externalEvent, userIntegration)
          if (newEvent) {
            result.itemsCreated++
            await this.trackExternalItem(userIntegration.id, externalEvent.id, 'event', newEvent.id)
          }
        }
      } catch (error) {
        result.errors.push({
          type: 'api_error' as const,
          message: error instanceof Error ? error.message : 'Unknown error',
          item: externalEvent
        })
      }
    }

    return result
  }

  private async fetchExternalTasks(integration: BaseIntegration): Promise<ExternalTask[]> {
    // This would be implemented based on the service
    // For now, return empty array
    return []
  }

  private async fetchExternalEvents(integration: BaseIntegration): Promise<ExternalEvent[]> {
    // This would be implemented based on the service
    // For now, return empty array
    return []
  }

  private async createIntegration(userIntegration: UserIntegration): Promise<BaseIntegration> {
    const factory = this.integrationFactories.get(userIntegration.serviceName)
    if (!factory) {
      throw new Error(`Unsupported integration service: ${userIntegration.serviceName}`)
    }

    const integration = factory()
    await integration.authenticate(
      userIntegration.accessToken!,
      userIntegration.refreshToken,
      userIntegration.tokenExpiresAt || undefined
    )

    return integration
  }

  private async findMatchingDayFlowTask(
    externalTask: ExternalTask,
    userIntegration: UserIntegration
  ): Promise<Task | null> {
    // Search by external ID first
    const existing = await db.query.externalItems.findFirst({
      where: and(
        eq(externalItems.externalId, externalTask.id),
        eq(externalItems.externalService, userIntegration.serviceName),
        eq(externalItems.userIntegrationId, userIntegration.id)
      )
    })

    if (existing?.itemId) {
      return taskRepository.findById(existing.itemId)
    }

    // Fallback to fuzzy matching
    const tasks = await taskRepository.findByUserId(userIntegration.userId)
    return tasks.find(task => {
      const similarity = this.calculateTitleSimilarity(task.title, externalTask.title)
      return similarity > 0.8
    }) || null
  }

  private async findMatchingDayFlowEvent(
    externalEvent: ExternalEvent,
    userIntegration: UserIntegration
  ): Promise<CalendarEvent | null> {
    // Search by external ID first
    const existing = await db.query.externalItems.findFirst({
      where: and(
        eq(externalItems.externalId, externalEvent.id),
        eq(externalItems.externalService, userIntegration.serviceName),
        eq(externalItems.userIntegrationId, userIntegration.id)
      )
    })

    if (existing?.itemId) {
      return calendarEventRepository.findById(existing.itemId)
    }

    // Fallback to fuzzy matching
    const events = await calendarEventRepository.findByUserId(userIntegration.userId)
    return events.find(event => {
      const similarity = this.calculateTitleSimilarity(event.title, externalEvent.title)
      const timeOverlap = this.hasTimeOverlap(event, externalEvent)
      return similarity > 0.8 && timeOverlap
    }) || null
  }

  private async createDayFlowTask(
    externalTask: ExternalTask,
    userIntegration: UserIntegration
  ): Promise<Task | null> {
    const taskData = DataTransformer.externalTaskToTask(externalTask, userIntegration.userId)
    return taskRepository.create({
      ...taskData,
      createdAt: new Date(),
      updatedAt: new Date()
    } as any)
  }

  private async createDayFlowEvent(
    externalEvent: ExternalEvent,
    userIntegration: UserIntegration
  ): Promise<CalendarEvent | null> {
    const eventData = DataTransformer.externalEventToEvent(externalEvent, userIntegration.userId)
    return calendarEventRepository.create({
      ...eventData,
      createdAt: new Date(),
      updatedAt: new Date()
    } as any)
  }

  private async updateDayFlowTask(
    dayflowTask: Task,
    externalTask: ExternalTask,
    userIntegration: UserIntegration
  ): Promise<Task | null> {
    const taskData = DataTransformer.externalTaskToTask(externalTask, dayflowTask.userId)
    return taskRepository.update(dayflowTask.id, {
      ...taskData,
      updatedAt: new Date()
    } as any)
  }

  private async updateDayFlowEvent(
    dayflowEvent: CalendarEvent,
    externalEvent: ExternalEvent,
    userIntegration: UserIntegration
  ): Promise<CalendarEvent | null> {
    const eventData = DataTransformer.externalEventToEvent(externalEvent, dayflowEvent.userId)
    return calendarEventRepository.update(dayflowEvent.id, {
      ...eventData,
      updatedAt: new Date()
    } as any)
  }

  private isUpdateNeeded(dayflowItem: Task | CalendarEvent, externalItem: ExternalTask | ExternalEvent): boolean {
    // Check if the external item is newer
    const dayflowUpdated = dayflowItem.updatedAt.getTime()
    const externalUpdated = externalItem.updatedAt?.getTime() || 0
    
    return externalUpdated > dayflowUpdated
  }

  private calculateTitleSimilarity(title1: string, title2: string): number {
    if (!title1 || !title2) return 0
    
    const longer = title1.length > title2.length ? title1 : title2
    const shorter = title1.length > title2.length ? title2 : title1
    
    if (longer.length === 0) return 1.0
    
    const distance = this.levenshteinDistance(longer, shorter)
    return (longer.length - distance) / longer.length
  }

  private levenshteinDistance(str1: string, str2: string): number {
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

  private hasTimeOverlap(event1: CalendarEvent, event2: ExternalEvent): boolean {
    return (
      event1.startTime <= event2.endTime &&
      event1.endTime >= event2.startTime
    )
  }

  private async applyAutoConflictResolution(
    job: SyncJob,
    result: SyncResult,
    strategy: ConflictResolution
  ): Promise<void> {
    for (const conflict of result.conflicts) {
      switch (strategy) {
        case 'latest':
          const latestItem = (conflict.dayflowItem.updatedAt.getTime() >= (conflict.externalItem.updatedAt?.getTime() || 0))
            ? conflict.dayflowItem
            : conflict.externalItem
          await this.applyResolution(job, conflict, latestItem === conflict.dayflowItem ? 'keep_dayflow' : 'keep_external')
          break
        case 'source':
          await this.applyResolution(job, conflict, 'keep_external')
          break
        case 'merge':
          // Simple merge strategy - combine fields
          await this.mergeItems(conflict.dayflowItem, conflict.externalItem, {})
          break
      }
    }
  }

  private async applyResolution(
    job: SyncJob,
    conflict: SyncConflict,
    resolution: 'keep_dayflow' | 'keep_external' | 'merge' | 'manual'
  ): Promise<void> {
    switch (resolution) {
      case 'keep_dayflow':
        // Keep existing DayFlow item, ignore external changes
        break
      case 'keep_external':
        // Update DayFlow item with external data
        if ('status' in conflict.dayflowItem) {
          await this.updateDayFlowTask(conflict.dayflowItem as Task, conflict.externalItem as ExternalTask, {} as UserIntegration)
        } else {
          await this.updateDayFlowEvent(conflict.dayflowItem as CalendarEvent, conflict.externalItem as ExternalEvent, {} as UserIntegration)
        }
        break
      case 'merge':
        // Apply merge logic
        break
      case 'manual':
        // Leave for manual resolution
        return
    }

    // Remove from conflicts array
    const index = job.conflicts.indexOf(conflict)
    if (index > -1) {
      job.conflicts.splice(index, 1)
    }
  }

  private async trackExternalItem(
    userIntegrationId: string,
    externalId: string,
    itemType: 'task' | 'event',
    itemId: string
  ): Promise<void> {
    await db.insert(externalItems).values({
      userIntegrationId,
      externalId,
      externalService: '', // Would be determined from user integration
      itemType,
      itemId,
      externalData: {},
      lastSyncAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  private async updateLastSyncTimestamp(userIntegrationId: string): Promise<void> {
    await db.update(userIntegrations)
      .set({ lastSyncAt: new Date(), syncStatus: 'idle' })
      .where(eq(userIntegrations.id, userIntegrationId))
  }

  private generateJobId(): string {
    return `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private mergeSyncResult(result: SyncResult, newResult: SyncResult): void {
    result.itemsProcessed += newResult.itemsProcessed
    result.itemsCreated += newResult.itemsCreated
    result.itemsUpdated += newResult.itemsUpdated
    result.itemsDeleted += newResult.itemsDeleted
    result.conflicts.push(...newResult.conflicts)
    result.errors.push(...newResult.errors)
  }

  private findJobByConflict(conflictId: string): SyncJob | null {
    for (const job of this.activeJobs.values()) {
      if (job.conflicts.some(c => c === undefined)) {
        return job
      }
    }
    return null
  }

  private async getDayFlowItem(itemId: string): Promise<Task | CalendarEvent | null> {
    // Try as task first, then as event
    const task = await taskRepository.findById(itemId)
    if (task) return task
    
    return calendarEventRepository.findById(itemId)
  }

  private async getExternalItem(itemId: string): Promise<ExternalTask | ExternalEvent | null> {
    // This would fetch from the external item tracking
    return null
  }

  private async keepDayFlowItem(dayflowItem: any, externalItem: any): Promise<void> {
    // Keep existing DayFlow item, update tracking
    await this.updateExternalItemTracking(dayflowItem.id, externalItem.id)
  }

  private async keepExternalItem(dayflowItem: any, externalItem: any): Promise<void> {
    // Update DayFlow item with external data
    if ('status' in dayflowItem) {
      await this.updateDayFlowTask(dayflowItem, externalItem, {} as UserIntegration)
    } else {
      await this.updateDayFlowEvent(dayflowItem, externalItem, {} as UserIntegration)
    }
  }

  private async mergeItems(dayflowItem: any, externalItem: any, mergedData: any): Promise<void> {
    // Simple merge - prefer external data for conflicts
    const merged = { ...dayflowItem, ...externalItem, ...mergedData }
    
    if ('status' in dayflowItem) {
      await this.updateDayFlowTask(dayflowItem, externalItem, {} as UserIntegration)
    } else {
      await this.updateDayFlowEvent(dayflowItem, externalItem, {} as UserIntegration)
    }
  }

  private async applyManualResolution(dayflowItem: any, externalItem: any, manualData: any): Promise<void> {
    // Apply manually resolved data
    const resolved = { ...dayflowItem, ...manualData }
    
    if ('status' in dayflowItem) {
      await taskRepository.update(dayflowItem.id, resolved as any)
    } else {
      await calendarEventRepository.update(dayflowItem.id, resolved as any)
    }
  }

  private async updateExternalItemTracking(dayflowId: string, externalId: string): Promise<void> {
    // Update tracking to prefer DayFlow item
    await db.update(externalItems)
      .set({ lastSyncAt: new Date() })
      .where(eq(externalItems.itemId, dayflowId))
  }
}

// Export singleton instance
export const syncEngine = new SyncEngine()

// Helper functions
export async function startFullSync(
  userIntegration: UserIntegration,
  options?: any
): Promise<string> {
  return syncEngine.startFullSync(userIntegration, options)
}

export async function startIncrementalSync(
  userIntegration: UserIntegration,
  options?: any
): Promise<string> {
  return syncEngine.startIncrementalSync(userIntegration, options)
}

export function getSyncJobStatus(jobId: string): SyncJob | null {
  return syncEngine.getJobStatus(jobId)
}