import { sql } from 'drizzle-orm'
import { integrationServices, userIntegrations, syncOperations, syncQueue, externalItems, integrationAuditLog } from '../integrations-schema'

/**
 * Integration Framework Migration
 * Creates tables for managing external service integrations
 */
export async function up() {
  // Integration services configuration table
  await sql`CREATE TABLE ${integrationServices} (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name varchar(50) NOT NULL UNIQUE,
    display_name varchar(100) NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    client_id text,
    client_secret text,
    scopes jsonb DEFAULT '[]'::jsonb,
    auth_url text,
    token_url text,
    api_base_url text,
    webhook_url text,
    icon_url text,
    is_enabled boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  )`

  // User integrations table
  await sql`CREATE TABLE ${userIntegrations} (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    service_id uuid REFERENCES integration_services(id) ON DELETE CASCADE NOT NULL,
    service_name varchar(50) NOT NULL,
    display_name varchar(100) NOT NULL,
    is_active boolean DEFAULT true,
    access_token text,
    refresh_token text,
    token_expires_at timestamptz,
    configuration jsonb DEFAULT '{}'::jsonb,
    webhook_id text,
    webhook_secret text,
    sync_settings jsonb DEFAULT '{
      "autoSync": true,
      "syncInterval": 15,
      "syncDirection": "two_way",
      "syncTasks": true,
      "syncEvents": true,
      "conflictResolution": "manual",
      "fieldMapping": {}
    }'::jsonb,
    last_sync_at timestamptz,
    sync_status text DEFAULT 'idle',
    sync_error text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  )`

  // Create indexes
  await sql`CREATE INDEX user_integrations_user_service_idx ON ${userIntegrations}(user_id, service_id)`
  await sql`CREATE INDEX user_integrations_service_idx ON ${userIntegrations}(service_id)`

  // Sync operations log table
  await sql`CREATE TABLE ${syncOperations} (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_integration_id uuid REFERENCES user_integrations(id) ON DELETE CASCADE NOT NULL,
    operation text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    started_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    items_processed integer DEFAULT 0,
    items_created integer DEFAULT 0,
    items_updated integer DEFAULT 0,
    items_deleted integer DEFAULT 0,
    conflicts jsonb DEFAULT '[]'::jsonb,
    error text,
    created_at timestamptz DEFAULT now()
  )`

  // Sync queue table
  await sql`CREATE TABLE ${syncQueue} (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_integration_id uuid REFERENCES user_integrations(id) ON DELETE CASCADE NOT NULL,
    operation text NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb,
    priority integer DEFAULT 5,
    status text DEFAULT 'pending',
    scheduled_at timestamptz DEFAULT now(),
    started_at timestamptz,
    completed_at timestamptz,
    attempts integer DEFAULT 0,
    max_attempts integer DEFAULT 3,
    last_error text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  )`

  // Create indexes for sync queue
  await sql`CREATE INDEX sync_queue_status_idx ON ${syncQueue}(status)`
  await sql`CREATE INDEX sync_queue_integration_idx ON ${syncQueue}(user_integration_id)`

  // External items tracking table
  await sql`CREATE TABLE ${externalItems} (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_integration_id uuid REFERENCES user_integrations(id) ON DELETE CASCADE NOT NULL,
    external_id text NOT NULL,
    external_service varchar(50) NOT NULL,
    item_type text NOT NULL,
    item_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
    external_data jsonb,
    last_sync_at timestamptz DEFAULT now(),
    last_modified_at timestamptz,
    is_deleted boolean DEFAULT false,
    version integer DEFAULT 1,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  )`

  // Create indexes for external items
  await sql`CREATE INDEX external_items_external_idx ON ${externalItems}(external_id, external_service)`
  await sql`CREATE INDEX external_items_integration_idx ON ${externalItems}(user_integration_id)`
  await sql`CREATE INDEX external_items_item_idx ON ${externalItems}(item_id, item_type)`

  // Integration audit log table
  await sql`CREATE TABLE ${integrationAuditLog} (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_integration_id uuid REFERENCES user_integrations(id) ON DELETE CASCADE,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    action text NOT NULL,
    resource text,
    resource_id text,
    details jsonb,
    ip_address text,
    user_agent text,
    created_at timestamptz DEFAULT now()
  )`

  // Create indexes for audit log
  await sql`CREATE INDEX integration_audit_user_idx ON ${integrationAuditLog}(user_id)`
  await sql`CREATE INDEX integration_audit_integration_idx ON ${integrationAuditLog}(user_integration_id)`
  await sql`CREATE INDEX integration_audit_action_idx ON ${integrationAuditLog}(action)`

  // Insert default integration services
  await sql`INSERT INTO ${integrationServices} (name, display_name, type, provider, scopes, auth_url, token_url, api_base_url, icon_url) VALUES
    ('notion', 'Notion', 'task_management', 'notion', '["read", "write"]', 'https://api.notion.com/v1/oauth/authorize', 'https://api.notion.com/v1/oauth/token', 'https://api.notion.com/v1', 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=32&h=32&fit=crop'),
    ('clickup', 'ClickUp', 'task_management', 'clickup', '["read", "write"]', 'https://app.clickup.com/api', 'https://api.clickup.com/api/v2/oauth/token', 'https://api.clickup.com/api/v2', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=32&h=32&fit=crop'),
    ('linear', 'Linear', 'task_management', 'linear', '["read", "write"]', 'https://linear.app/oauth/authorize', 'https://api.linear.app/oauth/token', 'https://api.linear.app/graphql', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=32&h=32&fit=crop'),
    ('todoist', 'Todoist', 'task_management', 'todoist', '["read", "write"]', 'https://todoist.com/oauth2/authorize', 'https://todoist.com/oauth2/access_token', 'https://api.todoist.com/rest/v2', 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=32&h=32&fit=crop'),
    ('google-calendar', 'Google Calendar', 'calendar', 'google', '["https://www.googleapis.com/auth/calendar"]', 'https://accounts.google.com/o/oauth2/v2/auth', 'https://oauth2.googleapis.com/token', 'https://www.googleapis.com/calendar/v3', 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=32&h=32&fit=crop'),
    ('outlook', 'Microsoft Outlook', 'calendar', 'microsoft', '["Calendars.ReadWrite"]', 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize', 'https://login.microsoftonline.com/common/oauth2/v2.0/token', 'https://graph.microsoft.com/v1.0', 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=32&h=32&fit=crop')`

  // Create trigger for updating updated_at timestamp
  await sql`CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql';`

  await sql`CREATE TRIGGER update_integration_services_updated_at
    BEFORE UPDATE ON ${integrationServices}
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column()`

  await sql`CREATE TRIGGER update_user_integrations_updated_at
    BEFORE UPDATE ON ${userIntegrations}
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column()`

  await sql`CREATE TRIGGER update_sync_queue_updated_at
    BEFORE UPDATE ON ${syncQueue}
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column()`

  await sql`CREATE TRIGGER update_external_items_updated_at
    BEFORE UPDATE ON ${externalItems}
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column()`
}

export async function down() {
  // Drop tables in reverse order
  await sql`DROP TABLE IF EXISTS ${integrationAuditLog}`
  await sql`DROP TABLE IF EXISTS ${externalItems}`
  await sql`DROP TABLE IF EXISTS ${syncQueue}`
  await sql`DROP TABLE IF EXISTS ${syncOperations}`
  await sql`DROP TABLE IF EXISTS ${userIntegrations}`
  await sql`DROP TABLE IF EXISTS ${integrationServices}`

  // Drop the trigger function if it exists
  await sql`DROP FUNCTION IF EXISTS update_updated_at_column()`
}