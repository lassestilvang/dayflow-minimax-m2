import { describe, it, expect, vi } from 'bun:test'

// Mock database first
vi.mock('@/lib/db', async () => {
  return {
    getDatabase: vi.fn(() => ({})),
    getSQL: vi.fn(() => ({})),
    checkDatabaseConnection: vi.fn().mockResolvedValue({ connected: false })
  }
})

// Now try importing just the error classes
import { DatabaseError, ValidationError, NotFoundError } from '@/lib/data-access'

describe('Minimal Import Test', () => {
  it('should import error classes', () => {
    const notFoundError = new NotFoundError('Test', '123')
    expect(notFoundError.message).toBe('Test with id 123 not found')
  })
})