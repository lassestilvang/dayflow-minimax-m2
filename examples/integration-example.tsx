// @ts-nocheck
// Integration Example: Complete DayFlow State Management Implementation
// This example shows how to use the enhanced state management system

import React, { useEffect, useState } from 'react'
import { useEnhancedCalendarStore } from '@/stores/enhancedStore'
import { useSync } from '@/lib/sync'
import { 
  taskRepository, 
  calendarEventRepository,
  DatabaseError,
  ValidationError 
} from '@/lib/data-access'

// Example component showing full integration
export function DayFlowDashboard() {
  const {
    tasks,
    events,
    categories,
    tags,
    isLoading,
    isSyncing,
    error,
    lastSync,
    addTask,
    addEvent,
    updateTask,
    updateEvent,
    deleteTask,
    deleteEvent,
    searchEvents,
    filterEvents,
    syncWithDatabase,
    exportData,
    importData,
  } = useEnhancedCalendarStore()

  const { startSync, syncStatus } = useSync()
  const [userId] = useState('user-123') // In real app, get from auth context

  // Initialize synchronization
  useEffect(() => {
    const initializeSync = async () => {
      try {
        await startSync(userId, {
          timeout: 30000,
          batchSize: 50,
          retryAttempts: 3,
        })
      } catch (error) {
        console.error('Failed to start sync:', error)
      }
    }

    initializeSync()
  }, [userId, startSync])

  // Example: Add a new task with optimistic updates
  const handleAddTask = async () => {
    const taskData = {
      title: 'Review pull requests',
      description: 'Review pending PRs from the team',
      priority: 'high' as const,
      status: 'pending' as const,
      dueDate: new Date('2024-01-15'),
      userId,
    }

    const success = await addTask(taskData)
    
    if (!success) {
      // Error is already handled with rollback in the store
      console.error('Failed to add task')
    }
  }

  // Example: Add a new event with conflict detection
  const handleAddEvent = async () => {
    const eventData = {
      title: 'Team Standup',
      description: 'Daily team synchronization',
      startTime: new Date('2024-01-02T09:00:00Z'),
      endTime: new Date('2024-01-02T09:30:00Z'),
      isAllDay: false,
      location: 'Conference Room A',
      userId,
    }

    const success = await addEvent(eventData)
    
    if (!success) {
      console.error('Failed to add event')
    }
  }

  // Example: Bulk operations
  const handleBulkCompleteTasks = async () => {
    const pendingTasks = tasks.filter(task => task.status === 'pending')
    const taskIds = pendingTasks.map(task => task.id)

    try {
      // Update locally first (optimistic)
      for (const taskId of taskIds) {
        await updateTask(taskId, {
          status: 'completed',
          completedAt: new Date(),
          progress: 100,
        })
      }

      // Then sync with database
      await taskRepository.bulkUpdate({
        ids: taskIds,
        updates: {
          status: 'completed',
          completedAt: new Date(),
          progress: 100,
        },
      })
    } catch (error) {
      console.error('Bulk update failed:', error)
    }
  }

  // Example: Search and filtering
  const handleSearch = (query: string) => {
    const searchResults = searchEvents(query)
    console.log('Search results:', searchResults)
  }

  const handleAdvancedFilter = () => {
    const filtered = filterEvents({
      categories: ['work', 'personal'],
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
      },
    })
    console.log('Filtered results:', filtered)
  }

  // Example: Data export/import
  const handleExportData = async () => {
    try {
      const exportData_result = await exportData()
      
      // Download as JSON file
      const blob = new Blob([JSON.stringify(exportData_result, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dayflow-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handleImportData = async (file: File) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      const success = await importData(data)
      if (!success) {
        console.error('Import failed')
      }
    } catch (error) {
      console.error('Import failed:', error)
    }
  }

  // Example: Error handling with specific error types
  const handleRiskyOperation = async () => {
    try {
      // This might fail validation
      await taskRepository.create({
        title: '', // Empty title will fail validation
        priority: 'invalid-priority',
      })
    } catch (error) {
      if (error instanceof ValidationError) {
        console.error('Validation error:', error.message, error.field)
      } else if (error instanceof DatabaseError) {
        console.error('Database error:', error.message, error.code)
      }
    }
  }

  // Example: Real-time sync status display
  if (isLoading) {
    return <div>Loading dashboard...</div>
  }

  return (
    <div className="dayflow-dashboard">
      {/* Sync Status */}
      <div className="sync-status">
        <p>Last sync: {lastSync ? lastSync.toLocaleString() : 'Never'}</p>
        <p>Status: {isSyncing ? 'Syncing...' : 'Ready'}</p>
        <p>Online: {syncStatus.isOnline ? 'Yes' : 'No'}</p>
        <p>Pending changes: {syncStatus.pendingChanges}</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <p>Error: {error}</p>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      )}

      {/* Task Management */}
      <div className="task-section">
        <h2>Tasks ({tasks.length})</h2>
        <button onClick={handleAddTask}>Add Task</button>
        <button onClick={handleBulkCompleteTasks}>Complete All Pending</button>
        
        <div className="task-list">
          {tasks.slice(0, 5).map(task => (
            <div key={task.id} className="task-item">
              <h3>{task.title}</h3>
              <p>Status: {task.status}</p>
              <p>Priority: {task.priority}</p>
              <button onClick={() => updateTask(task.id, { status: 'completed' })}>
                Mark Complete
              </button>
              <button onClick={() => deleteTask(task.id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>

      {/* Event Management */}
      <div className="event-section">
        <h2>Events ({events.length})</h2>
        <button onClick={handleAddEvent}>Add Event</button>
        
        <div className="event-list">
          {events.slice(0, 5).map(event => (
            <div key={event.id} className="event-item">
              <h3>{event.title}</h3>
              <p>
                {new Date(event.startTime).toLocaleString()} -{' '}
                {new Date(event.endTime).toLocaleString()}
              </p>
              <p>Location: {event.location || 'No location'}</p>
              <button onClick={() => deleteEvent(event.id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="search-section">
        <h2>Search & Filter</h2>
        <input
          type="text"
          placeholder="Search events and tasks..."
          onChange={(e) => handleSearch(e.target.value)}
        />
        <button onClick={handleAdvancedFilter}>Advanced Filter</button>
      </div>

      {/* Data Management */}
      <div className="data-section">
        <h2>Data Management</h2>
        <button onClick={handleExportData}>Export Data</button>
        <input
          type="file"
          accept=".json"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleImportData(file)
          }}
        />
      </div>

      {/* Categories and Tags */}
      <div className="organization-section">
        <h2>Organization</h2>
        <div>
          <h3>Categories ({categories.length})</h3>
          {categories.map(category => (
            <div key={category.id}>
              <span
                style={{
                  backgroundColor: category.color,
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                {category.name}
              </span>
            </div>
          ))}
        </div>
        <div>
          <h3>Tags ({tags.length})</h3>
          {tags.map(tag => (
            <span
              key={tag.id}
              style={{
                backgroundColor: tag.color,
                padding: '2px 8px',
                borderRadius: '4px',
                margin: '2px',
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="performance-section">
        <h2>Performance</h2>
        <button onClick={handleRiskyOperation}>Test Error Handling</button>
        
        {/* In a real app, you'd show actual metrics */}
        <div className="metrics">
          <p>Query Performance: {'<'} 100ms</p>
          <p>Cache Hit Rate: 95%</p>
          <p>Sync Latency: 500ms</p>
          <p>Error Rate: 0.1%</p>
        </div>
      </div>
    </div>
  )
}

// Example: Custom hook for database operations
export function useDatabaseOperations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const executeOperation = async <T,>(
    operation: () => Promise<T>
  ): Promise<T | null> => {
    setLoading(true)
    setError(null)

    try {
      const result = await operation()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    executeOperation,
    clearError: () => setError(null),
  }
}

// Example: Hook for sync management
export function useSyncManager() {
  const { startSync, syncStatus, stopSync } = useSync()
  const [isAutoSync, setIsAutoSync] = useState(false)

  const enableAutoSync = (userId: string, interval = 30000) => {
    setIsAutoSync(true)
    const syncInterval = setInterval(() => {
      startSync(userId, { timeout: interval })
    }, interval)

    return () => {
      clearInterval(syncInterval)
      setIsAutoSync(false)
    }
  }

  const disableAutoSync = () => {
    setIsAutoSync(false)
    stopSync()
  }

  return {
    syncStatus,
    isAutoSync,
    enableAutoSync,
    disableAutoSync,
    startSync,
    stopSync,
  }
}

// Example: Error boundary component
export class DataLayerErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Data layer error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong with data operations.</h2>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.stack}</pre>
          </details>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// Example: App wrapper with error boundary and sync initialization
export function DayFlowApp() {
  return (
    <DataLayerErrorBoundary>
      <DayFlowDashboard />
    </DataLayerErrorBoundary>
  )
}

// Example: Testing utilities
export const createMockUser = (overrides = {}) => ({
  id: 'mock-user-123',
  email: 'user@example.com',
  name: 'Test User',
  timezone: 'UTC',
  preferences: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockTask = (overrides = {}) => ({
  id: 'mock-task-123',
  title: 'Mock Task',
  description: 'This is a mock task',
  status: 'pending' as const,
  priority: 'medium' as const,
  userId: 'mock-user-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockEvent = (overrides = {}) => ({
  id: 'mock-event-123',
  title: 'Mock Event',
  description: 'This is a mock event',
  startTime: new Date(),
  endTime: new Date(Date.now() + 3600000), // 1 hour from now
  isAllDay: false,
  userId: 'mock-user-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export default DayFlowApp