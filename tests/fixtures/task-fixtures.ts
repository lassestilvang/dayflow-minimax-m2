import type { DatabaseTask, TaskFormData } from '@/types/database'

// Task fixtures for consistent testing
export const taskFixtures = {
  // Basic valid tasks
  validTasks: [
    {
      id: 'task-001',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      title: 'Complete Project Documentation',
      description: 'Write comprehensive documentation for the new feature',
      priority: 'high' as const,
      status: 'pending' as const,
      progress: 0,
      dueDate: new Date('2024-02-15T17:00:00Z'),
      categoryId: null,
      recurrence: { type: 'none' },
      reminder: { enabled: false, minutesBefore: 15 },
      createdAt: new Date('2024-01-15T09:00:00Z'),
      updatedAt: new Date('2024-01-15T09:00:00Z'),
    },
    {
      id: 'task-002',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      title: 'Review Code Changes',
      description: 'Review pull requests and provide feedback',
      priority: 'medium' as const,
      status: 'in_progress' as const,
      progress: 50,
      dueDate: new Date('2024-01-20T12:00:00Z'),
      categoryId: 'category-001',
      recurrence: { type: 'none' },
      reminder: { enabled: false, minutesBefore: 15 },
      createdAt: new Date('2024-01-10T14:30:00Z'),
      updatedAt: new Date('2024-01-18T16:45:00Z'),
    },
    {
      id: 'task-003',
      userId: '123e4567-e89b-12d3-a456-426614174002',
      title: 'Update User Interface',
      description: 'Improve the dashboard layout and add dark mode support',
      priority: 'urgent' as const,
      status: 'completed' as const,
      progress: 100,
      dueDate: new Date('2024-01-25T10:00:00Z'),
      categoryId: 'category-002',
      recurrence: { type: 'none' },
      reminder: { enabled: false, minutesBefore: 15 },
      createdAt: new Date('2024-01-05T11:15:00Z'),
      updatedAt: new Date('2024-01-22T15:30:00Z'),
    },
    {
      id: 'task-004',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      title: 'Fix Database Migration',
      description: null,
      priority: 'low' as const,
      status: 'cancelled' as const,
      progress: 0,
      dueDate: null,
      categoryId: null,
      recurrence: { type: 'none' },
      reminder: { enabled: false, minutesBefore: 15 },
      createdAt: new Date('2024-01-08T08:20:00Z'),
      updatedAt: new Date('2024-01-12T13:10:00Z'),
    },
    {
      id: 'task-005',
      userId: '123e4567-e89b-12d3-a456-426614174003',
      title: 'Setup CI/CD Pipeline',
      description: 'Configure automated testing and deployment',
      priority: 'medium' as const,
      status: 'pending' as const,
      progress: 0,
      dueDate: new Date('2024-02-01T09:00:00Z'),
      categoryId: 'category-003',
      recurrence: { type: 'none' },
      reminder: { enabled: false, minutesBefore: 15 },
      createdAt: new Date('2024-01-12T10:45:00Z'),
      updatedAt: new Date('2024-01-12T10:45:00Z'),
    },
  ] as DatabaseTask[],

  // Tasks for different status scenarios
  tasksByStatus: {
    pending: [
      {
        id: 'pending-001',
        userId: 'user-001',
        title: 'Pending Task 1',
        priority: 'medium' as const,
        status: 'pending' as const,
        progress: 0,
      },
      {
        id: 'pending-002',
        userId: 'user-001',
        title: 'Pending Task 2',
        priority: 'high' as const,
        status: 'pending' as const,
        progress: 0,
      },
    ],
    inProgress: [
      {
        id: 'progress-001',
        userId: 'user-001',
        title: 'In Progress Task 1',
        priority: 'high' as const,
        status: 'in_progress' as const,
        progress: 25,
      },
      {
        id: 'progress-002',
        userId: 'user-001',
        title: 'In Progress Task 2',
        priority: 'medium' as const,
        status: 'in_progress' as const,
        progress: 75,
      },
    ],
    completed: [
      {
        id: 'completed-001',
        userId: 'user-001',
        title: 'Completed Task 1',
        priority: 'low' as const,
        status: 'completed' as const,
        progress: 100,
      },
    ],
    cancelled: [
      {
        id: 'cancelled-001',
        userId: 'user-001',
        title: 'Cancelled Task 1',
        priority: 'urgent' as const,
        status: 'cancelled' as const,
        progress: 0,
      },
    ],
  },

  // Tasks for different priority scenarios
  tasksByPriority: {
    urgent: [
      {
        id: 'urgent-001',
        userId: 'user-001',
        title: 'Urgent Task 1',
        priority: 'urgent' as const,
        status: 'pending' as const,
        dueDate: new Date('2024-01-16T09:00:00Z'),
      },
    ],
    high: [
      {
        id: 'high-001',
        userId: 'user-001',
        title: 'High Priority Task',
        priority: 'high' as const,
        status: 'in_progress' as const,
        dueDate: new Date('2024-01-20T17:00:00Z'),
      },
    ],
    medium: [
      {
        id: 'medium-001',
        userId: 'user-001',
        title: 'Medium Priority Task',
        priority: 'medium' as const,
        status: 'pending' as const,
        dueDate: new Date('2024-01-25T12:00:00Z'),
      },
    ],
    low: [
      {
        id: 'low-001',
        userId: 'user-001',
        title: 'Low Priority Task',
        priority: 'low' as const,
        status: 'pending' as const,
        dueDate: new Date('2024-02-01T15:00:00Z'),
      },
    ],
  },

  // Task form data for testing CRUD operations
  taskFormData: [
    {
      title: 'New Task Creation',
      description: 'Test task creation workflow',
      priority: 'medium' as const,
      dueDate: new Date('2024-02-01T10:00:00Z'),
    },
    {
      title: 'Task with Long Description',
      description: 'This is a task with a very long description that should be validated correctly. '.repeat(10),
      priority: 'high' as const,
    },
    {
      title: 'Simple Task',
      priority: 'low' as const,
      dueDate: null,
    },
  ] as TaskFormData[],

  // Task update data
  taskUpdateData: [
    {
      title: 'Updated Task Title',
      status: 'completed' as const,
      progress: 100,
    },
    {
      priority: 'urgent' as const,
      description: 'Updated description',
    },
    {
      status: 'in_progress' as const,
      progress: 60,
      dueDate: new Date('2024-02-15T14:00:00Z'),
    },
  ],

  // Invalid task data for validation testing
  invalidTaskData: [
    {
      title: '', // Empty title
      priority: 'medium' as const,
    },
    {
      title: 'a'.repeat(201), // Too long title
      priority: 'high' as const,
    },
    {
      title: 'Valid Title',
      description: 'a'.repeat(1001), // Too long description
      priority: 'medium' as const,
    },
    {
      title: 'Valid Title',
      priority: 'invalid_priority' as any, // Invalid priority
      status: 'pending' as const,
    },
    {
      title: 'Valid Title',
      priority: 'medium' as const,
      status: 'invalid_status' as any, // Invalid status
    },
  ],

  // Tasks for different date scenarios
  overdueTasks: [
    {
      id: 'overdue-001',
      userId: 'user-001',
      title: 'Overdue Task 1',
      priority: 'high' as const,
      status: 'pending' as const,
      dueDate: new Date('2024-01-01T09:00:00Z'), // Past date
    },
    {
      id: 'overdue-002',
      userId: 'user-001',
      title: 'Overdue Task 2',
      priority: 'urgent' as const,
      status: 'in_progress' as const,
      dueDate: new Date('2024-01-05T17:00:00Z'), // Past date
    },
  ],

  dueSoonTasks: [
    {
      id: 'due-soon-001',
      userId: 'user-001',
      title: 'Due Soon Task',
      priority: 'medium' as const,
      status: 'pending' as const,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    },
  ],

  tasksWithoutDueDate: [
    {
      id: 'no-date-001',
      userId: 'user-001',
      title: 'Task without due date',
      priority: 'low' as const,
      status: 'pending' as const,
      dueDate: null,
    },
  ],

  // Bulk operations data
  bulkOperations: {
    bulkUpdate: {
      ids: ['task-001', 'task-002', 'task-003'],
      updates: { status: 'completed' as const },
    },
    bulkDelete: {
      ids: ['task-004', 'task-005'],
    },
  },

  // Task templates for different scenarios
  taskTemplates: {
    development: {
      title: 'Development Task',
      description: 'Software development related task',
      priority: 'medium' as const,
      categoryId: 'category-development',
    },
    design: {
      title: 'Design Task',
      description: 'UI/UX design related task',
      priority: 'high' as const,
      categoryId: 'category-design',
    },
    testing: {
      title: 'Testing Task',
      description: 'Quality assurance and testing',
      priority: 'urgent' as const,
      categoryId: 'category-testing',
    },
    documentation: {
      title: 'Documentation Task',
      description: 'Documentation and content creation',
      priority: 'low' as const,
      categoryId: 'category-documentation',
    },
  },

  // Helper methods
  createTask(overrides: Partial<DatabaseTask> = {}): DatabaseTask {
    return {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: 'user-001',
      title: 'Test Task',
      description: 'Test task description',
      priority: 'medium' as const,
      status: 'pending' as const,
      progress: 0,
      dueDate: null,
      categoryId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }
  },

  createBulkTasks(count: number, baseData: Partial<DatabaseTask> = {}): DatabaseTask[] {
    return Array.from({ length: count }, (_, index) => 
      this.createTask({
        ...baseData,
        title: `Test Task ${index + 1}`,
        description: `Description for task ${index + 1}`,
      })
    )
  },

  // Generate tasks with specific characteristics
  generateTasksByCharacteristics() {
    return {
      allStatuses: this.tasksByStatus,
      allPriorities: this.tasksByPriority,
      overdueTasks: this.overdueTasks,
      dueSoonTasks: this.dueSoonTasks,
      tasksWithoutDueDate: this.tasksWithoutDueDate,
    }
  },

  // Task search scenarios
  searchScenarios: [
    {
      query: 'documentation',
      expectedCount: 1,
      expectedTask: 'Complete Project Documentation',
    },
    {
      query: 'code',
      expectedCount: 1,
      expectedTask: 'Review Code Changes',
    },
    {
      query: 'interface',
      expectedCount: 1,
      expectedTask: 'Update User Interface',
    },
    {
      query: 'nonexistent',
      expectedCount: 0,
      expectedTask: null,
    },
  ],

  // Task filtering scenarios
  filterScenarios: [
    {
      filter: { status: 'pending' as const },
      expectedCount: 2,
    },
    {
      filter: { priority: 'urgent' as const },
      expectedCount: 1,
    },
    {
      filter: { categoryId: 'category-001' },
      expectedCount: 1,
    },
    {
      filter: { status: 'completed' as const, priority: 'urgent' as const },
      expectedCount: 1,
    },
  ],

  // Mock API responses (will be populated after validTasks is defined)
  mockAPIResponses: {
    success: {
      task: null as any, // Will be set after validTasks is available
      message: 'Task created successfully',
    },
    failure: {
      error: 'Task creation failed',
      message: 'Invalid task data',
    },
    notFound: {
      error: 'Task not found',
      message: 'The requested task does not exist',
    },
  },
}

// Fix the mock API responses after validTasks is defined
taskFixtures.mockAPIResponses.success.task = taskFixtures.validTasks[0]

// Export type for fixture validation
export type TaskFixtures = typeof taskFixtures

// Export specific fixtures for easier imports
export const { 
  validTasks, 
  tasksByStatus, 
  tasksByPriority,
  taskFormData,
  overdueTasks,
  bulkOperations,
  mockAPIResponses 
} = taskFixtures