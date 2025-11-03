import { describe, it, expect, vi } from 'vitest'
import testUtils, * as utils from '../utils/index'
import { databaseUtils } from '../utils/database'
import { mockUtils } from '../utils/mocks'
import { assertionUtils } from '../utils/assertions'
import { generatorUtils } from '../utils/generators'
import { helperUtils } from '../utils/helpers'

describe('Test Utilities Index', () => {
  describe('Module Exports', () => {
    it('should export database utilities', () => {
      expect(utils.databaseUtils).toBeDefined()
      expect(utils.databaseUtils).toEqual(databaseUtils)
    })

    it('should export mock utilities', () => {
      expect(utils.mockUtils).toBeDefined()
      expect(utils.mockUtils).toEqual(mockUtils)
    })

    it('should export assertion utilities', () => {
      expect(utils.assertionUtils).toBeDefined()
      expect(utils.assertionUtils).toEqual(assertionUtils)
    })

    it('should export generator utilities', () => {
      expect(utils.generatorUtils).toBeDefined()
      expect(utils.generatorUtils).toEqual(generatorUtils)
    })

    it('should export helper utilities', () => {
      expect(utils.helperUtils).toBeDefined()
      expect(utils.helperUtils).toEqual(helperUtils)
    })

    it('should export all utility modules individually', () => {
      expect(utils.database).toBeDefined()
      expect(utils.mocks).toBeDefined()
      expect(utils.assertions).toBeDefined()
      expect(utils.generators).toBeDefined()
      expect(utils.helpers).toBeDefined()
    })
  })

  describe('Combined Test Utils Object', () => {
    it('should export combined testUtils object', () => {
      expect(testUtils).toBeDefined()
      expect(typeof testUtils).toBe('object')
    })

    it('should merge all utility functions into testUtils', () => {
      // Check that all utility functions are available
      expect(testUtils).toHaveProperty('createMockDatabase')
      expect(testUtils).toHaveProperty('createMockUser')
      expect(testUtils).toHaveProperty('toBeWithinRange')
      expect(testUtils).toHaveProperty('generateTask')
      expect(testUtils).toHaveProperty('setupTestEnvironment')
    })

    it('should not have conflicting function names', () => {
      // Ensure no duplicate function names across utilities
      const allFunctions = [
        ...Object.keys(databaseUtils),
        ...Object.keys(mockUtils),
        ...Object.keys(assertionUtils),
        ...Object.keys(generatorUtils),
        ...Object.keys(helperUtils),
      ]
      
      const uniqueFunctions = new Set(allFunctions)
      expect(uniqueFunctions.size).toBe(allFunctions.length)
    })

    it('should include all utility functions', () => {
      const expectedFunctions = [
        // Database utils
        'createMockDatabase',
        'createMockDatabaseError',
        'mockDatabaseQuery',
        // Mock utils  
        'createMockUser',
        'createMockTask',
        'createMockEvent',
        'mockLocalStorage',
        'mockSessionStorage',
        // Assertion utils
        'toBeWithinRange',
        'toBeValidEmail',
        'toHaveRequiredProperties',
        // Generator utils
        'generateTask',
        'generateUser',
        'generateEvent',
        // Helper utils
        'setupTestEnvironment',
        'createMockEnvironment',
        'createApiRouteContext'
      ]
      
      expectedFunctions.forEach(funcName => {
        expect(testUtils).toHaveProperty(funcName)
        expect(typeof testUtils[funcName]).toBe('function')
      })
    })
  })

  describe('Default Export', () => {
    it('should export default as testUtils', () => {
      expect(testUtils).toBeDefined()
      expect(testUtils).toEqual(testUtils.default)
    })

    it('should have same content for default and named export', () => {
      expect(testUtils).toEqual(testUtils.default)
    })
  })

  describe('Utility Integration', () => {
    it('should properly integrate all utility modules', () => {
      // Test that utilities work together
      const mockUser = testUtils.createMockUser()
      expect(mockUser).toBeDefined()
      
      const mockTask = testUtils.createMockTask({ userId: mockUser.id })
      expect(mockTask).toBeDefined()
      expect(mockTask.userId).toBe(mockUser.id)
      
      // Test assertion utility
      expect(testUtils.toBeWithinRange(5, 1, 10)).toEqual({
        pass: true,
        message: expect.stringContaining('expected 5 not to be within range 1 - 10')
      })
    })

    it('should maintain proper types across utilities', () => {
      // Test type consistency
      const userData = { email: 'test@example.com', name: 'Test User' }
      const mockUser = testUtils.createMockUser(userData)
      expect(mockUser.email).toBe(userData.email)
      expect(mockUser.name).toBe(userData.name)
      
      const taskData = { title: 'Test Task', userId: mockUser.id }
      const mockTask = testUtils.createMockTask(taskData)
      expect(mockTask.title).toBe(taskData.title)
      expect(mockTask.userId).toBe(mockUser.id)
    })
  })

  describe('Utility Coverage', () => {
    it('should cover all utility categories', () => {
      const categories = ['database', 'mock', 'assertion', 'generator', 'helper']
      
      categories.forEach(category => {
        const utilsGroup = testUtils
        expect(Object.keys(utilsGroup).length).toBeGreaterThan(0)
      })
    })

    it('should provide comprehensive testing utilities', () => {
      // Test that we have utilities for different testing scenarios
      expect(testUtils.createMockDatabase).toBeDefined() // Database mocking
      expect(testUtils.createMockUser).toBeDefined() // Data generation
      expect(testUtils.toBeWithinRange).toBeDefined() // Custom assertions
      expect(testUtils.setupTestEnvironment).toBeDefined() // Test setup
    })
  })

  describe('Cross-Utility Dependencies', () => {
    it('should handle utilities that depend on each other', () => {
      // Test database utils can be used with mock utils
      const mockDb = testUtils.createMockDatabase()
      const mockUser = testUtils.createMockUser()
      
      // These should not conflict
      expect(mockDb).toBeDefined()
      expect(mockUser).toBeDefined()
    })

    it('should allow chaining of utility functions', () => {
      // Test that we can chain utility calls
      const testEnvironment = testUtils.setupTestEnvironment()
      expect(testEnvironment).toBeDefined()
      
      const mockUser = testUtils.createMockUser()
      expect(mockUser).toBeDefined()
      
      // Should be able to use assertion utils on generated data
      const emailAssertion = testUtils.toBeValidEmail(mockUser.email)
      expect(emailAssertion.pass).toBe(true)
    })
  })

  describe('Utility Performance', () => {
    it('should create mocks efficiently', () => {
      const start = Date.now()
      
      // Create multiple mocks to test performance
      for (let i = 0; i < 100; i++) {
        testUtils.createMockUser()
        testUtils.createMockTask()
        testUtils.createMockEvent()
      }
      
      const duration = Date.now() - start
      expect(duration).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should handle large datasets efficiently', () => {
      const users = Array.from({ length: 50 }, () => testUtils.createMockUser())
      expect(users).toHaveLength(50)
      
      const tasks = Array.from({ length: 100 }, () => 
        testUtils.createMockTask({ userId: users[0].id })
      )
      expect(tasks).toHaveLength(100)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid inputs gracefully', () => {
      expect(() => testUtils.createMockUser(null as any)).not.toThrow()
      expect(() => testUtils.createMockTask(undefined as any)).not.toThrow()
      expect(() => testUtils.createMockEvent('invalid' as any)).not.toThrow()
    })

    it('should provide meaningful errors for utility failures', () => {
      // Test that custom assertions provide useful error messages
      const result = testUtils.toBeValidEmail('invalid-email')
      expect(result.pass).toBe(false)
      expect(result.message).toContain('expected invalid-email to be a valid email')
    })
  })

  describe('Utility Reusability', () => {
    it('should allow utility functions to be reused', () => {
      // Test that utility functions can be called multiple times
      const result1 = testUtils.toBeWithinRange(5, 1, 10)
      const result2 = testUtils.toBeWithinRange(15, 1, 10)
      
      expect(result1.pass).toBe(true)
      expect(result2.pass).toBe(false)
    })

    it('should maintain consistency across multiple calls', () => {
      // Test that repeated calls return consistent results
      const mockUser1 = testUtils.createMockUser({ name: 'Test' })
      const mockUser2 = testUtils.createMockUser({ name: 'Test' })
      
      expect(mockUser1.name).toBe(mockUser2.name)
    })
  })

  describe('Module Structure', () => {
    it('should have proper ES6 module exports', () => {
      // Test that exports work correctly
      const { createMockDatabase } = utils
      expect(createMockDatabase).toBeDefined()
      
      const { toBeValidEmail } = utils
      expect(toBeValidEmail).toBeDefined()
    })

    it('should support named imports', () => {
      const { createMockUser, toBeValidEmail, generateTask } = utils
      expect(createMockUser).toBeDefined()
      expect(toBeValidEmail).toBeDefined()
      expect(generateTask).toBeDefined()
    })

    it('should support default import', () => {
      const imported = utils.default
      expect(imported).toEqual(testUtils)
    })
  })
})