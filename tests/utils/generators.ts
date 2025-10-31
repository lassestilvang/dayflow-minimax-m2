import type { DatabaseUser, DatabaseTask, DatabaseCalendarEvent, DatabaseCategory, DatabaseTag } from '@/types/database'

// Test data generators
export const generatorUtils = {
  // Generate random string
  generateRandomString(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  },

  // Generate random email
  generateRandomEmail(): string {
    const username = this.generateRandomString(8).toLowerCase()
    const domains = ['example.com', 'test.com', 'demo.org', 'mock.io']
    const domain = domains[Math.floor(Math.random() * domains.length)]
    return `${username}@${domain}`
  },

  // Generate random UUID
  generateRandomUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c == 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  },

  // Generate random phone number
  generateRandomPhone(): string {
    const countryCode = ['+1', '+44', '+49', '+33', '+81'][Math.floor(Math.random() * 5)]
    const number = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')
    return `${countryCode}${number}`
  },

  // Generate random name
  generateRandomName(): string {
    const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Emily', 'Chris', 'Lisa', 'Tom', 'Anna']
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez']
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    
    return `${firstName} ${lastName}`
  },

  // Generate random date within range
  generateRandomDate(start: Date = new Date('2020-01-01'), end: Date = new Date('2025-12-31')): Date {
    const startTime = start.getTime()
    const endTime = end.getTime()
    const randomTime = startTime + Math.random() * (endTime - startTime)
    return new Date(randomTime)
  },

  // Generate random color
  generateRandomColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#AED6F1', '#D2B4DE'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  },

  // Generate random priority
  generateRandomPriority(): 'low' | 'medium' | 'high' {
    const priorities: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high']
    return priorities[Math.floor(Math.random() * priorities.length)]
  },

  // Generate random status
  generateRandomStatus(): 'pending' | 'in-progress' | 'completed' | 'cancelled' {
    const statuses: Array<'pending' | 'in-progress' | 'completed' | 'cancelled'> = [
      'pending', 'in-progress', 'completed', 'cancelled'
    ]
    return statuses[Math.floor(Math.random() * statuses.length)]
  },

  // Generate bulk random data
  generateUsers(count: number = 1): DatabaseUser[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `user-${i + 1}`,
      email: this.generateRandomEmail(),
      name: this.generateRandomName(),
      workosId: `workos-${this.generateRandomString(8)}`,
      avatar: Math.random() > 0.5 ? this.generateRandomUUID() : null,
      createdAt: this.generateRandomDate(),
      updatedAt: this.generateRandomDate(),
    }))
  },

  generateTasks(count: number = 1, userIds: string[] = ['user-1']): DatabaseTask[] {
    const priorities: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high']
    const statuses: Array<'pending' | 'in-progress' | 'completed' | 'cancelled'> = [
      'pending', 'in-progress', 'completed', 'cancelled'
    ]

    return Array.from({ length: count }, (_, i) => ({
      id: `task-${i + 1}`,
      userId: userIds[i % userIds.length],
      title: `Task ${i + 1}: ${this.generateRandomString(20)}`,
      description: `Description for task ${i + 1}`,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      progress: Math.floor(Math.random() * 101),
      dueDate: Math.random() > 0.3 ? this.generateRandomDate() : null,
      categoryId: Math.random() > 0.5 ? `category-${Math.floor(Math.random() * 5) + 1}` : null,
      createdAt: this.generateRandomDate(),
      updatedAt: this.generateRandomDate(),
    }))
  },

  generateEvents(count: number = 1, userIds: string[] = ['user-1']): DatabaseCalendarEvent[] {
    return Array.from({ length: count }, (_, i) => {
      const startTime = this.generateRandomDate()
      const endTime = new Date(startTime.getTime() + Math.random() * 3600000 * 8) // 0-8 hours later
      
      return {
        id: `event-${i + 1}`,
        userId: userIds[i % userIds.length],
        title: `Event ${i + 1}: ${this.generateRandomString(20)}`,
        description: `Description for event ${i + 1}`,
        startTime,
        endTime,
        isAllDay: Math.random() > 0.8,
        location: Math.random() > 0.5 ? this.generateRandomString(10) : null,
        createdAt: this.generateRandomDate(),
        updatedAt: this.generateRandomDate(),
      }
    })
  },

  generateCategories(count: number = 1, userIds: string[] = ['user-1']): DatabaseCategory[] {
    const icons = ['folder', 'star', 'heart', 'check', 'clock', 'calendar', 'flag']
    const names = ['Work', 'Personal', 'Family', 'Finance', 'Health', 'Education', 'Travel', 'Shopping']

    return Array.from({ length: count }, (_, i) => ({
      id: `category-${i + 1}`,
      userId: userIds[i % userIds.length],
      name: names[i % names.length] || `Category ${i + 1}`,
      color: this.generateRandomColor(),
      icon: icons[Math.floor(Math.random() * icons.length)],
      createdAt: this.generateRandomDate(),
      updatedAt: this.generateRandomDate(),
    }))
  },

  generateTags(count: number = 1, userIds: string[] = ['user-1']): DatabaseTag[] {
    const tagNames = ['urgent', 'important', 'meeting', 'review', 'deadline', 'research', 'follow-up']

    return Array.from({ length: count }, (_, i) => ({
      id: `tag-${i + 1}`,
      userId: userIds[i % userIds.length],
      name: tagNames[i % tagNames.length] || `Tag ${i + 1}`,
      color: this.generateRandomColor(),
      createdAt: this.generateRandomDate(),
      updatedAt: this.generateRandomDate(),
    }))
  },

  // Generate related data sets
  generateCompleteUserWithData(userCount: number = 1, taskCount: number = 5, eventCount: number = 3) {
    const users = this.generateUsers(userCount)
    const userIds = users.map(u => u.id)
    
    const tasks = this.generateTasks(taskCount, userIds)
    const events = this.generateEvents(eventCount, userIds)
    const categories = this.generateCategories(Math.min(userCount, 5), userIds)
    const tags = this.generateTags(Math.min(taskCount, 8), userIds)

    return {
      users,
      tasks,
      events,
      categories,
      tags,
    }
  },

  // Generate performance test data
  generateLargeDataset(size: number = 1000) {
    const userIds = Array.from({ length: 10 }, (_, i) => `user-${i + 1}`)
    
    return {
      users: this.generateUsers(10),
      tasks: this.generateTasks(Math.floor(size * 0.6), userIds),
      events: this.generateEvents(Math.floor(size * 0.3), userIds),
      categories: this.generateCategories(20, userIds),
      tags: this.generateTags(50, userIds),
    }
  },

  // Generate edge case data
  generateEdgeCases() {
    return {
      emptyStrings: ['', ' ', '\t', '\n'],
      nullValues: [null, undefined],
      extremeNumbers: [0, -1, 1000000, Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER],
      invalidEmails: ['invalid', '@domain.com', 'user@', 'user.domain.com', 'user@domain'],
      invalidDates: [new Date('invalid'), new Date('1900-01-01'), new Date('2100-12-31')],
      longStrings: [this.generateRandomString(1000), this.generateRandomString(10000)],
      specialCharacters: ['\x00', '\x01', '\x1f', '\x7f', '\x80'],
    }
  },

  // Generate test scenarios
  generateTestScenarios() {
    return {
      // Task lifecycle scenarios
      taskLifecycle: [
        { status: 'pending', progress: 0 },
        { status: 'in-progress', progress: 50 },
        { status: 'completed', progress: 100 },
        { status: 'cancelled', progress: 0 },
      ],

      // Event scheduling scenarios
      eventTypes: [
        { isAllDay: false, duration: 1 }, // 1 hour
        { isAllDay: true, duration: 24 }, // 24 hours
        { isAllDay: false, duration: 0.5 }, // 30 minutes
        { isAllDay: false, duration: 8 }, // 8 hours
      ],

      // Priority scenarios
      priorityScenarios: [
        { priority: 'low', dueDate: this.generateRandomDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) },
        { priority: 'medium', dueDate: this.generateRandomDate(new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) },
        { priority: 'high', dueDate: this.generateRandomDate(new Date(), new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)) },
      ],

      // Error scenarios
      errorScenarios: [
        { networkError: true, timeoutError: false },
        { networkError: false, timeoutError: true },
        { networkError: false, timeoutError: false, validationError: true },
      ],
    }
  },
}