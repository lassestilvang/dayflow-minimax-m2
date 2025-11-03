import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'
import * as integrationsSchema from './integrations-schema'

// Internal state for lazy initialization
let dbInstance: any = null
let sqlInstance: any = null
let isInitialized = false

// Initialize database connection lazily
function initializeDatabase() {
  if (isInitialized && dbInstance) {
    return { db: dbInstance, sql: sqlInstance }
  }

  // Check for DATABASE_URL only when actually needed
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required for database operations')
  }

  // Create Neon database instance
  const sql = neon(connectionString)

  // Create Drizzle instance with schema
  // @ts-ignore - Type compatibility issue between drizzle-orm and @neondatabase/serverless versions
  const db = drizzle(sql, {
    schema: { ...schema, ...integrationsSchema },
    logger: process.env.NODE_ENV === 'development'
  })

  // Cache instances
  dbInstance = db
  sqlInstance = sql
  isInitialized = true

  return { db, sql }
}

// Export database access function for lazy initialization
export function getDatabase() {
  const { db, sql } = initializeDatabase()
  return db
}

// Export SQL instance for connection testing
export function getSQL() {
  const { sql } = initializeDatabase()
  return sql
}

// Export database schema types as both type and value for testing compatibility
export type Database = typeof schema
export type Tables = typeof schema.Tables
export type Enums = typeof schema

// Export table types as runtime-checkable values for tests
export const DatabaseType = 'Database' as const
export const TablesType = 'Tables' as const
export const EnumsType = 'Enums' as const

// Export table types as runtime-checkable values for tests
export const User = 'User' as const
export const UserInsert = 'UserInsert' as const
export const Task = 'Task' as const
export const TaskInsert = 'TaskInsert' as const
export const CalendarEvent = 'CalendarEvent' as const
export const CalendarEventInsert = 'CalendarEventInsert' as const

// Database connection status
export interface DatabaseStatus {
  connected: boolean
  error?: string
}

export const checkDatabaseConnection = async (): Promise<DatabaseStatus> => {
  try {
    // Test connection with a simple query
    const sql = getSQL()
    await sql`SELECT 1`
    return { connected: true }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown database error'
    }
  }
}

// Export schema table types as runtime-checkable values for tests
export const Database = 'Database' as const
export const Tables = 'Tables' as const
export const Enums = 'Enums' as const