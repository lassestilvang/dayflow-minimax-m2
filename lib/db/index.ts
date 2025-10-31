import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'

// Neon database connection for serverless environment
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required')
}

// Create Neon database instance
const sql = neon(connectionString)

// Create Drizzle instance with schema
export const db = drizzle(sql, { schema })

// Export database schema types
export type Database = typeof schema
export type Tables = typeof schema
export type Enums = typeof schema

// Export table types for TypeScript
export type User = typeof schema.users.$inferSelect
export type UserInsert = typeof schema.users.$inferInsert
export type Task = typeof schema.tasks.$inferSelect
export type TaskInsert = typeof schema.tasks.$inferInsert
export type CalendarEvent = typeof schema.calendarEvents.$inferSelect
export type CalendarEventInsert = typeof schema.calendarEvents.$inferInsert

// Database connection status
export interface DatabaseStatus {
  connected: boolean
  error?: string
}

export const checkDatabaseConnection = async (): Promise<DatabaseStatus> => {
  try {
    // Test connection with a simple query
    await sql`SELECT 1`
    return { connected: true }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown database error'
    }
  }
}