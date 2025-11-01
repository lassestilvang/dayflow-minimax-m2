import { describe, it, expect } from 'vitest'
import { 
  validateTaskData,
  validateEventData,
  validateUserData,
  validateTaskFormData,
  validateEventFormData,
} from '@/lib/validations/schemas'
import {
  taskSchema,
  calendarEventSchema,
  userSchema,
  taskFormDataSchema,
  calendarEventFormDataSchema,
} from '@/lib/validations/schemas'

describe('Validation Schemas', () => {
  describe('User Validation', () => {
    it('should validate correct user data', () => {
      const userData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        name: 'Test User',
        image: 'https://example.com/avatar.jpg',
        workosId: 'workos_123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const result = validateUserData(userData)
      
      expect(result.success).toBe(true)
      expect(result.data).toEqual(userData)
    })

    it('should reject invalid email', () => {
      const userData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'invalid-email',
        name: 'Test User',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const result = validateUserData(userData)
      
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe('Invalid email address')
    })

    it('should reject empty name', () => {
      const userData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        name: '',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const result = validateUserData(userData)
      
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe('Name is required')
    })

    it('should reject too long name', () => {
      const userData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        name: 'a'.repeat(101),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const result = validateUserData(userData)
      
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe('Name too long')
    })

    it('should reject invalid image URL', () => {
      const userData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        name: 'Test User',
        image: 'invalid-url',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const result = validateUserData(userData)
      
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe('Invalid image URL')
    })

    it('should reject invalid UUID', () => {
      const userData = {
        id: 'invalid-uuid',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const result = validateUserData(userData)
      
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe('Invalid ID format')
    })

    it('should accept missing optional fields', () => {
      const userData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const result = validateUserData(userData)
      
      expect(result.success).toBe(true)
      expect(result.data).toEqual(userData)
    })
  })

  describe('Task Validation', () => {
    it('should validate correct task data', () => {
      const taskData = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        title: 'Complete Project',
        description: 'Finish the main project features',
        status: 'in_progress' as const,
        priority: 'high' as const,
        dueDate: new Date('2024-12-31'),
        completedAt: null,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const result = validateTaskData(taskData)
      
      expect(result.success).toBe(true)
      expect(result.data).toEqual(taskData)
    })

    it('should validate correct task form data', () => {
      const taskFormData = {
        title: 'New Task',
        description: 'Task description',
        priority: 'medium' as const,
        dueDate: new Date('2024-12-31'),
      }

      const result = validateTaskFormData(taskFormData)
      
      expect(result.success).toBe(true)
      expect(result.data).toEqual(taskFormData)
    })

    it('should reject empty title', () => {
      const taskData = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        title: '',
        description: 'Task description',
        status: 'pending' as const,
        priority: 'medium' as const,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const result = validateTaskData(taskData)
      
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe('Title is required')
    })

    it('should reject too long title', () => {
      const taskData = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        title: 'a'.repeat(201),
        status: 'pending' as const,
        priority: 'medium' as const,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const result = validateTaskData(taskData)
      
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe('Title too long')
    })

    it('should reject too long description', () => {
      const taskData = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        title: 'Valid Title',
        description: 'a'.repeat(1001),
        status: 'pending' as const,
        priority: 'medium' as const,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const result = validateTaskData(taskData)
      
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe('Description too long')
    })

    it('should reject invalid status', () => {
      const taskData = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        title: 'Valid Title',
        status: 'invalid_status' as any,
        priority: 'medium' as const,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const result = validateTaskData(taskData)
      
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toContain('Invalid enum value')
    })

    it('should reject invalid priority', () => {
      const taskData = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        title: 'Valid Title',
        status: 'pending' as const,
        priority: 'invalid_priority' as any,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const result = validateTaskData(taskData)
      
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toContain('Invalid enum value')
    })

    it('should accept valid enum values', () => {
      const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled']
      const validPriorities = ['low', 'medium', 'high', 'urgent']

      expect(taskSchema.shape.status.safeParse('pending').success).toBe(true)
      expect(taskSchema.shape.status.safeParse('in_progress').success).toBe(true)
      expect(taskSchema.shape.status.safeParse('completed').success).toBe(true)
      expect(taskSchema.shape.status.safeParse('cancelled').success).toBe(true)
      expect(taskSchema.shape.status.safeParse('invalid').success).toBe(false)

      expect(taskSchema.shape.priority.safeParse('low').success).toBe(true)
      expect(taskSchema.shape.priority.safeParse('medium').success).toBe(true)
      expect(taskSchema.shape.priority.safeParse('high').success).toBe(true)
      expect(taskSchema.shape.priority.safeParse('urgent').success).toBe(true)
      expect(taskSchema.shape.priority.safeParse('invalid').success).toBe(false)
    })

    it('should apply default values', () => {
      const taskData = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        title: 'Valid Title',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const result = validateTaskData(taskData)
      
      expect(result.success).toBe(true)
      expect(result.data.status).toBe('pending')
      expect(result.data.priority).toBe('medium')
    })
  })

  describe('Calendar Event Validation', () => {
    it('should validate correct event data', () => {
      const eventData = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        title: 'Team Meeting',
        description: 'Weekly team standup',
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T10:00:00Z'),
        isAllDay: false,
        location: 'Conference Room A',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const result = validateEventData(eventData)
      
      expect(result.success).toBe(true)
      expect(result.data).toEqual(eventData)
    })

    it('should validate correct event form data', () => {
      const eventFormData = {
        title: 'Project Review',
        description: 'Review project progress',
        startTime: new Date('2024-01-01T14:00:00Z'),
        endTime: new Date('2024-01-01T16:00:00Z'),
        isAllDay: false,
        location: 'Conference Room B',
      }

      const result = validateEventFormData(eventFormData)
      
      expect(result.success).toBe(true)
      expect(result.data).toEqual(eventFormData)
    })

    it('should reject empty title', () => {
      const eventData = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        title: '',
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T10:00:00Z'),
        isAllDay: false,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const result = validateEventData(eventData)
      
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe('Title is required')
    })

    it('should reject end time before start time', () => {
      const eventData = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        title: 'Valid Title',
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T09:00:00Z'),
        isAllDay: false,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const result = validateEventData(eventData)
      
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe('End time must be after start time')
    })

    it('should reject too long location', () => {
      const eventData = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        title: 'Valid Title',
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T10:00:00Z'),
        isAllDay: false,
        location: 'a'.repeat(501),
        userId: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const result = validateEventData(eventData)
      
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe('Location too long')
    })

    it('should apply default isAllDay value', () => {
      const eventData = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        title: 'Valid Title',
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T10:00:00Z'),
        userId: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const result = validateEventData(eventData)
      
      expect(result.success).toBe(true)
      expect(result.data.isAllDay).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle null values correctly', () => {
      const taskData = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        title: 'Valid Title',
        description: null,
        status: 'pending' as const,
        priority: 'medium' as const,
        dueDate: null,
        completedAt: null,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const result = validateTaskData(taskData)
      
      expect(result.success).toBe(true)
      expect(result.data.description).toBeNull()
      expect(result.data.dueDate).toBeNull()
    })

    it('should handle undefined values correctly', () => {
      const taskData = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        title: 'Valid Title',
        status: 'pending' as const,
        priority: 'medium' as const,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        // description, dueDate, completedAt are undefined
      }

      const result = validateTaskData(taskData)
      
      expect(result.success).toBe(true)
      expect(result.data.description).toBeUndefined()
      expect(result.data.dueDate).toBeUndefined()
    })

    it('should validate boolean values', () => {
      const eventData = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        title: 'Valid Title',
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T10:00:00Z'),
        isAllDay: true,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const result = validateEventData(eventData)
      
      expect(result.success).toBe(true)
      expect(result.data.isAllDay).toBe(true)
    })

    it('should reject non-boolean isAllDay value', () => {
      const eventData = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        title: 'Valid Title',
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T10:00:00Z'),
        isAllDay: 'true' as any, // String instead of boolean
        userId: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const result = validateEventData(eventData)
      
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toContain('Expected boolean')
    })
  })

  describe('Schema Integration', () => {
    it('should create schemas correctly', () => {
      expect(userSchema).toBeDefined()
      expect(taskSchema).toBeDefined()
      expect(calendarEventSchema).toBeDefined()
      expect(userSchema.shape.email).toBeDefined()
      expect(taskSchema.shape.title).toBeDefined()
      // Check that calendarEventSchema has the validation methods
      expect(typeof calendarEventSchema.parse).toBe('function')
      expect(typeof calendarEventSchema.safeParse).toBe('function')
    })

    it('should have correct validation methods', () => {
      expect(typeof validateUserData).toBe('function')
      expect(typeof validateTaskData).toBe('function')
      expect(typeof validateEventData).toBe('function')
      expect(typeof validateTaskFormData).toBe('function')
      expect(typeof validateEventFormData).toBe('function')
    })

    it('should return consistent result structure', () => {
      const testData = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        title: '',
        status: 'pending' as const,
        priority: 'medium' as const,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const result = validateTaskData(testData)
      
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('error')
      expect(typeof result.success).toBe('boolean')
      expect(typeof result.error).toBe('object')
    })
  })
})