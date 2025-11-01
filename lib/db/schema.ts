import { pgTable, text, timestamp, boolean, uuid, integer, json } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').unique().notNull(),
  name: text('name'),
  image: text('image'),
  workosId: text('workos_id').unique(),
  timezone: text('timezone').default('UTC'),
  preferences: json('preferences').$type<{
    theme?: 'light' | 'dark' | 'system'
    notifications?: boolean
    defaultCalendarView?: 'week' | 'month' | 'day'
  }>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// Categories table
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull().default('#3b82f6'), // hex color
  icon: text('icon'), // icon name or emoji
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// Tags table
export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull().default('#6b7280'), // hex color
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// Tasks table
export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('pending'), // pending, in_progress, completed, cancelled
  priority: text('priority').notNull().default('medium'), // low, medium, high, urgent
  dueDate: timestamp('due_date', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  startTime: timestamp('start_time', { withTimezone: true }),
  endTime: timestamp('end_time', { withTimezone: true }),
  progress: integer('progress').notNull().default(0),
  estimatedDuration: integer('estimated_duration'), // in minutes
  actualDuration: integer('actual_duration'), // in minutes
  recurrence: json('recurrence').$type<{
    type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval?: number
    endDate?: Date
    daysOfWeek?: number[]
  }>().default({ type: 'none' }),
  reminder: json('reminder').$type<{
    enabled: boolean
    minutesBefore: number
  }>().default({ enabled: false, minutesBefore: 15 }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// Calendar events table
export const calendarEvents = pgTable('calendar_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
  isAllDay: boolean('is_all_day').default(false),
  location: text('location'),
  meetingUrl: text('meeting_url'),
  attendees: json('attendees').$type<{
    email: string
    name?: string
    status: 'pending' | 'accepted' | 'declined'
  }[]>().default([]),
  recurrence: json('recurrence').$type<{
    type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval?: number
    endDate?: Date
    daysOfWeek?: number[]
  }>().default({ type: 'none' }),
  reminder: json('reminder').$type<{
    enabled: boolean
    minutesBefore: number
  }>().default({ enabled: false, minutesBefore: 15 }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// Task-Tags junction table
export const taskTags = pgTable('task_tags', {
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  tagId: uuid('tag_id').references(() => tags.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  pk: {
    columns: [table.taskId, table.tagId],
    name: 'task_tags_pkey',
  },
}))

// Event-Tags junction table
export const eventTags = pgTable('event_tags', {
  eventId: uuid('event_id').references(() => calendarEvents.id, { onDelete: 'cascade' }).notNull(),
  tagId: uuid('tag_id').references(() => tags.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  pk: {
    columns: [table.eventId, table.tagId],
    name: 'event_tags_pkey',
  },
}))

// Task relations
export const tasksRelations = relations(tasks, ({ one, many }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [tasks.categoryId],
    references: [categories.id],
  }),
  tags: many(taskTags),
}))

// Calendar events relations
export const calendarEventsRelations = relations(calendarEvents, ({ one, many }) => ({
  user: one(users, {
    fields: [calendarEvents.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [calendarEvents.categoryId],
    references: [categories.id],
  }),
  tags: many(eventTags),
}))

// Categories relations
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  tasks: many(tasks),
  events: many(calendarEvents),
}))

// Tags relations
export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, {
    fields: [tags.userId],
    references: [users.id],
  }),
  tasks: many(taskTags),
  events: many(eventTags),
}))

// Junction table relations
export const taskTagsRelations = relations(taskTags, ({ one }) => ({
  task: one(tasks, {
    fields: [taskTags.taskId],
    references: [tasks.id],
  }),
  tag: one(tags, {
    fields: [taskTags.tagId],
    references: [tags.id],
  }),
}))

export const eventTagsRelations = relations(eventTags, ({ one }) => ({
  event: one(calendarEvents, {
    fields: [eventTags.eventId],
    references: [calendarEvents.id],
  }),
  tag: one(tags, {
    fields: [eventTags.tagId],
    references: [tags.id],
  }),
}))

// Users relations
export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
  calendarEvents: many(calendarEvents),
  categories: many(categories),
  tags: many(tags),
}))

// Helper function for SQL constraints
const sql = (strings: TemplateStringsArray, ...values: any[]) => strings.join('')