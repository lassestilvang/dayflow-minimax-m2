import { vi } from 'vitest'
import type { Mock } from 'vitest'

// Mock utilities for external dependencies
export const mockUtils = {
  // Mock fetch API
  mockFetch(response: any, shouldReject = false) {
    const mock = vi.fn()
    
    if (shouldReject) {
      mock.mockRejectedValue(response)
    } else {
      mock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => response,
        text: async () => JSON.stringify(response),
        headers: new Headers(),
      })
    }
    
    return mock
  },

  // Mock localStorage
  mockLocalStorage() {
    const store: Record<string, any> = {}
    
    const mockStorage = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key]
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach(key => delete store[key])
      }),
      key: vi.fn((index: number) => Object.keys(store)[index] || null),
    }
    
    Object.defineProperty(mockStorage, 'length', {
      get: () => Object.keys(store).length,
      configurable: true,
    })
    
    return mockStorage
  },

  // Mock sessionStorage
  mockSessionStorage() {
    const store: Record<string, any> = {}
    
    const mockStorage = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key]
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach(key => delete store[key])
      }),
      key: vi.fn((index: number) => Object.keys(store)[index] || null),
    }
    
    Object.defineProperty(mockStorage, 'length', {
      get: () => Object.keys(store).length,
      configurable: true,
    })
    
    return mockStorage
  },

  // Mock WebSocket
  mockWebSocket() {
    const listeners: Record<string, Function[]> = {}
    
    return Object.assign(function(this: any) {
      this.send = vi.fn()
      this.close = vi.fn()
      this.addEventListener = vi.fn((event: string, handler: Function) => {
        if (!listeners[event]) {
          listeners[event] = []
        }
        listeners[event].push(handler)
      })
      this.removeEventListener = vi.fn((event: string, handler: Function) => {
        if (listeners[event]) {
          const index = listeners[event].indexOf(handler)
          if (index > -1) {
            listeners[event].splice(index, 1)
          }
        }
      })
      this.dispatchEvent = vi.fn((event: any) => {
        const eventType = event.type
        if (listeners[eventType]) {
          listeners[eventType].forEach(handler => handler(event))
        }
        return true
      })
      this.readyState = 1 // OPEN
      this.connect = vi.fn()
      this.disconnect = vi.fn()
    }, {
      CONNECTING: 0,
      OPEN: 1,
      CLOSING: 2,
      CLOSED: 3,
      prototype: {}
    })
  },

  // Mock IntersectionObserver
  mockIntersectionObserver() {
    return Object.assign(function(this: any, callback: IntersectionObserverCallback) {
      this.observe = vi.fn()
      this.unobserve = vi.fn()
      this.disconnect = vi.fn()
      this.takeRecords = vi.fn()
      this.root = null
      this.rootMargin = ''
      this.thresholds = []
    }, {
      prototype: {}
    })
  },

  // Mock ResizeObserver
  mockResizeObserver() {
    return Object.assign(function(this: any, callback: ResizeObserverCallback) {
      this.observe = vi.fn()
      this.unobserve = vi.fn()
      this.disconnect = vi.fn()
      this.takeRecords = vi.fn()
    }, {
      prototype: {}
    })
  },

  // Mock date/time functions
  mockDateFunctions() {
    const mockDate = new Date('2024-01-01T00:00:00.000Z')
    vi.setSystemTime(mockDate)
    
    return {
      reset: () => vi.setSystemTime(0),
      advance: (ms: number) => vi.setSystemTime(Date.now() + ms),
      mockDate,
    }
  },

  // Mock crypto functions
  mockCrypto() {
    return {
      randomUUID: vi.fn(() => 'mock-uuid-123'),
      getRandomValues: vi.fn((array: Uint8Array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256)
        }
        return array
      }),
    }
  },

  // Mock timing functions
  mockTimers() {
    const timers = {
      timeouts: new Map<number, NodeJS.Timeout>(),
      intervals: new Map<number, NodeJS.Timeout>(),
    }
    
    const setTimeoutMock = vi.fn((callback: Function, delay?: number) => {
      const id = Math.random()
      timers.timeouts.set(id, setTimeout(callback, delay) as NodeJS.Timeout)
      return id
    })
    
    const clearTimeoutMock = vi.fn((id: number) => {
      const timer = timers.timeouts.get(id)
      if (timer) {
        clearTimeout(timer)
        timers.timeouts.delete(id)
      }
    })
    
    const setIntervalMock = vi.fn((callback: Function, delay?: number) => {
      const id = Math.random()
      timers.intervals.set(id, setInterval(callback, delay) as NodeJS.Timeout)
      return id
    })
    
    const clearIntervalMock = vi.fn((id: number) => {
      const timer = timers.intervals.get(id)
      if (timer) {
        clearInterval(timer)
        timers.intervals.delete(id)
      }
    })
    
    return {
      setTimeout: setTimeoutMock,
      clearTimeout: clearTimeoutMock,
      setInterval: setIntervalMock,
      clearInterval: clearIntervalMock,
      timers,
    }
  },

  // Mock clipboard API
  mockClipboard() {
    return {
      readText: vi.fn().mockResolvedValue('mock-clipboard-text'),
      writeText: vi.fn().mockResolvedValue(undefined),
      read: vi.fn().mockResolvedValue([]),
      write: vi.fn().mockResolvedValue(undefined),
    }
  },

  // Mock notification API
  mockNotification() {
    return {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('granted'),
      close: vi.fn(),
    }
  },

  // Mock broadcast channel
  mockBroadcastChannel() {
    const listeners: Record<string, Function[]> = {}
    
    return {
      postMessage: vi.fn(),
      addEventListener: vi.fn((event: string, handler: Function) => {
        if (!listeners[event]) {
          listeners[event] = []
        }
        listeners[event].push(handler)
      }),
      removeEventListener: vi.fn((event: string, handler: Function) => {
        if (listeners[event]) {
          const index = listeners[event].indexOf(handler)
          if (index > -1) {
            listeners[event].splice(index, 1)
          }
        }
      }),
      close: vi.fn(),
      dispatchMessage: (message: any) => {
        if (listeners['message']) {
          listeners['message'].forEach(handler => handler({ data: message }))
        }
      },
    }
  },

  // Mock service worker
  mockServiceWorker() {
    const registrations = new Map()
    
    return {
      register: vi.fn().mockResolvedValue({
        installing: null,
        waiting: null,
        active: {},
        scope: '/',
        updatefound: null,
      }),
      getRegistrations: vi.fn().mockResolvedValue(Array.from(registrations.values())),
      unregister: vi.fn().mockResolvedValue(true),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      scope: '/',
    }
  },

  // Mock geolocation API
  mockGeolocation() {
    return {
      getCurrentPosition: vi.fn((success: Function) => {
        success({
          coords: {
            latitude: 37.7749,
            longitude: -122.4194,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        })
      }),
      watchPosition: vi.fn((success: Function) => {
        success({
          coords: {
            latitude: 37.7749,
            longitude: -122.4194,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        })
        return 12345 // watch ID
      }),
      clearWatch: vi.fn(),
    }
  },

  // Mock media devices
  mockMediaDevices() {
    const mockStream = {
      id: 'mock-stream',
      active: true,
      getAudioTracks: () => [],
      getVideoTracks: () => [],
      getTracks: () => [],
      stop: vi.fn(),
    }
    
    return {
      enumerateDevices: vi.fn().mockResolvedValue([]),
      getUserMedia: vi.fn().mockResolvedValue(mockStream),
      getDisplayMedia: vi.fn().mockResolvedValue(mockStream),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
  },

  // Create comprehensive mock environment
  setupMockEnvironment() {
    // Replace global mocks
    global.fetch = this.mockFetch({})
    global.localStorage = this.mockLocalStorage()
    global.sessionStorage = this.mockSessionStorage()
    global.WebSocket = vi.fn(() => this.mockWebSocket())
    global.IntersectionObserver = vi.fn(() => this.mockIntersectionObserver())
    global.ResizeObserver = vi.fn(() => this.mockResizeObserver())
    global.crypto = this.mockCrypto()
    global.setTimeout = vi.fn((callback: TimerHandler) => callback) as any
    global.clearTimeout = vi.fn()
    global.setInterval = vi.fn((callback: TimerHandler) => callback) as any
    global.clearInterval = vi.fn()
    
    if (global.navigator) {
      Object.defineProperty(global.navigator, 'clipboard', {
        value: this.mockClipboard(),
        writable: true,
        configurable: true,
      })
      Object.defineProperty(global.navigator, 'geolocation', {
        value: this.mockGeolocation(),
        writable: true,
        configurable: true,
      })
      Object.defineProperty(global.navigator, 'mediaDevices', {
        value: this.mockMediaDevices(),
        writable: true,
        configurable: true,
      })
    }
    
    if ('Notification' in global) {
      global.Notification = Object.assign(this.mockNotification(), { prototype: {} })
    }
    
    if ('BroadcastChannel' in global) {
      global.BroadcastChannel = Object.assign(this.mockBroadcastChannel(), { prototype: {} })
    }
    
    if ('serviceWorker' in global.navigator) {
      Object.defineProperty(global.navigator, 'serviceWorker', {
        value: this.mockServiceWorker(),
        writable: true,
        configurable: true,
      })
    }
  },
}