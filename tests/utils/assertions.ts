import { vi } from 'vitest'

// Custom assertion utilities
export const assertionUtils = {
  // Check if value is within a range
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling
    return {
      pass,
      message: pass
        ? `expected ${received} not to be within range ${floor} - ${ceiling}`
        : `expected ${received} to be within range ${floor} - ${ceiling}`,
    }
  },

  // Check if string is a valid email
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const pass = emailRegex.test(received)
    return {
      pass,
      message: pass
        ? `expected ${received} not to be a valid email`
        : `expected ${received} to be a valid email`,
    }
  },

  // Check if object has required properties
  toHaveRequiredProperties(received: any, required: string[]) {
    const missing = required.filter(prop => !received.hasOwnProperty(prop))
    const pass = missing.length === 0
    return {
      pass,
      message: pass
        ? `expected object not to have required properties ${required.join(', ')}`
        : `expected object to have properties ${missing.join(', ')}`,
    }
  },

  // Check if date is within expected range
  toBeWithinDateRange(received: Date, startDate: Date, endDate: Date) {
    const pass = received >= startDate && received <= endDate
    return {
      pass,
      message: pass
        ? `expected ${received.toISOString()} not to be within range ${startDate.toISOString()} - ${endDate.toISOString()}`
        : `expected ${received.toISOString()} to be within range ${startDate.toISOString()} - ${endDate.toISOString()}`,
    }
  },

  // Check if array has unique values
  toHaveUniqueValues(received: any[]) {
    const uniqueValues = new Set(received)
    const pass = uniqueValues.size === received.length
    return {
      pass,
      passMessage: `expected array not to have unique values`,
      failMessage: `expected array to have unique values, but found duplicates`,
    }
  },

  // Check if string contains specific substring (case insensitive)
  toContainIgnoreCase(received: string, substring: string) {
    const pass = received.toLowerCase().includes(substring.toLowerCase())
    return {
      pass,
      message: pass
        ? `expected "${received}" not to contain "${substring}" (case insensitive)`
        : `expected "${received}" to contain "${substring}" (case insensitive)`,
    }
  },

  // Check if array contains all expected items
  toContainAllItems(received: any[], expected: any[]) {
    const missing = expected.filter(item => !received.includes(item))
    const pass = missing.length === 0
    return {
      pass,
      message: pass
        ? `expected array not to contain all items ${JSON.stringify(expected)}`
        : `expected array to contain all items: ${JSON.stringify(missing)}`,
    }
  },

  // Check if object matches partial properties
  toMatchPartial(received: any, expected: any) {
    const matches = Object.entries(expected).every(
      ([key, value]) => received[key] === value
    )
    return {
      pass: matches,
      message: matches
        ? `expected object not to match partial properties ${JSON.stringify(expected)}`
        : `expected object to match partial properties ${JSON.stringify(expected)}`,
    }
  },

  // Check if URL is valid
  toBeValidURL(received: string) {
    try {
      new URL(received)
      return {
        pass: true,
        message: `expected ${received} not to be a valid URL`,
      }
    } catch {
      return {
        pass: false,
        message: `expected ${received} to be a valid URL`,
      }
    }
  },

  // Check if object is instance of class
  toBeInstanceOfClass(received: any, expectedClass: Function) {
    const pass = received instanceof expectedClass
    return {
      pass,
      message: pass
        ? `expected ${received} not to be instance of ${expectedClass.name}`
        : `expected ${received} to be instance of ${expectedClass.name}`,
    }
  },

  // Check if date is today
  toBeToday(received: Date) {
    const today = new Date()
    const pass = 
      received.getDate() === today.getDate() &&
      received.getMonth() === today.getMonth() &&
      received.getFullYear() === today.getFullYear()
    return {
      pass,
      message: pass
        ? `expected ${received.toISOString()} not to be today`
        : `expected ${received.toISOString()} to be today (${today.toISOString()})`,
    }
  },

  // Check if array is sorted
  toBeSorted(received: any[]) {
    const sorted = [...received].sort((a, b) => {
      if (a < b) return -1
      if (a > b) return 1
      return 0
    })
    const pass = JSON.stringify(received) === JSON.stringify(sorted)
    return {
      pass,
      message: pass
        ? `expected array not to be sorted`
        : `expected array to be sorted`,
    }
  },

  // Check if string is UUID
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const pass = uuidRegex.test(received)
    return {
      pass,
      message: pass
        ? `expected ${received} not to be a valid UUID`
        : `expected ${received} to be a valid UUID`,
    }
  },

  // Check if value is in array
  toBeOneOf(received: any, expectedArray: any[]) {
    const pass = expectedArray.includes(received)
    return {
      pass,
      message: pass
        ? `expected ${received} not to be one of ${JSON.stringify(expectedArray)}`
        : `expected ${received} to be one of ${JSON.stringify(expectedArray)}`,
    }
  },

  // Check if date is after another date
  toBeAfter(received: Date, date: Date) {
    const pass = received > date
    return {
      pass,
      message: pass
        ? `expected ${received.toISOString()} not to be after ${date.toISOString()}`
        : `expected ${received.toISOString()} to be after ${date.toISOString()}`,
    }
  },

  // Check if date is before another date
  toBeBefore(received: Date, date: Date) {
    const pass = received < date
    return {
      pass,
      message: pass
        ? `expected ${received.toISOString()} not to be before ${date.toISOString()}`
        : `expected ${received.toISOString()} to be before ${date.toISOString()}`,
    }
  },

  // Check if array length matches
  toHaveLength(received: any[], expectedLength: number) {
    const pass = received.length === expectedLength
    return {
      pass,
      message: pass
        ? `expected array not to have length ${expectedLength}`
        : `expected array to have length ${expectedLength} but got ${received.length}`,
    }
  },

  // Check if string is palindrome
  toBePalindrome(received: string) {
    const normalized = received.toLowerCase().replace(/[^a-z]/g, '')
    const reversed = normalized.split('').reverse().join('')
    const pass = normalized === reversed
    return {
      pass,
      message: pass
        ? `expected "${received}" not to be a palindrome`
        : `expected "${received}" to be a palindrome`,
    }
  },

  // Check if number is even
  toBeEven(received: number) {
    const pass = received % 2 === 0
    return {
      pass,
      message: pass
        ? `expected ${received} not to be even`
        : `expected ${received} to be even`,
    }
  },

  // Check if number is odd
  toBeOdd(received: number) {
    const pass = received % 2 === 1
    return {
      pass,
      message: pass
        ? `expected ${received} not to be odd`
        : `expected ${received} to be odd`,
    }
  },

  // Check if string starts with prefix
  toStartWith(received: string, prefix: string) {
    const pass = received.startsWith(prefix)
    return {
      pass,
      message: pass
        ? `expected "${received}" not to start with "${prefix}"`
        : `expected "${received}" to start with "${prefix}"`,
    }
  },

  // Check if string ends with suffix
  toEndWith(received: string, suffix: string) {
    const pass = received.endsWith(suffix)
    return {
      pass,
      message: pass
        ? `expected "${received}" not to end with "${suffix}"`
        : `expected "${received}" to end with "${suffix}"`,
    }
  },

  // Check if value is null or undefined
  toBeNil(received: any) {
    const pass = received === null || received === undefined
    return {
      pass,
      message: pass
        ? `expected ${received} not to be null or undefined`
        : `expected ${received} to be null or undefined`,
    }
  },

  // Check if value is truthy
  toBeTruthy(received: any) {
    const pass = !!received
    return {
      pass,
      message: pass
        ? `expected ${received} not to be truthy`
        : `expected ${received} to be truthy`,
    }
  },

  // Check if value is falsy
  toBeFalsy(received: any) {
    const pass = !received
    return {
      pass,
      message: pass
        ? `expected ${received} not to be falsy`
        : `expected ${received} to be falsy`,
    }
  },
}

// TypeScript type declaration for custom matchers
declare global {
  namespace Vi {
    interface Assertion<T = any> {
      toBeWithinRange(floor: number, ceiling: number): T extends number ? void : never
      toBeValidEmail(): T extends string ? void : never
      toHaveRequiredProperties(required: string[]): T extends object ? void : never
      toBeWithinDateRange(startDate: Date, endDate: Date): T extends Date ? void : never
      toHaveUniqueValues(): T extends any[] ? void : never
      toContainIgnoreCase(substring: string): T extends string ? void : never
      toContainAllItems(expected: any[]): T extends any[] ? void : never
      toMatchPartial(expected: any): T extends object ? void : never
      toBeValidURL(): T extends string ? void : never
      toBeInstanceOfClass(expectedClass: Function): void
      toBeToday(): T extends Date ? void : never
      toBeSorted(): T extends any[] ? void : never
      toBeValidUUID(): T extends string ? void : never
      toBeOneOf(expectedArray: any[]): void
      toBeAfter(date: Date): T extends Date ? void : never
      toBeBefore(date: Date): T extends Date ? void : never
      toHaveLength(expectedLength: number): T extends any[] ? void : never
      toBePalindrome(): T extends string ? void : never
      toBeEven(): T extends number ? void : never
      toBeOdd(): T extends number ? void : never
      toStartWith(prefix: string): T extends string ? void : never
      toEndWith(suffix: string): T extends string ? void : never
      toBeNil(): void
      toBeTruthy(): void
      toBeFalsy(): void
    }
  }
}