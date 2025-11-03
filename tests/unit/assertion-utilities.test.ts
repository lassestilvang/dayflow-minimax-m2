import { describe, it, expect, vi } from 'vitest'
import { assertionUtils } from '../../utils/assertions'

describe('Assertion Utilities', () => {
  describe('toBeWithinRange', () => {
    it('should pass when value is within range', () => {
      const result = assertionUtils.toBeWithinRange(5, 1, 10)
      expect(result.pass).toBe(true)
      expect(result.message).toContain('expected 5 not to be within range 1 - 10')
    })

    it('should fail when value is below range', () => {
      const result = assertionUtils.toBeWithinRange(0, 1, 10)
      expect(result.pass).toBe(false)
      expect(result.message).toContain('expected 0 to be within range 1 - 10')
    })

    it('should fail when value is above range', () => {
      const result = assertionUtils.toBeWithinRange(15, 1, 10)
      expect(result.pass).toBe(false)
      expect(result.message).toContain('expected 15 to be within range 1 - 10')
    })

    it('should handle boundary values', () => {
      expect(assertionUtils.toBeWithinRange(1, 1, 10).pass).toBe(true)
      expect(assertionUtils.toBeWithinRange(10, 1, 10).pass).toBe(true)
    })

    it('should handle negative numbers', () => {
      expect(assertionUtils.toBeWithinRange(-5, -10, 0).pass).toBe(true)
      expect(assertionUtils.toBeWithinRange(-15, -10, 0).pass).toBe(false)
    })

    it('should handle decimal numbers', () => {
      expect(assertionUtils.toBeWithinRange(3.14, 1, 10).pass).toBe(true)
      expect(assertionUtils.toBeWithinRange(3.14159, 1, 10).pass).toBe(true)
    })
  })

  describe('toBeValidEmail', () => {
    it('should pass for valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.email+tag@domain.co.uk',
        'user123@test-domain.org',
        'first.last@subdomain.example.com'
      ]
      
      validEmails.forEach(email => {
        const result = assertionUtils.toBeValidEmail(email)
        expect(result.pass).toBe(true)
        expect(result.message).toContain(`expected ${email} not to be a valid email`)
      })
    })

    it('should fail for invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@example',
        'user@.com',
        'user @example.com',
        'user@ example.com',
        '',
        'user@example..com',
        'user..user@example.com'
      ]
      
      invalidEmails.forEach(email => {
        const result = assertionUtils.toBeValidEmail(email)
        expect(result.pass).toBe(false)
        expect(result.message).toContain(`expected ${email} to be a valid email`)
      })
    })
  })

  describe('toHaveRequiredProperties', () => {
    it('should pass when object has all required properties', () => {
      const obj = { name: 'John', age: 30, email: 'john@example.com' }
      const required = ['name', 'age']
      const result = assertionUtils.toHaveRequiredProperties(obj, required)
      
      expect(result.pass).toBe(true)
      expect(result.message).toContain('expected object not to have required properties')
    })

    it('should fail when object is missing required properties', () => {
      const obj = { name: 'John' }
      const required = ['name', 'age', 'email']
      const result = assertionUtils.toHaveRequiredProperties(obj, required)
      
      expect(result.pass).toBe(false)
      expect(result.message).toContain('expected object to have properties age, email')
    })

    it('should fail when object is null or undefined', () => {
      const required = ['name']
      expect(assertionUtils.toHaveRequiredProperties(null, required).pass).toBe(false)
      expect(assertionUtils.toHaveRequiredProperties(undefined, required).pass).toBe(false)
    })

    it('should handle empty required properties array', () => {
      const obj = { name: 'John' }
      const result = assertionUtils.toHaveRequiredProperties(obj, [])
      
      expect(result.pass).toBe(true)
    })

    it('should handle primitive values', () => {
      expect(assertionUtils.toHaveRequiredProperties('string', ['length']).pass).toBe(false)
      expect(assertionUtils.toHaveRequiredProperties(123, ['toString']).pass).toBe(false)
    })
  })

  describe('toBeWithinDateRange', () => {
    const now = new Date()
    const past = new Date(now.getTime() - 3600000) // 1 hour ago
    const future = new Date(now.getTime() + 3600000) // 1 hour from now

    it('should pass when date is within range', () => {
      const result = assertionUtils.toBeWithinDateRange(now, past, future)
      expect(result.pass).toBe(true)
    })

    it('should fail when date is before range', () => {
      const earlier = new Date(past.getTime() - 3600000)
      const result = assertionUtils.toBeWithinDateRange(earlier, past, future)
      expect(result.pass).toBe(false)
    })

    it('should fail when date is after range', () => {
      const later = new Date(future.getTime() + 3600000)
      const result = assertionUtils.toBeWithinDateRange(later, past, future)
      expect(result.pass).toBe(false)
    })

    it('should handle exact boundary dates', () => {
      expect(assertionUtils.toBeWithinDateRange(past, past, future).pass).toBe(true)
      expect(assertionUtils.toBeWithinDateRange(future, past, future).pass).toBe(true)
    })
  })

  describe('toHaveUniqueValues', () => {
    it('should pass for array with unique values', () => {
      const uniqueArray = [1, 2, 3, 4, 5]
      const result = assertionUtils.toHaveUniqueValues(uniqueArray)
      expect(result.pass).toBe(true)
      expect(result.passMessage).toBe('expected array not to have unique values')
    })

    it('should fail for array with duplicates', () => {
      const duplicateArray = [1, 2, 2, 3, 3, 3]
      const result = assertionUtils.toHaveUniqueValues(duplicateArray)
      expect(result.pass).toBe(false)
      expect(result.failMessage).toBe('expected array to have unique values, but found duplicates')
    })

    it('should handle empty array', () => {
      expect(assertionUtils.toHaveUniqueValues([]).pass).toBe(true)
    })

    it('should handle single element array', () => {
      expect(assertionUtils.toHaveUniqueValues([1]).pass).toBe(true)
    })

    it('should handle strings', () => {
      expect(assertionUtils.toHaveUniqueValues(['a', 'b', 'c']).pass).toBe(true)
      expect(assertionUtils.toHaveUniqueValues(['a', 'b', 'a']).pass).toBe(false)
    })

    it('should handle objects (by reference)', () => {
      const obj1 = { id: 1 }
      const obj2 = { id: 2 }
      const obj3 = obj1 // Same reference as obj1
      
      expect(assertionUtils.toHaveUniqueValues([obj1, obj2, obj3]).pass).toBe(true)
    })
  })

  describe('toContainIgnoreCase', () => {
    it('should pass when string contains substring (case insensitive)', () => {
      const testCases = [
        ['Hello World', 'hello'],
        ['Hello World', 'HELLO'],
        ['Hello World', 'HeLLo'],
        ['Test String', 'test'],
        ['UPPERCASE', 'uppercase'],
        ['mixed CASE string', 'case']
      ]
      
      testCases.forEach(([str, sub]) => {
        const result = assertionUtils.toContainIgnoreCase(str, sub)
        expect(result.pass).toBe(true)
      })
    })

    it('should fail when string does not contain substring', () => {
      const result = assertionUtils.toContainIgnoreCase('Hello World', 'Goodbye')
      expect(result.pass).toBe(false)
    })

    it('should handle exact matches', () => {
      const result = assertionUtils.toContainIgnoreCase('Test', 'Test')
      expect(result.pass).toBe(true)
    })

    it('should handle empty strings', () => {
      expect(assertionUtils.toContainIgnoreCase('', 'test').pass).toBe(false)
      expect(assertionUtils.toContainIgnoreCase('test', '').pass).toBe(true)
    })
  })

  describe('toContainAllItems', () => {
    it('should pass when array contains all expected items', () => {
      const received = [1, 2, 3, 4, 5]
      const expected = [2, 4]
      const result = assertionUtils.toContainAllItems(received, expected)
      
      expect(result.pass).toBe(true)
    })

    it('should fail when array is missing some expected items', () => {
      const received = [1, 2, 3]
      const expected = [2, 4, 5]
      const result = assertionUtils.toContainAllItems(received, expected)
      
      expect(result.pass).toBe(false)
      expect(result.message).toContain('expected array to contain all items')
    })

    it('should handle empty expected array', () => {
      const result = assertionUtils.toContainAllItems([1, 2, 3], [])
      expect(result.pass).toBe(true)
    })

    it('should handle empty received array', () => {
      const result = assertionUtils.toContainAllItems([], [1, 2])
      expect(result.pass).toBe(false)
    })

    it('should handle objects and arrays', () => {
      const obj1 = { id: 1 }
      const obj2 = { id: 2 }
      const received = [obj1, obj2, { id: 3 }]
      const expected = [obj1, obj2]
      const result = assertionUtils.toContainAllItems(received, expected)
      expect(result.pass).toBe(true)
    })
  })

  describe('toMatchPartial', () => {
    it('should pass when object matches partial properties', () => {
      const received = { name: 'John', age: 30, email: 'john@example.com', active: true }
      const expected = { name: 'John', age: 30 }
      const result = assertionUtils.toMatchPartial(received, expected)
      
      expect(result.pass).toBe(true)
    })

    it('should fail when object does not match partial properties', () => {
      const received = { name: 'John', age: 25 }
      const expected = { name: 'John', age: 30 }
      const result = assertionUtils.toMatchPartial(received, expected)
      
      expect(result.pass).toBe(false)
    })

    it('should handle empty expected object', () => {
      const received = { name: 'John' }
      const result = assertionUtils.toMatchPartial(received, {})
      expect(result.pass).toBe(true)
    })

    it('should handle extra properties in received object', () => {
      const received = { name: 'John', age: 30, email: 'john@example.com' }
      const expected = { name: 'John' }
      const result = assertionUtils.toMatchPartial(received, expected)
      expect(result.pass).toBe(true)
    })
  })

  describe('toBeValidURL', () => {
    it('should pass for valid URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://example.com',
        'https://www.example.com/path?query=value',
        'ftp://files.example.com',
        'https://subdomain.domain.co.uk'
      ]
      
      validUrls.forEach(url => {
        const result = assertionUtils.toBeValidURL(url)
        expect(result.pass).toBe(true)
      })
    })

    it('should fail for invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'http://',
        'https://',
        '://example.com',
        'http//example.com',
        '',
        'just-text'
      ]
      
      invalidUrls.forEach(url => {
        const result = assertionUtils.toBeValidURL(url)
        expect(result.pass).toBe(false)
      })
    })
  })

  describe('toBeInstanceOfClass', () => {
    class TestClass {}
    class OtherClass {}

    it('should pass when object is instance of class', () => {
      const instance = new TestClass()
      const result = assertionUtils.toBeInstanceOfClass(instance, TestClass)
      expect(result.pass).toBe(true)
    })

    it('should fail when object is not instance of class', () => {
      const instance = new TestClass()
      const result = assertionUtils.toBeInstanceOfClass(instance, OtherClass)
      expect(result.pass).toBe(false)
    })

    it('should work with built-in classes', () => {
      const date = new Date()
      const array = []
      const regexp = /test/
      
      expect(assertionUtils.toBeInstanceOfClass(date, Date).pass).toBe(true)
      expect(assertionUtils.toBeInstanceOfClass(array, Array).pass).toBe(true)
      expect(assertionUtils.toBeInstanceOfClass(regexp, RegExp).pass).toBe(true)
    })
  })

  describe('toBeToday', () => {
    it('should pass for today\'s date', () => {
      const today = new Date()
      const result = assertionUtils.toBeToday(today)
      expect(result.pass).toBe(true)
    })

    it('should fail for dates that are not today', () => {
      const yesterday = new Date(Date.now() - 86400000)
      const tomorrow = new Date(Date.now() + 86400000)
      
      expect(assertionUtils.toBeToday(yesterday).pass).toBe(false)
      expect(assertionUtils.toBeToday(tomorrow).pass).toBe(false)
    })
  })

  describe('toBeSorted', () => {
    it('should pass for sorted arrays', () => {
      const sortedNumbers = [1, 2, 3, 4, 5]
      const sortedStrings = ['a', 'b', 'c', 'd']
      const sortedDates = [new Date('2023-01-01'), new Date('2023-01-02'), new Date('2023-01-03')]
      
      expect(assertionUtils.toBeSorted(sortedNumbers).pass).toBe(true)
      expect(assertionUtils.toBeSorted(sortedStrings).pass).toBe(true)
      expect(assertionUtils.toBeSorted(sortedDates).pass).toBe(true)
    })

    it('should fail for unsorted arrays', () => {
      const unsorted = [3, 1, 4, 2, 5]
      expect(assertionUtils.toBeSorted(unsorted).pass).toBe(false)
    })

    it('should handle empty and single-element arrays', () => {
      expect(assertionUtils.toBeSorted([]).pass).toBe(true)
      expect(assertionUtils.toBeSorted([1]).pass).toBe(true)
    })
  })

  describe('toBeValidUUID', () => {
    it('should pass for valid UUIDs', () => {
      const validUuids = [
        '550e8400-e29b-41d4-a716-446655440000',
        '123e4567-e89b-12d3-a456-426614174000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
      ]
      
      validUuids.forEach(uuid => {
        const result = assertionUtils.toBeValidUUID(uuid)
        expect(result.pass).toBe(true)
      })
    })

    it('should fail for invalid UUIDs', () => {
      const invalidUuids = [
        'not-a-uuid',
        '550e8400-e29b-41d4-a716-44665544000', // too short
        '550e8400-e29b-41d4-a716-4466554400000', // too long
        '550e8400-e29b-41d4-a716-44665544000g', // invalid character
        ''
      ]
      
      invalidUuids.forEach(uuid => {
        const result = assertionUtils.toBeValidUUID(uuid)
        expect(result.pass).toBe(false)
      })
    })
  })

  describe('toBeOneOf', () => {
    it('should pass when value is in array', () => {
      const result = assertionUtils.toBeOneOf(2, [1, 2, 3, 4, 5])
      expect(result.pass).toBe(true)
    })

    it('should fail when value is not in array', () => {
      const result = assertionUtils.toBeOneOf(6, [1, 2, 3, 4, 5])
      expect(result.pass).toBe(false)
    })

    it('should work with different types', () => {
      expect(assertionUtils.toBeOneOf('hello', ['hello', 'world']).pass).toBe(true)
      expect(assertionUtils.toBeOneOf(true, [true, false]).pass).toBe(true)
      expect(assertionUtils.toBeOneOf(null, [null, undefined]).pass).toBe(true)
    })
  })

  describe('toBeAfter and toBeBefore', () => {
    const date1 = new Date('2023-01-01')
    const date2 = new Date('2023-01-02')
    const date3 = new Date('2023-01-03')

    it('should correctly identify date relationships', () => {
      expect(assertionUtils.toBeAfter(date2, date1).pass).toBe(true)
      expect(assertionUtils.toBeAfter(date1, date2).pass).toBe(false)
      
      expect(assertionUtils.toBeBefore(date1, date2).pass).toBe(true)
      expect(assertionUtils.toBeBefore(date2, date1).pass).toBe(false)
    })

    it('should handle equal dates', () => {
      expect(assertionUtils.toBeAfter(date1, date1).pass).toBe(false)
      expect(assertionUtils.toBeBefore(date1, date1).pass).toBe(false)
    })
  })

  describe('toHaveLength', () => {
    it('should pass when array has expected length', () => {
      const result = assertionUtils.toHaveLength([1, 2, 3], 3)
      expect(result.pass).toBe(true)
    })

    it('should fail when array has different length', () => {
      const result = assertionUtils.toHaveLength([1, 2], 3)
      expect(result.pass).toBe(false)
    })

    it('should handle empty arrays', () => {
      expect(assertionUtils.toHaveLength([], 0).pass).toBe(true)
    })
  })

  describe('String utilities', () => {
    describe('toBePalindrome', () => {
      it('should identify palindromes', () => {
        const palindromes = ['racecar', 'A man a plan a canal Panama', 'Madam']
        
        palindromes.forEach(str => {
          expect(assertionUtils.toBePalindrome(str).pass).toBe(true)
        })
      })

      it('should identify non-palindromes', () => {
        expect(assertionUtils.toBePalindrome('hello').pass).toBe(false)
        expect(assertionUtils.toBePalindrome('world').pass).toBe(false)
      })
    })

    describe('toBeEven and toBeOdd', () => {
      it('should identify even numbers', () => {
        expect(assertionUtils.toBeEven(2).pass).toBe(true)
        expect(assertionUtils.toBeEven(4).pass).toBe(true)
        expect(assertionUtils.toBeEven(0).pass).toBe(true)
      })

      it('should identify odd numbers', () => {
        expect(assertionUtils.toBeOdd(1).pass).toBe(true)
        expect(assertionUtils.toBeOdd(3).pass).toBe(true)
        expect(assertionUtils.toBeOdd(-1).pass).toBe(true)
      })

      it('should handle non-integers', () => {
        expect(assertionUtils.toBeEven(2.5).pass).toBe(false)
        expect(assertionUtils.toBeOdd(2.5).pass).toBe(false)
      })
    })

    describe('toStartWith and toEndWith', () => {
      it('should check string prefixes', () => {
        expect(assertionUtils.toStartWith('Hello World', 'Hello').pass).toBe(true)
        expect(assertionUtils.toStartWith('Hello World', 'hello').pass).toBe(false)
      })

      it('should check string suffixes', () => {
        expect(assertionUtils.toEndWith('Hello World', 'World').pass).toBe(true)
        expect(assertionUtils.toEndWith('Hello World', 'world').pass).toBe(false)
      })
    })
  })

  describe('Truthiness utilities', () => {
    describe('toBeNil', () => {
      it('should identify null and undefined', () => {
        expect(assertionUtils.toBeNil(null).pass).toBe(true)
        expect(assertionUtils.toBeNil(undefined).pass).toBe(true)
      })

      it('should not identify falsy values as nil', () => {
        expect(assertionUtils.toBeNil(0).pass).toBe(false)
        expect(assertionUtils.toBeNil(false).pass).toBe(false)
        expect(assertionUtils.toBeNil('').pass).toBe(false)
      })
    })

    describe('toBeTruthy and toBeFalsy', () => {
      it('should identify truthy values', () => {
        expect(assertionUtils.toBeTruthy(1).pass).toBe(true)
        expect(assertionUtils.toBeTruthy('test').pass).toBe(true)
        expect(assertionUtils.toBeTruthy(true).pass).toBe(true)
        expect(assertionUtils.toBeTruthy({}).pass).toBe(true)
        expect(assertionUtils.toBeTruthy([]).pass).toBe(true)
      })

      it('should identify falsy values', () => {
        expect(assertionUtils.toBeFalsy(0).pass).toBe(true)
        expect(assertionUtils.toBeFalsy(false).pass).toBe(true)
        expect(assertionUtils.toBeFalsy('').pass).toBe(true)
        expect(assertionUtils.toBeFalsy(null).pass).toBe(true)
        expect(assertionUtils.toBeFalsy(undefined).pass).toBe(true)
      })
    })
  })
})