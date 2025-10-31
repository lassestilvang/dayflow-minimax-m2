import { z } from 'zod'

// Base schemas
export const idSchema = z.string().uuid('Invalid ID format')

export const timestampSchema = z.date({
  required_error: 'Date is required',
  invalid_type_error: 'Invalid date format',
})

export const optionalTimestampSchema = z.date().optional()

// User schemas
export const userSchema = z.object({
  id: idSchema,
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  image: z.string().url('Invalid image URL').optional(),
  workosId: z.string().optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
})

export const userInsertSchema = userSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const userUpdateSchema = userInsertSchema.partial()

// Task schemas
export const taskStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'cancelled'] as const)
export const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent'] as const)

export const taskSchema = z.object({
  id: idSchema,
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  status: taskStatusSchema.default('pending'),
  priority: taskPrioritySchema.default('medium'),
  dueDate: optionalTimestampSchema,
  completedAt: optionalTimestampSchema,
  userId: idSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
})

export const taskInsertSchema = taskSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const taskUpdateSchema = taskInsertSchema.partial().extend({
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
})

export const taskFormDataSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  priority: taskPrioritySchema.default('medium'),
  dueDate: optionalTimestampSchema,
})

// Calendar Event schemas
export const calendarEventSchema = z.object({
  id: idSchema,
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  startTime: timestampSchema,
  endTime: timestampSchema,
  isAllDay: z.boolean().default(false),
  location: z.string().max(500, 'Location too long').optional(),
  userId: idSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
}).refine((data) => data.endTime > data.startTime, {
  message: 'End time must be after start time',
  path: ['endTime'],
})

export const calendarEventInsertSchema = calendarEventSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const calendarEventUpdateSchema = calendarEventInsertSchema.partial()

export const calendarEventFormDataSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  startTime: timestampSchema,
  endTime: timestampSchema,
  isAllDay: z.boolean().default(false),
  location: z.string().max(500, 'Location too long').optional(),
}).refine((data) => data.endTime > data.startTime, {
  message: 'End time must be after start time',
  path: ['endTime'],
})

// Search and filter schemas
export const searchQuerySchema = z.string().min(1, 'Search query is required').max(100, 'Query too long')

export const dateRangeSchema = z.object({
  start: timestampSchema,
  end: timestampSchema,
}).refine((data) => data.end >= data.start, {
  message: 'End date must be after start date',
  path: ['end'],
})

export const taskFilterSchema = z.object({
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  userId: idSchema.optional(),
  dateRange: dateRangeSchema.optional(),
})

export const eventFilterSchema = z.object({
  userId: idSchema.optional(),
  dateRange: dateRangeSchema.optional(),
  isAllDay: z.boolean().optional(),
  location: z.string().optional(),
})

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1, 'Page must be positive').default(1),
  limit: z.number().int().min(1, 'Limit must be positive').max(100, 'Limit too high').default(20),
})

// Sort schema
export const sortSchema = z.object({
  field: z.string(),
  direction: z.enum(['asc', 'desc']).default('asc'),
})

// Bulk operations schema
export const bulkTaskUpdateSchema = z.object({
  ids: z.array(idSchema).min(1, 'At least one ID required'),
  updates: taskUpdateSchema,
})

export const bulkEventUpdateSchema = z.object({
  ids: z.array(idSchema).min(1, 'At least one ID required'),
  updates: calendarEventUpdateSchema,
})

// Validation utility functions
export const validateTaskData = (data: unknown) => {
  return taskSchema.safeParse(data)
}

export const validateEventData = (data: unknown) => {
  return calendarEventSchema.safeParse(data)
}

export const validateUserData = (data: unknown) => {
  return userSchema.safeParse(data)
}

export const validateTaskFormData = (data: unknown) => {
  return taskFormDataSchema.safeParse(data)
}

export const validateEventFormData = (data: unknown) => {
  return calendarEventFormDataSchema.safeParse(data)
}

// Export type inference
export type UserValidation = z.infer<typeof userSchema>
export type UserInsertValidation = z.infer<typeof userInsertSchema>
export type UserUpdateValidation = z.infer<typeof userUpdateSchema>

export type TaskValidation = z.infer<typeof taskSchema>
export type TaskInsertValidation = z.infer<typeof taskInsertSchema>
export type TaskUpdateValidation = z.infer<typeof taskUpdateSchema>
export type TaskFormDataValidation = z.infer<typeof taskFormDataSchema>

export type CalendarEventValidation = z.infer<typeof calendarEventSchema>
export type CalendarEventInsertValidation = z.infer<typeof calendarEventInsertSchema>
export type CalendarEventUpdateValidation = z.infer<typeof calendarEventUpdateSchema>
export type CalendarEventFormDataValidation = z.infer<typeof calendarEventFormDataSchema>

export type TaskFilterValidation = z.infer<typeof taskFilterSchema>
export type EventFilterValidation = z.infer<typeof eventFilterSchema>
export type PaginationValidation = z.infer<typeof paginationSchema>
export type SortValidation = z.infer<typeof sortSchema>

export type BulkTaskUpdateValidation = z.infer<typeof bulkTaskUpdateSchema>
export type BulkEventUpdateValidation = z.infer<typeof bulkEventUpdateSchema>