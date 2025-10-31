import { describe, it, expect, vi } from 'vitest'
import { cn } from '@/lib/utils'
import { 
  getCurrentWeek,
  getPreviousWeek,
  getNextWeek,
  generateWeekDays,
  generateTimeSlots,
  getEventDurationInMinutes,
  calculateEventHeight,
  calculateEventTopPosition,
  formatTimeRange,
  formatEventTime,
  getWeekDisplayText,
  getDayDisplayText,
  sortEventsByTime,
  getEventsForDay,
  getEventsForWeek,
  detectEventCollisions,
  checkEventCollision,
  validateEventTimeRange,
  getDurationText,
  DEFAULT_VIEW_SETTINGS,
} from '@/lib/date-utils'
import { testUtils } from '@/tests/utils'

// Mock date-fns functions
vi.mock('date-fns', () => ({
  format: vi.fn(),
  startOfWeek: vi.fn(),
  endOfWeek: vi.fn(),
  startOfDay: vi.fn(),
  endOfDay: vi.fn(),
  addWeeks: vi.fn(),
  subWeeks: vi.fn(),
  addDays: vi.fn(),
  isSameDay: vi.fn(),
  isToday: vi.fn(),
  isAfter: vi.fn(),
  isBefore: vi.fn(),
  parseISO: vi.fn(),
  addMinutes: vi.fn(),
  getDay: vi.fn(),
  getHours: vi.fn(),
  getMinutes: vi.fn(),
  setHours: vi.fn(),
  setMinutes: vi.fn(),
  startOfHour: vi.fn(),
  endOfHour: vi.fn(),
  differenceInMinutes: vi.fn(),
}))

describe('Core Utilities', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      const result = cn('class1', 'class2', 'class3')
      expect(typeof result).toBe('string')
    })

    it('should handle conditional classes', () => {
      const result = cn('base-class', true && 'conditional-class', false && 'hidden-class')
      expect(result).toContain('base-class')
      expect(result).toContain('conditional-class')
      expect(result).not.toContain('hidden-class')
    })

    it('should handle Tailwind CSS classes', () => {
      const result = cn('px-4', 'py-2', 'bg-blue-500')
      expect(result).toContain('px-4')
      expect(result).toContain('py-2')
      expect(result).toContain('bg-blue-500')
    })
  })
})

describe('Date Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Week Navigation', () => {
    it('should get current week with proper structure', () => {
      const { format, startOfWeek, endOfWeek, addDays, getDay } = require('date-fns')
      
      // Mock the dependencies
      format.mockReturnValue('Monday')
      startOfWeek.mockReturnValue(new Date('2024-01-01'))
      endOfWeek.mockReturnValue(new Date('2024-01-07'))
      addDays.mockReturnValue(new Date('2024-01-02'))
      getDay.mockReturnValue(1)
      
      const week = getCurrentWeek()
      
      expect(week).toHaveProperty('startDate')
      expect(week).toHaveProperty('endDate')
      expect(week).toHaveProperty('days')
      expect(Array.isArray(week.days)).toBe(true)
      expect(week.days).toHaveLength(7)
    })

    it('should get previous week correctly', () => {
      const { subWeeks } = require('date-fns')
      const currentWeek = testUtils.createMockWeek()
      
      subWeeks.mockReturnValue(new Date('2023-12-25'))
      const previousWeek = getPreviousWeek(currentWeek)
      
      expect(previousWeek).toHaveProperty('startDate')
      expect(previousWeek).toHaveProperty('endDate')
      expect(subWeeks).toHaveBeenCalledWith(currentWeek.startDate, 1)
    })

    it('should get next week correctly', () => {
      const { addWeeks } = require('date-fns')
      const currentWeek = testUtils.createMockWeek()
      
      addWeeks.mockReturnValue(new Date('2024-01-08'))
      const nextWeek = getNextWeek(currentWeek)
      
      expect(nextWeek).toHaveProperty('startDate')
      expect(nextWeek).toHaveProperty('endDate')
      expect(addWeeks).toHaveBeenCalledWith(currentWeek.startDate, 1)
    })
  })

  describe('Time Slot Generation', () => {
    it('should generate time slots for default settings', () => {
      const slots = generateTimeSlots(DEFAULT_VIEW_SETTINGS)
      
      expect(Array.isArray(slots)).toBe(true)
      expect(slots.length).toBe(17) // 6 to 22 hours inclusive = 17 hours
    })

    it('should handle custom view settings', () => {
      const customSettings = {
        startHour: 8,
        endHour: 18,
        showWeekends: true,
        timeFormat: '12h' as const,
        defaultView: 'day' as const,
      }
      
      const slots = generateTimeSlots(customSettings)
      
      expect(slots).toHaveLength(11) // 8 to 18 hours inclusive = 11 hours
      expect(slots[0].hour).toBe(8)
      expect(slots[slots.length - 1].hour).toBe(18)
    })

    it('should format 12h time correctly', () => {
      const { format, setHours } = require('date-fns')
      format.mockReturnValue('9 AM')
      
      const customSettings = {
        ...DEFAULT_VIEW_SETTINGS,
        timeFormat: '12h' as const,
      }
      
      const slots = generateTimeSlots(customSettings)
      
      expect(slots[3].label).toBe('9 AM')
      expect(format).toHaveBeenCalled()
    })
  })

  describe('Event Duration and Positioning', () => {
    it('should calculate event duration in minutes', () => {
      const { differenceInMinutes } = require('date-fns')
      const startTime = new Date('2024-01-01T10:00:00Z')
      const endTime = new Date('2024-01-01T11:30:00Z')
      const event = { startTime, endTime }
      
      differenceInMinutes.mockReturnValue(90)
      
      const duration = getEventDurationInMinutes(event)
      
      expect(duration).toBe(90)
      expect(differenceInMinutes).toHaveBeenCalledWith(endTime, startTime)
    })

    it('should return 0 for events without time data', () => {
      const event1 = { startTime: null, endTime: null }
      const event2 = { startTime: undefined, endTime: undefined }
      
      expect(getEventDurationInMinutes(event1)).toBe(0)
      expect(getEventDurationInMinutes(event2)).toBe(0)
    })

    it('should calculate event height correctly', () => {
      const { differenceInMinutes } = require('date-fns')
      const startTime = new Date('2024-01-01T10:00:00Z')
      const endTime = new Date('2024-01-01T12:00:00Z')
      const event = { startTime, endTime }
      
      differenceInMinutes.mockReturnValue(120) // 2 hours
      const pixelsPerHour = 60
      
      const height = calculateEventHeight(event, pixelsPerHour)
      
      expect(height).toBe(120) // 2 hours * 60 pixels per hour
    })

    it('should enforce minimum event height', () => {
      const { differenceInMinutes } = require('date-fns')
      const startTime = new Date('2024-01-01T10:00:00Z')
      const endTime = new Date('2024-01-01T10:15:00Z')
      const event = { startTime, endTime }
      
      differenceInMinutes.mockReturnValue(15) // 15 minutes
      const pixelsPerHour = 60
      
      const height = calculateEventHeight(event, pixelsPerHour)
      
      expect(height).toBe(30) // Minimum 30px
    })

    it('should calculate event top position', () => {
      const { getHours, getMinutes } = require('date-fns')
      const startTime = new Date('2024-01-01T10:30:00Z')
      const event = { startTime }
      const settings = { ...DEFAULT_VIEW_SETTINGS, startHour: 6 }
      
      getHours.mockReturnValue(10)
      getMinutes.mockReturnValue(30)
      
      const position = calculateEventTopPosition(event, settings)
      
      expect(position).toBe(270) // (10 - 6) hours * 60 minutes + 30 minutes = 270 pixels
    })

    it('should handle events starting before start hour', () => {
      const { getHours, getMinutes } = require('date-fns')
      const startTime = new Date('2024-01-01T05:30:00Z')
      const event = { startTime }
      const settings = { ...DEFAULT_VIEW_SETTINGS, startHour: 6 }
      
      getHours.mockReturnValue(5)
      getMinutes.mockReturnValue(30)
      
      const position = calculateEventTopPosition(event, settings)
      
      expect(position).toBeLessThan(0) // Should be negative
    })

    it('should get event left position for day index', () => {
      const position = getEventLeftPosition(0, 7)
      expect(position).toBe(0)
      
      const positionMidWeek = getEventLeftPosition(3, 7)
      expect(positionMidWeek).toBeCloseTo(42.857, 2) // (3/7)*100 ≈ 42.857
    })

    it('should calculate event width for total days', () => {
      const width = getEventWidth(7)
      expect(width).toBeCloseTo(12.285, 2) // (100/7) - 2 ≈ 12.285
      
      const widthSingleDay = getEventWidth(1)
      expect(widthSingleDay).toBe(98) // (100/1) - 2 = 98
    })
  })

  describe('Date and Time Formatting', () => {
    it('should format time range correctly', () => {
      const { format } = require('date-fns')
      format.mockImplementation((date, formatStr) => {
        if (formatStr === 'HH:mm') {
          return date.toISOString().substring(11, 16)
        }
        return date.toISOString()
      })
      
      const startTime = new Date('2024-01-01T10:00:00Z')
      const endTime = new Date('2024-01-01T15:30:00Z')
      
      const timeRange = formatTimeRange(startTime, endTime)
      
      expect(timeRange).toBe('10:00 - 15:30')
    })

    it('should format all-day event time', () => {
      const allDayEvent = {
        isAllDay: true,
        title: 'All Day Event',
        startTime: new Date('2024-01-01T00:00:00Z'),
        endTime: new Date('2024-01-01T23:59:59Z'),
      }
      
      const formatted = formatEventTime(allDayEvent)
      
      expect(formatted).toBe('All day')
    })

    it('should format timed event correctly', () => {
      const { format } = require('date-fns')
      format.mockImplementation((date, formatStr) => {
        if (formatStr === 'HH:mm') {
          return date.toISOString().substring(11, 16)
        }
        return date.toISOString()
      })
      
      const timedEvent = {
        isAllDay: false,
        title: 'Timed Event',
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T10:30:00Z'),
      }
      
      const formatted = formatEventTime(timedEvent)
      
      expect(formatted).toBe('09:00 - 10:30')
    })

    it('should handle events without time data', () => {
      const noTimeEvent = {
        isAllDay: false,
        title: 'No Time Event',
        startTime: null,
        endTime: null,
      }
      
      const formatted = formatEventTime(noTimeEvent)
      
      expect(formatted).toBe('No time set')
    })

    it('should get week display text for same month', () => {
      const { format } = require('date-fns')
      const week = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07'),
      }
      
      format.mockReturnValueOnce('January').mockReturnValueOnce('1').mockReturnValueOnce('7').mockReturnValueOnce('2024')
      
      const displayText = getWeekDisplayText(week)
      
      expect(displayText).toBe('January 1 – 7, 2024')
    })

    it('should get week display text for different months', () => {
      const { format } = require('date-fns')
      const week = {
        startDate: new Date('2024-01-29'),
        endDate: new Date('2024-02-04'),
      }
      
      format.mockReturnValueOnce('January').mockReturnValueOnce('29').mockReturnValueOnce('February').mockReturnValueOnce('4').mockReturnValueOnce('2024')
      
      const displayText = getWeekDisplayText(week)
      
      expect(displayText).toBe('January 29 – February 4, 2024')
    })

    it('should get day display text', () => {
      const { format, isToday } = require('date-fns')
      const today = new Date('2024-01-15')
      
      format.mockReturnValueOnce('Mon').mockReturnValueOnce('Jan 15')
      isToday.mockReturnValue(true)
      
      const displayText = getDayDisplayText(today)
      
      expect(displayText).toBe('Mon Jan 15 (Today)')
    })

    it('should get day display text for non-today', () => {
      const { format, isToday } = require('date-fns')
      const notToday = new Date('2024-01-14')
      
      format.mockReturnValueOnce('Sun').mockReturnValueOnce('Jan 14')
      isToday.mockReturnValue(false)
      
      const displayText = getDayDisplayText(notToday)
      
      expect(displayText).toBe('Sun Jan 14')
    })
  })

  describe('Event Sorting and Filtering', () => {
    it('should sort events by time', () => {
      const events = [
        { id: '1', startTime: new Date('2024-01-01T15:00:00Z') },
        { id: '2', startTime: new Date('2024-01-01T09:00:00Z') },
        { id: '3', startTime: new Date('2024-01-01T12:00:00Z') },
      ]
      
      const sorted = sortEventsByTime(events)
      
      expect(sorted[0].startTime).toEqual(new Date('2024-01-01T09:00:00Z'))
      expect(sorted[1].startTime).toEqual(new Date('2024-01-01T12:00:00Z'))
      expect(sorted[2].startTime).toEqual(new Date('2024-01-01T15:00:00Z'))
    })

    it('should place events without time at the beginning', () => {
      const events = [
        { id: '1', startTime: new Date('2024-01-01T15:00:00Z') },
        { id: '2', startTime: null },
        { id: '3', startTime: new Date('2024-01-01T09:00:00Z') },
      ]
      
      const sorted = sortEventsByTime(events)
      
      expect(sorted[0].startTime).toBeNull()
      expect(sorted[1].startTime).toEqual(new Date('2024-01-01T09:00:00Z'))
      expect(sorted[2].startTime).toEqual(new Date('2024-01-01T15:00:00Z'))
    })

    it('should get events for specific day', () => {
      const { isSameDay } = require('date-fns')
      const targetDate = new Date('2024-01-01')
      const events = [
        { id: '1', startTime: new Date('2024-01-01T10:00:00Z') },
        { id: '2', startTime: new Date('2024-01-02T10:00:00Z') },
        { id: '3', startTime: new Date('2024-01-01T15:00:00Z') },
      ]
      
      isSameDay.mockReturnValueOnce(true).mockReturnValueOnce(false).mockReturnValueOnce(true)
      
      const dayEvents = getEventsForDay(events, targetDate)
      
      expect(dayEvents).toHaveLength(2)
      expect(dayEvents[0].id).toBe('1')
      expect(dayEvents[1].id).toBe('3')
    })

    it('should get events for week', () => {
      const week = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07'),
      }
      
      const events = [
        { id: '1', startTime: new Date('2024-01-03T10:00:00Z') },
        { id: '2', startTime: new Date('2024-01-10T10:00:00Z') }, // Outside week
        { id: '3', startTime: new Date('2024-01-06T15:00:00Z') },
        { id: '4', startTime: null },
      ]
      
      const weekEvents = getEventsForWeek(week, events)
      
      expect(weekEvents).toHaveLength(2)
      expect(weekEvents.map(e => e.id)).toContain('1')
      expect(weekEvents.map(e => e.id)).toContain('3')
      expect(weekEvents.map(e => e.id)).not.toContain('2')
      expect(weekEvents.map(e => e.id)).not.toContain('4')
    })
  })

  describe('Collision Detection', () => {
    it('should detect event collisions', () => {
      const events = [
        { id: '1', startTime: new Date('2024-01-01T10:00:00Z'), endTime: new Date('2024-01-01T11:00:00Z') },
        { id: '2', startTime: new Date('2024-01-01T10:30:00Z'), endTime: new Date('2024-01-01T11:30:00Z') },
        { id: '3', startTime: new Date('2024-01-01T12:00:00Z'), endTime: new Date('2024-01-01T13:00:00Z') },
      ]
      
      const conflicts = detectEventCollisions(events)
      
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].eventId).toBe('1')
      expect(conflicts[0].conflictingEventId).toBe('2')
    })

    it('should not detect non-colliding events', () => {
      const events = [
        { id: '1', startTime: new Date('2024-01-01T10:00:00Z'), endTime: new Date('2024-01-01T11:00:00Z') },
        { id: '2', startTime: new Date('2024-01-01T11:00:00Z'), endTime: new Date('2024-01-01T12:00:00Z') }, // Starts exactly when first ends
        { id: '3', startTime: new Date('2024-01-01T12:30:00Z'), endTime: new Date('2024-01-01T13:30:00Z') },
      ]
      
      const conflicts = detectEventCollisions(events)
      
      expect(conflicts).toHaveLength(0)
    })

    it('should handle events without proper time data', () => {
      const events = [
        { id: '1', startTime: null, endTime: new Date('2024-01-01T11:00:00Z') },
        { id: '2', startTime: new Date('2024-01-01T10:00:00Z'), endTime: null },
        { id: '3', startTime: new Date('2024-01-01T10:30:00Z'), endTime: new Date('2024-01-01T11:30:00Z') },
      ]
      
      const conflicts = detectEventCollisions(events)
      
      expect(conflicts).toHaveLength(0) // Events without time data should be ignored
    })

    it('should check for event collision with existing events', () => {
      const newEvent = {
        id: 'new',
        startTime: new Date('2024-01-01T10:30:00Z'),
        endTime: new Date('2024-01-01T11:30:00Z'),
      }
      
      const existingEvents = [
        { id: '1', startTime: new Date('2024-01-01T10:00:00Z'), endTime: new Date('2024-01-01T11:00:00Z') },
        { id: '2', startTime: new Date('2024-01-01T12:00:00Z'), endTime: new Date('2024-01-01T13:00:00Z') },
      ]
      
      const hasCollision = checkEventCollision(newEvent, existingEvents)
      
      expect(hasCollision).toBe(true)
    })

    it('should not detect collision when excluded event ID matches', () => {
      const newEvent = {
        id: '1',
        startTime: new Date('2024-01-01T10:30:00Z'),
        endTime: new Date('2024-01-01T11:30:00Z'),
      }
      
      const existingEvents = [
        { id: '1', startTime: new Date('2024-01-01T10:00:00Z'), endTime: new Date('2024-01-01T11:00:00Z') },
        { id: '2', startTime: new Date('2024-01-01T12:00:00Z'), endTime: new Date('2024-01-01T13:00:00Z') },
      ]
      
      const hasCollision = checkEventCollision(newEvent, existingEvents, '1')
      
      expect(hasCollision).toBe(false)
    })

    it('should handle events without time data in collision check', () => {
      const newEvent = {
        id: 'new',
        startTime: new Date('2024-01-01T10:30:00Z'),
        endTime: new Date('2024-01-01T11:30:00Z'),
      }
      
      const existingEvents = [
        { id: '1', startTime: null, endTime: new Date('2024-01-01T11:00:00Z') },
        { id: '2', startTime: new Date('2024-01-01T10:00:00Z'), endTime: null },
      ]
      
      const hasCollision = checkEventCollision(newEvent, existingEvents)
      
      expect(hasCollision).toBe(false)
    })
  })

  describe('Time Utilities', () => {
    it('should get duration text for minutes', () => {
      expect(getDurationText(30)).toBe('30m')
      expect(getDurationText(45)).toBe('45m')
    })

    it('should get duration text for hours', () => {
      expect(getDurationText(60)).toBe('1h')
      expect(getDurationText(120)).toBe('2h')
    })

    it('should get duration text for hours and minutes', () => {
      expect(getDurationText(90)).toBe('1h 30m')
      expect(getDurationText(150)).toBe('2h 30m')
    })

    it('should validate event time range', () => {
      const { isAfter, differenceInMinutes } = require('date-fns')
      const startTime = new Date('2024-01-01T10:00:00Z')
      const endTime = new Date('2024-01-01T11:00:00Z')
      
      isAfter.mockReturnValue(false)
      differenceInMinutes.mockReturnValue(60)
      
      const validation = validateEventTimeRange(startTime, endTime)
      
      expect(validation.isValid).toBe(true)
      expect(validation).not.toHaveProperty('error')
    })

    it('should reject end time before start time', () => {
      const { isAfter } = require('date-fns')
      const startTime = new Date('2024-01-01T11:00:00Z')
      const endTime = new Date('2024-01-01T10:00:00Z')
      
      isAfter.mockReturnValue(true)
      
      const validation = validateEventTimeRange(startTime, endTime)
      
      expect(validation.isValid).toBe(false)
      expect(validation.error).toBe('End time must be after start time')
    })

    it('should reject events shorter than 15 minutes', () => {
      const { isAfter, differenceInMinutes } = require('date-fns')
      const startTime = new Date('2024-01-01T10:00:00Z')
      const endTime = new Date('2024-01-01T10:10:00Z')
      
      isAfter.mockReturnValue(false)
      differenceInMinutes.mockReturnValue(10)
      
      const validation = validateEventTimeRange(startTime, endTime)
      
      expect(validation.isValid).toBe(false)
      expect(validation.error).toBe('Event must be at least 15 minutes long')
    })
  })
})

// Helper function to create mock week for testing
function createMockWeek() {
  const startDate = new Date('2024-01-01')
  const endDate = new Date('2024-01-07')
  
  return {
    startDate,
    endDate,
    days: generateWeekDays(startDate, endDate),
  }
}