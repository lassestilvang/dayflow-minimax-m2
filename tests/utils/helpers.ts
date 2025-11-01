import { vi } from 'vitest'

// Test helper utilities
export const helperUtils = {
  // Wait for a specific condition
  async waitFor(condition: () => boolean, timeout = 5000, interval = 100): Promise<boolean> {
    const startTime = Date.now()
    
    return new Promise((resolve) => {
      const check = () => {
        if (condition()) {
          resolve(true)
          return
        }
        
        if (Date.now() - startTime > timeout) {
          resolve(false)
          return
        }
        
        setTimeout(check, interval)
      }
      
      check()
    })
  },

  // Wait for DOM changes
  async waitForDOMChange(target: Element | Document = document, timeout = 5000): Promise<boolean> {
    return new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        observer.disconnect()
        resolve(true)
      })
      
      observer.observe(target, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeOldValue: true,
        characterData: true,
        characterDataOldValue: true,
      })
      
      setTimeout(() => {
        observer.disconnect()
        resolve(false)
      }, timeout)
    })
  },

  // Create a mock element
  createMockElement(tag = 'div', properties: any = {}): HTMLElement {
    const element = document.createElement(tag)
    
    Object.assign(element, {
      click: vi.fn(),
      focus: vi.fn(),
      blur: vi.fn(),
      getAttribute: vi.fn((name) => properties[name] || null),
      setAttribute: vi.fn(),
      removeAttribute: vi.fn(),
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        toggle: vi.fn(),
        contains: vi.fn(() => true),
      },
      style: {
        ...(properties.style || {}),
      },
      ...properties,
    })
    
    return element
  },

  // Create a mock form
  createMockForm(elements: Array<{ name: string; value: string; type?: string }> = []) {
    const form = {
      elements: elements.map(el => ({
        name: el.name,
        value: el.value,
        type: el.type || 'text',
        checked: el.type === 'checkbox' ? true : undefined,
      })),
      
      submit: vi.fn(),
      reset: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
    
    return form
  },

  // Create a mock event
  createMockEvent(type: string, options: any = {}) {
    return {
      type,
      target: options.target || {},
      currentTarget: options.currentTarget || {},
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      stopImmediatePropagation: vi.fn(),
      ...options,
    }
  },

  // Create a mock custom event
  createMockCustomEvent(type: string, detail: any = {}) {
    return new CustomEvent(type, { detail })
  },

  // Simulate user interactions
  simulateClick(element: HTMLElement) {
    element.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    }))
  },

  simulateInput(element: HTMLInputElement, value: string) {
    element.value = value
    element.dispatchEvent(new Event('input', { bubbles: true }))
    element.dispatchEvent(new Event('change', { bubbles: true }))
  },

  simulateKeyPress(element: HTMLElement, key: string, options = {}) {
    element.dispatchEvent(new KeyboardEvent('keydown', {
      key,
      ...options,
    }))
    element.dispatchEvent(new KeyboardEvent('keypress', {
      key,
      ...options,
    }))
    element.dispatchEvent(new KeyboardEvent('keyup', {
      key,
      ...options,
    }))
  },

  // Mock react-router navigation
  mockRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      pathname: '/',
      query: {},
    }
  },

  // Mock next-auth session
  mockSession(user = { id: '1', email: 'test@example.com', name: 'Test User' }) {
    return {
      data: { user },
      status: 'authenticated',
    }
  },

  // Create test context wrapper
  createTestContext() {
    return {
      user: {
        id: 'test-user-1',
        email: 'test@example.com',
        name: 'Test User',
        workosId: 'workos-test-1',
      },
      router: this.mockRouter(),
      session: this.mockSession(),
    }
  },

  // Setup timeout mocks
  setupTimeouts() {
    const timeouts = new Map()
    
    vi.stubGlobal('setTimeout', vi.fn((callback, delay) => {
      const id = Math.random()
      timeouts.set(id, { callback, delay })
      return id
    }))
    
    vi.stubGlobal('clearTimeout', vi.fn((id) => {
      timeouts.delete(id)
    }))
    
    return timeouts
  },

  // Setup interval mocks
  setupIntervals() {
    const intervals = new Map()
    
    vi.stubGlobal('setInterval', vi.fn((callback, delay) => {
      const id = Math.random()
      intervals.set(id, { callback, delay })
      return id
    }))
    
    vi.stubGlobal('clearInterval', vi.fn((id) => {
      intervals.delete(id)
    }))
    
    return intervals
  },

  // Cleanup timers
  cleanupTimers() {
    vi.unstubAllGlobals()
  },

  // Create promise that resolves after delay
  createDelayedPromise<T>(value: T, delay = 100): Promise<T> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(value), delay)
    })
  },

  // Create promise that rejects after delay
  createDelayedRejection(error: Error, delay = 100): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(error), delay)
    })
  },

  // Generate test filename
  generateTestFilename(testName: string, category: 'unit' | 'integration' | 'e2e' | 'perf' = 'unit') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    return `${testName}-${category}-${timestamp}.test.ts`
  },

  // Create test report data
  createTestReport(suiteName: string, results: Array<{ name: string; passed: boolean; duration: number }>) {
    const total = results.length
    const passed = results.filter(r => r.passed).length
    const failed = total - passed
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)
    
    return {
      suite: suiteName,
      summary: {
        total,
        passed,
        failed,
        duration: totalDuration,
      },
      results: results.map(r => ({
        ...r,
        status: r.passed ? 'passed' : 'failed',
      })),
      timestamp: new Date().toISOString(),
    }
  },

  // Validate test data structure
  validateTestData(data: any, schema: Record<string, string | Function>) {
    const errors: string[] = []
    
    for (const [field, type] of Object.entries(schema)) {
      const value = data[field]
      
      if (type === 'string' && typeof value !== 'string') {
        errors.push(`Field ${field} should be string, got ${typeof value}`)
      } else if (type === 'number' && typeof value !== 'number') {
        errors.push(`Field ${field} should be number, got ${typeof value}`)
      } else if (type === 'object' && (typeof value !== 'object' || value === null)) {
        errors.push(`Field ${field} should be object, got ${typeof value}`)
      } else if (typeof type === 'function' && !(value instanceof type)) {
        errors.push(`Field ${field} should be instance of ${type.name}`)
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    }
  },

  // Create performance benchmark
  createBenchmark(name: string, iterations = 100) {
    const results: number[] = []
    
    return {
      name,
      iterations,
      start: () => performance.now(),
      end: (start: number) => {
        const duration = performance.now() - start
        results.push(duration)
        return duration
      },
      getAverage: () => results.reduce((sum, r) => sum + r, 0) / results.length,
      getMin: () => Math.min(...results),
      getMax: () => Math.max(...results),
      getMedian: () => {
        const sorted = [...results].sort((a, b) => a - b)
        const middle = Math.floor(sorted.length / 2)
        return sorted.length % 2 === 0 
          ? (sorted[middle - 1] + sorted[middle]) / 2
          : sorted[middle]
      },
      getResults: () => [...results],
    }
  },

  // Mock window.history
  mockHistory() {
    const mockState = { url: '/', index: 0 }
    
    return {
      pushState: vi.fn((state, title, url) => {
        mockState.url = url
        mockState.index++
      }),
      replaceState: vi.fn((state, title, url) => {
        mockState.url = url
      }),
      back: vi.fn(),
      forward: vi.fn(),
      go: vi.fn(),
      state: mockState,
      length: 5,
    }
  },

  // Mock screen API
  mockScreen() {
    return {
      width: 1920,
      height: 1080,
      colorDepth: 24,
      pixelDepth: 24,
      availWidth: 1920,
      availHeight: 1080,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
  },

  // Create comprehensive environment mock
  createMockEnvironment() {
    // Mock window
    Object.defineProperty(window, 'innerWidth', { value: 1920 })
    Object.defineProperty(window, 'innerHeight', { value: 1080 })
    
    // Mock document
    const mockDocument = document.implementation.createHTMLDocument('test')
    Object.defineProperty(window, 'document', { value: mockDocument })
    
    // Mock history
    Object.defineProperty(window, 'history', { value: this.mockHistory() })
    
    // Mock screen
    Object.defineProperty(window, 'screen', { value: this.mockScreen() })
    
    // Mock performance
    Object.defineProperty(window, 'performance', {
      value: {
        now: vi.fn(() => Date.now()),
        timing: {
          navigationStart: 0,
        },
      },
    })
    
    // Mock crypto
    Object.defineProperty(window, 'crypto', {
      value: {
        randomUUID: vi.fn(() => 'mock-uuid'),
        getRandomValues: vi.fn((arr: any) => {
          for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.floor(Math.random() * 256)
          }
          return arr
        }),
      },
    })
  },

  // Mock HTTP request/response for API testing
  createMockRequest(overrides: any = {}) {
    return {
      method: 'GET',
      url: '/',
      params: {},
      query: {},
      body: null,
      headers: {},
      cookies: {},
      ip: '127.0.0.1',
      user: null,
      files: [],
      get: vi.fn((name: string) => overrides.headers?.[name.toLowerCase()]),
      json: vi.fn(),
      text: vi.fn(),
      ...overrides,
    }
  },

  createMockResponse() {
    const response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      text: vi.fn().mockReturnThis(),
      html: vi.fn().mockReturnThis(),
      cookie: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
      getHeader: vi.fn().mockReturnThis(),
      redirect: vi.fn().mockReturnThis(),
      end: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
      locals: {},
      headersSent: false,
    }

    return response
  },

  // Mock Next.js API route context
  createApiRouteContext(request: any, response: any) {
    return {
      params: request.params,
      searchParams: new URLSearchParams(request.searchParams),
      request,
      response,
    }
  },

  // Mock user session for authentication tests
  createMockSession(user: any = { id: 'test-user', email: 'test@example.com' }) {
    return {
      user,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    }
  },

  // Mock API rate limiting
  createRateLimiter(requests: number = 100, windowMs: number = 60000) {
    const calls: Array<{ ip: string; timestamp: number }> = []
    
    return {
      isAllowed: (ip: string) => {
        const now = Date.now()
        const cutoff = now - windowMs
        
        // Remove old calls
        while (calls.length > 0 && calls[0].timestamp < cutoff) {
          calls.shift()
        }
        
        // Count recent calls from this IP
        const recentCalls = calls.filter(call => call.ip === ip)
        
        if (recentCalls.length >= requests) {
          return false
        }
        
        calls.push({ ip, timestamp: now })
        return true
      },
      getRemainingRequests: (ip: string) => {
        const now = Date.now()
        const cutoff = now - windowMs
        const recentCalls = calls.filter(call => call.ip === ip && call.timestamp >= cutoff)
        return Math.max(0, requests - recentCalls.length)
      },
      getResetTime: () => new Date(Date.now() + windowMs),
    }
  },
}