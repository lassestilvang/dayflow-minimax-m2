import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest'
import fs from 'fs'
import path from 'path'
import { MigrationManager, createMigrationManager, runMigrations, migrationManager, type Migration, type MigrationStatus } from '../../lib/db/migration-manager'

// Mock instances
const mockExecute = vi.fn()
const mockSelect = vi.fn()
const mockTransaction = vi.fn((callback) => callback({
  execute: mockExecute,
  insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([]) }) }),
  delete: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([]) }) }),
  update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([]) }) }) }),
}))

// Mock drizzle-orm/neon-http
vi.mock('drizzle-orm/neon-http', () => ({
  drizzle: vi.fn().mockImplementation(() => ({
    execute: mockExecute,
    select: mockSelect,
    transaction: mockTransaction,
    sql: (strings: any, ...values: any) => ({ sql: strings.join(' '), values }),
  })),
}))

// Mock @neondatabase/serverless  
vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn().mockReturnValue({
    query: vi.fn().mockResolvedValue([{ result: 'success' }]),
  }),
}))

// Create properly mocked fs functions
const mockReaddirSync = vi.fn()
const mockWriteFileSync = vi.fn()
const mockExistsSync = vi.fn().mockReturnValue(true)
const mockMkdirSync = vi.fn()

// Mock fs module
vi.mock('fs', () => ({
  readdirSync: mockReaddirSync,
  writeFileSync: mockWriteFileSync,
  existsSync: mockExistsSync,
  mkdirSync: mockMkdirSync,
}))

// Mock path module
vi.mock('path', () => ({
  join: vi.fn((...args) => args.join('/')),
}))

describe('Migration Manager', () => {
  let migrationManagerInstance: MigrationManager
  const testConnectionString = 'postgresql://user:pass@localhost:5432/testdb'

  beforeEach(() => {
    // Reset all mock implementations
    mockExecute.mockReset()
    mockSelect.mockReset()
    mockTransaction.mockImplementation((callback) => callback({
      execute: mockExecute,
      insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([]) }) }),
      delete: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([]) }) }),
      update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([]) }) }) }),
    }))

    // Reset fs mocks
    mockReaddirSync.mockReset()
    mockWriteFileSync.mockReset()
    mockExistsSync.mockReturnValue(true)
    mockMkdirSync.mockReset()

    // Create migration manager instance for testing
    migrationManagerInstance = new MigrationManager(testConnectionString)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('MigrationManager Class', () => {
    describe('Constructor', () => {
      it('should create MigrationManager instance with connection string', () => {
        expect(migrationManagerInstance).toBeInstanceOf(MigrationManager)
        expect(migrationManagerInstance).toHaveProperty('db')
        expect(migrationManagerInstance).toHaveProperty('connectionString')
        expect(migrationManagerInstance.connectionString).toBe(testConnectionString)
      })

      it('should initialize database client and drizzle instance', () => {
        const { drizzle } = require('drizzle-orm/neon-http')
        expect(drizzle).toHaveBeenCalledWith(expect.any(Object), {
          schema: {},
          logger: false, // Default NODE_ENV is not 'development'
        })
      })

      it('should enable logger in development environment', () => {
        const originalEnv = process.env.NODE_ENV
        process.env.NODE_ENV = 'development'
        
        const devManager = new MigrationManager(testConnectionString)
        const { drizzle } = require('drizzle-orm/neon-http')
        expect(drizzle).toHaveBeenCalledWith(expect.any(Object), {
          schema: {},
          logger: true,
        })
        
        process.env.NODE_ENV = originalEnv
      })
    })

    describe('loadMigrations', () => {
      it('should load migration files from directory', async () => {
        const testFiles = ['001_initial_schema.ts', '002_integration_framework.ts']
        
        mockReaddirSync.mockReturnValue(testFiles)
        
        // Mock the process.cwd
        const originalProcessCwd = process.cwd
        process.cwd = vi.fn().mockReturnValue('/test/project')
        
        try {
          const migrations = await migrationManagerInstance.loadMigrations()
          expect(migrations).toHaveLength(2)
          expect(migrations[0]).toHaveProperty('id', '001')
          expect(migrations[0]).toHaveProperty('name', 'initial_schema')
          expect(migrations[1]).toHaveProperty('id', '002')
          expect(migrations[1]).toHaveProperty('name', 'integration_framework')
        } finally {
          process.cwd = originalProcessCwd
        }
      })

      it('should filter files with correct pattern', async () => {
        const testFiles = [
          '001_valid_migration.ts',
          '002_another_migration.ts',
          'invalid_file.txt', // Should be filtered out
          'no_number_here.ts', // Should be filtered out
          '0000_too_many_numbers.ts', // Should be filtered out
        ]

        mockReaddirSync.mockReturnValue(testFiles)
        
        const originalProcessCwd = process.cwd
        process.cwd = vi.fn().mockReturnValue('/test/project')
        
        try {
          const migrations = await migrationManagerInstance.loadMigrations()
          expect(migrations).toHaveLength(2)
          expect(migrations[0].id).toBe('001')
          expect(migrations[1].id).toBe('002')
        } finally {
          process.cwd = originalProcessCwd
        }
      })

      it('should sort migrations by filename', async () => {
        const testFiles = [
          '003_later_migration.ts',
          '001_earlier_migration.ts',
          '002_middle_migration.ts',
        ]

        mockReaddirSync.mockReturnValue(testFiles)
        
        const originalProcessCwd = process.cwd
        process.cwd = vi.fn().mockReturnValue('/test/project')
        
        try {
          const migrations = await migrationManagerInstance.loadMigrations()
          expect(migrations).toHaveLength(3)
          expect(migrations[0].id).toBe('001')
          expect(migrations[1].id).toBe('002')
          expect(migrations[2].id).toBe('003')
        } finally {
          process.cwd = originalProcessCwd
        }
      })

      it('should handle missing migration directory', async () => {
        mockReaddirSync.mockImplementation(() => {
          throw new Error('ENOENT: no such file or directory')
        })
        
        const originalProcessCwd = process.cwd
        process.cwd = vi.fn().mockReturnValue('/test/project')
        
        try {
          await expect(migrationManagerInstance.loadMigrations()).rejects.toThrow()
        } finally {
          process.cwd = originalProcessCwd
        }
      })
    })

    describe('createMigrationsTable', () => {
      it('should create migrations table', async () => {
        await migrationManagerInstance.createMigrationsTable()
        
        expect(mockExecute).toHaveBeenCalledWith(expect.objectContaining({
          sql: expect.stringContaining('CREATE TABLE IF NOT EXISTS migrations'),
          values: expect.any(Array)
        }))
      })

      it('should execute CREATE TABLE statement with correct schema', async () => {
        await migrationManagerInstance.createMigrationsTable()
        
        expect(mockExecute).toHaveBeenCalledWith(expect.objectContaining({
          sql: expect.stringContaining('CREATE TABLE IF NOT EXISTS migrations'),
          values: []
        }))
      })
    })

    describe('getMigrationStatus', () => {
      it('should return migration status for all migrations', async () => {
        const testFiles = ['001_initial_schema.ts', '002_integration_framework.ts']
        
        mockReaddirSync.mockReturnValue(testFiles)
        
        // Mock applied migrations response
        mockSelect.mockReturnValue({
          from: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([
              { id: '001', name: 'initial_schema', applied_at: new Date(), error: null }
            ])
          })
        })

        const originalProcessCwd = process.cwd
        process.cwd = vi.fn().mockReturnValue('/test/project')
        
        try {
          const status = await migrationManagerInstance.getMigrationStatus()
          
          expect(status).toHaveLength(2)
          expect(status[0]).toEqual({
            id: '001',
            name: 'initial_schema',
            applied: true,
            appliedAt: expect.any(Date),
            error: undefined
          })
          expect(status[1]).toEqual({
            id: '002',
            name: 'integration_framework',
            applied: false,
            appliedAt: undefined,
            error: undefined
          })
        } finally {
          process.cwd = originalProcessCwd
        }
      })

      it('should handle migrations with errors', async () => {
        mockReaddirSync.mockReturnValue(['001_initial_schema.ts'])
        mockSelect.mockReturnValue({
          from: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([
              { id: '001', name: 'initial_schema', applied_at: new Date(), error: 'Connection failed' }
            ])
          })
        })

        const originalProcessCwd = process.cwd
        process.cwd = vi.fn().mockReturnValue('/test/project')
        
        try {
          const status = await migrationManagerInstance.getMigrationStatus()
          
          expect(status[0].error).toBe('Connection failed')
        } finally {
          process.cwd = originalProcessCwd
        }
      })
    })

    describe('migrate', () => {
      it('should apply pending migrations successfully', async () => {
        const mockMigrations = [
          { 
            id: '001', 
            name: 'initial_schema', 
            up: vi.fn().mockResolvedValue(undefined), 
            down: vi.fn() 
          }
        ]

        // Mock loadMigrations
        vi.spyOn(migrationManagerInstance as any, 'loadMigrations').mockResolvedValue(mockMigrations)
        
        // Mock getMigrationStatus
        vi.spyOn(migrationManagerInstance as any, 'getMigrationStatus').mockResolvedValue([
          { id: '001', name: 'initial_schema', applied: false }
        ])

        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
        
        const result = await migrationManagerInstance.migrate()
        
        expect(result.success).toBe(true)
        expect(result.migrated).toEqual(['001'])
        expect(mockMigrations[0].up).toHaveBeenCalled()
        expect(consoleSpy).toHaveBeenCalledWith('Applying migration 001: initial_schema')
        expect(consoleSpy).toHaveBeenCalledWith('Migration 001 applied successfully')
        
        consoleSpy.mockRestore()
      })

      it('should return success when no pending migrations', async () => {
        vi.spyOn(migrationManagerInstance as any, 'getMigrationStatus').mockResolvedValue([
          { id: '001', name: 'initial_schema', applied: true }
        ])

        const result = await migrationManagerInstance.migrate()
        
        expect(result.success).toBe(true)
        expect(result.migrated).toEqual([])
      })

      it('should rollback migrations on error', async () => {
        const mockMigrations = [
          { 
            id: '001', 
            name: 'initial_schema', 
            up: vi.fn().mockResolvedValue(undefined), 
            down: vi.fn().mockResolvedValue(undefined) 
          },
          { 
            id: '002', 
            name: 'second_migration', 
            up: vi.fn().mockRejectedValue(new Error('Migration failed')), 
            down: vi.fn().mockResolvedValue(undefined) 
          }
        ]

        vi.spyOn(migrationManagerInstance as any, 'loadMigrations').mockResolvedValue(mockMigrations)
        vi.spyOn(migrationManagerInstance as any, 'getMigrationStatus').mockResolvedValue([
          { id: '001', name: 'initial_schema', applied: false },
          { id: '002', name: 'second_migration', applied: false }
        ])

        vi.spyOn(migrationManagerInstance as any, 'rollbackMigration').mockResolvedValue({ success: true })

        const result = await migrationManagerInstance.migrate()
        
        expect(result.success).toBe(false)
        expect(result.error).toBe('Migration failed')
        expect(result.migrated).toEqual([])
        
        // First migration should have been rolled back
        expect(migrationManagerInstance.rollbackMigration).toHaveBeenCalledWith('001')
      })

      it('should handle migration transaction errors', async () => {
        const mockMigrations = [
          { 
            id: '001', 
            name: 'initial_schema', 
            up: vi.fn().mockRejectedValue(new Error('Transaction failed')), 
            down: vi.fn() 
          }
        ]

        vi.spyOn(migrationManagerInstance as any, 'loadMigrations').mockResolvedValue(mockMigrations)
        vi.spyOn(migrationManagerInstance as any, 'getMigrationStatus').mockResolvedValue([
          { id: '001', name: 'initial_schema', applied: false }
        ])

        const result = await migrationManagerInstance.migrate()
        
        expect(result.success).toBe(false)
        expect(result.error).toBe('Transaction failed')
      })
    })

    describe('rollbackMigration', () => {
      it('should rollback migration successfully', async () => {
        const mockMigration = {
          id: '001',
          name: 'initial_schema',
          up: vi.fn(),
          down: vi.fn().mockResolvedValue(undefined)
        }

        vi.spyOn(migrationManagerInstance as any, 'loadMigrations').mockResolvedValue([mockMigration])

        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
        
        const result = await migrationManagerInstance.rollbackMigration('001')
        
        expect(result.success).toBe(true)
        expect(mockMigration.down).toHaveBeenCalled()
        expect(consoleSpy).toHaveBeenCalledWith('Migration 001 rolled back successfully')
        
        consoleSpy.mockRestore()
      })

      it('should return error for non-existent migration', async () => {
        vi.spyOn(migrationManagerInstance as any, 'loadMigrations').mockResolvedValue([])

        const result = await migrationManagerInstance.rollbackMigration('999')
        
        expect(result.success).toBe(false)
        expect(result.error).toBe('Migration 999 not found')
      })

      it('should handle rollback errors', async () => {
        const mockMigration = {
          id: '001',
          name: 'initial_schema',
          up: vi.fn(),
          down: vi.fn().mockRejectedValue(new Error('Rollback failed'))
        }

        vi.spyOn(migrationManagerInstance as any, 'loadMigrations').mockResolvedValue([mockMigration])

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        
        const result = await migrationManagerInstance.rollbackMigration('001')
        
        expect(result.success).toBe(false)
        expect(result.error).toBe('Rollback failed')
        expect(consoleSpy).toHaveBeenCalledWith('Failed to rollback migration 001:', expect.any(Error))
        
        consoleSpy.mockRestore()
      })
    })

    describe('reset', () => {
      it('should reset database successfully', async () => {
        const mockAppliedMigrations = [
          { id: '001', name: 'initial_schema', applied_at: new Date() },
          { id: '002', name: 'integration_framework', applied_at: new Date() }
        ]

        mockSelect.mockReturnValue({
          from: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockAppliedMigrations)
          })
        })

        vi.spyOn(migrationManagerInstance as any, 'rollbackMigration')
          .mockResolvedValue({ success: true })

        const result = await migrationManagerInstance.reset()
        
        expect(result.success).toBe(true)
        expect(migrationManagerInstance.rollbackMigration).toHaveBeenCalledTimes(2)
        expect(mockExecute).toHaveBeenCalledWith(expect.objectContaining({
          sql: expect.stringContaining('DROP TABLE IF EXISTS migrations')
        }))
      })

      it('should return error if rollback fails', async () => {
        mockSelect.mockReturnValue({
          from: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([
              { id: '001', name: 'initial_schema', applied_at: new Date() }
            ])
          })
        })

        vi.spyOn(migrationManagerInstance as any, 'rollbackMigration')
          .mockResolvedValue({ success: false, error: 'Rollback failed' })

        const result = await migrationManagerInstance.reset()
        
        expect(result.success).toBe(false)
        expect(result.error).toBe('Rollback failed')
      })

      it('should handle database errors', async () => {
        mockSelect.mockImplementation(() => {
          throw new Error('Database connection failed')
        })

        const result = await migrationManagerInstance.reset()
        
        expect(result.success).toBe(false)
        expect(result.error).toBe('Database connection failed')
      })
    })

    describe('generateMigration', () => {
      it('should generate migration file successfully', async () => {
        const migrationName = 'add_new_table'
        const testCwd = '/test/project'
        
        process.cwd = vi.fn().mockReturnValue(testCwd)
        mockWriteFileSync.mockImplementation(() => {})

        const result = await migrationManagerInstance.generateMigration(migrationName)
        
        expect(result.success).toBe(true)
        expect(result.path).toContain(migrationName)
        expect(result.path).toContain('.ts')
        expect(mockWriteFileSync).toHaveBeenCalledWith(
          expect.stringContaining(migrationName),
          expect.stringContaining(migrationName)
        )
        
        process.cwd = vi.fn()
      })

      it('should generate correct migration template', async () => {
        const migrationName = 'test_migration'
        
        process.cwd = vi.fn().mockReturnValue('/test/project')
        mockWriteFileSync.mockImplementation(() => {})

        await migrationManagerInstance.generateMigration(migrationName)
        
        const templateContent = mockWriteFileSync.mock.calls[0][1] as string
        
        expect(templateContent).toContain('import { Migration } from \'drizzle-kit/migrations/sql\'')
        expect(templateContent).toContain('export const up = async (db: any)')
        expect(templateContent).toContain('export const down = async (db: any)')
        expect(templateContent).toContain(migrationName)
        
        process.cwd = vi.fn()
      })

      it('should handle file system errors', async () => {
        mockWriteFileSync.mockImplementation(() => {
          throw new Error('Permission denied')
        })

        const result = await migrationManagerInstance.generateMigration('test')
        
        expect(result.success).toBe(false)
        expect(result.error).toBe('Permission denied')
      })
    })

    describe('getDatabaseInfo', () => {
      it('should return database information successfully', async () => {
        const mockTables = [{ table_name: 'users' }, { table_name: 'tasks' }]
        const mockIndexes = [{ indexname: 'idx_users_email', tablename: 'users' }]
        const mockSize = [{ size: '1024 MB' }]

        mockSelect
          .mockReturnValueOnce({ // For tables
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(mockTables)
            })
          })
          .mockReturnValueOnce({ // For indexes
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(mockIndexes)
            })
          })
          .mockReturnValueOnce({ // For size
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(mockSize)
            })
          })

        const result = await migrationManagerInstance.getDatabaseInfo()
        
        expect(result).toEqual({
          tables: ['users', 'tasks'],
          indexes: ['users.idx_users_email'],
          size: '1024 MB'
        })
      })

      it('should handle database errors', async () => {
        mockSelect.mockImplementation(() => {
          throw new Error('Database query failed')
        })

        await expect(migrationManagerInstance.getDatabaseInfo()).rejects.toThrow('Failed to get database info')
      })

      it('should handle empty results', async () => {
        mockSelect
          .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) })
          .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) })
          .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) })

        const result = await migrationManagerInstance.getDatabaseInfo()
        
        expect(result.tables).toEqual([])
        expect(result.indexes).toEqual([])
        expect(result.size).toBe('0 bytes')
      })
    })

    describe('checkHealth', () => {
      it('should return healthy database status', async () => {
        const mockVersion = [{ version: 'PostgreSQL 14.5 on x86_64-pc-linux-gnu' }]
        const mockUptime = [{ uptime: 3600 }]
        const mockConnections = [{ count: 5 }]

        // Mock SQL function to return different results
        mockSelect.mockImplementation((fn: any) => {
          const sql = fn.sql || fn.toString()
          if (sql.includes('version()')) {
            return { from: vi.fn().mockReturnValue(mockVersion) }
          } else if (sql.includes('pg_postmaster_start_time()')) {
            return { from: vi.fn().mockReturnValue(mockUptime) }
          } else {
            return {
              from: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue(mockConnections)
              })
            }
          }
        })

        const result = await migrationManagerInstance.checkHealth()
        
        expect(result).toEqual({
          connected: true,
          version: '14.5',
          uptime: 3600,
          activeConnections: 5
        })
      })

      it('should handle database connection errors', async () => {
        mockSelect.mockImplementation(() => {
          throw new Error('Connection refused')
        })

        const result = await migrationManagerInstance.checkHealth()
        
        expect(result).toEqual({
          connected: false,
          version: 'unknown',
          uptime: 0,
          activeConnections: 0,
          error: 'Connection refused'
        })
      })

      it('should parse version string correctly', async () => {
        const mockVersion = [{ version: 'PostgreSQL 15.2 on x86_64-apple-darwin21.6.0' }]
        const mockUptime = [{ uptime: 7200 }]
        const mockConnections = [{ count: 3 }]

        mockSelect.mockImplementation((fn: any) => {
          const sql = fn.sql || fn.toString()
          if (sql.includes('version()')) {
            return { from: vi.fn().mockReturnValue(mockVersion) }
          } else if (sql.includes('pg_postmaster_start_time()')) {
            return { from: vi.fn().mockReturnValue(mockUptime) }
          } else {
            return {
              from: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue(mockConnections)
              })
            }
          }
        })

        const result = await migrationManagerInstance.checkHealth()
        
        expect(result.version).toBe('15.2')
        expect(result.uptime).toBe(7200)
        expect(result.activeConnections).toBe(3)
      })
    })
  })

  describe('createMigrationManager utility', () => {
    it('should create MigrationManager with DATABASE_URL', () => {
      process.env.DATABASE_URL = testConnectionString
      
      const manager = createMigrationManager()
      
      expect(manager).toBeInstanceOf(MigrationManager)
      expect(manager.connectionString).toBe(testConnectionString)
    })

    it('should use provided connection string', () => {
      const customConnectionString = 'postgresql://custom:pass@custom:5432/custom'
      const manager = createMigrationManager(customConnectionString)
      
      expect(manager.connectionString).toBe(customConnectionString)
    })

    it('should throw error when no connection string provided', () => {
      delete process.env.DATABASE_URL
      
      expect(() => createMigrationManager()).toThrow('DATABASE_URL environment variable is required')
    })
  })

  describe('runMigrations CLI interface', () => {
    beforeEach(() => {
      process.env.DATABASE_URL = testConnectionString
    })

    it('should handle migrate command', async () => {
      vi.spyOn(migrationManagerInstance, 'migrate').mockResolvedValue({
        success: true,
        migrated: ['001', '002']
      })

      const result = await runMigrations('migrate')
      
      expect(result).toEqual({
        success: true,
        migrated: ['001', '002']
      })
    })

    it('should handle status command', async () => {
      const mockStatus = [
        { id: '001', name: 'initial_schema', applied: true, appliedAt: new Date() },
        { id: '002', name: 'integration_framework', applied: false }
      ]

      vi.spyOn(migrationManagerInstance, 'getMigrationStatus').mockResolvedValue(mockStatus)

      const result = await runMigrations('status')
      
      expect(result).toEqual(mockStatus)
    })

    it('should handle reset command', async () => {
      vi.spyOn(migrationManagerInstance, 'reset').mockResolvedValue({
        success: true
      })

      const result = await runMigrations('reset')
      
      expect(result).toEqual({ success: true })
    })

    it('should handle generate command with name', async () => {
      vi.spyOn(migrationManagerInstance, 'generateMigration').mockResolvedValue({
        success: true,
        path: '/path/to/migration.ts'
      })

      const result = await runMigrations('generate', { name: 'test_migration' })
      
      expect(result).toEqual({
        success: true,
        path: '/path/to/migration.ts'
      })
    })

    it('should require name for generate command', async () => {
      await expect(runMigrations('generate')).rejects.toThrow('Migration name is required')
    })

    it('should handle health command', async () => {
      const mockHealth = {
        connected: true,
        version: '14.5',
        uptime: 3600,
        activeConnections: 5
      }

      vi.spyOn(migrationManagerInstance, 'checkHealth').mockResolvedValue(mockHealth)

      const result = await runMigrations('health')
      
      expect(result).toEqual(mockHealth)
    })

    it('should handle info command', async () => {
      const mockInfo = {
        tables: ['users', 'tasks'],
        indexes: ['users.idx_email'],
        size: '1MB'
      }

      vi.spyOn(migrationManagerInstance, 'getDatabaseInfo').mockResolvedValue(mockInfo)

      const result = await runMigrations('info')
      
      expect(result).toEqual(mockInfo)
    })

    it('should handle unknown command', async () => {
      await expect(runMigrations('unknown_command')).rejects.toThrow('Unknown command: unknown_command')
    })
  })

  describe('migrationManager singleton', () => {
    it('should return MigrationManager instance when DATABASE_URL is set', () => {
      process.env.DATABASE_URL = testConnectionString
      
      const manager = migrationManager as any
      
      expect(manager).toBeInstanceOf(MigrationManager)
    })

    it('should handle missing DATABASE_URL gracefully', () => {
      delete process.env.DATABASE_URL
      
      const manager = migrationManager as any
      
      expect(typeof manager.migrate).toBe('function')
      
      // Test that calling a method returns the expected error response
      return expect(manager.migrate()).resolves.toEqual({
        success: false,
        error: 'Database not configured'
      })
    })
  })

  describe('Migration interfaces', () => {
    it('should export Migration interface', () => {
      const migration: Migration = {
        id: '001',
        name: 'test_migration',
        up: async () => {},
        down: async () => {},
        timestamp: new Date()
      }
      
      expect(migration).toHaveProperty('id')
      expect(migration).toHaveProperty('name')
      expect(migration).toHaveProperty('up')
      expect(migration).toHaveProperty('down')
      expect(migration).toHaveProperty('timestamp')
    })

    it('should export MigrationStatus interface', () => {
      const status: MigrationStatus = {
        id: '001',
        name: 'test_migration',
        applied: true,
        appliedAt: new Date(),
        error: undefined
      }
      
      expect(status).toHaveProperty('id')
      expect(status).toHaveProperty('name')
      expect(status).toHaveProperty('applied')
      expect(status.applied).toBe(true)
    })

    it('should handle MigrationStatus without appliedAt', () => {
      const status: MigrationStatus = {
        id: '001',
        name: 'test_migration',
        applied: false
      }
      
      expect(status).toHaveProperty('appliedAt', undefined)
      expect(status).toHaveProperty('error', undefined)
    })
  })
})