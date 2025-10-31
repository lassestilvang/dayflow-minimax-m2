# State Management and Data Layer Documentation

## Overview

This document provides comprehensive documentation for the state management and data persistence layer implemented in the DayFlow application. The system provides robust data handling with database synchronization, optimistic updates, and conflict resolution.

## Architecture

### Core Components

1. **Database Layer**
   - Drizzle ORM with Neon PostgreSQL
   - Enhanced schema with categories, tags, and relationships
   - Migration system with automatic version management

2. **Data Access Layer**
   - Repository pattern with TypeScript interfaces
   - Comprehensive CRUD operations
   - Advanced filtering and search capabilities
   - Bulk operations and batch processing

3. **State Management**
   - Enhanced Zustand store with persistence
   - Optimistic updates with rollback support
   - Real-time synchronization with conflict resolution

4. **Validation Layer**
   - Zod schemas for runtime validation
   - Type-safe form validation
   - Data integrity checks

## Database Schema

### Core Tables

```typescript
// Users table with preferences
users: {
  id: uuid (PK)
  email: text (unique, not null)
  name: text
  image: text
  workosId: text (unique)
  timezone: text (default: 'UTC')
  preferences: jsonb (user preferences)
  createdAt: timestamp
  updatedAt: timestamp
}

// Categories for organization
categories: {
  id: uuid (PK)
  name: text (not null)
  color: text (not null, default: '#3b82f6')
  icon: text
  userId: uuid (FK to users)
  createdAt: timestamp
  updatedAt: timestamp
}

// Tags for flexible organization
tags: {
  id: uuid (PK)
  name: text (not null)
  color: text (not null, default: '#6b7280')
  userId: uuid (FK to users)
  createdAt: timestamp
  updatedAt: timestamp
}

// Tasks with advanced features
tasks: {
  id: uuid (PK)
  title: text (not null)
  description: text
  status: text (not null, default: 'pending')
  priority: text (not null, default: 'medium')
  dueDate: timestamp
  completedAt: timestamp
  startTime: timestamp
  endTime: timestamp
  progress: integer (0-100, default: 0)
  estimatedDuration: integer (minutes)
  actualDuration: integer (minutes)
  recurrence: jsonb (recurrence rules)
  reminder: jsonb (reminder settings)
  userId: uuid (FK to users)
  categoryId: uuid (FK to categories, nullable)
  createdAt: timestamp
  updatedAt: timestamp
}

// Calendar events with meeting support
calendarEvents: {
  id: uuid (PK)
  title: text (not null)
  description: text
  startTime: timestamp (not null)
  endTime: timestamp (not null)
  isAllDay: boolean (default: false)
  location: text
  meetingUrl: text
  attendees: jsonb (meeting attendees)
  recurrence: jsonb (recurrence rules)
  reminder: jsonb (reminder settings)
  userId: uuid (FK to users)
  categoryId: uuid (FK to categories, nullable)
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Junction Tables

```typescript
// Task-Tag relationships
taskTags: {
  taskId: uuid (FK to tasks, composite PK)
  tagId: uuid (FK to tags, composite PK)
  createdAt: timestamp
}

// Event-Tag relationships
eventTags: {
  eventId: uuid (FK to calendar_events, composite PK)
  tagId: uuid (FK to tags, composite PK)
  createdAt: timestamp
}
```

## Usage Examples

### Basic Setup

```typescript
import { useEnhancedCalendarStore } from '@/stores/enhancedStore'
import { useSync } from '@/lib/sync'

// Initialize the store
const store = useEnhancedCalendarStore()

// Setup synchronization
const { startSync, syncStatus } = useSync()

// Start syncing for a user
await startSync('user-id-123', {
  batchSize: 50,
  timeout: 30000,
  retryAttempts: 3
})
```

### Task Management

```typescript
import { taskRepository } from '@/lib/data-access'

// Create a new task
const newTask = await taskRepository.create({
  title: 'Complete project documentation',
  description: 'Write comprehensive docs for the new features',
  priority: 'high',
  status: 'pending',
  dueDate: new Date('2024-01-15'),
  categoryId: 'category-uuid',
  tags: ['important', 'documentation']
})

// Update task status
const updatedTask = await taskRepository.update(newTask.id, {
  status: 'completed',
  completedAt: new Date(),
  progress: 100
})

// Bulk update multiple tasks
const bulkResult = await taskRepository.bulkUpdate({
  ids: ['task-1', 'task-2', 'task-3'],
  updates: { status: 'completed' }
})

// Find overdue tasks
const overdueTasks = await taskRepository.findOverdue('user-id-123')

// Search tasks with filters
const filteredTasks = await taskRepository.findWithFilters('user-id-123', {
  status: ['pending', 'in_progress'],
  priority: ['high', 'urgent'],
  dueDateRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-01-31')
  }
})
```

### Event Management

```typescript
import { calendarEventRepository } from '@/lib/data-access'

// Create a new event
const newEvent = await calendarEventRepository.create({
  title: 'Team Standup',
  description: 'Daily team synchronization meeting',
  startTime: new Date('2024-01-02T09:00:00Z'),
  endTime: new Date('2024-01-02T09:30:00Z'),
  isAllDay: false,
  location: 'Conference Room A',
  attendees: [
    { email: 'alice@example.com', name: 'Alice', status: 'accepted' },
    { email: 'bob@example.com', name: 'Bob', status: 'pending' }
  ],
  recurrence: {
    type: 'daily',
    interval: 1
  },
  reminder: {
    enabled: true,
    minutesBefore: 15
  }
})

// Check for conflicts
const conflicts = await calendarEventRepository.findConflicts(
  'user-id-123',
  new Date('2024-01-02T09:15:00Z'),
  new Date('2024-01-02T09:45:00Z')
)

// Find events in date range
const weekEvents = await calendarEventRepository.findByDateRange(
  'user-id-123',
  new Date('2024-01-01'),
  new Date('2024-01-07')
)
```

### Category and Tag Management

```typescript
import { categoryRepository, tagRepository } from '@/lib/data-access'

// Create a category
const newCategory = await categoryRepository.create({
  name: 'Work Projects',
  color: '#3b82f6',
  icon: 'briefcase'
})

// Create tags
const workTag = await tagRepository.create({
  name: 'work',
  color: '#10b981'
})

const urgentTag = await tagRepository.create({
  name: 'urgent',
  color: '#ef4444'
})

// Search tags by name
const matchingTags = await tagRepository.searchByName('user-id-123', 'work')
```

### Store Integration

```typescript
import { useEnhancedCalendarStore } from '@/stores/enhancedStore'

// Using the enhanced store with database sync
const {
  tasks,
  events,
  addTask,
  addEvent,
  updateTask,
  updateEvent,
  searchEvents,
  filterEvents,
  syncWithDatabase
} = useEnhancedCalendarStore()

// Add a task with optimistic updates
const success = await addTask({
  title: 'New task',
  description: 'Task description',
  priority: 'medium',
  status: 'pending',
  userId: 'user-id-123'
})

if (!success) {
  console.error('Failed to create task')
}

// Search and filter events
const searchResults = searchEvents('meeting')
const filteredResults = filterEvents({
  categories: ['work', 'personal'],
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-01-31')
  }
})

// Sync with database
await syncWithDatabase('user-id-123')
```

### Synchronization

```typescript
import { 
  syncService, 
  optimisticUpdateManager, 
  conflictResolutionService 
} from '@/lib/sync'

// Setup sync event listeners
syncService.on('sync_start', () => {
  console.log('🔄 Syncing data...')
})

syncService.on('sync_complete', (result) => {
  console.log(`✅ Synced ${result.syncedItems} items`)
})

syncService.on('sync_error', (error) => {
  console.error('❌ Sync failed:', error)
})

// Handle optimistic updates
await optimisticUpdateManager.executeUpdate(
  'task-123',
  'create',
  'task',
  taskData,
  originalData // for rollback
)

// Resolve conflicts
const conflicts = [
  {
    type: 'task',
    id: 'task-123',
    localData: localTask,
    remoteData: remoteTask
  }
]

const resolved = await conflictResolutionService.resolveConflicts(
  conflicts,
  'client' // or 'server' or 'manual'
)

// Force sync all pending changes
const result = await syncService.forceSync('user-id-123')
```

### Data Import/Export

```typescript
// Export all user data
const exportData = await store.exportData()

// Save to file
const dataBlob = new Blob([JSON.stringify(exportData, null, 2)], {
  type: 'application/json'
})
const url = URL.createObjectURL(dataBlob)

// Import data
const importData = {
  events: [...],
  tasks: [...],
  categories: [...],
  tags: [...]
}

const success = await store.importData(importData)
```

### Error Handling

```typescript
import { DatabaseError, ValidationError, NotFoundError } from '@/lib/data-access'

try {
  const task = await taskRepository.create(taskData)
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid data:', error.message, error.field)
  } else if (error instanceof NotFoundError) {
    console.error('Record not found:', error.message)
  } else if (error instanceof DatabaseError) {
    console.error('Database error:', error.message, error.code)
  }
}
```

### Migration Management

```typescript
import { MigrationManager, runMigrations } from '@/lib/db/migration-manager'

// Create migration manager
const manager = new MigrationManager(process.env.DATABASE_URL!)

// Check migration status
const status = await manager.getMigrationStatus()
console.log('Migration status:', status)

// Apply migrations
const result = await manager.migrate()
if (result.success) {
  console.log('Migrations applied:', result.migrated)
} else {
  console.error('Migration failed:', result.error)
}

// Generate new migration
const newMigration = await manager.generateMigration('add_user_preferences')
console.log('Generated migration:', newMigration.path)

// Check database health
const health = await manager.checkHealth()
console.log('Database health:', health)
```

## Best Practices

### 1. Use Optimistic Updates
Always use the enhanced store for user-initiated changes to provide immediate feedback:

```typescript
// ✅ Good - Immediate UI update
const success = await addTask(taskData)

// ❌ Bad - Delayed UI update
const task = await taskRepository.create(taskData)
addTask(task) // Manual state update
```

### 2. Handle Errors Gracefully
Implement comprehensive error handling:

```typescript
try {
  await operation()
} catch (error) {
  if (error instanceof ValidationError) {
    // Show field-specific errors
    showFieldError(error.field, error.message)
  } else if (error instanceof DatabaseError) {
    // Show generic database error
    showError('Database operation failed')
  }
}
```

### 3. Use Repository Methods Appropriately
Choose the right repository method for your use case:

```typescript
// For single records
const task = await taskRepository.findById(id)

// For user-specific queries
const userTasks = await taskRepository.findByUserId(userId)

// For complex filtering
const filteredTasks = await taskRepository.findWithFilters(userId, filters)

// For bulk operations
await taskRepository.bulkUpdate(bulkData)
```

### 4. Implement Proper Sync Strategies
Use appropriate sync strategies based on your needs:

```typescript
// For real-time apps
await syncService.startSync(userId, {
  timeout: 10000, // 10 seconds
  batchSize: 20
})

// For offline-first apps
await syncService.startSync(userId, {
  timeout: 30000, // 30 seconds
  batchSize: 50
})
```

### 5. Validate Data at Boundaries
Validate data at the entry points:

```typescript
// Validate form data before processing
const validation = validateTaskFormData(formData)
if (!validation.success) {
  showValidationErrors(validation.error)
  return
}
```

## Performance Considerations

### 1. Use Pagination for Large Datasets
```typescript
const result = await taskRepository.findMany(
  {}, // filters
  { field: 'createdAt', direction: 'desc' }, // sort
  { page: 1, limit: 20 } // pagination
)
```

### 2. Implement Caching
```typescript
// Cache frequently accessed data
const cachedCategories = await getCached('user-categories', async () => {
  return await categoryRepository.findByUserId(userId)
}, 300000) // 5 minutes TTL
```

### 3. Use Bulk Operations
```typescript
// ✅ Efficient
await taskRepository.bulkUpdate({ ids, updates })

// ❌ Inefficient
for (const id of ids) {
  await taskRepository.update(id, updates)
}
```

## Troubleshooting

### Common Issues

1. **Sync Not Working**
   - Check internet connection
   - Verify DATABASE_URL is set
   - Check sync service status

2. **Validation Errors**
   - Check Zod schemas
   - Verify data types match expectations
   - Check field requirements

3. **Database Connection Issues**
   - Verify Neon database is running
   - Check connection string format
   - Verify SSL settings

4. **Performance Issues**
   - Implement proper indexing
   - Use pagination for large datasets
   - Optimize queries with filters

### Debug Mode

Enable debug logging:

```typescript
// Enable Drizzle logging
process.env.Drizzle_LOG_QUERIES = 'true'

// Enable sync debugging
syncService.on('sync_start', () => console.log('🔄 Sync started'))
```

## API Reference

### Repository Methods

#### UserRepository
- `create(data)`: Create new user
- `findById(id)`: Find user by ID
- `findByEmail(email)`: Find user by email
- `update(id, data)`: Update user
- `updatePreferences(id, preferences)`: Update user preferences

#### TaskRepository
- `create(data)`: Create new task
- `findById(id)`: Find task by ID
- `findByUserId(userId)`: Find all tasks for user
- `findWithFilters(userId, filters)`: Find tasks with filters
- `findOverdue(userId)`: Find overdue tasks
- `bulkUpdate(data)`: Bulk update tasks

#### CalendarEventRepository
- `create(data)`: Create new event
- `findById(id)`: Find event by ID
- `findByDateRange(userId, start, end)`: Find events in range
- `findConflicts(userId, start, end, excludeId)`: Find conflicting events

### Store Methods

#### EnhancedCalendarStore
- `addTask(task)`: Add task with optimistic updates
- `updateTask(id, updates)`: Update task
- `addEvent(event)`: Add event with optimistic updates
- `syncWithDatabase(userId)`: Sync with database
- `searchEvents(query)`: Search events
- `filterEvents(filters)`: Filter events

### Sync Methods

#### SyncService
- `startSync(userId, options)`: Start synchronization
- `forceSync(userId)`: Force sync all pending changes
- `getSyncStatus()`: Get current sync status

#### OptimisticUpdateManager
- `executeUpdate(id, type, entity, data)`: Execute optimistic update
- `rollbackUpdate(id)`: Rollback update

This comprehensive data layer provides a robust foundation for managing application state with real-time synchronization, conflict resolution, and performance optimization.