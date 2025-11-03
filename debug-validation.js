import { validateTaskData, validateUserData, validateEventData } from './lib/validations/schemas.ts'

console.log('Testing validation functions...')
console.log('validateTaskData:', typeof validateTaskData)
console.log('validateUserData:', typeof validateUserData)
console.log('validateEventData:', typeof validateEventData)

const testTaskData = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Test Task',
  description: 'Test Description',
  status: 'pending',
  priority: 'high',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const testUserData = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@example.com',
  name: 'Test User',
  workosId: 'workos-123',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const testEventData = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Test Event',
  startTime: new Date('2024-01-01T10:00:00Z'),
  endTime: new Date('2024-01-01T11:00:00Z'),
  isAllDay: false,
  userId: '550e8400-e29b-41d4-a716-446655440000',
  createdAt: new Date(),
  updatedAt: new Date(),
}

try {
  const taskResult = validateTaskData(testTaskData)
  console.log('Task validation result:', taskResult)
} catch (error) {
  console.error('Task validation error:', error)
}

try {
  const userResult = validateUserData(testUserData)
  console.log('User validation result:', userResult)
} catch (error) {
  console.error('User validation error:', error)
}

try {
  const eventResult = validateEventData(testEventData)
  console.log('Event validation result:', eventResult)
} catch (error) {
  console.error('Event validation error:', error)
}