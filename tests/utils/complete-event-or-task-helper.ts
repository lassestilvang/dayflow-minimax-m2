/**
 * Complete EventOrTask Helper
 * Ensures all EventOrTask objects have the required properties
 */

import type { EventOrTask } from '../../types'

export function completeEventOrTask(item: Partial<EventOrTask>): EventOrTask {
  const now = new Date()
  const itemAny = item as any
  
  // Check if this is a task by looking for task-specific properties
  const isTask = 'status' in item || 'progress' in item
  
  if (isTask) {
    // Complete as Task
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
      dueDate: itemAny.dueDate,
      completedAt: itemAny.completedAt,
    } as EventOrTask
  } else {
    // Complete as CalendarEvent
    return {
      id: itemAny.id || 'test-event-id',
      title: itemAny.title || 'Test Event',
      description: itemAny.description || 'Test Description',
      startTime: itemAny.startTime || now,
      endTime: itemAny.endTime || now,
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