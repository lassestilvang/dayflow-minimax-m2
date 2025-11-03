import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TextEncoder, TextDecoder } from 'util'

// Ensure vi is globally available
;(global as any).vi = vi
;(global as any).describe = describe
;(global as any).it = it
;(global as any).expect = expect

// Add vi.mocked helper function to make mocks strongly typed
;(global as any).vi.mocked = (mockFn: any) => mockFn

// Add vi.doMock helper function for dynamic mocking
;(global as any).vi.doMock = vi.mock

// Add vi.importMock helper function for importing actual module
;(global as any).vi.importMock = vi.mock

// Add vi.importActual helper function for importing real modules
;(global as any).vi.importActual = vi.importActual

// Add vi.unmock helper function for unmocking modules
;(global as any).vi.unmock = vi.unmock || ((moduleName: string) => {
  // Clear the mock from registry
  const mockRegistry = (vi as any)._mockRegistry
  if (mockRegistry && mockRegistry[moduleName]) {
    delete mockRegistry[moduleName]
  }
})

// Polyfills for Node.js environment
;(global as any).TextEncoder = TextEncoder
;(global as any).TextDecoder = TextDecoder

// Safe window access with environment check
if (typeof window === 'undefined') {
  // Define window object for Node.js test environment
  ;(global as any).window = {
    matchMedia: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
    crypto: {
      randomUUID: vi.fn(() => 'mock-uuid'),
      getRandomValues: vi.fn((array: Uint8Array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256)
        }
        return array
      }),
      subtle: {
        digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
      },
    },
  }
} else {
  // Mock window.matchMedia if running in browser-like environment
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

// Mock IntersectionObserver
;(global as any).IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
;(global as any).ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock WebSocket with proper constructor
;(global as any).WebSocket = vi.fn().mockImplementation(() => ({
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}))
;(global as any).WebSocket.CONNECTING = 0
;(global as any).WebSocket.OPEN = 1
;(global as any).WebSocket.CLOSING = 2
;(global as any).WebSocket.CLOSED = 3

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}
;(global as any).localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}
;(global as any).sessionStorage = sessionStorageMock

// Mock fetch
;(global as any).fetch = vi.fn()

// Setup test database environment - DO NOT override in setup, let tests control
;(process.env as any).NODE_ENV = 'test'
;(global as any).TESTING = 'true'
;(global as any).MOCK_SERVICES = 'true'

// Function to clear all require caches that might interfere with tests
function clearRequireCache() {
  const cacheKeys = Object.keys(require.cache)
  cacheKeys.forEach(key => {
    if (key.includes('/lib/db/') ||
        key.includes('drizzle-orm') ||
        key.includes('@neondatabase/serverless') ||
        key.includes('migration-manager') ||
        key.includes('/tests/unit/')) {
      delete require.cache[key]
    }
  })
}

// Function to clear module mocks for database testing
function clearDatabaseModuleMocks() {
  // Clear vi.mock registry for database modules
  const mockModules = ['drizzle-orm/neon-http', '@neondatabase/serverless']
  mockModules.forEach(moduleName => {
    const mockRegistry = (vi as any)._mockRegistry
    if (mockRegistry) {
      // Clear specific mocks from registry
      delete mockRegistry[moduleName]
    }
  })
  // Also clear migration manager mocks
  const migrationMockRegistry = (vi as any)._mockRegistry
  if (migrationMockRegistry) {
    Object.keys(migrationMockRegistry).forEach(key => {
      if (key.includes('migration-manager') || key.includes('/lib/db/migration-manager')) {
        delete migrationMockRegistry[key]
      }
    })
  }
}

// Global test setup - ENHANCED for database testing
beforeEach(() => {
  // Clear all API/storage mocks
  localStorageMock.getItem.mockReset()
  localStorageMock.setItem.mockReset()
  localStorageMock.removeItem.mockReset()
  localStorageMock.clear.mockReset()
  
  sessionStorageMock.getItem.mockReset()
  sessionStorageMock.setItem.mockReset()
  sessionStorageMock.removeItem.mockReset()
  sessionStorageMock.clear.mockReset()

  // Clear require cache for database modules - MORE AGGRESSIVE
  clearRequireCache()
  
  // Clear database module mocks
  clearDatabaseModuleMocks()
  
  // Reset ALL mocks to ensure clean slate
  vi.clearAllMocks()
  
  // Reset all test-related environment variables that might interfere
  delete process.env.DATABASE_URL
  delete process.env.NODE_ENV
})

afterEach(() => {
  // Clear ALL mocks to ensure clean slate between tests
  vi.clearAllMocks()
  
  // Clear require cache after each test - MORE AGGRESSIVE
  clearRequireCache()
  
  // Clear database module mocks after each test
  clearDatabaseModuleMocks()
  
  // Reset environment variables
  delete process.env.DATABASE_URL
  delete process.env.NODE_ENV
})

// Extend expect matchers if needed
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      }
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      }
    }
  },
})

// Export helper functions for use in tests
export { clearRequireCache, clearDatabaseModuleMocks }