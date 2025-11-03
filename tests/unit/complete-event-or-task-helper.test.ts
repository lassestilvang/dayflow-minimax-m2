import { describe, it, expect } from 'vitest'
import { completeEventOrTask, completeTask, completeEvent } from '../utils/complete-event-or-task-helper'
import type { EventOrTask } from '../../types'

describe('Complete EventOrTask Helper', () => {
  describe('completeEventOrTask', () => {
    it('should complete an empty task with defaults', () => {
      const result = completeEventOrTask({})
      
      expect(result).toBeDefined()
      expect(result.id).toBe('test-task-id')
      expect(result.title).toBe('Test Task')
      expect(result.description).toBe('Test Description')
      expect(result.status).toBe('pending')
      expect(result.priority).toBe('medium')
      expect(result.userId).toBe('test-user')
      expect(result.progress).toBe(0)
      expect(result.recurrence).toEqual({ type: 'none' })
      expect(result.reminder).toEqual({ enabled: false, minutesBefore: 15 })
      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.updatedAt).toBeInstanceOf(Date)
    })

    it('should complete an empty event with defaults', () => {
      const result = completeEventOrTask({})
      
      // Should default to task since we pass empty object
      // Let's pass specific event properties to make it an event
      const eventInput = {
        isAllDay: true,
        startTime: new Date(),
        endTime: new Date(),
      }
      const eventResult = completeEventOrTask(eventInput)
      
      expect(eventResult).toBeDefined()
      expect(eventResult.id).toBe('test-event-id')
      expect(eventResult.title).toBe('Test Event')
      expect(eventResult.startTime).toBeDefined()
      expect(eventResult.endTime).toBeDefined()
      expect(eventResult.isAllDay).toBe(true)
      expect((eventResult as any).status).toBeUndefined()
    })

    it('should handle task with provided values', () => {
      const input = {
        id: 'custom-task-id',
        title: 'Custom Task Title',
        description: 'Custom Description',
        status: 'completed',
        priority: 'high',
        userId: 'custom-user',
        progress: 75,
        dueDate: new Date('2024-01-01'),
      }

      const result = completeEventOrTask(input)
      
      expect(result.id).toBe('custom-task-id')
      expect(result.title).toBe('Custom Task Title')
      expect(result.description).toBe('Custom Description')
      expect(result.status).toBe('completed')
      expect(result.priority).toBe('high')
      expect(result.userId).toBe('custom-user')
      expect(result.progress).toBe(75)
      expect(result.dueDate).toEqual(new Date('2024-01-01'))
      // Default values should still be applied
      expect(result.recurrence).toEqual({ type: 'none' })
      expect(result.reminder).toEqual({ enabled: false, minutesBefore: 15 })
    })

    it('should detect task by status property', () => {
      const taskInput = {
        title: 'Task with Status',
        status: 'in_progress',
      }

      const result = completeEventOrTask(taskInput)
      
      expect((result as any).status).toBe('in_progress')
      expect((result as any).progress).toBe(0)
    })

    it('should detect task by progress property', () => {
      const taskInput = {
        title: 'Task with Progress',
        progress: 50,
      }

      const result = completeEventOrTask(taskInput)
      
      expect((result as any).progress).toBe(50)
      expect((result as any).status).toBe('pending') // default
    })

    it('should complete event when no task-specific properties', () => {
      const eventInput = {
        title: 'Test Event',
        startTime: new Date('2024-01-01'),
        endTime: new Date('2024-01-01'),
        location: 'Test Location',
      }

      const result = completeEventOrTask(eventInput)
      
      expect((result as any).title).toBe('Test Event')
      expect((result as any).startTime).toEqual(new Date('2024-01-01'))
      expect((result as any).endTime).toEqual(new Date('2024-01-01'))
      expect((result as any).location).toBe('Test Location')
      expect((result as any).isAllDay).toBe(false)
      expect((result as any).attendees).toEqual([])
    })

    it('should use provided timestamps if available', () => {
      const now = new Date()
      const input = {
        id: 'custom-id',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
      }

      const result = completeEventOrTask(input)
      
      expect(result.createdAt).toEqual(new Date('2023-01-01'))
      expect(result.updatedAt).toEqual(new Date('2023-01-02'))
    })

    it('should handle optional fields properly', () => {
      const input = {
        title: 'Task with Optional Fields',
        categoryId: 'test-category-id',
        completedAt: new Date('2024-01-01'),
      }

      const result = completeEventOrTask(input)
      
      expect((result as any).categoryId).toBe('test-category-id')
      expect((result as any).completedAt).toEqual(new Date('2024-01-01'))
    })

    it('should handle event-specific optional fields', () => {
      const input = {
        title: 'Event with Optional Fields',
        isAllDay: true,
        location: 'Conference Room',
        attendees: [
          { email: 'user@example.com', name: 'Test User', status: 'accepted' as const }
        ],
        categoryId: 'event-category-id',
      }

      const result = completeEventOrTask(input)
      
      expect((result as any).isAllDay).toBe(true)
      expect((result as any).location).toBe('Conference Room')
      expect((result as any).attendees).toHaveLength(1)
      expect((result as any).categoryId).toBe('event-category-id')
    })

    it('should handle partial task properties correctly', () => {
      const input = {
        title: 'Partial Task',
        status: 'completed',
        // Missing progress, but that's okay - should get default
      }

      const result = completeEventOrTask(input)
      
      expect((result as any).status).toBe('completed')
      expect((result as any).progress).toBe(0)
    })
  })

  describe('completeTask', () => {
    it('should complete task with task-specific defaults', () => {
      const input = {
        title: 'Task Helper Test',
        userId: 'user-123',
      }

      const result = completeTask(input)
      
      expect(result.id).toBe('test-task-id')
      expect(result.title).toBe('Task Helper Test')
      expect(result.userId).toBe('user-123')
      expect((result as any).status).toBe('pending')
      expect((result as any).priority).toBe('medium')
      expect((result as any).progress).toBe(0)
    })

    it('should override default status with provided value', () => {
      const input = {
        title: 'Custom Status Task',
        status: 'in_progress',
      }

      const result = completeTask(input)
      
      expect((result as any).status).toBe('in_progress')
    })

    it('should override default priority with provided value', () => {
      const input = {
        title: 'Custom Priority Task',
        priority: 'urgent',
      }

      const result = completeTask(input)
      
      expect((result as any).priority).toBe('urgent')
    })

    it('should override default progress with provided value', () => {
      const input = {
        title: 'Custom Progress Task',
        progress: 80,
      }

      const result = completeTask(input)
      
      expect((result as any).progress).toBe(80)
    })

    it('should work with empty input', () => {
      const result = completeTask({})
      
      expect(result.id).toBe('test-task-id')
      expect(result.title).toBe('Test Task')
      expect((result as any).status).toBe('pending')
      expect((result as any).priority).toBe('medium')
      expect((result as any).progress).toBe(0)
    })

    it('should preserve existing task properties', () => {
      const input = {
        id: 'custom-id',
        title: 'Custom Task',
        description: 'Custom Description',
        dueDate: new Date('2024-12-31'),
        completedAt: new Date('2024-12-30'),
      }

      const result = completeTask(input)
      
      expect(result.id).toBe('custom-id')
      expect(result.title).toBe('Custom Task')
      expect(result.description).toBe('Custom Description')
      expect((result as any).dueDate).toEqual(new Date('2024-12-31'))
      expect((result as any).completedAt).toEqual(new Date('2024-12-30'))
    })
  })

  describe('completeEvent', () => {
    it('should complete event with event-specific defaults', () => {
      const input = {
        title: 'Event Helper Test',
        userId: 'user-123',
      }

      const result = completeEvent(input)
      
      expect(result.id).toBe('test-event-id')
      expect(result.title).toBe('Event Helper Test')
      expect(result.userId).toBe('user-123')
      expect((result as any).isAllDay).toBe(false)
      expect((result as any).startTime).toBeInstanceOf(Date)
      expect((result as any).endTime).toBeInstanceOf(Date)
    })

    it('should override default isAllDay with provided value', () => {
      const input = {
        title: 'All Day Event',
        isAllDay: true,
      }

      const result = completeEvent(input)
      
      expect((result as any).isAllDay).toBe(true)
    })

    it('should override default startTime with provided value', () => {
      const startTime = new Date('2024-06-01T09:00:00')
      const input = {
        title: 'Timed Event',
        startTime,
      }

      const result = completeEvent(input)
      
      expect((result as any).startTime).toEqual(startTime)
    })

    it('should override default endTime with provided value', () => {
      const endTime = new Date('2024-06-01T17:00:00')
      const input = {
        title: 'Timed Event',
        endTime,
      }

      const result = completeEvent(input)
      
      expect((result as any).endTime).toEqual(endTime)
    })

    it('should work with empty input', () => {
      const result = completeEvent({})
      
      expect(result.id).toBe('test-event-id')
      expect(result.title).toBe('Test Event')
      expect((result as any).isAllDay).toBe(false)
      expect((result as any).startTime).toBeInstanceOf(Date)
      expect((result as any).endTime).toBeInstanceOf(Date)
      expect((result as any).attendees).toEqual([])
    })

    it('should preserve existing event properties', () => {
      const input = {
        id: 'custom-event-id',
        title: 'Custom Event',
        description: 'Custom Description',
        location: 'Custom Location',
        categoryId: 'event-category-123',
        attendees: [
          { email: 'user1@example.com', name: 'User 1', status: 'accepted' as const }
        ],
      }

      const result = completeEvent(input)
      
      expect(result.id).toBe('custom-event-id')
      expect(result.title).toBe('Custom Event')
      expect(result.description).toBe('Custom Description')
      expect((result as any).location).toBe('Custom Location')
      expect((result as any).categoryId).toBe('event-category-123')
      expect((result as any).attendees).toHaveLength(1)
    })

    it('should use current time for timestamp defaults if not provided', () => {
      const beforeCall = new Date()
      const result = completeEvent({})
      const afterCall = new Date()
      
      expect((result as any).startTime).toBeInstanceOf(Date)
      expect((result as any).endTime).toBeInstanceOf(Date)
      expect((result as any).startTime.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime())
      expect((result as any).endTime.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime())
      expect((result as any).startTime.getTime()).toBeLessThanOrEqual(afterCall.getTime())
      expect((result as any).endTime.getTime()).toBeLessThanOrEqual(afterCall.getTime())
    })
  })

  describe('Type Safety', () => {
    it('should return EventOrTask type', () => {
      const taskResult = completeEventOrTask({ title: 'Test Task' })
      expect(taskResult).toBeInstanceOf(Object)
      
      const eventResult = completeEventOrTask({ title: 'Test Event', startTime: new Date(), endTime: new Date() })
      expect(eventResult).toBeInstanceOf(Object)
    })

    it('should maintain proper typing for completions', () => {
      const taskInput = { title: 'Test', status: 'pending' }
      const taskResult = completeTask(taskInput)
      expect((taskResult as any).status).toBeDefined()
      
      const eventInput = { title: 'Test', startTime: new Date(), endTime: new Date() }
      const eventResult = completeEvent(eventInput)
      expect((eventResult as any).startTime).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle null input gracefully', () => {
      expect(() => completeEventOrTask(null as any)).not.toThrow()
    })

    it('should handle undefined input gracefully', () => {
      expect(() => completeEventOrTask(undefined as any)).not.toThrow()
    })

    it('should handle input with unexpected properties', () => {
      const input = {
        title: 'Test Item',
        unknownProperty: 'value',
        anotherUnknown: 123,
        status: 'pending',
        startTime: new Date(),
        endTime: new Date(),
      }

      const result = completeEventOrTask(input)
      
      expect(result.title).toBe('Test Item')
      // Should prioritize task status over event properties
      expect((result as any).status).toBe('pending')
    })

    it('should handle mixed task and event properties correctly', () => {
      const input = {
        title: 'Mixed Item',
        status: 'completed', // Task property
        startTime: new Date('2024-01-01'), // Event property
        endTime: new Date('2024-01-01'), // Event property
        progress: 50, // Task property
      }

      const result = completeEventOrTask(input)
      
      // Should be treated as task since both task-specific properties exist
      expect((result as any).status).toBe('completed')
      expect((result as any).progress).toBe(50)
      // Event properties should still be present
      expect((result as any).startTime).toEqual(new Date('2024-01-01'))
      expect((result as any).endTime).toEqual(new Date('2024-01-01'))
    })

    it('should handle string dates correctly', () => {
      const input = {
        title: 'Test with String Date',
        dueDate: '2024-01-01T00:00:00Z',
        startTime: '2024-01-01T09:00:00Z',
        endTime: '2024-01-01T17:00:00Z',
      }

      const result = completeEventOrTask(input)
      
      expect((result as any).dueDate).toBe('2024-01-01T00:00:00Z')
      expect((result as any).startTime).toBe('2024-01-01T09:00:00Z')
      expect((result as any).endTime).toBe('2024-01-01T17:00:00Z')
    })
  })
})