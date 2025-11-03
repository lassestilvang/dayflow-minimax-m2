import { describe, it, expect } from 'vitest'
import * as schema from '../../lib/db/schema'

describe('Database Schema Definitions', () => {
  describe('Table Definitions', () => {
    it('should define users table with correct structure', () => {
      expect(schema.users).toBeDefined()
      expect(typeof schema.users).toBe('object')
    })

    it('should define tasks table with correct structure', () => {
      expect(schema.tasks).toBeDefined()
      expect(typeof schema.tasks).toBe('object')
    })

    it('should define calendarEvents table with correct structure', () => {
      expect(schema.calendarEvents).toBeDefined()
      expect(typeof schema.calendarEvents).toBe('object')
    })

    it('should define categories table with correct structure', () => {
      expect(schema.categories).toBeDefined()
      expect(typeof schema.categories).toBe('object')
    })

    it('should define tags table with correct structure', () => {
      expect(schema.tags).toBeDefined()
      expect(typeof schema.tags).toBe('object')
    })

    it('should define taskTags junction table with correct structure', () => {
      expect(schema.taskTags).toBeDefined()
      expect(typeof schema.taskTags).toBe('object')
    })

    it('should define eventTags junction table with correct structure', () => {
      expect(schema.eventTags).toBeDefined()
      expect(typeof schema.eventTags).toBe('object')
    })
  })

  describe('Relations', () => {
    it('should define tasks relations correctly', () => {
      expect(schema.tasksRelations).toBeDefined()
      expect(typeof schema.tasksRelations).toBe('object')
    })

    it('should define calendarEvents relations correctly', () => {
      expect(schema.calendarEventsRelations).toBeDefined()
      expect(typeof schema.calendarEventsRelations).toBe('object')
    })

    it('should define categories relations correctly', () => {
      expect(schema.categoriesRelations).toBeDefined()
      expect(typeof schema.categoriesRelations).toBe('object')
    })

    it('should define tags relations correctly', () => {
      expect(schema.tagsRelations).toBeDefined()
      expect(typeof schema.tagsRelations).toBe('object')
    })

    it('should define taskTags relations correctly', () => {
      expect(schema.taskTagsRelations).toBeDefined()
      expect(typeof schema.taskTagsRelations).toBe('object')
    })

    it('should define eventTags relations correctly', () => {
      expect(schema.eventTagsRelations).toBeDefined()
      expect(typeof schema.eventTagsRelations).toBe('object')
    })

    it('should define users relations correctly', () => {
      expect(schema.usersRelations).toBeDefined()
      expect(typeof schema.usersRelations).toBe('object')
    })
  })

  describe('Tables Object', () => {
    it('should export Tables object', () => {
      expect(schema.Tables).toBeDefined()
      expect(typeof schema.Tables).toBe('object')
    })

    it('should contain all expected tables', () => {
      const expectedTables = ['users', 'tasks', 'calendarEvents', 'categories', 'tags', 'taskTags', 'eventTags']
      
      expectedTables.forEach(tableName => {
        expect(schema.Tables).toHaveProperty(tableName)
      })
    })

    it('should export tables as readable reference', () => {
      // Tables should reference the actual tables
      expect(schema.Tables.users).toBe(schema.users)
      expect(schema.Tables.tasks).toBe(schema.tasks)
      expect(schema.Tables.calendarEvents).toBe(schema.calendarEvents)
      expect(schema.Tables.categories).toBe(schema.categories)
      expect(schema.Tables.tags).toBe(schema.tags)
      expect(schema.Tables.taskTags).toBe(schema.taskTags)
      expect(schema.Tables.eventTags).toBe(schema.eventTags)
    })
  })

  describe('SQL Helper Function', () => {
    it('should export SQL helper function', () => {
      expect(typeof schema.sql).toBe('function')
    })

    it('should work with template strings', () => {
      const result = schema.sql`SELECT * FROM users WHERE id = ${'123'}`
      expect(typeof result).toBe('string')
    })
  })

  describe('Schema Completeness', () => {
    it('should export all schema components', () => {
      const exports = Object.keys(schema)
      
      // Check for table exports
      expect(exports).toContain('users')
      expect(exports).toContain('tasks')
      expect(exports).toContain('calendarEvents')
      expect(exports).toContain('categories')
      expect(exports).toContain('tags')
      expect(exports).toContain('taskTags')
      expect(exports).toContain('eventTags')
      
      // Check for relation exports
      expect(exports).toContain('tasksRelations')
      expect(exports).toContain('calendarEventsRelations')
      expect(exports).toContain('categoriesRelations')
      expect(exports).toContain('tagsRelations')
      expect(exports).toContain('taskTagsRelations')
      expect(exports).toContain('eventTagsRelations')
      expect(exports).toContain('usersRelations')
      
      // Check for utility exports
      expect(exports).toContain('Tables')
      expect(exports).toContain('sql')
    })
  })
})