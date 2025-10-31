// Integration fixtures for testing external service integrations
export const integrationFixtures = {
  // External service integrations
  validIntegrations: [
    {
      id: 'integration-001',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      service: 'google-calendar' as const,
      accountId: 'google-account-123',
      accessToken: 'google-access-token-456',
      refreshToken: 'google-refresh-token-789',
      expiresAt: new Date('2024-06-15T12:00:00Z'),
      settings: {
        syncEvents: true,
        syncTasks: false,
        calendarId: 'primary',
      },
      status: 'connected' as const,
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-15T14:30:00Z'),
      lastSync: new Date('2024-01-15T14:30:00Z'),
      error: null,
    },
    {
      id: 'integration-002',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      service: 'apple-calendar' as const,
      accountId: 'apple-account-456',
      accessToken: 'apple-access-token-789',
      refreshToken: 'apple-refresh-token-012',
      expiresAt: new Date('2024-06-20T15:00:00Z'),
      settings: {
        syncEvents: true,
        syncTasks: true,
        calendarId: 'work',
      },
      status: 'connected' as const,
      createdAt: new Date('2024-01-02T09:15:00Z'),
      updatedAt: new Date('2024-01-10T11:45:00Z'),
      lastSync: new Date('2024-01-10T11:45:00Z'),
      error: null,
    },
    {
      id: 'integration-003',
      userId: '123e4567-e89b-12d3-a456-426614174002',
      service: 'outlook-calendar' as const,
      accountId: 'outlook-account-789',
      accessToken: 'outlook-access-token-012',
      refreshToken: 'outlook-refresh-token-345',
      expiresAt: new Date('2024-05-30T08:00:00Z'),
      settings: {
        syncEvents: true,
        syncTasks: false,
        calendarId: 'outlook-primary',
      },
      status: 'connected' as const,
      createdAt: new Date('2024-01-03T13:20:00Z'),
      updatedAt: new Date('2024-01-12T16:10:00Z'),
      lastSync: new Date('2024-01-12T16:10:00Z'),
      error: null,
    },
    {
      id: 'integration-004',
      userId: '123e4567-e89b-12d3-a456-426614174003',
      service: 'todoist' as const,
      accountId: 'todoist-account-012',
      accessToken: 'todoist-access-token-345',
      refreshToken: null,
      expiresAt: new Date('2024-12-31T23:59:59Z'),
      settings: {
        syncEvents: false,
        syncTasks: true,
        projectId: 'dayflow-sync',
      },
      status: 'connected' as const,
      createdAt: new Date('2024-01-05T14:00:00Z'),
      updatedAt: new Date('2024-01-18T10:30:00Z'),
      lastSync: new Date('2024-01-18T10:30:00Z'),
      error: null,
    },
  ],

  // Integration statuses
  integrationStatuses: {
    connected: {
      id: 'connected-int-001',
      userId: 'user-001',
      service: 'google-calendar' as const,
      accountId: 'account-123',
      status: 'connected' as const,
      accessToken: 'valid-token',
      refreshToken: 'valid-refresh',
      expiresAt: new Date('2024-12-31T23:59:59Z'),
    },
    disconnected: {
      id: 'disconnected-int-001',
      userId: 'user-001',
      service: 'apple-calendar' as const,
      accountId: 'account-456',
      status: 'disconnected' as const,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
    },
    error: {
      id: 'error-int-001',
      userId: 'user-001',
      service: 'outlook-calendar' as const,
      accountId: 'account-789',
      status: 'error' as const,
      accessToken: 'expired-token',
      refreshToken: 'expired-refresh',
      expiresAt: new Date('2023-01-01T00:00:00Z'),
      error: 'Token expired',
    },
    pending: {
      id: 'pending-int-001',
      userId: 'user-001',
      service: 'todoist' as const,
      accountId: 'account-012',
      status: 'pending' as const,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
    },
  },

  // OAuth configurations
  oauthConfigs: {
    googleCalendar: {
      clientId: 'google-client-id-123',
      clientSecret: 'google-client-secret-456',
      redirectUri: 'https://app.dayflow.com/auth/google/callback',
      scopes: ['calendar', 'calendar.events'],
      authUrl: 'https://accounts.google.com/o/oauth2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
    },
    appleCalendar: {
      clientId: 'apple-client-id-789',
      clientSecret: 'apple-client-secret-012',
      redirectUri: 'https://app.dayflow.com/auth/apple/callback',
      scopes: ['calendar', 'calendar.read'],
      authUrl: 'https://appleid.apple.com/auth/authorize',
      tokenUrl: 'https://appleid.apple.com/auth/token',
    },
    outlookCalendar: {
      clientId: 'outlook-client-id-345',
      clientSecret: 'outlook-client-secret-678',
      redirectUri: 'https://app.dayflow.com/auth/outlook/callback',
      scopes: ['Calendars.ReadWrite', 'User.Read'],
      authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    },
    todoist: {
      clientId: 'todoist-client-id-901',
      clientSecret: null, // Todoist uses simple API key
      redirectUri: 'https://app.dayflow.com/auth/todoist/callback',
      scopes: ['read', 'write'],
      authUrl: 'https://todoist.com/oauth/authorize',
      tokenUrl: 'https://todoist.com/oauth/access_token',
    },
  },

  // Sync scenarios
  syncScenarios: {
    successfulSync: {
      integrationId: 'sync-success-001',
      syncType: 'full' as const,
      status: 'completed' as const,
      startTime: new Date('2024-01-15T10:00:00Z'),
      endTime: new Date('2024-01-15T10:05:00Z'),
      itemsProcessed: 45,
      itemsSynced: 42,
      itemsSkipped: 3,
      itemsFailed: 0,
    },
    partialSync: {
      integrationId: 'sync-partial-001',
      syncType: 'incremental' as const,
      status: 'completed' as const,
      startTime: new Date('2024-01-15T11:00:00Z'),
      endTime: new Date('2024-01-15T11:03:00Z'),
      itemsProcessed: 12,
      itemsSynced: 10,
      itemsSkipped: 1,
      itemsFailed: 1,
    },
    failedSync: {
      integrationId: 'sync-failed-001',
      syncType: 'full' as const,
      status: 'failed' as const,
      startTime: new Date('2024-01-15T12:00:00Z'),
      endTime: new Date('2024-01-15T12:02:00Z'),
      itemsProcessed: 5,
      itemsSynced: 0,
      itemsSkipped: 0,
      itemsFailed: 5,
      error: 'API rate limit exceeded',
    },
  },

  // Conflict scenarios
  conflictScenarios: {
    titleConflict: {
      localEvent: {
        id: 'local-001',
        title: 'Team Meeting',
        startTime: new Date('2024-02-01T10:00:00Z'),
        endTime: new Date('2024-02-01T11:00:00Z'),
      },
      remoteEvent: {
        id: 'remote-001',
        title: 'Updated Team Meeting',
        startTime: new Date('2024-02-01T10:00:00Z'),
        endTime: new Date('2024-02-01T11:00:00Z'),
      },
      resolution: 'server-wins' as const,
    },
    timeConflict: {
      localEvent: {
        id: 'local-002',
        title: 'Presentation',
        startTime: new Date('2024-02-02T14:00:00Z'),
        endTime: new Date('2024-02-02T15:00:00Z'),
      },
      remoteEvent: {
        id: 'remote-002',
        title: 'Presentation',
        startTime: new Date('2024-02-02T14:30:00Z'),
        endTime: new Date('2024-02-02T15:30:00Z'),
      },
      resolution: 'merge-times' as const,
    },
    deletionConflict: {
      localEvent: {
        id: 'local-003',
        title: 'Deleted Event',
        startTime: new Date('2024-02-03T16:00:00Z'),
        endTime: new Date('2024-02-03T17:00:00Z'),
      },
      remoteEvent: {
        id: 'remote-003',
        title: 'Updated Deleted Event',
        startTime: new Date('2024-02-03T16:00:00Z'),
        endTime: new Date('2024-02-03T17:00:00Z'),
      },
      resolution: 'server-wins' as const,
    },
  },

  // Webhook scenarios
  webhookScenarios: {
    calendarEventUpdate: {
      event: 'calendar.event.updated',
      data: {
        integrationId: 'integration-001',
        eventId: 'google-event-123',
        changes: {
          title: 'Updated Meeting Title',
          startTime: new Date('2024-02-01T10:30:00Z'),
          endTime: new Date('2024-02-01T11:30:00Z'),
        },
      },
      timestamp: new Date('2024-01-15T15:30:00Z'),
    },
    calendarEventDelete: {
      event: 'calendar.event.deleted',
      data: {
        integrationId: 'integration-001',
        eventId: 'google-event-456',
        title: 'Deleted Meeting',
      },
      timestamp: new Date('2024-01-15T16:00:00Z'),
    },
    todoistTaskUpdate: {
      event: 'todoist.task.completed',
      data: {
        integrationId: 'integration-004',
        taskId: 'todoist-task-789',
        changes: {
          status: 'completed',
          completedAt: new Date('2024-01-15T17:00:00Z'),
        },
      },
      timestamp: new Date('2024-01-15T17:00:00Z'),
    },
  },

  // Rate limiting scenarios
  rateLimitScenarios: {
    googleCalendar: {
      calls: [
        { endpoint: 'calendar.events.list', calls: 98, limit: 100, window: 'minute' },
        { endpoint: 'calendar.events.insert', calls: 199, limit: 200, window: 'day' },
        { endpoint: 'calendar.events.update', calls: 500, limit: 1000, window: 'day' },
      ],
    },
    outlookCalendar: {
      calls: [
        { endpoint: 'calendar/events', calls: 99, limit: 100, window: 'minute' },
        { endpoint: 'calendar/events', calls: 199, limit: 200, window: 'hour' },
      ],
    },
  },

  // API error responses
  apiErrorResponses: {
    unauthorized: {
      status: 401,
      error: 'unauthorized',
      message: 'Access token is invalid or expired',
    },
    rateLimitExceeded: {
      status: 429,
      error: 'rate_limit_exceeded',
      message: 'API rate limit exceeded',
      retryAfter: 60,
    },
    notFound: {
      status: 404,
      error: 'not_found',
      message: 'Calendar or event not found',
    },
    validationError: {
      status: 400,
      error: 'validation_error',
      message: 'Invalid event data provided',
    },
    serverError: {
      status: 500,
      error: 'server_error',
      message: 'Internal server error',
    },
  },

  // Integration settings
  integrationSettings: {
    googleCalendar: {
      defaults: {
        syncEvents: true,
        syncTasks: false,
        calendarId: 'primary',
        syncInterval: '15min' as const,
        conflictResolution: 'server-wins' as const,
      },
      options: {
        syncInterval: ['5min', '15min', '30min', '1hour', 'manual'],
        conflictResolution: ['client-wins', 'server-wins', 'merge-data'],
      },
    },
    appleCalendar: {
      defaults: {
        syncEvents: true,
        syncTasks: false,
        calendarId: 'work',
        syncInterval: '30min' as const,
        conflictResolution: 'merge-data' as const,
      },
      options: {
        syncInterval: ['15min', '30min', '1hour', '2hour', 'manual'],
        conflictResolution: ['client-wins', 'server-wins', 'merge-data'],
      },
    },
    todoist: {
      defaults: {
        syncEvents: false,
        syncTasks: true,
        projectId: null,
        syncInterval: '1hour' as const,
        conflictResolution: 'client-wins' as const,
      },
      options: {
        syncInterval: ['30min', '1hour', '2hour', '6hour', 'manual'],
        conflictResolution: ['client-wins', 'server-wins'],
      },
    },
  },

  // Helper methods
  createIntegration(overrides: any = {}) {
    return {
      id: `integration-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: 'user-001',
      service: 'google-calendar' as const,
      accountId: `account-${Date.now()}`,
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresAt: new Date('2024-12-31T23:59:59Z'),
      settings: {
        syncEvents: true,
        syncTasks: false,
        calendarId: 'primary',
      },
      status: 'connected' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSync: new Date(),
      error: null,
      ...overrides,
    }
  },

  createBulkIntegrations(count: number, baseData: any = {}) {
    return Array.from({ length: count }, (_, index) => 
      this.createIntegration({
        ...baseData,
        service: ['google-calendar', 'apple-calendar', 'outlook-calendar', 'todoist'][index % 4],
        accountId: `account-${index + 1}`,
      })
    )
  },

  // Mock responses
  mockOAuthResponses: {
    success: {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      token_type: 'Bearer',
      scope: 'calendar.read calendar.write',
    },
    error: {
      error: 'access_denied',
      error_description: 'User denied access',
    },
    expired: {
      error: 'invalid_grant',
      error_description: 'Refresh token expired',
    },
  },

  mockWebhookPayloads: {
    eventCreated: {
      integrationId: 'integration-001',
      eventId: 'external-event-123',
      data: {
        title: 'New Event',
        startTime: new Date('2024-02-01T10:00:00Z'),
        endTime: new Date('2024-02-01T11:00:00Z'),
      },
      timestamp: new Date().toISOString(),
    },
    eventUpdated: {
      integrationId: 'integration-001',
      eventId: 'external-event-123',
      data: {
        title: 'Updated Event',
        startTime: new Date('2024-02-01T10:30:00Z'),
        endTime: new Date('2024-02-01T11:30:00Z'),
      },
      timestamp: new Date().toISOString(),
    },
    eventDeleted: {
      integrationId: 'integration-001',
      eventId: 'external-event-123',
      timestamp: new Date().toISOString(),
    },
  },
}

// Export specific fixtures for easier imports
export const { 
  validIntegrations, 
  integrationStatuses,
  oauthConfigs,
  syncScenarios,
  conflictScenarios,
  mockOAuthResponses 
} = integrationFixtures