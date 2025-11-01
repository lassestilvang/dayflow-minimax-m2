import {
  format,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  addWeeks,
  subWeeks,
  addDays,
  isSameDay,
  isToday,
  isAfter,
  isBefore,
  parseISO,
  addMinutes,
  getDay,
  getHours,
  getMinutes,
  setHours,
  setMinutes,
  startOfHour,
  endOfHour,
  differenceInMinutes,
} from 'date-fns'
import {
  CalendarWeek,
  CalendarDay,
  TimeSlot,
  CalendarConflict,
  EventOrTask,
  CalendarViewSettings,
} from '@/types/calendar'

// Default settings
export const DEFAULT_VIEW_SETTINGS: CalendarViewSettings = {
  startHour: 6,
  endHour: 22,
  showWeekends: false,
  timeFormat: '24h',
  defaultView: 'week',
}

// Week navigation utilities
export function getCurrentWeek(date: Date = new Date()): CalendarWeek {
  const startDate = startOfWeek(date, { weekStartsOn: 1 }) // Monday
  const endDate = endOfWeek(date, { weekStartsOn: 1 })
  
  return {
    startDate,
    endDate,
    days: generateWeekDays(startDate, endDate),
  }
}

export function getWeekFromDate(date: Date): CalendarWeek {
  const startDate = startOfWeek(date, { weekStartsOn: 1 })
  const endDate = endOfWeek(date, { weekStartsOn: 1 })
  
  return {
    startDate,
    endDate,
    days: generateWeekDays(startDate, endDate),
  }
}

export function getPreviousWeek(week: CalendarWeek): CalendarWeek {
  return getWeekFromDate(subWeeks(week.startDate, 1))
}

export function getNextWeek(week: CalendarWeek): CalendarWeek {
  return getWeekFromDate(addWeeks(week.startDate, 1))
}

export function generateWeekDays(startDate: Date, endDate: Date): CalendarDay[] {
  const days: CalendarDay[] = []
  
  for (let i = 0; i < 7; i++) {
    const date = addDays(startDate, i)
    const dayOfWeek = getDay(date) // 0 = Sunday, 1 = Monday, etc.
    
    days.push({
      date,
      dayOfWeek: dayOfWeek === 0 ? 7 : dayOfWeek, // Convert Sunday (0) to 7 for Monday-first layout
      dayName: format(date, 'EEEE'),
      events: [],
      isToday: isToday(date),
      isCurrentWeek: true,
    })
  }
  
  return days
}

// Time utilities
export function generateTimeSlots(settings: CalendarViewSettings = DEFAULT_VIEW_SETTINGS): TimeSlot[] {
  const slots: TimeSlot[] = []
  
  for (let hour = settings.startHour; hour <= settings.endHour; hour++) {
    const label = settings.timeFormat === '12h' 
      ? format(setHours(new Date(), hour), 'h a')
      : hour.toString().padStart(2, '0') + ':00'
    
    slots.push({
      hour,
      minute: 0,
      label,
    })
  }
  
  return slots
}

export function getEventDurationInMinutes(event: EventOrTask): number {
  if (!event.startTime || !event.endTime) {
    return 0
  }
  return differenceInMinutes(new Date(event.endTime), new Date(event.startTime))
}

export function calculateEventHeight(event: EventOrTask, pixelsPerHour: number = 60): number {
  const durationMinutes = getEventDurationInMinutes(event)
  const hours = durationMinutes / 60
  return Math.max(hours * pixelsPerHour, 30) // Minimum 30px height
}

export function calculateEventTopPosition(event: EventOrTask, settings: CalendarViewSettings): number {
  if (!event.startTime) {
    return 0
  }
  
  const startHour = getHours(new Date(event.startTime))
  const startMinute = getMinutes(new Date(event.startTime))
  
  const offsetFromStart = (startHour - settings.startHour) * 60 + startMinute
  const pixelsPerMinute = 60 / 60 // 60 pixels per hour = 1 pixel per minute
  
  return offsetFromStart * pixelsPerMinute
}

export function getEventLeftPosition(dayIndex: number, totalDays: number): number {
  return (dayIndex / totalDays) * 100
}

export function getEventWidth(totalDays: number): number {
  return 100 / totalDays - 2 // 2% margin
}

// Date and time formatting
export function formatTimeRange(startTime: Date, endTime: Date): string {
  const start = format(startTime, 'HH:mm')
  const end = format(endTime, 'HH:mm')
  return `${start} - ${end}`
}

export function formatEventTime(event: EventOrTask): string {
  if (event.isAllDay) {
    return 'All day'
  }
  if (!event.startTime || !event.endTime) {
    return 'No time set'
  }
  return formatTimeRange(new Date(event.startTime), new Date(event.endTime))
}

export function getWeekDisplayText(week: CalendarWeek): string {
  const startMonth = format(week.startDate, 'MMMM')
  const endMonth = format(week.endDate, 'MMMM')
  const startDay = format(week.startDate, 'd')
  const endDay = format(week.endDate, 'd')
  const year = format(week.startDate, 'yyyy')
  
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} – ${endDay}, ${year}`
  } else {
    return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`
  }
}

export function getDayDisplayText(date: Date): string {
  const today = isToday(date)
  return `${format(date, 'EEE')} ${format(date, 'MMM d')}${today ? ' (Today)' : ''}`
}

// Event sorting and filtering
export function sortEventsByTime(events: EventOrTask[]): EventOrTask[] {
  return [...events].sort((a, b) => {
    const aTime = a.startTime ? new Date(a.startTime).getTime() : 0
    const bTime = b.startTime ? new Date(b.startTime).getTime() : 0
    return aTime - bTime
  })
}

export function getEventsForDay(events: EventOrTask[], date: Date): EventOrTask[] {
  return events.filter(event =>
    event.startTime && isSameDay(new Date(event.startTime), date)
  ).sort((a, b) => {
    const aTime = a.startTime ? new Date(a.startTime).getTime() : 0
    const bTime = b.startTime ? new Date(b.startTime).getTime() : 0
    return aTime - bTime
  })
}

export function getEventsForWeek(week: CalendarWeek, events: EventOrTask[]): EventOrTask[] {
  return events.filter(event => {
    if (!event.startTime) {
      return false
    }
    const eventDate = new Date(event.startTime)
    return eventDate >= week.startDate && eventDate <= week.endDate
  })
}

// Collision detection
export function detectEventCollisions(events: EventOrTask[]): CalendarConflict[] {
  const conflicts: CalendarConflict[] = []
  const sortedEvents = sortEventsByTime(events)
  
  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const current = sortedEvents[i]
    const next = sortedEvents[i + 1]
    
    // Skip events without proper time data
    if (!current.endTime || !next.startTime) {
      continue
    }
    
    const currentEnd = new Date(current.endTime)
    const nextStart = new Date(next.startTime)
    
    if (currentEnd > nextStart) {
      conflicts.push({
        eventId: current.id,
        conflictingEventId: next.id,
        startTime: nextStart,
        endTime: currentEnd,
      })
    }
  }
  
  return conflicts
}

export function checkEventCollision(
  newEvent: EventOrTask,
  existingEvents: EventOrTask[],
  excludeEventId?: string
): boolean {
  // Check if the new event has proper time data
  if (!newEvent.startTime || !newEvent.endTime) {
    return false
  }
  
  const newEventStart = new Date(newEvent.startTime)
  const newEventEnd = new Date(newEvent.endTime)
  
  return existingEvents.some(event => {
    if (excludeEventId && event.id === excludeEventId) {
      return false
    }
    
    // Skip events without proper time data
    if (!event.startTime || !event.endTime) {
      return false
    }
    
    const eventStart = new Date(event.startTime)
    const eventEnd = new Date(event.endTime)
    
    return (
      (newEventStart >= eventStart && newEventStart < eventEnd) ||
      (newEventEnd > eventStart && newEventEnd <= eventEnd) ||
      (newEventStart <= eventStart && newEventEnd >= eventEnd)
    )
  })
}

// Time slot utilities
export function getTimeFromSlot(day: number, hour: number): Date {
  const baseDate = getCurrentWeek().startDate
  return setHours(setMinutes(addDays(baseDate, day - 1), 0), hour)
}

export function snapToNearestSlot(time: Date, snapMinutes: number = 15): Date {
  const minutes = getMinutes(time)
  const snappedMinutes = Math.round(minutes / snapMinutes) * snapMinutes
  
  return setMinutes(setHours(time, getHours(time)), snappedMinutes)
}

// Duration utilities
export function getDurationText(durationMinutes: number): string {
  if (durationMinutes < 60) {
    return `${durationMinutes}m`
  }
  
  const hours = Math.floor(durationMinutes / 60)
  const remainingMinutes = durationMinutes % 60
  
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  
  return `${hours}h ${remainingMinutes}m`
}

export function calculateEndTime(startTime: Date, durationMinutes: number): Date {
  return addMinutes(startTime, durationMinutes)
}

// Validation utilities
export function validateEventTimeRange(startTime: Date, endTime: Date): { isValid: boolean; error?: string } {
  if (isAfter(startTime, endTime)) {
    return { isValid: false, error: 'End time must be after start time' }
  }
  
  if (differenceInMinutes(endTime, startTime) < 15) {
    return { isValid: false, error: 'Event must be at least 15 minutes long' }
  }
  
  return { isValid: true }
}

// Create default events for demo
export function createDefaultEvents(): EventOrTask[] {
  const now = new Date()
  const today = startOfDay(now)
  const tomorrow = addDays(today, 1)
  const nextWeek = addWeeks(today, 1)
  
  return [
    {
      id: '1',
      title: 'Team Standup',
      description: 'Daily team standup meeting',
      startTime: setHours(today, 9),
      endTime: setHours(today, 9),
      isAllDay: false,
      categoryId: 'work' as const,
      userId: 'user-1',
      createdAt: now,
      updatedAt: now,
      recurrence: { type: 'none' as const },
      reminder: { enabled: false as const, minutesBefore: 15 },
    },
    {
      id: '2',
      title: 'Project Review',
      description: 'Quarterly project review with stakeholders',
      startTime: setHours(tomorrow, 14),
      endTime: setHours(tomorrow, 16),
      isAllDay: false,
      categoryId: 'work' as const,
      userId: 'user-1',
      createdAt: now,
      updatedAt: now,
      recurrence: { type: 'none' as const },
      reminder: { enabled: false as const, minutesBefore: 15 },
    },
    {
      id: '3',
      title: 'Family Dinner',
      description: 'Weekly family dinner',
      startTime: setHours(today, 18),
      endTime: setHours(today, 20),
      isAllDay: false,
      categoryId: 'family' as const,
      userId: 'user-1',
      createdAt: now,
      updatedAt: now,
      recurrence: { type: 'none' as const },
      reminder: { enabled: false as const, minutesBefore: 15 },
    },
    {
      id: '4',
      title: 'Gym Session',
      description: 'Personal workout',
      startTime: setHours(tomorrow, 6),
      endTime: setHours(tomorrow, 7),
      isAllDay: false,
      categoryId: 'personal' as const,
      userId: 'user-1',
      createdAt: now,
      updatedAt: now,
      recurrence: { type: 'none' as const },
      reminder: { enabled: false as const, minutesBefore: 15 },
    },
    {
      id: '5',
      title: 'Trip Planning',
      description: 'Plan upcoming vacation to Europe',
      startTime: setHours(nextWeek, 10),
      endTime: setHours(nextWeek, 12),
      isAllDay: false,
      categoryId: 'travel' as const,
      userId: 'user-1',
      createdAt: now,
      updatedAt: now,
      recurrence: { type: 'none' as const },
      reminder: { enabled: false as const, minutesBefore: 15 },
    },
  ]
}