import { describe, it, expect } from 'vitest'
import * as migrationManager from '../../lib/db/migration-manager'

describe('Migration Manager - Coverage Tests', () => {
  describe('Exports', () => {
    it('should export MigrationManager class', () => {
      expect(migrationManager.MigrationManager).toBeDefined()
      expect(typeof migrationManager.MigrationManager).toBe('function')
    })

    it('should export createMigrationManager function', () => {
      expect(migrationManager.createMigrationManager).toBeDefined()
      expect(typeof migrationManager.createMigrationManager).toBe('function')
    })

    it('should export runMigrations function', () => {
      expect(migrationManager.runMigrations).toBeDefined()
      expect(typeof migrationManager.runMigrations).toBe('function')
    })

    it('should export migrationManager singleton', () => {
      expect(migrationManager.migrationManager).toBeDefined()
    })
  })

  describe('Basic Functionality', () => {
    it('should create MigrationManager instance', () => {
      const manager = new migrationManager.MigrationManager('test-connection')
      expect(manager).toBeDefined()
    })

    it('should create MigrationManager with connection string', () => {
      const manager = new migrationManager.MigrationManager('postgresql://test:test@localhost:5432/test')
      expect(manager).toBeDefined()
      expect(manager).toHaveProperty('connectionString')
    })

    it('should handle createMigrationManager without connection', () => {
      expect(() => migrationManager.createMigrationManager()).toThrow()
    })

    it('should handle createMigrationManager with connection', () => {
      const manager = migrationManager.createMigrationManager('postgresql://test:test@localhost:5432/test')
      expect(manager).toBeDefined()
      expect(manager).toBeInstanceOf(migrationManager.MigrationManager)
    })
  })

  describe('Module Loading', () => {
    it('should load without errors', () => {
      expect(migrationManager).toBeDefined()
      expect(Object.keys(migrationManager)).toContain('MigrationManager')
    })

    it('should have all expected exports', () => {
      const exports = Object.keys(migrationManager)
      expect(exports).toContain('MigrationManager')
      expect(exports).toContain('createMigrationManager')
      expect(exports).toContain('runMigrations')
      expect(exports).toContain('migrationManager')
    })
  })
})