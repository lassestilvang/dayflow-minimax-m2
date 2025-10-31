// Calendar Components Export
export { WeeklyCalendar } from './WeeklyCalendar'
export { CalendarGrid } from './CalendarGrid'
export { CalendarEvent } from './CalendarEvent'
export { WeekNavigation, CompactWeekNavigation } from './WeekNavigation'

// Re-export types for convenience
export type {
  CalendarEvent as CalendarEventType,
  Task,
  CalendarCategory,
  CalendarWeek,
  CalendarDay,
  EventOrTask,
  CalendarViewSettings,
  CalendarDragDropData,
  CalendarConflict,
  CalendarFormData,
  TaskFormData,
} from '@/types/calendar'

// Re-export utilities for convenience
export {
  getCurrentWeek,
  getPreviousWeek,
  getNextWeek,
  getWeekFromDate,
  generateTimeSlots,
  generateWeekDays,
  getEventsForWeek,
  getEventsForDay,
  sortEventsByTime,
  detectEventCollisions,
  checkEventCollision,
  validateEventTimeRange,
  formatTimeRange,
  formatEventTime,
  getWeekDisplayText,
  getDayDisplayText,
  createDefaultEvents,
} from '@/lib/date-utils'