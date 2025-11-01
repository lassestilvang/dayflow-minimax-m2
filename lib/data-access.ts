import { and, eq, gte, lte, like, ilike, inArray, sql, desc, asc, between } from 'drizzle-orm'
import { db, type User, type UserInsert, type Task, type TaskInsert, type CalendarEvent, type CalendarEventInsert } from './db'
import { 
  users, 
  tasks, 
  calendarEvents, 
  categories, 
  tags, 
  taskTags, 
  eventTags,
  type Tables 
} from './db/schema'
import {
  validateTaskData,
  validateEventData,
  validateUserData,
  validateTaskFormData,
  validateEventFormData,
  validateTaskInsertData,
  validateEventInsertData,
  validateUserInsertData,
  validateTaskUpdateData,
  validateEventUpdateData,
  taskInsertSchema,
  eventInsertSchema,
  userInsertSchema,
  taskUpdateSchema,
  eventUpdateSchema,
  taskFormDataSchema,
  eventFormDataSchema,
  type TaskFilterValidation,
  type EventFilterValidation,
  type PaginationValidation,
  type SortValidation,
  type BulkTaskUpdateValidation,
  type BulkEventUpdateValidation
} from './validations/schemas'

// Error classes for specific database errors
export class DatabaseError extends Error {
  constructor(message: string, public code?: string, public details?: unknown) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConflictError'
  }
}

// Base repository class
abstract class BaseRepository<T, TInsert, TUpdate> {
  constructor(
    protected table: any,
    protected validateData: (data: unknown) => { success: boolean; error?: any },
    protected validateInsert?: (data: unknown) => { success: boolean; error?: any }
  ) {}

  async create(data: TInsert): Promise<T> {
    const validation = this.validateInsert ? this.validateInsert(data) : this.validateData(data)
    if (!validation.success) {
      throw new ValidationError('Invalid data', validation.error?.message)
    }

    try {
      const result = await db.insert(this.table).values(data).returning()
      return result[0]
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        throw new ConflictError('Duplicate entry')
      }
      throw new DatabaseError('Failed to create record', error.code, error)
    }
  }

  async findById(id: string): Promise<T | null> {
    try {
      const result = await db.select().from(this.table).where(eq(this.table.id, id)).limit(1)
      return result[0] || null
    } catch (error: any) {
      throw new DatabaseError('Failed to fetch record', error.code, error)
    }
  }

  async update(id: string, data: TUpdate): Promise<T> {
    const validation = this.validateData(data)
    if (!validation.success) {
      throw new ValidationError('Invalid update data', validation.error?.message)
    }

    try {
      const result = await db
        .update(this.table)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(this.table.id, id))
        .returning()
      
      if (!result[0]) {
        throw new NotFoundError('Record', id)
      }
      return result[0]
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error
      throw new DatabaseError('Failed to update record', error.code, error)
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const result = await db.delete(this.table).where(eq(this.table.id, id)).returning()
      if (!result[0]) {
        throw new NotFoundError('Record', id)
      }
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error
      throw new DatabaseError('Failed to delete record', error.code, error)
    }
  }

  async findMany(
    filters: Partial<T> = {},
    pagination: PaginationValidation = { page: 1, limit: 20 },
    sort: SortValidation = { field: 'createdAt', direction: 'desc' }
  ): Promise<{ data: T[]; total: number }> {
    try {
      // Build WHERE conditions
      const conditions = []
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          conditions.push(eq(this.table[key as keyof T], value as any))
        }
      }

      // Get total count
      const countQuery = conditions.length > 0 
        ? db.select({ count: sql<number>`count(*)` }).from(this.table).where(and(...conditions))
        : db.select({ count: sql<number>`count(*)` }).from(this.table)
      
      const [{ count }] = await countQuery

      // Get data with pagination and sorting
      const offset = (pagination.page - 1) * pagination.limit
      const orderBy = sort.direction === 'desc' 
        ? desc(this.table[sort.field as keyof T] as any)
        : asc(this.table[sort.field as keyof T] as any)

      const query = conditions.length > 0
        ? db.select().from(this.table).where(and(...conditions)).orderBy(orderBy).limit(pagination.limit).offset(offset)
        : db.select().from(this.table).orderBy(orderBy).limit(pagination.limit).offset(offset)

      const data = await query

      return { data, total: count }
    } catch (error: any) {
      throw new DatabaseError('Failed to fetch records', error.code, error)
    }
  }
}

// User Repository
export class UserRepository extends BaseRepository<User, UserInsert, Partial<UserInsert>> {
  constructor() {
    super(users, (data) => userInsertSchema.safeParse(data), (data) => userInsertSchema.safeParse(data))
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1)
      return result[0] || null
    } catch (error: any) {
      throw new DatabaseError('Failed to fetch user by email', error.code, error)
    }
  }

  async findByWorkosId(workosId: string): Promise<User | null> {
    try {
      const result = await db.select().from(users).where(eq(users.workosId, workosId)).limit(1)
      return result[0] || null
    } catch (error: any) {
      throw new DatabaseError('Failed to fetch user by WorkOS ID', error.code, error)
    }
  }

  async updatePreferences(id: string, preferences: User['preferences']): Promise<User> {
    return this.update(id, { preferences })
  }
}

// Task Repository
export class TaskRepository extends BaseRepository<Task, TaskInsert, Partial<TaskInsert>> {
  constructor() {
    super(tasks, validateTaskUpdateData, validateTaskInsertData)
  }

  async findByUserId(userId: string): Promise<Task[]> {
    try {
      return await db.select().from(tasks).where(eq(tasks.userId, userId))
    } catch (error: any) {
      throw new DatabaseError('Failed to fetch tasks by user', error.code, error)
    }
  }

  async findWithFilters(userId: string, filters: TaskFilterValidation): Promise<Task[]> {
    try {
      const conditions = [eq(tasks.userId, userId)]
      
      if (filters.status) {
        conditions.push(eq(tasks.status, filters.status))
      }
      
      if (filters.priority) {
        conditions.push(eq(tasks.priority, filters.priority))
      }
      
      if (filters.dateRange) {
        conditions.push(between(tasks.dueDate, filters.dateRange.start, filters.dateRange.end))
      }

      return await db.select().from(tasks).where(and(...conditions))
    } catch (error: any) {
      throw new DatabaseError('Failed to fetch tasks with filters', error.code, error)
    }
  }

  async findOverdue(userId: string): Promise<Task[]> {
    try {
      const now = new Date()
      return await db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.userId, userId),
            eq(tasks.status, 'pending'),
            lte(tasks.dueDate, now)
          )
        )
    } catch (error: any) {
      throw new DatabaseError('Failed to fetch overdue tasks', error.code, error)
    }
  }

  async findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Task[]> {
    try {
      return await db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.userId, userId),
            between(tasks.dueDate, startDate, endDate)
          )
        )
    } catch (error: any) {
      throw new DatabaseError('Failed to fetch tasks by date range', error.code, error)
    }
  }

  async bulkUpdate(data: BulkTaskUpdateValidation): Promise<Task[]> {
    try {
      const results = await db.transaction(async (tx) => {
        const updatedTasks = []
        for (const id of data.ids) {
          const [updated] = await tx
            .update(tasks)
            .set({ ...data.updates, updatedAt: new Date() })
            .where(eq(tasks.id, id))
            .returning()
          updatedTasks.push(updated)
        }
        return updatedTasks
      })
      return results
    } catch (error: any) {
      throw new DatabaseError('Failed to bulk update tasks', error.code, error)
    }
  }

  async addTag(taskId: string, tagId: string): Promise<void> {
    try {
      await db.insert(taskTags).values({ taskId, tagId })
    } catch (error: any) {
      if (error.code === '23505') return // Already exists
      throw new DatabaseError('Failed to add tag to task', error.code, error)
    }
  }

  async removeTag(taskId: string, tagId: string): Promise<void> {
    try {
      await db.delete(taskTags).where(and(eq(taskTags.taskId, taskId), eq(taskTags.tagId, tagId)))
    } catch (error: any) {
      throw new DatabaseError('Failed to remove tag from task', error.code, error)
    }
  }

  async getWithTags(taskId: string): Promise<Task & { tags: { id: string; name: string; color: string }[] } | null> {
    try {
      const result = await db
        .select({
          task: tasks,
          tags: {
            id: tags.id,
            name: tags.name,
            color: tags.color,
          },
        })
        .from(tasks)
        .leftJoin(taskTags, eq(tasks.id, taskTags.taskId))
        .leftJoin(tags, eq(taskTags.tagId, tags.id))
        .where(eq(tasks.id, taskId))

      if (!result[0]) return null

      const task = result[0].task
      const tags_data = result
        .filter(r => r.tags?.id)
        .map(r => r.tags!) as { id: string; name: string; color: string }[]

      return { ...task, tags: tags_data }
    } catch (error: any) {
      throw new DatabaseError('Failed to fetch task with tags', error.code, error)
    }
  }
}

// Calendar Event Repository
export class CalendarEventRepository extends BaseRepository<CalendarEvent, CalendarEventInsert, Partial<CalendarEventInsert>> {
  constructor() {
    super(calendarEvents, validateEventUpdateData, validateEventInsertData)
  }

  async findByUserId(userId: string): Promise<CalendarEvent[]> {
    try {
      return await db.select().from(calendarEvents).where(eq(calendarEvents.userId, userId))
    } catch (error: any) {
      throw new DatabaseError('Failed to fetch events by user', error.code, error)
    }
  }

  async findWithFilters(userId: string, filters: EventFilterValidation): Promise<CalendarEvent[]> {
    try {
      const conditions = [eq(calendarEvents.userId, userId)]
      
      if (filters.dateRange) {
        conditions.push(
          and(
            lte(calendarEvents.startTime, filters.dateRange.end),
            gte(calendarEvents.endTime, filters.dateRange.start)
          )
        )
      }
      
      if (filters.isAllDay !== undefined) {
        conditions.push(eq(calendarEvents.isAllDay, filters.isAllDay))
      }

      return await db.select().from(calendarEvents).where(and(...conditions))
    } catch (error: any) {
      throw new DatabaseError('Failed to fetch events with filters', error.code, error)
    }
  }

  async findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    try {
      return await db
        .select()
        .from(calendarEvents)
        .where(
          and(
            eq(calendarEvents.userId, userId),
            and(
              lte(calendarEvents.startTime, endDate),
              gte(calendarEvents.endTime, startDate)
            )
          )
        )
    } catch (error: any) {
      throw new DatabaseError('Failed to fetch events by date range', error.code, error)
    }
  }

  async findConflicts(
    userId: string, 
    startTime: Date, 
    endTime: Date, 
    excludeId?: string
  ): Promise<CalendarEvent[]> {
    try {
      const conditions = [
        eq(calendarEvents.userId, userId),
        and(
          lte(calendarEvents.startTime, endTime),
          gte(calendarEvents.endTime, startTime)
        )
      ]

      if (excludeId) {
        conditions.push(sql`${calendarEvents.id} != ${excludeId}`)
      }

      return await db.select().from(calendarEvents).where(and(...conditions))
    } catch (error: any) {
      throw new DatabaseError('Failed to fetch event conflicts', error.code, error)
    }
  }

  async bulkUpdate(data: BulkEventUpdateValidation): Promise<CalendarEvent[]> {
    try {
      const results = await db.transaction(async (tx) => {
        const updatedEvents = []
        for (const id of data.ids) {
          const [updated] = await tx
            .update(calendarEvents)
            .set({ ...data.updates, updatedAt: new Date() })
            .where(eq(calendarEvents.id, id))
            .returning()
          updatedEvents.push(updated)
        }
        return updatedEvents
      })
      return results
    } catch (error: any) {
      throw new DatabaseError('Failed to bulk update events', error.code, error)
    }
  }

  async addTag(eventId: string, tagId: string): Promise<void> {
    try {
      await db.insert(eventTags).values({ eventId, tagId })
    } catch (error: any) {
      if (error.code === '23505') return // Already exists
      throw new DatabaseError('Failed to add tag to event', error.code, error)
    }
  }

  async removeTag(eventId: string, tagId: string): Promise<void> {
    try {
      await db.delete(eventTags).where(and(eq(eventTags.eventId, eventId), eq(eventTags.tagId, tagId)))
    } catch (error: any) {
      throw new DatabaseError('Failed to remove tag from event', error.code, error)
    }
  }

  async getWithTags(eventId: string): Promise<CalendarEvent & { tags: { id: string; name: string; color: string }[] } | null> {
    try {
      const result = await db
        .select({
          event: calendarEvents,
          tags: {
            id: tags.id,
            name: tags.name,
            color: tags.color,
          },
        })
        .from(calendarEvents)
        .leftJoin(eventTags, eq(calendarEvents.id, eventTags.eventId))
        .leftJoin(tags, eq(eventTags.tagId, tags.id))
        .where(eq(calendarEvents.id, eventId))

      if (!result[0]) return null

      const event = result[0].event
      const tags_data = result
        .filter(r => r.tags?.id)
        .map(r => r.tags!) as { id: string; name: string; color: string }[]

      return { ...event, tags: tags_data }
    } catch (error: any) {
      throw new DatabaseError('Failed to fetch event with tags', error.code, error)
    }
  }
}

// Category Repository
export class CategoryRepository extends BaseRepository<typeof categories.$inferSelect, typeof categories.$inferInsert, Partial<typeof categories.$inferInsert>> {
  constructor() {
    super(categories, (data) => ({ success: true })) // Add validation later
  }

  async findByUserId(userId: string) {
    try {
      return await db.select().from(categories).where(eq(categories.userId, userId))
    } catch (error: any) {
      throw new DatabaseError('Failed to fetch categories by user', error.code, error)
    }
  }

  async findByName(userId: string, name: string) {
    try {
      const result = await db
        .select()
        .from(categories)
        .where(and(eq(categories.userId, userId), eq(categories.name, name)))
        .limit(1)
      return result[0] || null
    } catch (error: any) {
      throw new DatabaseError('Failed to fetch category by name', error.code, error)
    }
  }
}

// Tag Repository
export class TagRepository extends BaseRepository<typeof tags.$inferSelect, typeof tags.$inferInsert, Partial<typeof tags.$inferInsert>> {
  constructor() {
    super(tags, (data) => ({ success: true })) // Add validation later
  }

  async findByUserId(userId: string) {
    try {
      return await db.select().from(tags).where(eq(tags.userId, userId))
    } catch (error: any) {
      throw new DatabaseError('Failed to fetch tags by user', error.code, error)
    }
  }

  async searchByName(userId: string, query: string) {
    try {
      return await db
        .select()
        .from(tags)
        .where(and(eq(tags.userId, userId), ilike(tags.name, `%${query}%`)))
    } catch (error: any) {
      throw new DatabaseError('Failed to search tags', error.code, error)
    }
  }
}

// Repository instances
export const userRepository = new UserRepository()
export const taskRepository = new TaskRepository()
export const calendarEventRepository = new CalendarEventRepository()
export const categoryRepository = new CategoryRepository()
export const tagRepository = new TagRepository()

// Dashboard stats repository
export class DashboardRepository {
  async getUserStats(userId: string) {
    try {
      const [taskStats] = await db
        .select({
          totalTasks: sql<number>`count(*)`,
          completedTasks: sql<number>`count(*) filter (where status = 'completed')`,
          pendingTasks: sql<number>`count(*) filter (where status = 'pending')`,
          overdueTasks: sql<number>`count(*) filter (where status = 'pending' and due_date < now())`,
        })
        .from(tasks)
        .where(eq(tasks.userId, userId))

      const [eventStats] = await db
        .select({
          upcomingEvents: sql<number>`count(*) filter (where start_time > now())`,
        })
        .from(calendarEvents)
        .where(eq(calendarEvents.userId, userId))

      return {
        totalTasks: taskStats?.totalTasks || 0,
        completedTasks: taskStats?.completedTasks || 0,
        pendingTasks: taskStats?.pendingTasks || 0,
        overdueTasks: taskStats?.overdueTasks || 0,
        upcomingEvents: eventStats?.upcomingEvents || 0,
      }
    } catch (error: any) {
      throw new DatabaseError('Failed to fetch dashboard stats', error.code, error)
    }
  }
}

export const dashboardRepository = new DashboardRepository()