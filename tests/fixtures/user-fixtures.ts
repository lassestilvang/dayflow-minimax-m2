import type { DatabaseUser, UserValidation } from '@/types/database'

// User fixtures for consistent testing
export const userFixtures = {
  // Basic valid users
  validUsers: [
    {
      id: '123e4567-e89b-12d3-a456-426614174001',
      email: 'john.doe@example.com',
      name: 'John Doe',
      workosId: 'workos_123456',
      avatar: null,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174002',
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      workosId: 'workos_789012',
      avatar: 'https://example.com/avatars/jane.jpg',
      createdAt: new Date('2024-01-02T00:00:00Z'),
      updatedAt: new Date('2024-01-02T00:00:00Z'),
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174003',
      email: 'mike.wilson@example.com',
      name: 'Mike Wilson',
      workosId: 'workos_345678',
      avatar: null,
      createdAt: new Date('2024-01-03T00:00:00Z'),
      updatedAt: new Date('2024-01-03T00:00:00Z'),
    },
  ] as DatabaseUser[],

  // Users for different scenarios
  adminUser: {
    id: 'admin-user-001',
    email: 'admin@dayflow.com',
    name: 'DayFlow Admin',
    workosId: 'workos_admin',
    avatar: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as DatabaseUser,

  testUser: {
    id: 'test-user-001',
    email: 'test@dayflow.com',
    name: 'Test User',
    workosId: 'workos_test',
    avatar: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as DatabaseUser,

  demoUser: {
    id: 'demo-user-001',
    email: 'demo@dayflow.com',
    name: 'Demo User',
    workosId: 'workos_demo',
    avatar: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as DatabaseUser,

  // User insertion data (without id, createdAt, updatedAt)
  userInsertData: [
    {
      email: 'new.user@example.com',
      name: 'New User',
      workosId: 'workos_new123',
    },
    {
      email: 'another@example.com',
      name: 'Another User',
      workosId: 'workos_another456',
      avatar: 'https://example.com/avatars/another.jpg',
    },
  ],

  // User update data
  userUpdateData: [
    {
      name: 'Updated John Doe',
    },
    {
      email: 'updated.email@example.com',
      name: 'Updated Name',
      avatar: 'https://example.com/avatars/updated.jpg',
    },
    {
      workosId: 'new_workos_id',
    },
  ],

  // Invalid user data for testing validation
  invalidUserData: [
    {
      id: 'invalid-uuid',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174001',
      email: 'invalid-email',
      name: 'Test User',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174001',
      email: 'test@example.com',
      name: '',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174001',
      email: 'test@example.com',
      name: 'a'.repeat(101),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174001',
      email: 'test@example.com',
      name: 'Test User',
      image: 'invalid-url',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],

  // Users for different authentication scenarios
  authenticatedUser: {
    id: 'auth-user-001',
    email: 'authenticated@example.com',
    name: 'Authenticated User',
    workosId: 'workos_auth',
    avatar: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as DatabaseUser,

  unauthenticatedUser: null as DatabaseUser | null,

  // Session data for testing
  userSessions: [
    {
      user: {
        id: 'session-user-001',
        email: 'session@example.com',
        name: 'Session User',
      },
      expires: new Date('2024-12-31T23:59:59Z'),
      accessToken: 'mock-access-token',
    },
    {
      user: {
        id: 'session-user-002',
        email: 'expired@example.com',
        name: 'Expired User',
      },
      expires: new Date('2023-01-01T00:00:00Z'),
      accessToken: 'expired-token',
    },
  ],

  // Helper methods
  createUser(overrides: Partial<DatabaseUser> = {}): DatabaseUser {
    return {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: `user${Date.now()}@example.com`,
      name: 'Test User',
      workosId: `workos_${Date.now()}`,
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }
  },

  createBulkUsers(count: number, baseData: Partial<DatabaseUser> = {}): DatabaseUser[] {
    return Array.from({ length: count }, (_, index) => 
      this.createUser({
        ...baseData,
        email: `user${index}@example.com`,
        name: `User ${index + 1}`,
      })
    )
  },

  // Generate users with specific characteristics for different test scenarios
  generateUsersByType() {
    return {
      activeUsers: this.validUsers.filter(user => 
        user.email.includes('example.com') && user.workosId
      ),
      usersWithAvatars: this.validUsers.filter(user => user.avatar),
      usersWithoutAvatars: this.validUsers.filter(user => !user.avatar),
      adminUsers: [adminUser],
      testUsers: [testUser],
      demoUsers: [this.demoUser],
    }
  },

  // User relationships for testing
  userRelationships: {
    owner: null, // Will be set after initialization
    collaborators: [], // Will be set after initialization
    viewers: [], // Will be set after initialization
  },

  // Mock authentication responses - will be initialized after export
  mockAuthResponses: {
    success: {
      user: null as any, // Will be set after initialization
      session: {
        accessToken: 'mock-token',
        expires: new Date('2024-12-31T23:59:59Z'),
      },
    },
    failure: {
      error: 'Authentication failed',
      message: 'Invalid credentials',
    },
    unauthorized: {
      error: 'Unauthorized',
      message: 'Access denied',
    },
  },
}

// Export type for fixture validation
export type UserFixtures = typeof userFixtures

// Export specific fixtures for easier imports
export const {
  validUsers,
  adminUser,
  testUser,
  demoUser,
  authenticatedUser,
  userSessions,
  mockAuthResponses
} = userFixtures

// Initialize user relationships after export
userFixtures.userRelationships.owner = userFixtures.adminUser
userFixtures.userRelationships.collaborators = userFixtures.validUsers.slice(0, 2)
userFixtures.userRelationships.viewers = [userFixtures.demoUser]
userFixtures.mockAuthResponses.success.user = userFixtures.authenticatedUser