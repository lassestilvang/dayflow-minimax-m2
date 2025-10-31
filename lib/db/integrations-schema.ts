import { pgTable, text, timestamp, boolean, uuid, integer, json, varchar, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Integration services configuration
export const integrationServices = pgTable('integration_services', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(), // notion, clickup, linear, todoist, google-calendar, etc.
  displayName: varchar('display_name', { length: 100 }).notNull(),
  type: text('type').notNull(), // 'task_management' | 'calendar'
  provider: text('provider').notNull(), // OAuth provider name
  clientId: text('client_id'),
  clientSecret: text('client_secret'),
  scopes: json('scopes').$type<string[]>().default([]),
  authUrl: text('auth_url'),
  tokenUrl: text('token_url'),
  apiBaseUrl: text('api_base_url'),
  webhookUrl: text('webhook_url'),
  iconUrl: text('icon_url'),
  isEnabled: boolean('is_enabled').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// User's connected integrations
export const userIntegrations = pgTable('user_integrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  serviceId: uuid('service_id').references(() => integrationServices.id, { onDelete: 'cascade' }).notNull(),
  serviceName: varchar('service_name', { length: 50 }).notNull(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  isActive: boolean('is_active').default(true),
  // OAuth credentials
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
  // Service-specific configuration
  configuration: json('configuration').$type<Record<string, any>>().default({}),
  // Webhook configuration
  webhookId: text('webhook_id'),
  webhookSecret: text('webhook_secret'),
  // Sync settings
  syncSettings: json('sync_settings').$type<{
    autoSync: boolean
    syncInterval: number // minutes
    syncDirection: 'one_way' | 'two_way' | 'manual'
    syncTasks: boolean
    syncEvents: boolean
    conflictResolution: 'manual' | 'latest' | 'source' | 'merge'
    fieldMapping: Record<string, string>
  }>().default({
    autoSync: true,
    syncInterval: 15,
    syncDirection: 'two_way',
    syncTasks: true,
    syncEvents: true,
    conflictResolution: 'manual',
    fieldMapping: {},
  }),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
  syncStatus: text('sync_status').default('idle'), // idle, syncing, error, success
  syncError: text('sync_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userServiceIdx: index('user_integrations_user_service_idx').on(table.userId, table.serviceId),
  serviceIdx: index('user_integrations_service_idx').on(table.serviceId),
}))

// Sync operations log
export const syncOperations = pgTable('sync_operations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userIntegrationId: uuid('user_integration_id').references(() => userIntegrations.id, { onDelete: 'cascade' }).notNull(),
  operation: text('operation').notNull(), // 'full_sync', 'incremental_sync', 'manual_sync', 'webhook'
  status: text('status').notNull().default('pending'), // pending, running, completed, failed
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  itemsProcessed: integer('items_processed').default(0),
  itemsCreated: integer('items_created').default(0),
  itemsUpdated: integer('items_updated').default(0),
  itemsDeleted: integer('items_deleted').default(0),
  conflicts: json('conflicts').$type<Array<{
    type: string
    item: any
    source: 'dayflow' | 'external'
    conflict: any
    resolution?: string
  }>>().default([]),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// Sync queue for managing sync operations
export const syncQueue = pgTable('sync_queue', {
  id: uuid('id').defaultRandom().primaryKey(),
  userIntegrationId: uuid('user_integration_id').references(() => userIntegrations.id, { onDelete: 'cascade' }).notNull(),
  operation: text('operation').notNull(), // 'sync_tasks', 'sync_events', 'full_sync'
  payload: json('payload').$type<Record<string, any>>().default({}),
  priority: integer('priority').default(5), // 1-10, lower is higher priority
  status: text('status').default('pending'), // pending, processing, completed, failed, cancelled
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).defaultNow(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  attempts: integer('attempts').default(0),
  maxAttempts: integer('max_attempts').default(3),
  lastError: text('last_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  statusIdx: index('sync_queue_status_idx').on(table.status),
  integrationIdx: index('sync_queue_integration_idx').on(table.userIntegrationId),
}))

// External items tracking (for conflict detection and incremental sync)
export const externalItems = pgTable('external_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  userIntegrationId: uuid('user_integration_id').references(() => userIntegrations.id, { onDelete: 'cascade' }).notNull(),
  externalId: text('external_id').notNull(),
  externalService: varchar('external_service', { length: 50 }).notNull(),
  itemType: text('item_type').notNull(), // 'task' | 'event'
  itemId: uuid('item_id').references(() => tasks.id, { onDelete: 'cascade' }),
  // External service data
  externalData: json('external_data').$type<Record<string, any>>(),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }).defaultNow(),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }),
  isDeleted: boolean('is_deleted').default(false),
  version: integer('version').default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  externalIdx: index('external_items_external_idx').on(table.externalId, table.externalService),
  integrationIdx: index('external_items_integration_idx').on(table.userIntegrationId),
  itemIdx: index('external_items_item_idx').on(table.itemId, table.itemType),
}))

// Integration audit log
export const integrationAuditLog = pgTable('integration_audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  userIntegrationId: uuid('user_integration_id').references(() => userIntegrations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  action: text('action').notNull(), // 'connected', 'disconnected', 'synced', 'failed', 'configured'
  resource: text('resource'), // 'service', 'task', 'event', 'oauth'
  resourceId: text('resource_id'),
  details: json('details').$type<Record<string, any>>(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdx: index('integration_audit_user_idx').on(table.userId),
  integrationIdx: index('integration_audit_integration_idx').on(table.userIntegrationId),
  actionIdx: index('integration_audit_action_idx').on(table.action),
}))

// Import the users table from the main schema
import { users, tasks } from './schema'

// Relations
export const integrationServicesRelations = relations(integrationServices, ({ many }) => ({
  userIntegrations: many(userIntegrations),
}))

export const userIntegrationsRelations = relations(userIntegrations, ({ one, many }) => ({
  user: one(users, {
    fields: [userIntegrations.userId],
    references: [users.id],
  }),
  service: one(integrationServices, {
    fields: [userIntegrations.serviceId],
    references: [integrationServices.id],
  }),
  syncOperations: many(syncOperations),
  syncQueue: many(syncQueue),
  externalItems: many(externalItems),
  auditLog: many(integrationAuditLog),
}))

export const syncOperationsRelations = relations(syncOperations, ({ one }) => ({
  userIntegration: one(userIntegrations, {
    fields: [syncOperations.userIntegrationId],
    references: [userIntegrations.id],
  }),
}))

export const syncQueueRelations = relations(syncQueue, ({ one }) => ({
  userIntegration: one(userIntegrations, {
    fields: [syncQueue.userIntegrationId],
    references: [userIntegrations.id],
  }),
}))

export const externalItemsRelations = relations(externalItems, ({ one }) => ({
  userIntegration: one(userIntegrations, {
    fields: [externalItems.userIntegrationId],
    references: [userIntegrations.id],
  }),
}))

export const integrationAuditLogRelations = relations(integrationAuditLog, ({ one }) => ({
  userIntegration: one(userIntegrations, {
    fields: [integrationAuditLog.userIntegrationId],
    references: [userIntegrations.id],
  }),
  user: one(users, {
    fields: [integrationAuditLog.userId],
    references: [users.id],
  }),
}))

// Types
export type IntegrationService = typeof integrationServices.$inferSelect
export type IntegrationServiceInsert = typeof integrationServices.$inferInsert

export type UserIntegration = typeof userIntegrations.$inferSelect
export type UserIntegrationInsert = typeof userIntegrations.$inferInsert

export type SyncOperation = typeof syncOperations.$inferSelect
export type SyncOperationInsert = typeof syncOperations.$inferInsert

export type SyncQueueItem = typeof syncQueue.$inferSelect
export type SyncQueueItemInsert = typeof syncQueue.$inferInsert

export type ExternalItem = typeof externalItems.$inferSelect
export type ExternalItemInsert = typeof externalItems.$inferInsert

export type IntegrationAuditLog = typeof integrationAuditLog.$inferSelect
export type IntegrationAuditLogInsert = typeof integrationAuditLog.$inferInsert