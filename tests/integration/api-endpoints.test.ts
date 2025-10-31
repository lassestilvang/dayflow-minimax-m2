import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { vi } from 'vitest'
import { createMockRequest, createMockResponse } from '@/tests/utils'
import { testFixtures } from '@/tests/fixtures'

// Mock the database and repositories
vi.mock('@/lib/db', () => ({
  db: {
    query: vi.fn(),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => [testFixtures.users.validUsers[0]]),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => [testFixtures.users.validUsers[0]]),
        })),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => [testFixtures.users.validUsers[0]]),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(() => [testFixtures.users.validUsers[0]]),
      })),
    })),
  },
}))

vi.mock('@/lib/data-access', () => ({
  userRepository: {
    create: vi.fn(),
    findByEmail: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  taskRepository: {
    create: vi.fn(),
    findByUserId: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    bulkUpdate: vi.fn(),
  },
  calendarEventRepository: {
    create: vi.fn(),
    findByUserId: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findConflicts: vi.fn(),
  },
}))

// Mock validation
vi.mock('@/lib/validations/schemas', () => ({
  validateUserData: vi.fn(),
  validateTaskData: vi.fn(),
  validateEventData: vi.fn(),
}))

describe('API Integration Tests', () => {
  describe('User Management Endpoints', () => {
    describe('POST /api/users', () => {
      it('should create a new user successfully', async () => {
        const { validateUserData } = require('@/lib/validations/schemas')
        const { userRepository } = require('@/lib/data-access')
        
        validateUserData.mockReturnValue({ success: true })
        userRepository.create.mockResolvedValue(testFixtures.users.validUsers[0])

        const request = createMockRequest({
          method: 'POST',
          body: {
            email: 'newuser@example.com',
            name: 'New User',
            workosId: 'workos_new123',
          },
        })

        const response = createMockResponse()

        // Import and call the API handler
        const { default: handler } = await import('@/app/api/users/route')
        await handler(request, response)

        expect(response.status).toHaveBeenCalledWith(201)
        expect(userRepository.create).toHaveBeenCalledWith({
          email: 'newuser@example.com',
          name: 'New User',
          workosId: 'workos_new123',
        })
      })

      it('should reject invalid user data', async () => {
        const { validateUserData } = require('@/lib/validations/schemas')
        validateUserData.mockReturnValue({ 
          success: false, 
          error: { message: 'Invalid email format' } 
        })

        const request = createMockRequest({
          method: 'POST',
          body: {
            email: 'invalid-email',
            name: 'Test User',
          },
        })

        const response = createMockResponse()

        const { default: handler } = await import('@/app/api/users/route')
        await handler(request, response)

        expect(response.status).toHaveBeenCalledWith(400)
      })

      it('should handle database errors gracefully', async () => {
        const { validateUserData } = require('@/lib/validations/schemas')
        const { userRepository } = require('@/lib/data-access')
        
        validateUserData.mockReturnValue({ success: true })
        userRepository.create.mockRejectedValue(new Error('Database connection failed'))

        const request = createMockRequest({
          method: 'POST',
          body: {
            email: 'newuser@example.com',
            name: 'New User',
            workosId: 'workos_new123',
          },
        })

        const response = createMockResponse()

        const { default: handler } = await import('@/app/api/users/route')
        await handler(request, response)

        expect(response.status).toHaveBeenCalledWith(500)
      })
    })

    describe('GET /api/users/[id]', () => {
      it('should fetch user by ID', async () => {
        const { userRepository } = require('@/lib/data-access')
        userRepository.findById.mockResolvedValue(testFixtures.users.validUsers[0])

        const request = createMockRequest({
          method: 'GET',
          params: { id: '123e4567-e89b-12d3-a456-426614174001' },
        })

        const response = createMockResponse()

        const { default: handler } = await import('@/app/api/users/[id]/route')
        await handler(request, response)

        expect(response.status).toHaveBeenCalledWith(200)
        expect(userRepository.findById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174001')
      })

      it('should return 404 for non-existent user', async () => {
        const { userRepository } = require('@/lib/data-access')
        userRepository.findById.mockResolvedValue(null)

        const request = createMockRequest({
          method: 'GET',
          params: { id: 'nonexistent-id' },
        })

        const response = createMockResponse()

        const { default: handler } = await import('@/app/api/users/[id]/route')
        await handler(request, response)

        expect(response.status).toHaveBeenCalledWith(404)
      })
    })

    describe('PUT /api/users/[id]', () => {
      it('should update user successfully', async () => {
        const { userRepository } = require('@/lib/data-access')
        const { validateUserData } = require('@/lib/validations/schemas')
        
        validateUserData.mockReturnValue({ success: true })
        userRepository.update.mockResolvedValue(testFixtures.users.validUsers[0])

        const request = createMockRequest({
          method: 'PUT',
          params: { id: '123e4567-e89b-12d3-a456-426614174001' },
          body: { name: 'Updated Name' },
        })

        const response = createMockResponse()

        const { default: handler } = await import('@/app/api/users/[id]/route')
        await handler(request, response)

        expect(response.status).toHaveBeenCalledWith(200)
        expect(userRepository.update).toHaveBeenCalledWith(
          '123e4567-e89b-12d3-a456-426614174001',
          { name: 'Updated Name' }
        )
      })
    })

    describe('DELETE /api/users/[id]', () => {
      it('should delete user successfully', async () => {
        const { userRepository } = require('@/lib/data-access')
        userRepository.delete.mockResolvedValue(testFixtures.users.validUsers[0])

        const request = createMockRequest({
          method: 'DELETE',
          params: { id: '123e4567-e89b-12d3-a456-426614174001' },
        })

        const response = createMockResponse()

        const { default: handler } = await import('@/app/api/users/[id]/route')
        await handler(request, response)

        expect(response.status).toHaveBeenCalledWith(200)
        expect(userRepository.delete).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174001')
      })
    })
  })

  describe('Task Management Endpoints', () => {
    describe('GET /api/tasks', () => {
      it('should fetch tasks for authenticated user', async () => {
        const { taskRepository } = require('@/lib/data-access')
        taskRepository.findByUserId.mockResolvedValue(testFixtures.tasks.validTasks)

        const request = createMockRequest({
          method: 'GET',
          headers: { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' },
        })

        const response = createMockResponse()

        const { default: handler } = await import('@/app/api/tasks/route')
        await handler(request, response)

        expect(response.status).toHaveBeenCalledWith(200)
        expect(taskRepository.findByUserId).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174001')
      })

      it('should require authentication', async () => {
        const request = createMockRequest({
          method: 'GET',
        })

        const response = createMockResponse()

        const { default: handler } = await import('@/app/api/tasks/route')
        await handler(request, response)

        expect(response.status).toHaveBeenCalledWith(401)
      })
    })

    describe('POST /api/tasks', () => {
      it('should create a new task', async () => {
        const { taskRepository } = require('@/lib/data-access')
        const { validateTaskData } = require('@/lib/validations/schemas')
        
        validateTaskData.mockReturnValue({ success: true })
        taskRepository.create.mockResolvedValue(testFixtures.tasks.validTasks[0])

        const request = createMockRequest({
          method: 'POST',
          headers: { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' },
          body: {
            title: 'New Task',
            description: 'Task description',
            priority: 'medium',
            status: 'pending',
          },
        })

        const response = createMockResponse()

        const { default: handler } = await import('@/app/api/tasks/route')
        await handler(request, response)

        expect(response.status).toHaveBeenCalledWith(201)
        expect(taskRepository.create).toHaveBeenCalled()
      })

      it('should reject invalid task data', async () => {
        const { validateTaskData } = require('@/lib/validations/schemas')
        validateTaskData.mockReturnValue({ 
          success: false, 
          error: { message: 'Invalid task data' } 
        })

        const request = createMockRequest({
          method: 'POST',
          headers: { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' },
          body: { title: '' }, // Invalid - empty title
        })

        const response = createMockResponse()

        const { default: handler } = await import('@/app/api/tasks/route')
        await handler(request, response)

        expect(response.status).toHaveBeenCalledWith(400)
      })
    })

    describe('PUT /api/tasks/[id]', () => {
      it('should update existing task', async () => {
        const { taskRepository } = require('@/lib/data-access')
        taskRepository.findById.mockResolvedValue(testFixtures.tasks.validTasks[0])
        taskRepository.update.mockResolvedValue(testFixtures.tasks.validTasks[0])

        const request = createMockRequest({
          method: 'PUT',
          params: { id: 'task-001' },
          headers: { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' },
          body: { status: 'completed', progress: 100 },
        })

        const response = createMockResponse()

        const { default: handler } = await import('@/app/api/tasks/[id]/route')
        await handler(request, response)

        expect(response.status).toHaveBeenCalledWith(200)
        expect(taskRepository.update).toHaveBeenCalled()
      })

      it('should return 404 for non-existent task', async () => {
        const { taskRepository } = require('@/lib/data-access')
        taskRepository.findById.mockResolvedValue(null)

        const request = createMockRequest({
          method: 'PUT',
          params: { id: 'nonexistent-task' },
          headers: { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' },
          body: { status: 'completed' },
        })

        const response = createMockResponse()

        const { default: handler } = await import('@/app/api/tasks/[id]/route')
        await handler(request, response)

        expect(response.status).toHaveBeenCalledWith(404)
      })
    })

    describe('DELETE /api/tasks/[id]', () => {
      it('should delete task successfully', async () => {
        const { taskRepository } = require('@/lib/data-access')
        taskRepository.findById.mockResolvedValue(testFixtures.tasks.validTasks[0])
        taskRepository.delete.mockResolvedValue(testFixtures.tasks.validTasks[0])

        const request = createMockRequest({
          method: 'DELETE',
          params: { id: 'task-001' },
          headers: { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' },
        })

        const response = createMockResponse()

        const { default: handler } = await import('@/app/api/tasks/[id]/route')
        await handler(request, response)

        expect(response.status).toHaveBeenCalledWith(200)
        expect(taskRepository.delete).toHaveBeenCalledWith('task-001')
      })
    })

    describe('POST /api/tasks/bulk', () => {
      it('should perform bulk operations', async () => {
        const { taskRepository } = require('@/lib/data-access')
        taskRepository.bulkUpdate.mockResolvedValue([testFixtures.tasks.validTasks[0], testFixtures.tasks.validTasks[1]])

        const request = createMockRequest({
          method: 'POST',
          headers: { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' },
          body: {
            action: 'update',
            ids: ['task-001', 'task-002'],
            updates: { status: 'completed' },
          },
        })

        const response = createMockResponse()

        const { default: handler } = await import('@/app/api/tasks/bulk/route')
        await handler(request, response)

        expect(response.status).toHaveBeenCalledWith(200)
        expect(taskRepository.bulkUpdate).toHaveBeenCalledWith({
          ids: ['task-001', 'task-002'],
          updates: { status: 'completed' },
        })
      })

      it('should validate bulk operation parameters', async () => {
        const request = createMockRequest({
          method: 'POST',
          headers: { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' },
          body: {
            action: 'invalid-action',
            ids: [],
            updates: {},
          },
        })

        const response = createMockResponse()

        const { default: handler } = await import('@/app/api/tasks/bulk/route')
        await handler(request, response)

        expect(response.status).toHaveBeenCalledWith(400)
      })
    })
  })

  describe('Calendar Events Endpoints', () => {
    describe('GET /api/calendar/events', () => {
      it('should fetch events for date range', async () => {
        const { calendarEventRepository } = require('@/lib/data-access')
        calendarEventRepository.findByUserId.mockResolvedValue(testFixtures.events.validEvents)

        const request = createMockRequest({
          method: 'GET',
          headers: { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' },
          searchParams: {
            start: '2024-01-01T00:00:00Z',
            end: '2024-01-31T23:59:59Z',
          },
        })

        const response = createMockResponse()

        const { default: handler } = await import('@/app/api/calendar/events/route')
        await handler(request, response)

        expect(response.status).toHaveBeenCalledWith(200)
        expect(calendarEventRepository.findByUserId).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174001')
      })
    })

    describe('POST /api/calendar/events', () => {
      it('should create new calendar event', async () => {
        const { calendarEventRepository } = require('@/lib/data-access')
        const { validateEventData } = require('@/lib/validations/schemas')
        
        validateEventData.mockReturnValue({ success: true })
        calendarEventRepository.create.mockResolvedValue(testFixtures.events.validEvents[0])

        const request = createMockRequest({
          method: 'POST',
          headers: { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' },
          body: {
            title: 'New Event',
            description: 'Event description',
            startTime: '2024-02-01T10:00:00Z',
            endTime: '2024-02-01T11:00:00Z',
            isAllDay: false,
          },
        })

        const response = createMockResponse()

        const { default: handler } = await import('@/app/api/calendar/events/route')
        await handler(request, response)

        expect(response.status).toHaveBeenCalledWith(201)
        expect(calendarEventRepository.create).toHaveBeenCalled()
      })

      it('should detect and handle event conflicts', async () => {
        const { calendarEventRepository } = require('@/lib/data-access')
        const { validateEventData } = require('@/lib/validations/schemas')
        
        validateEventData.mockReturnValue({ success: true })
        calendarEventRepository.findConflicts.mockResolvedValue([{
          id: 'conflicting-event',
          title: 'Conflicting Event',
        }])
        calendarEventRepository.create.mockResolvedValue(testFixtures.events.validEvents[0])

        const request = createMockRequest({
          method: 'POST',
          headers: { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' },
          body: {
            title: 'Conflicting Event',
            startTime: '2024-02-01T10:00:00Z',
            endTime: '2024-02-01T11:00:00Z',
            isAllDay: false,
          },
        })

        const response = createMockResponse()

        const { default: handler } = await import('@/app/api/calendar/events/route')
        await handler(request, response)

        expect(response.status).toHaveBeenCalledWith(201)
        expect(calendarEventRepository.findConflicts).toHaveBeenCalled()
      })
    })

    describe('GET /api/calendar/events/[id]', () => {
      it('should fetch specific event', async () => {
        const { calendarEventRepository } = require('@/lib/data-access')
        calendarEventRepository.findById.mockResolvedValue(testFixtures.events.validEvents[0])

        const request = createMockRequest({
          method: 'GET',
          params: { id: 'event-001' },
          headers: { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' },
        })

        const response = createMockResponse()

        const { default: handler } = await import('@/app/api/calendar/events/[id]/route')
        await handler(request, response)

        expect(response.status).toHaveBeenCalledWith(200)
        expect(calendarEventRepository.findById).toHaveBeenCalledWith('event-001')
      })
    })
  })

  describe('Integration Endpoints', () => {
    describe('GET /api/integrations', () => {
      it('should fetch user integrations', async () => {
        const { integrationFixtures } = testFixtures
        
        const request = createMockRequest({
          method: 'GET',
          headers: { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' },
        })

        const response = createMockResponse()

        const { default: handler } = await import('@/app/api/integrations/route')
        await handler(request, response)

        expect(response.status).toHaveBeenCalledWith(200)
      })
    })

    describe('POST /api/integrations/[service]/connect', () => {
      it('should initiate OAuth flow', async () => {
        const request = createMockRequest({
          method: 'POST',
          params: { service: 'google-calendar' },
          headers: { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' },
          body: {
            redirectUri: 'https://app.dayflow.com/callback',
            scopes: ['calendar', 'calendar.events'],
          },
        })

        const response = createMockResponse()

        const { default: handler } = await import('@/app/api/integrations/[service]/connect/route')
        await handler(request, response)

        expect(response.status).toHaveBeenCalledWith(200)
      })

      it('should handle invalid service parameters', async () => {
        const request = createMockRequest({
          method: 'POST',
          params: { service: 'invalid-service' },
          headers: { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' },
        })

        const response = createMockResponse()

        const { default: handler } = await import('@/app/api/integrations/[service]/connect/route')
        await handler(request, response)

        expect(response.status).toHaveBeenCalledWith(400)
      })
    })

    describe('POST /api/integrations/[service]/sync', () => {
      it('should trigger synchronization', async () => {
        const request = createMockRequest({
          method: 'POST',
          params: { service: 'google-calendar' },
          headers: { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' },
          body: {
            syncType: 'incremental',
            lastSync: '2024-01-01T00:00:00Z',
          },
        })

        const response = createMockResponse()

        const { default: handler } = await import('@/app/api/integrations/[service]/sync/route')
        await handler(request, response)

        expect(response.status).toHaveBeenCalledWith(200)
      })
    })
  })

  describe('Middleware and Authentication', () => {
    it('should validate request headers', async () => {
      const request = createMockRequest({
        method: 'GET',
        headers: {}, // Missing authentication header
      })

      const response = createMockResponse()

      // Test authentication middleware
      const { authMiddleware } = await import('@/app/api/_middleware/auth')
      await authMiddleware(request, response)

      expect(response.status).toHaveBeenCalledWith(401)
    })

    it('should validate request body size', async () => {
      const largeBody = 'a'.repeat(1000000) // 1MB body
      const request = createMockRequest({
        method: 'POST',
        body: largeBody,
        headers: {
          'content-length': '1000000',
        },
      })

      const response = createMockResponse()

      const { sizeMiddleware } = await import('@/app/api/_middleware/size')
      await sizeMiddleware(request, response)

      expect(response.status).toHaveBeenCalledWith(413)
    })

    it('should handle CORS preflight requests', async () => {
      const request = createMockRequest({
        method: 'OPTIONS',
        headers: {
          'origin': 'https://example.com',
          'access-control-request-method': 'POST',
        },
      })

      const response = createMockResponse()

      const { corsMiddleware } = await import('@/app/api/_middleware/cors')
      await corsMiddleware(request, response)

      expect(response.status).toHaveBeenCalledWith(200)
    })
  })

  describe('Error Handling', () => {
    it('should handle 404 for undefined routes', async () => {
      const request = createMockRequest({
        method: 'GET',
        params: { path: 'nonexistent' },
      })

      const response = createMockResponse()

      const { default: handler } = await import('@/app/api/[...path]/route')
      await handler(request, response)

      expect(response.status).toHaveBeenCalledWith(404)
    })

    it('should handle server errors gracefully', async () => {
      const { userRepository } = require('@/lib/data-access')
      userRepository.findById.mockRejectedValue(new Error('Server error'))

      const request = createMockRequest({
        method: 'GET',
        params: { id: '123e4567-e89b-12d3-a456-426614174001' },
      })

      const response = createMockResponse()

      const { default: handler } = await import('@/app/api/users/[id]/route')
      await handler(request, response)

      expect(response.status).toHaveBeenCalledWith(500)
    })

    it('should provide meaningful error messages', async () => {
      const request = createMockRequest({
        method: 'GET',
        params: { id: 'invalid-id' },
      })

      const response = createMockResponse()

      const { default: handler } = await import('@/app/api/users/[id]/route')
      await handler(request, response)

      expect(response.json).toHaveBeenCalled()
      const errorData = response.json.mock.calls[0][0]
      expect(errorData).toHaveProperty('error')
      expect(errorData).toHaveProperty('message')
    })
  })

  describe('Performance and Rate Limiting', () => {
    it('should handle rate limiting', async () => {
      // Mock multiple requests from same IP
      const requests = Array.from({ length: 101 }, () => 
        createMockRequest({
          method: 'GET',
          headers: { 'x-forwarded-for': '127.0.0.1' },
        })
      )

      const { rateLimitMiddleware } = await import('@/app/api/_middleware/rateLimit')
      
      for (let i = 0; i < 100; i++) {
        const response = createMockResponse()
        await rateLimitMiddleware(requests[i], response)
        expect(response.status).toHaveBeenCalledWith(200)
      }

      // 101st request should be rate limited
      const response = createMockResponse()
      await rateLimitMiddleware(requests[100], response)
      expect(response.status).toHaveBeenCalledWith(429)
    })
  })
})