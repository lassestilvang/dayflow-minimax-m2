// Test utilities and helpers

// Import all modules
import { databaseUtils } from './database'
import { mockUtils } from './mocks'
import { assertionUtils } from './assertions'
import { generatorUtils } from './generators'
import { helperUtils } from './helpers'

// Import individual functions that actually exist
import {
  createMockDatabase,
  resetMockDB,
  createMockUser,
  createMockTask,
  createMockCalendarEvent,
  createMockCategory,
  createMockTag,
  createMockDatabaseError,
  createMockNotFoundError,
  createMockValidationError,
  createMockDB,
  mockDatabaseQuery
} from './database'

import {
  createMockEvent as createMockDOMEvent,
  createMockCustomEvent,
  waitFor,
  waitForDOMChange,
  createMockElement,
  createMockForm,
  simulateClick,
  simulateInput,
  simulateKeyPress,
  mockRouter,
  mockSession,
  createTestContext,
  setupTimeouts,
  setupIntervals,
  createDelayedPromise,
  createDelayedRejection,
  createTestReport,
  validateTestData,
  createBenchmark,
  mockHistory,
  mockScreen,
  createMockEnvironment,
  createMockRequest,
  createMockResponse,
  createApiRouteContext,
  createMockSession,
  createRateLimiter
} from './helpers'

// Mock functions are part of mockUtils object, not individual exports
// We'll reference them through mockUtils.mockFunctionName

// Fix generator functions - add missing functions
const generatorFunctions = {
  ...generatorUtils,
  // Add aliases for singular -> plural functions
  generateTask: generatorUtils.generateTasks,
  generateUser: generatorUtils.generateUsers,
  generateEvent: generatorUtils.generateEvents,
}

// Export individual functions that actually exist
export {
  // Database functions
  createMockDatabase,
  resetMockDB,
  createMockUser,
  createMockTask,
  createMockCalendarEvent,
  createMockCategory,
  createMockTag,
  createMockDatabaseError,
  createMockNotFoundError,
  createMockValidationError,
  createMockDB,
  mockDatabaseQuery,
  
  // Helper functions
  waitFor,
  waitForDOMChange,
  createMockElement,
  createMockForm,
  createMockDOMEvent,
  createMockCustomEvent,
  simulateClick,
  simulateInput,
  simulateKeyPress,
  mockRouter,
  mockSession,
  createTestContext,
  setupTimeouts,
  setupIntervals,
  createDelayedPromise,
  createDelayedRejection,
  createTestReport,
  validateTestData,
  createBenchmark,
  mockHistory,
  mockScreen,
  createMockEnvironment,
  createMockRequest,
  createMockResponse,
  createApiRouteContext,
  createMockSession,
  createRateLimiter,
}

// Create individual exports for destructuring
export const toBeWithinRange = assertionUtils.toBeWithinRange
export const toBeValidEmail = assertionUtils.toBeValidEmail
export const toHaveRequiredProperties = assertionUtils.toHaveRequiredProperties
export const generateTask = generatorFunctions.generateTask
export const generateUser = generatorFunctions.generateUser
export const generateEvent = generatorFunctions.generateEvent

// Export utility modules
export {
  databaseUtils,
  mockUtils,
  assertionUtils,
  generatorUtils,
  helperUtils,
  
  // Aliases for module access
  databaseUtils as database,
  mockUtils as mocks,
  assertionUtils as assertions,
  generatorFunctions as generators,
  helperUtils as helpers,
}

// Flatten utility objects for direct access
export const testUtils = {
  // Database utilities
  ...databaseUtils,
  createMockDatabase,
  resetMockDB,
  createMockUser,
  createMockTask,
  createMockCalendarEvent,
  createMockCategory,
  createMockTag,
  createMockDatabaseError,
  createMockNotFoundError,
  createMockValidationError,
  createMockDB,
  mockDatabaseQuery,
  
  // Mock utilities
  ...mockUtils,
  setupMockEnvironment: mockUtils.setupMockEnvironment,
  mockLocalStorage: mockUtils.mockLocalStorage,
  mockSessionStorage: mockUtils.mockSessionStorage,
  mockWebSocket: mockUtils.mockWebSocket,
  mockFetch: mockUtils.mockFetch,
  
  // Assertion utilities
  ...assertionUtils,
  toBeWithinRange: assertionUtils.toBeWithinRange,
  toBeValidEmail: assertionUtils.toBeValidEmail,
  toHaveRequiredProperties: assertionUtils.toHaveRequiredProperties,
  
  // Generator utilities
  ...generatorFunctions,
  generateRandomString: generatorFunctions.generateRandomString,
  generateRandomEmail: generatorFunctions.generateRandomEmail,
  generateRandomUUID: generatorFunctions.generateRandomUUID,
  generateRandomName: generatorFunctions.generateRandomName,
  generateRandomDate: generatorFunctions.generateRandomDate,
  generateRandomColor: generatorFunctions.generateRandomColor,
  generateRandomPriority: generatorFunctions.generateRandomPriority,
  generateRandomStatus: generatorFunctions.generateRandomStatus,
  generateUsers: generatorFunctions.generateUsers,
  generateTasks: generatorFunctions.generateTasks,
  generateEvents: generatorFunctions.generateEvents,
  generateCategories: generatorFunctions.generateCategories,
  generateTags: generatorFunctions.generateTags,
  generateCompleteUserWithData: generatorFunctions.generateCompleteUserWithData,
  generateLargeDataset: generatorFunctions.generateLargeDataset,
  generateEdgeCases: generatorFunctions.generateEdgeCases,
  generateTestScenarios: generatorFunctions.generateTestScenarios,
  
  // Helper utilities
  ...helperUtils,
  waitFor: helperUtils.waitFor,
  waitForDOMChange: helperUtils.waitForDOMChange,
  createMockElement: helperUtils.createMockElement,
  createMockForm: helperUtils.createMockForm,
  createMockDOMEvent,
  createMockCustomEvent,
  simulateClick: helperUtils.simulateClick,
  simulateInput: helperUtils.simulateInput,
  simulateKeyPress: helperUtils.simulateKeyPress,
  mockRouter: helperUtils.mockRouter,
  mockSession: helperUtils.mockSession,
  createTestContext: helperUtils.createTestContext,
  setupTimeouts: helperUtils.setupTimeouts,
  setupIntervals: helperUtils.setupIntervals,
  createDelayedPromise: helperUtils.createDelayedPromise,
  createDelayedRejection: helperUtils.createDelayedRejection,
  createTestReport: helperUtils.createTestReport,
  validateTestData: helperUtils.validateTestData,
  createBenchmark: helperUtils.createBenchmark,
  mockHistory: helperUtils.mockHistory,
  mockScreen: helperUtils.mockScreen,
  createMockEnvironment: helperUtils.createMockEnvironment,
  createMockRequest: helperUtils.createMockRequest,
  createMockResponse: helperUtils.createMockResponse,
  createApiRouteContext: helperUtils.createApiRouteContext,
  createMockSession: helperUtils.createMockSession,
  createRateLimiter: helperUtils.createRateLimiter,
  
  // Export utility modules for named imports
  database: databaseUtils,
  mocks: mockUtils,
  assertions: assertionUtils,
  generators: generatorFunctions,
  helpers: helperUtils,
  
  // Setup test environment function
  setupTestEnvironment: () => {
    mockUtils.setupMockEnvironment()
    return {
      mocks: mockUtils,
      timestamp: Date.now(),
      environment: 'test'
    }
  },
}

// Create a namespace export object that includes everything
const utils = {
  ...databaseUtils,
  ...mockUtils,
  ...assertionUtils,
  ...generatorUtils,
  ...helperUtils,
  // Add individual functions that are exported separately
  createMockDatabase,
  resetMockDB,
  createMockUser,
  createMockTask,
  createMockCalendarEvent,
  createMockCategory,
  createMockTag,
  createMockDatabaseError,
  createMockNotFoundError,
  createMockValidationError,
  createMockDB,
  mockDatabaseQuery,
  mockLocalStorage: mockUtils.mockLocalStorage,
  mockSessionStorage: mockUtils.mockSessionStorage,
  mockWebSocket: mockUtils.mockWebSocket,
  mockFetch: mockUtils.mockFetch,
  toBeWithinRange: assertionUtils.toBeWithinRange,
  toBeValidEmail: assertionUtils.toBeValidEmail,
  toHaveRequiredProperties: assertionUtils.toHaveRequiredProperties,
  generateRandomString: generatorUtils.generateRandomString,
  generateRandomEmail: generatorUtils.generateRandomEmail,
  generateRandomUUID: generatorUtils.generateRandomUUID,
  generateRandomName: generatorUtils.generateRandomName,
  generateRandomDate: generatorUtils.generateRandomDate,
  generateRandomColor: generatorUtils.generateRandomColor,
  generateRandomPriority: generatorUtils.generateRandomPriority,
  generateRandomStatus: generatorUtils.generateRandomStatus,
  generateUsers: generatorUtils.generateUsers,
  generateTasks: generatorUtils.generateTasks,
  generateEvents: generatorUtils.generateEvents,
  generateCategories: generatorUtils.generateCategories,
  generateTags: generatorUtils.generateTags,
  generateCompleteUserWithData: generatorUtils.generateCompleteUserWithData,
  generateLargeDataset: generatorUtils.generateLargeDataset,
  generateEdgeCases: generatorUtils.generateEdgeCases,
  generateTestScenarios: generatorUtils.generateTestScenarios,
  generateTask: generatorFunctions.generateTask,
  generateUser: generatorFunctions.generateUser,
  generateEvent: generatorFunctions.generateEvent,
  waitFor: helperUtils.waitFor,
  waitForDOMChange: helperUtils.waitForDOMChange,
  createMockElement: helperUtils.createMockElement,
  createMockForm: helperUtils.createMockForm,
  createMockDOMEvent,
  createMockCustomEvent,
  simulateClick: helperUtils.simulateClick,
  simulateInput: helperUtils.simulateInput,
  simulateKeyPress: helperUtils.simulateKeyPress,
  mockRouter: helperUtils.mockRouter,
  mockSession: helperUtils.mockSession,
  createTestContext: helperUtils.createTestContext,
  setupTimeouts: helperUtils.setupTimeouts,
  setupIntervals: helperUtils.setupIntervals,
  createDelayedPromise: helperUtils.createDelayedPromise,
  createDelayedRejection: helperUtils.createDelayedRejection,
  createTestReport: helperUtils.createTestReport,
  validateTestData: helperUtils.validateTestData,
  createBenchmark: helperUtils.createBenchmark,
  mockHistory: helperUtils.mockHistory,
  mockScreen: helperUtils.mockScreen,
  createMockEnvironment: helperUtils.createMockEnvironment,
  createMockRequest: helperUtils.createMockRequest,
  createMockResponse: helperUtils.createMockResponse,
  createApiRouteContext: helperUtils.createApiRouteContext,
  createMockSession: helperUtils.createMockSession,
  createRateLimiter: helperUtils.createRateLimiter,
  database: databaseUtils,
  mocks: mockUtils,
  assertions: assertionUtils,
  generators: generatorUtils,
  helpers: helperUtils,
}

// Make testUtils have a circular default reference
Object.defineProperty(testUtils, 'default', {
  value: testUtils,
  enumerable: false,
  configurable: false,
  writable: false,
})

// Export utils for namespace imports
export { utils }

// Make testUtils the default export
export default testUtils