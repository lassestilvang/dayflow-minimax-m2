// Test fixtures and mock data for consistent testing

export * from './user-fixtures'
export * from './task-fixtures'
export * from './event-fixtures'
export * from './integration-fixtures'
export * from './calendar-fixtures'

import { userFixtures } from './user-fixtures'
import { taskFixtures } from './task-fixtures'
import { eventFixtures } from './event-fixtures'
import { integrationFixtures } from './integration-fixtures'
import { calendarFixtures } from './calendar-fixtures'

export const testFixtures = {
  users: userFixtures,
  tasks: taskFixtures,
  events: eventFixtures,
  integrations: integrationFixtures,
  calendar: calendarFixtures,
}

// Default export for convenience
export default testFixtures