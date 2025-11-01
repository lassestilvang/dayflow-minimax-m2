import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'
import * as path from 'path'
import { sql } from 'drizzle-orm'

// Migration interface
export interface Migration {
  id: string
  name: string
  up: (db: any) => Promise<void>
  down: (db: any) => Promise<void>
  timestamp: Date
}

// Migration status
export interface MigrationStatus {
  id: string
  name: string
  applied: boolean
  appliedAt?: Date
  error?: string
}

// Database migration manager
export class MigrationManager {
  private db: any
  private connectionString: string

  constructor(connectionString: string) {
    this.connectionString = connectionString
    const sqlClient = neon(connectionString)
    this.db = drizzle(sqlClient) as any
  }

  // Load migrations from directory
  private async loadMigrations(): Promise<Migration[]> {
    const migrationsDir = path.join(process.cwd(), 'lib', 'db', 'migrations')
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.match(/^\d+_.*\.ts$/))
      .sort()

    const migrations: Migration[] = []

    for (const file of files) {
      const filePath = path.join(migrationsDir, file)
      const migrationModule = await import(filePath)
      
      const id = file.split('_')[0]
      const name = file.replace(/^\d+_/, '').replace('.ts', '')
      
      migrations.push({
        id,
        name,
        up: migrationModule.up,
        down: migrationModule.down,
        timestamp: new Date(),
      })
    }

    return migrations
  }

  // Create migrations table if it doesn't exist
  private async createMigrationsTable(): Promise<void> {
    await this.db.execute(sql`
      CREATE TABLE IF NOT EXISTS migrations (
        id text PRIMARY KEY,
        name text NOT NULL,
        applied_at timestamp with time zone DEFAULT now(),
        error text
      )
    `)
  }

  // Get migration status
  async getMigrationStatus(): Promise<MigrationStatus[]> {
    await this.createMigrationsTable()
    
    const migrations = await this.loadMigrations()
    const appliedMigrations = await this.db
      .select()
      .from(sql`migrations`)
      .orderBy(sql`applied_at`)

    const appliedIds = new Set(appliedMigrations.map((m: any) => m.id))

    return migrations.map(migration => ({
      id: migration.id,
      name: migration.name,
      applied: appliedIds.has(migration.id),
      appliedAt: appliedMigrations.find(m => m.id === migration.id)?.applied_at,
      error: appliedMigrations.find(m => m.id === migration.id)?.error,
    }))
  }

  // Apply pending migrations
  async migrate(): Promise<{ success: boolean; error?: string; migrated: string[] }> {
    await this.createMigrationsTable()
    
    const migrations = await this.loadMigrations()
    const status = await this.getMigrationStatus()
    const pendingMigrations = status.filter(s => !s.applied).map(s => s.id)

    if (pendingMigrations.length === 0) {
      return { success: true, migrated: [] }
    }

    const migrated: string[] = []

    try {
      for (const migrationId of pendingMigrations) {
        const migration = migrations.find(m => m.id === migrationId)
        if (!migration) continue

        console.log(`Applying migration ${migrationId}: ${migration.name}`)
        
        await this.db.transaction(async (tx: any) => {
          await migration.up(tx)
          
          await tx.execute(sql`
            INSERT INTO migrations (id, name, applied_at)
            VALUES (${migration.id}, ${migration.name}, ${sql`now()`})
          `)
        })

        migrated.push(migrationId)
        console.log(`Migration ${migrationId} applied successfully`)
      }

      return { success: true, migrated }
    } catch (error: any) {
      // Rollback successful migrations
      for (const id of migrated) {
        await this.rollbackMigration(id)
      }
      
      return { 
        success: false, 
        error: error.message || 'Unknown migration error',
        migrated: []
      }
    }
  }

  // Rollback a specific migration
  async rollbackMigration(migrationId: string): Promise<{ success: boolean; error?: string }> {
    const migrations = await this.loadMigrations()
    const migration = migrations.find(m => m.id === migrationId)
    
    if (!migration) {
      return { success: false, error: `Migration ${migrationId} not found` }
    }

    try {
      await this.db.transaction(async (tx: any) => {
        await migration.down(tx)
        
        await tx.execute(sql`
          DELETE FROM migrations WHERE id = ${migrationId}
        `)
      })

      console.log(`Migration ${migrationId} rolled back successfully`)
      return { success: true }
    } catch (error: any) {
      console.error(`Failed to rollback migration ${migrationId}:`, error)
      return { success: false, error: error.message }
    }
  }

  // Reset database to initial state
  async reset(): Promise<{ success: boolean; error?: string }> {
    try {
      // Get all applied migrations
      const appliedMigrations = await this.db
        .select()
        .from(sql`migrations`)
        .orderBy(sql`applied_at DESC`)

      // Rollback all migrations
      for (const migration of appliedMigrations) {
        const rollbackResult = await this.rollbackMigration(migration.id)
        if (!rollbackResult.success) {
          return { success: false, error: rollbackResult.error }
        }
      }

      // Drop migrations table
      await this.db.execute(sql`DROP TABLE IF EXISTS migrations`)

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Generate a new migration file
  async generateMigration(name: string): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      const migrationsDir = path.join(process.cwd(), 'lib', 'db', 'migrations')
      const timestamp = Date.now()
      const filename = `${timestamp}_${name}.ts`
      const filepath = path.join(migrationsDir, filename)

      const template = `import { Migration } from 'drizzle-kit/migrations/sql'

export const up = async (db: any) => {
  // Add your migration SQL here
  console.log('Migration ${name} - Up')
}

export const down = async (db: any) => {
  // Add your rollback SQL here
  console.log('Migration ${name} - Down')
}
`

      fs.writeFileSync(filepath, template)

      return { success: true, path: filepath }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get database info
  async getDatabaseInfo(): Promise<{
    tables: string[]
    indexes: string[]
    size: string
  }> {
    try {
      const tables = await this.db
        .select({ tableName: sql`table_name` })
        .from(sql`information_schema.tables`)
        .where(sql`table_schema = 'public'`)

      const indexes = await this.db
        .select({ 
          indexName: sql`indexname`, 
          tableName: sql`tablename` 
        })
        .from(sql`pg_indexes`)
        .where(sql`schemaname = 'public'`)

      const sizeResult = await this.db
        .select({ size: sql`pg_size_pretty(pg_database_size(current_database()))` })
        .from(sql`pg_database`)
        .where(sql`datname = current_database()`)

      return {
        tables: tables.map(t => t.tableName),
        indexes: indexes.map(i => `${i.tableName}.${i.indexName}`),
        size: sizeResult[0]?.size || '0 bytes',
      }
    } catch (error: any) {
      throw new Error(`Failed to get database info: ${error.message}`)
    }
  }

  // Check database health
  async checkHealth(): Promise<{
    connected: boolean
    version: string
    uptime: number
    activeConnections: number
    error?: string
  }> {
    try {
      const versionResult = await this.db
        .select({ version: sql`version()` })
        .from(sql`version()`

        )

      const uptimeResult = await this.db
        .select({ uptime: sql`EXTRACT(EPOCH FROM (now() - pg_postmaster_start_time()))` })
        .from(sql`pg_postmaster_start_time()`

        )

      const connectionsResult = await this.db
        .select({ count: sql`count(*)` })
        .from(sql`pg_stat_activity`)
        .where(sql`state = 'active'`)

      return {
        connected: true,
        version: versionResult[0]?.version?.split(' ')[1] || 'unknown',
        uptime: Math.floor(uptimeResult[0]?.uptime || 0),
        activeConnections: connectionsResult[0]?.count || 0,
      }
    } catch (error: any) {
      return {
        connected: false,
        version: 'unknown',
        uptime: 0,
        activeConnections: 0,
        error: error.message,
      }
    }
  }
}

// Utility functions
export const createMigrationManager = (connectionString?: string) => {
  const url = connectionString || process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL environment variable is required')
  }
  return new MigrationManager(url)
}

// CLI interface for migrations
export const runMigrations = async (command: string, options: any = {}) => {
  const manager = createMigrationManager()

  switch (command) {
    case 'migrate':
      return await manager.migrate()
    
    case 'status':
      return await manager.getMigrationStatus()
    
    case 'reset':
      return await manager.reset()
    
    case 'generate':
      if (!options.name) {
        throw new Error('Migration name is required')
      }
      return await manager.generateMigration(options.name)
    
    case 'health':
      return await manager.checkHealth()
    
    case 'info':
      return await manager.getDatabaseInfo()
    
    default:
      throw new Error(`Unknown command: ${command}`)
  }
}

// Export singleton instance
export const migrationManager = createMigrationManager()