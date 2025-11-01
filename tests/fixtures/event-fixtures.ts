import type { DatabaseCalendarEvent, EventFormData } from '@/types/database'

// Calendar event fixtures for consistent testing
export const eventFixtures = {
  // Basic valid events
  validEvents: [
    {
      id: 'event-001',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      title: 'Team Standup',
      description: 'Daily team standup meeting to discuss progress and blockers',
      startTime: new Date('2024-01-15T09:00:00Z'),
      endTime: new Date('2024-01-15T09:30:00Z'),
      isAllDay: false,
      location: 'Conference Room A',
      categoryId: null,
      recurrence: { type: 'none' },
      reminder: { enabled: false, minutesBefore: 15 },
      createdAt: new Date('2024-01-14T16:30:00Z'),
      updatedAt: new Date('2024-01-14T16:30:00Z'),
    },
    {
      id: 'event-002',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      title: 'Project Review Meeting',
      description: 'Quarterly project review with stakeholders',
      startTime: new Date('2024-01-16T14:00:00Z'),
      endTime: new Date('2024-01-16T16:00:00Z'),
      isAllDay: false,
      location: 'Executive Conference Room',
      categoryId: null,
      recurrence: { type: 'none' },
      reminder: { enabled: false, minutesBefore: 15 },
      createdAt: new Date('2024-01-10T11:20:00Z'),
      updatedAt: new Date('2024-01-12T09:45:00Z'),
    },
    {
      id: 'event-003',
      userId: '123e4567-e89b-12d3-a456-426614174002',
      title: 'All-Day Training Session',
      description: 'Company-wide training on new security protocols',
      startTime: new Date('2024-01-17T00:00:00Z'),
      endTime: new Date('2024-01-17T23:59:59Z'),
      isAllDay: true,
      location: null,
      categoryId: null,
      recurrence: { type: 'none' },
      reminder: { enabled: false, minutesBefore: 15 },
      createdAt: new Date('2024-01-15T13:15:00Z'),
      updatedAt: new Date('2024-01-15T13:15:00Z'),
    },
    {
      id: 'event-004',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      title: 'Client Presentation',
      description: null,
      startTime: new Date('2024-01-18T10:00:00Z'),
      endTime: new Date('2024-01-18T11:30:00Z'),
      isAllDay: false,
      location: 'Client Office - Downtown',
      categoryId: null,
      recurrence: { type: 'none' },
      reminder: { enabled: false, minutesBefore: 15 },
      createdAt: new Date('2024-01-12T08:30:00Z'),
      updatedAt: new Date('2024-01-13T14:20:00Z'),
    },
    {
      id: 'event-005',
      userId: '123e4567-e89b-12d3-a456-426614174003',
      title: 'Team Lunch',
      description: 'Monthly team building lunch',
      startTime: new Date('2024-01-19T12:00:00Z'),
      endTime: new Date('2024-01-19T13:00:00Z'),
      isAllDay: false,
      location: 'Local Restaurant - The Garden',
      categoryId: null,
      recurrence: { type: 'none' },
      reminder: { enabled: false, minutesBefore: 15 },
      createdAt: new Date('2024-01-16T10:00:00Z'),
      updatedAt: new Date('2024-01-16T10:00:00Z'),
    },
  ] as DatabaseCalendarEvent[],

  // Events for different time scenarios
  eventsByTimeType: {
    allDayEvents: [
      {
        id: 'allday-001',
        userId: 'user-001',
        title: 'Company Holiday',
        startTime: new Date('2024-01-20T00:00:00Z'),
        endTime: new Date('2024-01-20T23:59:59Z'),
        isAllDay: true,
      },
    ],
    timedEvents: [
      {
        id: 'timed-001',
        userId: 'user-001',
        title: 'Quick Meeting',
        startTime: new Date('2024-01-21T09:00:00Z'),
        endTime: new Date('2024-01-21T09:15:00Z'),
        isAllDay: false,
      },
      {
        id: 'timed-002',
        userId: 'user-001',
        title: 'Long Workshop',
        startTime: new Date('2024-01-22T08:00:00Z'),
        endTime: new Date('2024-01-22T17:00:00Z'),
        isAllDay: false,
      },
    ],
  },

  // Events for collision testing
  conflictingEvents: [
    {
      id: 'conflict-001',
      userId: 'user-001',
      title: 'First Event',
      description: null,
      startTime: new Date('2024-01-23T10:00:00Z'),
      endTime: new Date('2024-01-23T11:00:00Z'),
      isAllDay: false,
      location: null,
      categoryId: null,
      recurrence: { type: 'none' },
      reminder: { enabled: false, minutesBefore: 15 },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'conflict-002',
      userId: 'user-001',
      title: 'Overlapping Event',
      description: null,
      startTime: new Date('2024-01-23T10:30:00Z'),
      endTime: new Date('2024-01-23T11:30:00Z'),
      isAllDay: false,
      location: null,
      categoryId: null,
      recurrence: { type: 'none' },
      reminder: { enabled: false, minutesBefore: 15 },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'conflict-003',
      userId: 'user-001',
      title: 'Non-overlapping Event',
      description: null,
      startTime: new Date('2024-01-23T11:00:00Z'),
      endTime: new Date('2024-01-23T12:00:00Z'),
      isAllDay: false,
      location: null,
      categoryId: null,
      recurrence: { type: 'none' },
      reminder: { enabled: false, minutesBefore: 15 },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],

  // Events for different weeks
  weeklyEvents: {
    currentWeek: [
      {
        id: 'week-001',
        userId: 'user-001',
        title: 'Monday Event',
        description: null,
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T11:00:00Z'),
        isAllDay: false,
        location: null,
        categoryId: null,
        recurrence: { type: 'none' },
        reminder: { enabled: false, minutesBefore: 15 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'week-002',
        userId: 'user-001',
        title: 'Wednesday Event',
        description: null,
        startTime: new Date('2024-01-17T14:00:00Z'),
        endTime: new Date('2024-01-17T15:00:00Z'),
        isAllDay: false,
        location: null,
        categoryId: null,
        recurrence: { type: 'none' },
        reminder: { enabled: false, minutesBefore: 15 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    nextWeek: [
      {
        id: 'next-week-001',
        userId: 'user-001',
        title: 'Next Monday Event',
        description: null,
        startTime: new Date('2024-01-22T10:00:00Z'),
        endTime: new Date('2024-01-22T11:00:00Z'),
        isAllDay: false,
        location: null,
        categoryId: null,
        recurrence: { type: 'none' },
        reminder: { enabled: false, minutesBefore: 15 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    previousWeek: [
      {
        id: 'prev-week-001',
        userId: 'user-001',
        title: 'Previous Friday Event',
        description: null,
        startTime: new Date('2024-01-12T15:00:00Z'),
        endTime: new Date('2024-01-12T16:00:00Z'),
        isAllDay: false,
        location: null,
        categoryId: null,
        recurrence: { type: 'none' },
        reminder: { enabled: false, minutesBefore: 15 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  },

  // Event form data for testing CRUD operations
  eventFormData: [
    {
      title: 'New Event Creation',
      description: 'Test event creation workflow',
      startTime: new Date('2024-02-01T10:00:00Z'),
      endTime: new Date('2024-02-01T11:00:00Z'),
      isAllDay: false,
      location: 'Conference Room B',
    },
    {
      title: 'All-Day Workshop',
      description: 'Full day workshop on new technologies',
      startTime: new Date('2024-02-02T00:00:00Z'),
      endTime: new Date('2024-02-02T23:59:59Z'),
      isAllDay: true,
      location: null,
    },
    {
      title: 'Simple Meeting',
      startTime: new Date('2024-02-03T14:30:00Z'),
      endTime: new Date('2024-02-03T15:00:00Z'),
      isAllDay: false,
    },
  ] as EventFormData[],

  // Event update data
  eventUpdateData: [
    {
      title: 'Updated Event Title',
      location: 'New Conference Room',
    },
    {
      description: 'Updated event description',
      startTime: new Date('2024-02-01T11:00:00Z'),
      endTime: new Date('2024-02-01T12:00:00Z'),
    },
    {
      isAllDay: true,
      location: null,
    },
  ],

  // Invalid event data for validation testing
  invalidEventData: [
    {
      title: '', // Empty title
      startTime: new Date('2024-02-01T10:00:00Z'),
      endTime: new Date('2024-02-01T11:00:00Z'),
      isAllDay: false,
    },
    {
      title: 'a'.repeat(201), // Too long title
      startTime: new Date('2024-02-01T10:00:00Z'),
      endTime: new Date('2024-02-01T11:00:00Z'),
      isAllDay: false,
    },
    {
      title: 'Valid Title',
      description: 'a'.repeat(1001), // Too long description
      startTime: new Date('2024-02-01T10:00:00Z'),
      endTime: new Date('2024-02-01T11:00:00Z'),
      isAllDay: false,
    },
    {
      title: 'Valid Title',
      location: 'a'.repeat(501), // Too long location
      startTime: new Date('2024-02-01T10:00:00Z'),
      endTime: new Date('2024-02-01T11:00:00Z'),
      isAllDay: false,
    },
    {
      title: 'Valid Title',
      startTime: new Date('2024-02-01T11:00:00Z'), // End before start
      endTime: new Date('2024-02-01T10:00:00Z'),
      isAllDay: false,
    },
  ],

  // Events for different location scenarios
  eventsByLocation: {
    withLocation: [
      {
        id: 'location-001',
        userId: 'user-001',
        title: 'Event with Location',
        description: null,
        startTime: new Date('2024-02-05T10:00:00Z'),
        endTime: new Date('2024-02-05T11:00:00Z'),
        isAllDay: false,
        location: 'Conference Room A - Floor 5',
        categoryId: null,
        recurrence: { type: 'none' },
        reminder: { enabled: false, minutesBefore: 15 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    withoutLocation: [
      {
        id: 'no-location-001',
        userId: 'user-001',
        title: 'Event without Location',
        description: null,
        startTime: new Date('2024-02-06T14:00:00Z'),
        endTime: new Date('2024-02-06T15:00:00Z'),
        isAllDay: false,
        location: null,
        categoryId: null,
        recurrence: { type: 'none' },
        reminder: { enabled: false, minutesBefore: 15 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  },

  // Events for drag and drop testing
  dragDropEvents: [
    {
      id: 'drag-001',
      userId: 'user-001',
      title: 'Draggable Event 1',
      description: null,
      startTime: new Date('2024-02-07T09:00:00Z'),
      endTime: new Date('2024-02-07T10:00:00Z'),
      isAllDay: false,
      location: null,
      categoryId: null,
      recurrence: { type: 'none' },
      reminder: { enabled: false, minutesBefore: 15 },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'drag-002',
      userId: 'user-001',
      title: 'Draggable Event 2',
      description: null,
      startTime: new Date('2024-02-07T10:30:00Z'),
      endTime: new Date('2024-02-07T11:30:00Z'),
      isAllDay: false,
      location: null,
      categoryId: null,
      recurrence: { type: 'none' },
      reminder: { enabled: false, minutesBefore: 15 },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],

  // Events for resizing testing
  resizableEvents: [
    {
      id: 'resize-001',
      userId: 'user-001',
      title: 'Resizable Event',
      description: null,
      startTime: new Date('2024-02-08T10:00:00Z'),
      endTime: new Date('2024-02-08T11:00:00Z'),
      isAllDay: false,
      location: null,
      categoryId: null,
      recurrence: { type: 'none' },
      reminder: { enabled: false, minutesBefore: 15 },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],

  // Bulk operations data
  bulkOperations: {
    bulkUpdate: {
      ids: ['event-001', 'event-002', 'event-003'],
      updates: { location: 'Updated Location' },
    },
    bulkDelete: {
      ids: ['event-004', 'event-005'],
    },
  },

  // Event templates for different scenarios
  eventTemplates: {
    meeting: {
      title: 'Team Meeting',
      description: 'Regular team meeting',
      isAllDay: false,
      location: 'Conference Room A',
    },
    workshop: {
      title: 'Training Workshop',
      description: 'Educational workshop session',
      isAllDay: false,
      location: 'Training Center',
    },
    conference: {
      title: 'Industry Conference',
      description: 'External industry conference',
      isAllDay: true,
      location: 'Convention Center',
    },
    personal: {
      title: 'Personal Appointment',
      description: 'Personal appointment or meeting',
      isAllDay: false,
      location: null,
    },
  },

  // Helper methods
  createEvent(overrides: Partial<DatabaseCalendarEvent> = {}): DatabaseCalendarEvent {
    return {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: 'user-001',
      title: 'Test Event',
      description: 'Test event description',
      startTime: new Date('2024-02-01T10:00:00Z'),
      endTime: new Date('2024-02-01T11:00:00Z'),
      isAllDay: false,
      location: 'Test Location',
      categoryId: null,
      recurrence: { type: 'none' },
      reminder: { enabled: false, minutesBefore: 15 },
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }
  },

  createBulkEvents(count: number, baseData: Partial<DatabaseCalendarEvent> = {}): DatabaseCalendarEvent[] {
    return Array.from({ length: count }, (_, index) => 
      this.createEvent({
        ...baseData,
        title: `Test Event ${index + 1}`,
        description: `Description for event ${index + 1}`,
        startTime: new Date(2024, 0, 1 + index, 10 + Math.floor(index / 8), 0, 0),
        endTime: new Date(2024, 0, 1 + index, 11 + Math.floor(index / 8), 0, 0),
      })
    )
  },

  // Generate events with specific characteristics
  generateEventsByCharacteristics() {
    return {
      allDayEvents: this.eventsByTimeType.allDayEvents,
      timedEvents: this.eventsByTimeType.timedEvents,
      conflictingEvents: this.conflictingEvents,
      eventsWithLocation: this.eventsByLocation.withLocation,
      eventsWithoutLocation: this.eventsByLocation.withoutLocation,
    }
  },

  // Event search scenarios
  searchScenarios: [
    {
      query: 'team',
      expectedCount: 2,
      expectedEvents: ['Team Standup', 'Team Lunch'],
    },
    {
      query: 'meeting',
      expectedCount: 2,
      expectedEvents: ['Team Standup', 'Project Review Meeting'],
    },
    {
      query: 'training',
      expectedCount: 1,
      expectedEvents: ['All-Day Training Session'],
    },
    {
      query: 'nonexistent',
      expectedCount: 0,
      expectedEvents: [],
    },
  ],

  // Event filtering scenarios
  filterScenarios: [
    {
      filter: { isAllDay: true },
      expectedCount: 1,
    },
    {
      filter: { hasLocation: true },
      expectedCount: 4,
    },
    {
      filter: { dateRange: { start: new Date('2024-01-15'), end: new Date('2024-01-17') } },
      expectedCount: 3,
    },
  ],

  // Mock API responses (will be populated after validEvents is defined)
  mockAPIResponses: {
    success: {
      event: null as any, // Will be set after validEvents is available
      message: 'Event created successfully',
    },
    failure: {
      error: 'Event creation failed',
      message: 'Invalid event data',
    },
    conflict: {
      error: 'Event conflict detected',
      message: 'The event conflicts with an existing event',
    },
    notFound: {
      error: 'Event not found',
      message: 'The requested event does not exist',
    },
  },

  // Event duration scenarios
  durationScenarios: {
    shortEvents: [
      {
        id: 'short-001',
        userId: 'user-001',
        title: '15 Minute Meeting',
        description: null,
        startTime: new Date('2024-02-10T10:00:00Z'),
        endTime: new Date('2024-02-10T10:15:00Z'),
        isAllDay: false,
        location: null,
        categoryId: null,
        recurrence: { type: 'none' },
        reminder: { enabled: false, minutesBefore: 15 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    mediumEvents: [
      {
        id: 'medium-001',
        userId: 'user-001',
        title: '1 Hour Meeting',
        description: null,
        startTime: new Date('2024-02-10T11:00:00Z'),
        endTime: new Date('2024-02-10T12:00:00Z'),
        isAllDay: false,
        location: null,
        categoryId: null,
        recurrence: { type: 'none' },
        reminder: { enabled: false, minutesBefore: 15 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    longEvents: [
      {
        id: 'long-001',
        userId: 'user-001',
        title: '4 Hour Workshop',
        description: null,
        startTime: new Date('2024-02-10T13:00:00Z'),
        endTime: new Date('2024-02-10T17:00:00Z'),
        isAllDay: false,
        location: null,
        categoryId: null,
        recurrence: { type: 'none' },
        reminder: { enabled: false, minutesBefore: 15 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  },
}

// Fix the mock API responses after validEvents is defined
eventFixtures.mockAPIResponses.success.event = eventFixtures.validEvents[0]

// Export type for fixture validation
export type EventFixtures = typeof eventFixtures

// Export specific fixtures for easier imports
export const { 
  validEvents, 
  conflictingEvents,
  eventFormData,
  dragDropEvents,
  bulkOperations,
  mockAPIResponses 
} = eventFixtures