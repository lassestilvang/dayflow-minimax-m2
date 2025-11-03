// Isolated validation tests to avoid mock pollution
import { describe, it, expect } from 'bun:test'

// Import validation functions directly without any mocks
import {
  validateUserData,
  validateTaskData,
  validateEventData,
  validateTaskInsertData,
  validateEventInsertData,
  validateTaskUpdateData,
  validateEventUpdateData,
  validateTaskFormData,
  validateEventFormData,
} from '@/lib/validations/schemas'

describe('Validation Schemas - Isolated', () => {
  describe('User Validation', () => {
    it('should validate correct user data', () => {
      const userData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        name: 'Test User',
        workosId: 'workos-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = validateUserData(userData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const userData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'invalid-email',
        name: 'Test User',
        workosId: 'workos-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = validateUserData(userData)
      expect(result.success).toBe(false)
    })

    it('should reject empty name', () => {
      const userData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        name: '',
        workosId: 'workos-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = validateUserData(userData)
      expect(result.success).toBe(false)
    })

    it('should reject too long name', () => {
      const userData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        name: 'a'.repeat(101),
        workosId: 'workos-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = validateUserData(userData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid image URL', () => {
      const userData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        name: 'Test User',
        image: 'not-a-url',
        workosId: 'workos-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = validateUserData(userData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid UUID', () => {
      const userData = {
        id: 'invalid-uuid',
        email: 'test@example.com',
        name: 'Test User',
        workosId: 'workos-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = validateUserData(userData)
      expect(result.success).toBe(false)
    })

    it('should accept missing optional fields', () => {
      const userData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = validateUserData(userData)
      expect(result.success).toBe(true)
    })
  })

  describe('Task Validation', () => {
    it('should validate correct task data', () => {
      const taskData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test Task',
        description: 'Test Description',
        status: 'pending',
        priority: 'high',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = validateTaskData(taskData)
      expect(result.success).toBe(true)
    })

    it('should validate correct task form data', () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        priority: 'high',
        dueDate: new Date(),
      }

      const result = validateTaskFormData(taskData)
      expect(result.success).toBe(true)
    })

    it('should reject empty title', () => {
      const taskData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: '',
        description: 'Test Description',
        status: 'pending',
        priority: 'high',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = validateTaskData(taskData)
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe('Title is required')
    })

    it('should reject too long title', () => {
      const taskData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'a'.repeat(201),
        description: 'Test Description',
        status: 'pending',
        priority: 'high',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = validateTaskData(taskData)
      expect(result.success).toBe(false)
    })

    it('should reject too long description', () => {
      const taskData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test Task',
        description: 'a'.repeat(1001),
        status: 'pending',
        priority: 'high',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = validateTaskData(taskData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid status', () => {
      const taskData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test Task',
        description: 'Test Description',
        status: 'invalid-status',
        priority: 'high',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = validateTaskData(taskData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid priority', () => {
      const taskData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test Task',
        description: 'Test Description',
        status: 'pending',
        priority: 'invalid-priority',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = validateTaskData(taskData)
      expect(result.success).toBe(false)
    })

    it('should accept valid enum values', () => {
      const taskData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test Task',
        status: 'pending',
        priority: 'high',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = validateTaskData(taskData)
      expect(result.success).toBe(true)
    })

    it('should apply default values', () => {
      const taskData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test Task',
        description: 'Test Description',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = validateTaskData(taskData)
      expect(result.success).toBe(true)
      expect((result as any).data?.status).toBe('pending')
    })
  })

  describe('Calendar Event Validation', () => {
    it('should validate correct event data', () => {
      const eventData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test Event',
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        isAllDay: false,
        userId: '550e8400-e29b-41d4-a716-446655440000',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = validateEventData(eventData)
      expect(result.success).toBe(true)
    })

    it('should validate correct event form data', () => {
      const eventData = {
        title: 'Test Event',
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        isAllDay: false,
      }

      const result = validateEventFormData(eventData)
      expect(result.success).toBe(true)
    })

    it('should reject empty title', () => {
      const eventData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: '',
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        isAllDay: false,
        userId: '550e8400-e29b-41d4-a716-446655440000',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = validateEventData(eventData)
      expect(result.success).toBe(false)
    })

    it('should reject end time before start time', () => {
      const eventData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test Event',
        startTime: new Date('2024-01-01T11:00:00Z'),
        endTime: new Date('2024-01-01T10:00:00Z'),
        isAllDay: false,
        userId: '550e8400-e29b-41d4-a716-446655440000',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = validateEventData(eventData)
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe('End time must be after start time')
    })

    it('should reject too long location', () => {
      const eventData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test Event',
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        isAllDay: false,
        location: 'a'.repeat(501),
        userId: '550e8400-e29b-41d4-a716-446655440000',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = validateEventData(eventData)
      expect(result.success).toBe(false)
    })

    it('should apply default isAllDay value', () => {
      const eventData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test Event',
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        userId: '550e8400-e29b-41d4-a716-446655440000',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = validateEventData(eventData)
      expect(result.success).toBe(true)
      expect((result as any).data?.isAllDay).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle null values correctly', () => {
      const result = validateTaskData(null)
      expect(result.success).toBe(false)
    })

    it('should handle undefined values correctly', () => {
      const result = validateTaskData(undefined)
      expect(result.success).toBe(false)
    })

    it('should validate boolean values', () => {
      const eventData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test Event',
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        isAllDay: true,
        userId: '550e8400-e29b-41d4-a716-446655440000',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = validateEventData(eventData)
      expect(result.success).toBe(true)
    })

    it('should reject non-boolean isAllDay value', () => {
      const eventData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test Event',
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        isAllDay: 'true' as any,
        userId: '550e8400-e29b-41d4-a716-446655440000',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = validateEventData(eventData)
      expect(result.success).toBe(false)
    })
  })

  describe('Schema Integration', () => {
    it('should create schemas correctly', () => {
      expect(typeof validateUserData).toBe('function')
      expect(typeof validateTaskData).toBe('function')
      expect(typeof validateEventData).toBe('function')
    })

    it('should have correct validation methods', () => {
      expect(typeof validateTaskInsertData).toBe('function')
      expect(typeof validateEventInsertData).toBe('function')
      expect(typeof validateTaskUpdateData).toBe('function')
      expect(typeof validateEventUpdateData).toBe('function')
    })

    it('should return consistent result structure', () => {
      const testData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test Task',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = validateTaskData(testData)
      expect(result).toHaveProperty('success')
    })
  })
})