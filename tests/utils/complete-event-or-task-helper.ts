/**
 * Complete EventOrTask Helper
 * Ensures all EventOrTask objects have the required properties
 */

import type { EventOrTask } from '../../types'

export function completeEventOrTask(item: Partial<EventOrTask>): EventOrTask {
  const now = new Date()
  
  // Base properties that all items need
  const baseCompleted: EventOrTask = {
    id: item.id || 'test-id',
    userId: item.userId || 'test-user',
    title: item.title || 'Test Title',
    description: item.description || 'Test Description',
    status: item.status || 'pending',
    priority: item.priority || 'medium',
    createdAt: item.createdAt || now,
    updatedAt: item.updatedAt || now,
    
    // Task-specific required properties
    progress: item.progress || 0,
    recurrence: item.recurrence || { type: 'none' },
    reminder: item.reminder || null,
  }

  // Add event-specific properties if this is an event
  if ('startTime' in item || item.isAllDay !== undefined) {
    return {
      ...baseCompleted,
      // Event properties
      startTime: (item as any).startTime || new Date(),
      endTime: (item as any).endTime || new Date(),
      isAllDay: (item as any).isAllDay || false,
      location: (item as any).location || null,
      attendees: (item as any).attendees || [],
    }
  }

  // Task properties are already included in baseCompleted
  return baseCompleted
}

export function completeTask(task: Partial<EventOrTask>): EventOrTask {
  return completeEventOrTask(task)
}

export function completeEvent(event: Partial<EventOrTask>): EventOrTask {
  return completeEventOrTask({
    ...event,
    isAllDay: event.isAllDay || false,
    startTime: (event as any).startTime || new Date(),
    endTime: (event as any).endTime || new Date(),
  })
}