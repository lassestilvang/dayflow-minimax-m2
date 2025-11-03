import { TextEncoder, TextDecoder } from 'util'

// Polyfills for Node.js environment
;(global as any).TextEncoder = TextEncoder
;(global as any).TextDecoder = TextDecoder

// Mock window.matchMedia
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

// Mock crypto with proper random function - ONLY for window.crypto, not global
Object.defineProperty(window, 'crypto', {
  value: {
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
  writable: true,
  configurable: true,
})

// Setup test database environment
;(process.env as any).NODE_ENV = 'test'
;(global as any).DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb' // Mock DATABASE_URL for tests
;(process.env as any).TESTING = 'true'
;(process.env as any).MOCK_SERVICES = 'true'

// Global test setup - REDUCED to avoid validation interference
beforeEach(() => {
  // Only clear API/storage mocks, not all mocks to avoid validation interference
  localStorageMock.getItem.mockReset()
  localStorageMock.setItem.mockReset()
  localStorageMock.removeItem.mockReset()
  localStorageMock.clear.mockReset()
  
  sessionStorageMock.getItem.mockReset()
  sessionStorageMock.setItem.mockReset()
  sessionStorageMock.removeItem.mockReset()
  sessionStorageMock.clear.mockReset()
})

afterEach(() => {
  // MINIMAL cleanup - avoid clearing all mocks that might interfere with validation
  // Only clear specific mocks that we manage
  vi.clearAllMocks?.()
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