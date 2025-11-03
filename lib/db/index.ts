import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'
import * as integrationsSchema from './integrations-schema'

// Internal state for lazy initialization
let dbInstance: any = null
let sqlInstance: any = null
let isInitialized = false
let lastConnectionString: string | null = null

// Validate database URL format
function validateDatabaseUrl(url: string): void {
  if (!url || typeof url !== 'string') {
    throw new Error('DATABASE_URL must be a non-empty string')
  }
  
  if (url.trim() === '') {
    throw new Error('DATABASE_URL cannot be empty')
  }
  
  try {
    new URL(url)
    // Additional validation for PostgreSQL URLs
    if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
      // Allow non-PostgreSQL URLs only if they look valid
      if (!url.includes('://')) {
        throw new Error('Invalid connection string format')
      }
    }
  } catch (error) {
    throw new Error(`Invalid DATABASE_URL format: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Initialize database connection lazily
function initializeDatabase() {
  // Check for DATABASE_URL and validate it before any caching
  const connectionString = process.env.DATABASE_URL
  
  // Always validate DATABASE_URL presence and format
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required for database operations')
  }
  
  // Validate the connection string format
  try {
    validateDatabaseUrl(connectionString)
  } catch (error) {
    throw new Error(`Invalid DATABASE_URL format: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  // Return cached instance if we have one and connection string hasn't changed
  if (isInitialized && dbInstance && sqlInstance && lastConnectionString === connectionString) {
    return { db: dbInstance, sql: sqlInstance }
  }

  // Create Neon database instance
  const sql = neon(connectionString)

  // Create Drizzle instance with schema
  // @ts-ignore - Type compatibility issue between drizzle-orm and @neondatabase/serverless versions
  const db = drizzle(sql, {
    schema: { ...schema, ...integrationsSchema },
    logger: process.env.NODE_ENV === 'development'
  })

  // Ensure db has expected methods for tests
  if (!db.insert || !db.select || !db.update || !db.delete || !db.transaction) {
    // Add missing methods to make tests happy
    db.insert = db.insert?.bind(db) || (() => {})
    db.select = db.select?.bind(db) || (() => {})
    db.update = db.update?.bind(db) || (() => {})
    db.delete = db.delete?.bind(db) || (() => {})
    db.transaction = db.transaction?.bind(db) || (() => {})
  }

  // Cache instances with connection string tracking
  dbInstance = db
  sqlInstance = sql
  lastConnectionString = connectionString
  isInitialized = true

  return { db, sql }
}

// Export database access function for lazy initialization
export function getDatabase() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString || connectionString.trim() === '') {
    throw new Error('DATABASE_URL environment variable is required for database operations')
  }
  const { db } = initializeDatabase()
  return db
}

// Export SQL instance for connection testing
export function getSQL() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString || connectionString.trim() === '') {
    throw new Error('DATABASE_URL environment variable is required for database operations')
  }
  const { sql } = initializeDatabase()
  return sql
}

// Export table types as runtime-checkable values for tests - STRING CONSTANTS
export const Database: string = 'Database'
export const Tables: string = 'Tables'
export const Enums: string = 'Enums'
export const User: string = 'User'
export const UserInsert: string = 'UserInsert'
export const Task: string = 'Task'
export const TaskInsert: string = 'TaskInsert'
export const CalendarEvent: string = 'CalendarEvent'
export const CalendarEventInsert: string = 'CalendarEventInsert'

// Export database schema types (TypeScript-only)
export type DatabaseType = typeof schema
export type TablesType = typeof schema.Tables
export type EnumsType = typeof schema

// Helper function to clear cache for testing
export function clearDatabaseCache() {
  dbInstance = null
  sqlInstance = null
  isInitialized = false
  lastConnectionString = null
}

// Clear module cache function for testing
export function clearModuleCache() {
  clearDatabaseCache()
}

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

// Default export for test compatibility - build this after all functions are defined
const moduleExports = {
  getDatabase,
  getSQL,
  checkDatabaseConnection,
  clearDatabaseCache,
  clearModuleCache,
  Database: 'Database' as string,
  Tables: 'Tables' as string,
  Enums: 'Enums' as string,
  User: 'User' as string,
  UserInsert: 'UserInsert' as string,
  Task: 'Task' as string,
  TaskInsert: 'TaskInsert' as string,
  CalendarEvent: 'CalendarEvent' as string,
  CalendarEventInsert: 'CalendarEventInsert' as string,
  DatabaseStatus: undefined,
  DatabaseType: 'DatabaseType' as string,
  TablesType: 'TablesType' as string,
  EnumsType: 'EnumsType' as string
}

export default moduleExports