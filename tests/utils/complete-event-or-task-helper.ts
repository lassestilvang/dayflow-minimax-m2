/**
 * Complete EventOrTask Helper
 * Ensures all EventOrTask objects have the required properties
 */

import type { EventOrTask } from '@/types'

export function completeEventOrTask(item: Partial<EventOrTask> | null | undefined): EventOrTask {
  const now = new Date()
  
  // Handle null or undefined input gracefully
  if (!item) {
    // Default to a task for empty/null input
    return {
      id: 'test-task-id',
      title: 'Test Task',
      description: 'Test Description',
      status: 'pending',
      priority: 'medium',
      userId: 'test-user',
      createdAt: now,
      updatedAt: now,
      progress: 0,
      recurrence: { type: 'none' },
      reminder: { enabled: false, minutesBefore: 15 },
      dueDate: undefined,
      completedAt: undefined,
    } as EventOrTask
  }
  
  const itemAny = item as any
  
  // Check if this is a task by looking for task-specific properties
  const isTask = 'status' in itemAny || 'progress' in itemAny || 'dueDate' in itemAny || 'priority' in itemAny || 'completedAt' in itemAny
  
  // For empty objects, assume it's a task (more common use case)
  const isEmpty = Object.keys(itemAny).length === 0
  const shouldBeTask = isTask || isEmpty
  
  if (shouldBeTask) {
    // Complete as Task
    const dueDate = itemAny.dueDate
      ? (typeof itemAny.dueDate === 'string' ? itemAny.dueDate : new Date(itemAny.dueDate))
      : undefined
    const completedAt = itemAny.completedAt
      ? (typeof itemAny.completedAt === 'string' ? itemAny.completedAt : new Date(itemAny.completedAt))
      : undefined
    
    return {
      id: itemAny.id || 'test-task-id',
      title: itemAny.title || 'Test Task',
      description: itemAny.description || 'Test Description',
      status: itemAny.status || 'pending',
      priority: itemAny.priority || 'medium',
      userId: itemAny.userId || 'test-user',
      createdAt: itemAny.createdAt || now,
      updatedAt: itemAny.updatedAt || now,
      progress: itemAny.progress || 0,
      recurrence: itemAny.recurrence || { type: 'none' },
      reminder: itemAny.reminder || { enabled: false, minutesBefore: 15 },
      dueDate,
      completedAt,
      // Preserve event properties if they exist
      startTime: itemAny.startTime || undefined,
      endTime: itemAny.endTime || undefined,
      location: itemAny.location,
      categoryId: itemAny.categoryId,
      attendees: itemAny.attendees || [],
      isAllDay: itemAny.isAllDay,
    } as EventOrTask
  } else {
    // Complete as CalendarEvent
    const startTime = itemAny.startTime
      ? (typeof itemAny.startTime === 'string' ? new Date(itemAny.startTime) : itemAny.startTime)
      : undefined
    const endTime = itemAny.endTime
      ? (typeof itemAny.endTime === 'string' ? new Date(itemAny.endTime) : itemAny.endTime)
      : undefined
    
    return {
      id: itemAny.id || 'test-event-id',
      title: itemAny.title || 'Test Event',
      description: itemAny.description || 'Test Description',
      startTime: startTime || now,
      endTime: endTime || now,
      isAllDay: itemAny.isAllDay || false,
      location: itemAny.location,
      userId: itemAny.userId || 'test-user',
      createdAt: itemAny.createdAt || now,
      updatedAt: itemAny.updatedAt || now,
      recurrence: itemAny.recurrence || { type: 'none' },
      reminder: itemAny.reminder || { enabled: false, minutesBefore: 15 },
      categoryId: itemAny.categoryId,
      attendees: itemAny.attendees || [],
    } as EventOrTask
  }
}

export function completeTask(task: Partial<EventOrTask>): EventOrTask {
  return completeEventOrTask({
    ...task,
    status: (task as any).status || 'pending',
    priority: (task as any).priority || 'medium',
    progress: (task as any).progress || 0,
  })
}

export function completeEvent(event: Partial<EventOrTask>): EventOrTask {
  return completeEventOrTask({
    ...event,
    isAllDay: (event as any).isAllDay || false,
    startTime: (event as any).startTime || new Date(),
    endTime: (event as any).endTime || new Date(),
  })
}