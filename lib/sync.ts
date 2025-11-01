import { EventEmitter } from 'node:events'
import { db } from './db'
import {
  userRepository,
  taskRepository,
  calendarEventRepository,
  categoryRepository,
  tagRepository,
  DatabaseError,
  NotFoundError,
} from './data-access'
import { useEnhancedCalendarStore } from '@/stores/enhancedStore'
import type {
  SyncStatus,
  SyncOptions,
  SyncResult,
  DatabaseTask,
  DatabaseCalendarEvent,
  DatabaseCategory,
  DatabaseTag,
} from '@/types/database'

// Real-time synchronization service
export class SyncService extends EventEmitter {
  private syncInterval: NodeJS.Timeout | null = null
  private isOnline = true
  private lastSync: Date | null = null
  private pendingChanges: Map<string, any> = new Map()
  private syncQueue: Array<() => Promise<void>> = []
  private isProcessing = false

  constructor() {
    super()
    this.setupEventListeners()
  }
  
  private setupEventListeners() {
    // Online/offline detection
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true
        this.emit('online')
      })

      window.addEventListener('offline', () => {
        this.isOnline = false
        this.emit('offline')
        this.pauseSync()
      })
    }
  }

  // Start synchronization
  async startSync(userId: string, options: SyncOptions = {}): Promise<SyncResult> {
    const startTime = Date.now()
    const errors: string[] = []
    const conflicts: string[] = []
    let syncedItems = 0

    try {
      this.emit('sync_start')

      // Initial sync
      const result = await this.syncWithDatabase(userId, options)
      syncedItems += result.syncedItems

      // Start periodic sync
      this.startPeriodicSync(userId, options)

      return {
        success: true,
        errors,
        conflicts,
        syncedItems,
        duration: Date.now() - startTime,
      }
    } catch (error: any) {
      errors.push(error.message)
      return {
        success: false,
        errors,
        conflicts,
        syncedItems,
        duration: Date.now() - startTime,
      }
    } finally {
      this.emit('sync_complete')
    }
  }

  // Stop synchronization
  stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
    this.emit('sync_stopped')
  }

  // Pause synchronization when offline
  private pauseSync(): void {
    this.emit('sync_paused')
  }

  // Start periodic synchronization
  private startPeriodicSync(userId: string, options: SyncOptions): void {
    const interval = options.timeout || 30000 // 30 seconds default
    
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isProcessing) {
        this.processSyncQueue(userId, options)
      }
    }, interval)
  }

  // Sync with database
  private async syncWithDatabase(userId: string, options: SyncOptions = {}): Promise<{
    syncedItems: number
  }> {
    let syncedItems = 0

    try {
      // Sync tasks
      const tasks = await taskRepository.findByUserId(userId)
      syncedItems += tasks.length

      // Sync events
      const events = await calendarEventRepository.findByUserId(userId)
      syncedItems += events.length

      // Sync categories
      const categories = await categoryRepository.findByUserId(userId)
      syncedItems += categories.length

      // Sync tags
      const tags = await tagRepository.findByUserId(userId)
      syncedItems += tags.length

      // Update local state
      useEnhancedCalendarStore.setState({
        tasks: tasks as any,
        events: events as any,
        categories: categories as any,
        tags: tags as any,
        lastSync: new Date(),
      })

      this.lastSync = new Date()
      this.emit('sync_success', { syncedItems })

      return { syncedItems }
    } catch (error: any) {
      this.emit('sync_error', error)
      throw new DatabaseError(`Sync failed: ${error.message}`)
    }
  }

  // Process sync queue
  private async processSyncQueue(userId: string, options: SyncOptions): Promise<void> {
    if (this.isProcessing || this.syncQueue.length === 0) return

    this.isProcessing = true

    try {
      while (this.syncQueue.length > 0) {
        const task = this.syncQueue.shift()
        if (task) {
          await task()
        }
      }
    } finally {
      this.isProcessing = false
    }
  }

  // Queue a sync operation
  private queueSync(task: () => Promise<void>): void {
    this.syncQueue.push(task)
  }

  // Add task to sync queue
  async addTaskToSync(taskData: DatabaseTask, userId: string): Promise<void> {
    const syncTask = async () => {
      try {
        await taskRepository.create(taskData)
        this.emit('task_synced', { taskId: taskData.id })
      } catch (error: any) {
        this.emit('sync_error', { operation: 'create_task', error: error.message })
      }
    }

    this.queueSync(syncTask)
    this.emit('task_added_to_sync', { taskId: taskData.id })
  }

  // Add event to sync queue
  async addEventToSync(eventData: DatabaseCalendarEvent, userId: string): Promise<void> {
    const syncTask = async () => {
      try {
        await calendarEventRepository.create(eventData)
        this.emit('event_synced', { eventId: eventData.id })
      } catch (error: any) {
        this.emit('sync_error', { operation: 'create_event', error: error.message })
      }
    }

    this.queueSync(syncTask)
    this.emit('event_added_to_sync', { eventId: eventData.id })
  }

  // Update task and sync
  async updateTaskAndSync(taskId: string, updates: Partial<DatabaseTask>): Promise<void> {
    const syncTask = async () => {
      try {
        await taskRepository.update(taskId, updates)
        this.emit('task_synced', { taskId })
      } catch (error: any) {
        this.emit('sync_error', { operation: 'update_task', taskId, error: error.message })
      }
    }

    this.queueSync(syncTask)
    this.emit('task_updated', { taskId })
  }

  // Update event and sync
  async updateEventAndSync(eventId: string, updates: Partial<DatabaseCalendarEvent>): Promise<void> {
    const syncTask = async () => {
      try {
        await calendarEventRepository.update(eventId, updates)
        this.emit('event_synced', { eventId })
      } catch (error: any) {
        this.emit('sync_error', { operation: 'update_event', eventId, error: error.message })
      }
    }

    this.queueSync(syncTask)
    this.emit('event_updated', { eventId })
  }

  // Delete task and sync
  async deleteTaskAndSync(taskId: string): Promise<void> {
    const syncTask = async () => {
      try {
        await taskRepository.delete(taskId)
        this.emit('task_synced', { taskId })
      } catch (error: any) {
        this.emit('sync_error', { operation: 'delete_task', taskId, error: error.message })
      }
    }

    this.queueSync(syncTask)
    this.emit('task_deleted', { taskId })
  }

  // Delete event and sync
  async deleteEventAndSync(eventId: string): Promise<void> {
    const syncTask = async () => {
      try {
        await calendarEventRepository.delete(eventId)
        this.emit('event_synced', { eventId })
      } catch (error: any) {
        this.emit('sync_error', { operation: 'delete_event', eventId, error: error.message })
      }
    }

    this.queueSync(syncTask)
    this.emit('event_deleted', { eventId })
  }

  // Force sync all pending changes
  async forceSync(userId: string): Promise<SyncResult> {
    const startTime = Date.now()
    const errors: string[] = []
    const conflicts: string[] = []
    let syncedItems = 0

    try {
      this.emit('force_sync_start')

      // Process all queued sync operations
      await this.processSyncQueue(userId, {})

      // Perform full sync
      const result = await this.syncWithDatabase(userId, {})
      syncedItems += result.syncedItems

      return {
        success: true,
        errors,
        conflicts,
        syncedItems,
        duration: Date.now() - startTime,
      }
    } catch (error: any) {
      errors.push(error.message)
      return {
        success: false,
        errors,
        conflicts,
        syncedItems,
        duration: Date.now() - startTime,
      }
    } finally {
      this.emit('force_sync_complete')
    }
  }

  // Get current sync status
  getSyncStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isProcessing,
      lastSync: this.lastSync,
      pendingChanges: this.syncQueue.length,
      conflicts: [],
      errors: [],
    }
  }

  // Clear all pending changes
  clearPendingChanges(): void {
    this.syncQueue = []
    this.pendingChanges.clear()
    this.emit('pending_changes_cleared')
  }

  // Cleanup
  destroy(): void {
    this.stopSync()
    this.removeAllListeners()
  }
}

// Optimistic update manager
export class OptimisticUpdateManager {
  private updates: Map<string, {
    type: 'create' | 'update' | 'delete'
    entity: 'task' | 'event'
    data: any
    timestamp: number
    rollbackData?: any
  }> = new Map()

  // Execute optimistic update
  async executeUpdate(
    id: string,
    type: 'create' | 'update' | 'delete',
    entity: 'task' | 'event',
    data: any,
    rollbackData?: any
  ): Promise<void> {
    this.updates.set(id, {
      type,
      entity,
      data,
      timestamp: Date.now(),
      rollbackData,
    })

    // Execute the update optimistically
    await this.applyOptimisticUpdate(id, type, entity, data)
  }

  // Rollback optimistic update
  async rollbackUpdate(id: string): Promise<void> {
    const update = this.updates.get(id)
    if (!update) return

    await this.rollbackOptimisticUpdate(id, update)
    this.updates.delete(id)
  }

  // Apply optimistic update to local state
  private async applyOptimisticUpdate(
    id: string,
    type: 'create' | 'update' | 'delete',
    entity: 'task' | 'event',
    data: any
  ): Promise<void> {
    const store = useEnhancedCalendarStore.getState()

    switch (type) {
      case 'create':
        if (entity === 'task') {
          store.addTask(data)
        } else {
          store.addEvent(data)
        }
        break

      case 'update':
        if (entity === 'task') {
          store.updateTask(id, data)
        } else {
          store.updateEvent(id, data)
        }
        break

      case 'delete':
        if (entity === 'task') {
          store.deleteTask(id)
        } else {
          store.deleteEvent(id)
        }
        break
    }
  }

  // Rollback optimistic update
  private async rollbackOptimisticUpdate(
    id: string,
    update: any
  ): Promise<void> {
    const store = useEnhancedCalendarStore.getState()

    switch (update.type) {
      case 'create':
        if (update.entity === 'task') {
          store.deleteTask(id)
        } else {
          store.deleteEvent(id)
        }
        break

      case 'delete':
        if (update.entity === 'task' && update.rollbackData) {
          store.addTask(update.rollbackData)
        } else if (update.entity === 'event' && update.rollbackData) {
          store.addEvent(update.rollbackData)
        }
        break

      case 'update':
        if (update.entity === 'task' && update.rollbackData) {
          store.updateTask(id, update.rollbackData)
        } else if (update.entity === 'event' && update.rollbackData) {
          store.updateEvent(id, update.rollbackData)
        }
        break
    }
  }

  // Get all pending updates
  getPendingUpdates(): Map<string, any> {
    return new Map(this.updates)
  }

  // Clear all pending updates
  clearPendingUpdates(): void {
    this.updates.clear()
  }

  // Retry all failed updates
  async retryFailedUpdates(syncService: SyncService, userId: string): Promise<void> {
    for (const [id, update] of this.updates) {
      try {
        switch (update.type) {
          case 'create':
            if (update.entity === 'task') {
              await syncService.addTaskToSync(update.data, userId)
            } else {
              await syncService.addEventToSync(update.data, userId)
            }
            break

          case 'update':
            if (update.entity === 'task') {
              await syncService.updateTaskAndSync(id, update.data)
            } else {
              await syncService.updateEventAndSync(id, update.data)
            }
            break

          case 'delete':
            if (update.entity === 'task') {
              await syncService.deleteTaskAndSync(id)
            } else {
              await syncService.deleteEventAndSync(id)
            }
            break
        }
      } catch (error) {
        // Keep failed update for later retry
        console.error(`Failed to retry update ${id}:`, error)
      }
    }
  }
}

// Conflict resolution service
export class ConflictResolutionService {
  // Resolve conflicts based on strategy
  async resolveConflicts(
    conflicts: Array<{
      type: 'task' | 'event'
      id: string
      localData: any
      remoteData: any
    }>,
    strategy: 'client' | 'server' | 'manual' = 'client'
  ): Promise<Array<{
    id: string
    type: 'task' | 'event'
    resolvedData: any
    strategy: string
  }>> {
    const resolved: Array<{
      id: string
      type: 'task' | 'event'
      resolvedData: any
      strategy: string
    }> = []

    for (const conflict of conflicts) {
      let resolvedData: any

      switch (strategy) {
        case 'client':
          resolvedData = conflict.localData
          break

        case 'server':
          resolvedData = conflict.remoteData
          break

        case 'manual':
          // This would require user input
          resolvedData = conflict.localData // Default to client
          break

        default:
          resolvedData = conflict.localData
      }

      resolved.push({
        id: conflict.id,
        type: conflict.type,
        resolvedData,
        strategy,
      })
    }

    return resolved
  }

  // Merge data intelligently
  mergeData(localData: any, remoteData: any): any {
    const merged = { ...localData }

    for (const [key, remoteValue] of Object.entries(remoteData)) {
      const localValue = merged[key]

      if (localValue === undefined) {
        merged[key] = remoteValue
      } else if (localValue instanceof Date && remoteValue instanceof Date) {
        // Keep the most recent timestamp
        merged[key] = remoteValue > localValue ? remoteValue : localValue
      } else if (typeof localValue === 'string' && typeof remoteValue === 'string') {
        // For strings, prefer the one with more recent update
        if (remoteData.updatedAt > localData.updatedAt) {
          merged[key] = remoteValue
        }
      }
    }

    return merged
  }
}

// Create instances
export const syncService = new SyncService()
export const optimisticUpdateManager = new OptimisticUpdateManager()
export const conflictResolutionService = new ConflictResolutionService()

// Hook for React components
export const useSync = () => {
  const syncStatus = syncService.getSyncStatus()
  
  const startSync = async (userId: string, options?: SyncOptions) => {
    return await syncService.startSync(userId, options)
  }

  const stopSync = () => {
    syncService.stopSync()
  }

  const forceSync = async (userId: string) => {
    return await syncService.forceSync(userId)
  }

  return {
    syncStatus,
    startSync,
    stopSync,
    forceSync,
  }
}

// Auto-initialize sync service
if (typeof window !== 'undefined') {
  // Set up event listeners for debugging
  syncService.on('sync_start', () => {
    console.log('🔄 Sync started')
  })

  syncService.on('sync_complete', () => {
    console.log('✅ Sync completed')
  })

  syncService.on('sync_error', (error) => {
    console.error('❌ Sync error:', error)
  })
}

export default syncService