// Calendar fixtures for testing calendar functionality
import type { CalendarWeek, CalendarEvent, Task, CalendarConflict } from '@/types/calendar'

// Calendar fixtures for consistent testing
export const calendarFixtures = {
  // Calendar weeks for testing
  calendarWeeks: [
    {
      startDate: new Date('2024-01-01T00:00:00Z'), // Monday
      endDate: new Date('2024-01-07T23:59:59Z'),   // Sunday
      days: [
        {
          date: new Date('2024-01-01T00:00:00Z'),
          dayOfWeek: 1,
          dayName: 'Monday',
          events: [],
          isToday: false,
          isCurrentWeek: true,
        },
        {
          date: new Date('2024-01-02T00:00:00Z'),
          dayOfWeek: 2,
          dayName: 'Tuesday',
          events: [],
          isToday: false,
          isCurrentWeek: true,
        },
        {
          date: new Date('2024-01-03T00:00:00Z'),
          dayOfWeek: 3,
          dayName: 'Wednesday',
          events: [],
          isToday: false,
          isCurrentWeek: true,
        },
        {
          date: new Date('2024-01-04T00:00:00Z'),
          dayOfWeek: 4,
          dayName: 'Thursday',
          events: [],
          isToday: false,
          isCurrentWeek: true,
        },
        {
          date: new Date('2024-01-05T00:00:00Z'),
          dayOfWeek: 5,
          dayName: 'Friday',
          events: [],
          isToday: false,
          isCurrentWeek: true,
        },
        {
          date: new Date('2024-01-06T00:00:00Z'),
          dayOfWeek: 6,
          dayName: 'Saturday',
          events: [],
          isToday: false,
          isCurrentWeek: true,
        },
        {
          date: new Date('2024-01-07T00:00:00Z'),
          dayOfWeek: 7,
          dayName: 'Sunday',
          events: [],
          isToday: false,
          isCurrentWeek: true,
        },
      ],
    },
    {
      startDate: new Date('2024-01-08T00:00:00Z'), // Next Monday
      endDate: new Date('2024-01-14T23:59:59Z'),   // Next Sunday
      days: [],
    },
  ] as CalendarWeek[],

  // View settings for different calendar views
  viewSettings: {
    weekView: {
      startHour: 6,
      endHour: 22,
      showWeekends: false,
      timeFormat: '24h' as const,
      defaultView: 'week' as const,
    },
    dayView: {
      startHour: 6,
      endHour: 22,
      showWeekends: true,
      timeFormat: '12h' as const,
      defaultView: 'day' as const,
    },
    monthView: {
      startHour: 8,
      endHour: 20,
      showWeekends: true,
      timeFormat: '12h' as const,
      defaultView: 'month' as const,
    },
  },

  // Time slots for different view settings
  timeSlots: {
    weekSlots: [
      { hour: 6, minute: 0, label: '06:00' },
      { hour: 7, minute: 0, label: '07:00' },
      { hour: 8, minute: 0, label: '08:00' },
      { hour: 9, minute: 0, label: '09:00' },
      { hour: 10, minute: 0, label: '10:00' },
      { hour: 11, minute: 0, label: '11:00' },
      { hour: 12, minute: 0, label: '12:00' },
      { hour: 13, minute: 0, label: '13:00' },
      { hour: 14, minute: 0, label: '14:00' },
      { hour: 15, minute: 0, label: '15:00' },
      { hour: 16, minute: 0, label: '16:00' },
      { hour: 17, minute: 0, label: '17:00' },
      { hour: 18, minute: 0, label: '18:00' },
      { hour: 19, minute: 0, label: '19:00' },
      { hour: 20, minute: 0, label: '20:00' },
      { hour: 21, minute: 0, label: '21:00' },
      { hour: 22, minute: 0, label: '22:00' },
    ],
  },

  // Calendar conflicts for testing
  calendarConflicts: [
    {
      eventId: 'event-001',
      conflictingEventId: 'event-002',
      type: 'time-overlap' as const,
      startTime: new Date('2024-01-15T10:00:00Z'),
      endTime: new Date('2024-01-15T11:30:00Z'),
      severity: 'high' as const,
    },
    {
      eventId: 'event-003',
      conflictingEventId: 'event-004',
      type: 'time-overlap' as const,
      startTime: new Date('2024-01-15T14:00:00Z'),
      endTime: new Date('2024-01-15T16:00:00Z'),
      severity: 'medium' as const,
    },
  ] as CalendarConflict[],

  // Drag and drop scenarios
  dragDropScenarios: {
    successfulDrop: {
      eventId: 'event-001',
      sourcePosition: { x: 100, y: 200 },
      targetPosition: { x: 150, y: 250 },
      newStartTime: new Date('2024-01-15T11:00:00Z'),
      newEndTime: new Date('2024-01-15T12:00:00Z'),
      success: true,
    },
    blockedDrop: {
      eventId: 'event-002',
      sourcePosition: { x: 100, y: 200 },
      targetPosition: { x: 120, y: 220 },
      newStartTime: new Date('2024-01-15T10:30:00Z'),
      newEndTime: new Date('2024-01-15T11:30:00Z'),
      success: false,
      reason: 'conflict-with-existing-event',
    },
    invalidDrop: {
      eventId: 'event-003',
      sourcePosition: { x: 100, y: 200 },
      targetPosition: { x: 50, y: 50 },
      success: false,
      reason: 'outside-calendar-boundaries',
    },
  },

  // Resize scenarios
  resizeScenarios: {
    expandEvent: {
      eventId: 'event-001',
      originalEndTime: new Date('2024-01-15T11:00:00Z'),
      newEndTime: new Date('2024-01-15T12:00:00Z'),
      success: true,
    },
    shrinkEvent: {
      eventId: 'event-002',
      originalStartTime: new Date('2024-01-15T10:00:00Z'),
      newStartTime: new Date('2024-01-15T10:30:00Z'),
      success: true,
    },
    minDurationReached: {
      eventId: 'event-003',
      originalDuration: 15, // minutes
      newDuration: 5, // minutes (below minimum)
      success: false,
      reason: 'minimum-duration-not-met',
    },
  },

  // Calendar navigation scenarios
  navigationScenarios: {
    previousWeek: {
      currentWeek: {
        startDate: new Date('2024-01-08T00:00:00Z'),
        endDate: new Date('2024-01-14T23:59:59Z'),
      },
      expectedWeek: {
        startDate: new Date('2024-01-01T00:00:00Z'),
        endDate: new Date('2024-01-07T23:59:59Z'),
      },
    },
    nextWeek: {
      currentWeek: {
        startDate: new Date('2024-01-08T00:00:00Z'),
        endDate: new Date('2024-01-14T23:59:59Z'),
      },
      expectedWeek: {
        startDate: new Date('2024-01-15T00:00:00Z'),
        endDate: new Date('2024-01-21T23:59:59Z'),
      },
    },
    jumpToDate: {
      targetDate: new Date('2024-03-15T00:00:00Z'),
      expectedWeek: {
        startDate: new Date('2024-03-11T00:00:00Z'), // Monday of the week containing the target date
        endDate: new Date('2024-03-17T23:59:59Z'),
      },
    },
  },

  // Event positioning scenarios
  positioningScenarios: {
    singleDayEvent: {
      event: {
        id: 'event-001',
        title: 'Single Day Event',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T11:00:00Z'),
        isAllDay: false,
      },
      dayIndex: 0,
      expected: {
        left: 0,
        width: 98,
        top: 240, // (10 - 6) * 60 + 0 = 240px
        height: 60, // 1 hour * 60px
      },
    },
    multiDayEvent: {
      event: {
        id: 'event-002',
        title: 'Multi-Day Event',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-17T15:00:00Z'),
        isAllDay: false,
      },
      dayIndex: 0,
      expected: {
        left: 0,
        width: 294, // 3 days * 98px + margins
        top: 240,
        height: 300, // 5 hours * 60px
      },
    },
    allDayEvent: {
      event: {
        id: 'event-003',
        title: 'All Day Event',
        startTime: new Date('2024-01-15T00:00:00Z'),
        endTime: new Date('2024-01-15T23:59:59Z'),
        isAllDay: true,
      },
      dayIndex: 0,
      expected: {
        left: 0,
        width: 98,
        top: 0,
        height: 30,
      },
    },
  },

  // Selection scenarios
  selectionScenarios: {
    selectEvent: {
      eventId: 'event-001',
      selected: true,
      expectedSelection: {
        id: 'event-001',
        selected: true,
      },
    },
    selectTimeSlot: {
      dayIndex: 1,
      hour: 10,
      minute: 30,
      selected: true,
      expectedSelection: {
        dayIndex: 1,
        hour: 10,
        minute: 30,
        selected: true,
      },
    },
    clearSelection: {
      previousSelection: {
        id: 'event-001',
        selected: true,
      },
      newSelection: null,
    },
  },

  // Filter scenarios
  filterScenarios: {
    byCategory: {
      categories: ['work', 'personal'],
      expectedEvents: ['work-event-1', 'work-event-2', 'personal-event-1'],
    },
    byDateRange: {
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-20T23:59:59Z'),
      expectedEvents: ['event-001', 'event-002', 'event-003'],
    },
    byPriority: {
      priorities: ['high', 'urgent'],
      expectedEvents: ['urgent-event-1', 'high-event-1', 'high-event-2'],
    },
  },

  // Search scenarios
  searchScenarios: {
    findEventByTitle: {
      query: 'meeting',
      expectedEvents: ['team-meeting', 'client-meeting'],
      expectedCount: 2,
    },
    findEventByLocation: {
      query: 'conference',
      expectedEvents: ['conference-call', 'conference-room-booking'],
      expectedCount: 2,
    },
    noResults: {
      query: 'nonexistent',
      expectedEvents: [],
      expectedCount: 0,
    },
  },

  // Calendar display modes
  displayModes: {
    week: {
      name: 'week',
      label: 'Week View',
      showWeekends: true,
      timeSlots: true,
    },
    month: {
      name: 'month',
      label: 'Month View',
      showWeekends: true,
      timeSlots: false,
    },
    day: {
      name: 'day',
      label: 'Day View',
      showWeekends: true,
      timeSlots: true,
    },
    agenda: {
      name: 'agenda',
      label: 'Agenda View',
      showWeekends: true,
      timeSlots: false,
    },
  },

  // Helper methods
  createCalendarWeek(date: Date = new Date()): CalendarWeek {
    const startDate = new Date(date)
    startDate.setDate(startDate.getDate() - startDate.getDay() + 1) // Monday
    
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 6) // Sunday
    
    const days = []
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startDate)
      dayDate.setDate(startDate.getDate() + i)
      
      days.push({
        date: dayDate,
        dayOfWeek: i + 1,
        dayName: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i],
        events: [],
        isToday: dayDate.toDateString() === new Date().toDateString(),
        isCurrentWeek: true,
      })
    }
    
    return {
      startDate,
      endDate,
      days,
    }
  },

  createTimeSlots(startHour: number = 6, endHour: number = 22) {
    const slots = []
    for (let hour = startHour; hour <= endHour; hour++) {
      slots.push({
        hour,
        minute: 0,
        label: `${hour.toString().padStart(2, '0')}:00`,
      })
    }
    return slots
  },

  createCalendarConflict(eventId: string, conflictingEventId: string, type: 'time-overlap' | 'location-conflict' = 'time-overlap'): CalendarConflict {
    return {
      eventId,
      conflictingEventId,
      type,
      startTime: new Date(),
      endTime: new Date(),
      severity: 'high',
    }
  },

  // Mock calendar responses
  mockCalendarResponses: {
    success: {
      events: ['event-001', 'event-002', 'event-003'],
      conflicts: [],
      message: 'Calendar loaded successfully',
    },
    withConflicts: {
      events: ['event-001', 'event-002'],
      conflicts: [
        {
          eventId: 'event-001',
          conflictingEventId: 'event-002',
          type: 'time-overlap' as const,
          startTime: new Date('2024-01-15T10:00:00Z'),
          endTime: new Date('2024-01-15T11:30:00Z'),
          severity: 'high' as const,
        },
      ],
      message: 'Calendar loaded with conflicts',
    },
    empty: {
      events: [],
      conflicts: [],
      message: 'No events found for this period',
    },
    error: {
      error: 'calendar_load_failed',
      message: 'Failed to load calendar data',
    },
  },
}

// Export specific fixtures for easier imports
export const { 
  calendarWeeks, 
  viewSettings,
  calendarConflicts,
  dragDropScenarios,
  resizeScenarios,
  navigationScenarios,
  mockCalendarResponses 
} = calendarFixtures