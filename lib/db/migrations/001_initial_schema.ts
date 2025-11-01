// Migration interface for database schema updates
export interface Migration {
  up: (db: any) => Promise<void>
  down: (db: any) => Promise<void>
}

export const up = async (db: any) => {
  // Create users table
  await db.execute(`
    CREATE TABLE users (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      email text UNIQUE NOT NULL,
      name text,
      image text,
      workos_id text UNIQUE,
      timezone text DEFAULT 'UTC',
      preferences jsonb DEFAULT '{}',
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  // Create categories table
  await db.execute(`
    CREATE TABLE categories (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      name text NOT NULL,
      color text NOT NULL DEFAULT '#3b82f6',
      icon text,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  // Create tags table
  await db.execute(`
    CREATE TABLE tags (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      name text NOT NULL,
      color text NOT NULL DEFAULT '#6b7280',
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  // Create tasks table
  await db.execute(`
    CREATE TABLE tasks (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      title text NOT NULL,
      description text,
      status text NOT NULL DEFAULT 'pending',
      priority text NOT NULL DEFAULT 'medium',
      due_date timestamp with time zone,
      completed_at timestamp with time zone,
      start_time timestamp with time zone,
      end_time timestamp with time zone,
      progress integer NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
      estimated_duration integer,
      actual_duration integer,
      recurrence jsonb DEFAULT '{"type": "none"}',
      reminder jsonb DEFAULT '{"enabled": false, "minutesBefore": 15}',
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  // Create calendar_events table
  await db.execute(`
    CREATE TABLE calendar_events (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      title text NOT NULL,
      description text,
      start_time timestamp with time zone NOT NULL,
      end_time timestamp with time zone NOT NULL,
      is_all_day boolean DEFAULT false,
      location text,
      meeting_url text,
      attendees jsonb DEFAULT '[]',
      recurrence jsonb DEFAULT '{"type": "none"}',
      reminder jsonb DEFAULT '{"enabled": false, "minutesBefore": 15}',
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  // Create task_tags junction table
  await db.execute(`
    CREATE TABLE task_tags (
      task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      PRIMARY KEY (task_id, tag_id)
    );
  `);

  // Create event_tags junction table
  await db.execute(`
    CREATE TABLE event_tags (
      event_id uuid NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
      tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      PRIMARY KEY (event_id, tag_id)
    );
  `);

  // Create indexes for better performance
  await db.execute(`CREATE INDEX idx_users_email ON users(email);`);
  await db.execute(`CREATE INDEX idx_users_workos_id ON users(workos_id);`);
  await db.execute(`CREATE INDEX idx_tasks_user_id ON tasks(user_id);`);
  await db.execute(`CREATE INDEX idx_tasks_status ON tasks(status);`);
  await db.execute(`CREATE INDEX idx_tasks_due_date ON tasks(due_date);`);
  await db.execute(`CREATE INDEX idx_tasks_category_id ON tasks(category_id);`);
  await db.execute(`CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);`);
  await db.execute(`CREATE INDEX idx_calendar_events_start_time ON calendar_events(start_time);`);
  await db.execute(`CREATE INDEX idx_calendar_events_end_time ON calendar_events(end_time);`);
  await db.execute(`CREATE INDEX idx_categories_user_id ON categories(user_id);`);
  await db.execute(`CREATE INDEX idx_tags_user_id ON tags(user_id);`);
  await db.execute(`CREATE INDEX idx_task_tags_task_id ON task_tags(task_id);`);
  await db.execute(`CREATE INDEX idx_task_tags_tag_id ON task_tags(tag_id);`);
  await db.execute(`CREATE INDEX idx_event_tags_event_id ON event_tags(event_id);`);
  await db.execute(`CREATE INDEX idx_event_tags_tag_id ON event_tags(tag_id);`);

  // Create full-text search indexes
  await db.execute(`CREATE INDEX idx_tasks_title_search ON tasks USING gin(to_tsvector('english', title));`);
  await db.execute(`CREATE INDEX idx_tasks_description_search ON tasks USING gin(to_tsvector('english', COALESCE(description, '')));`);
  await db.execute(`CREATE INDEX idx_calendar_events_title_search ON calendar_events USING gin(to_tsvector('english', title));`);
  await db.execute(`CREATE INDEX idx_calendar_events_description_search ON calendar_events USING gin(to_tsvector('english', COALESCE(description, '')));`);
}

export const down = async (db: any) => {
  // Drop indexes first
  await db.execute(`DROP INDEX IF EXISTS idx_event_tags_tag_id;`);
  await db.execute(`DROP INDEX IF EXISTS idx_event_tags_event_id;`);
  await db.execute(`DROP INDEX IF EXISTS idx_task_tags_tag_id;`);
  await db.execute(`DROP INDEX IF EXISTS idx_task_tags_task_id;`);
  await db.execute(`DROP INDEX IF EXISTS idx_tags_user_id;`);
  await db.execute(`DROP INDEX IF EXISTS idx_categories_user_id;`);
  await db.execute(`DROP INDEX IF EXISTS idx_calendar_events_end_time;`);
  await db.execute(`DROP INDEX IF EXISTS idx_calendar_events_start_time;`);
  await db.execute(`DROP INDEX IF EXISTS idx_calendar_events_user_id;`);
  await db.execute(`DROP INDEX IF EXISTS idx_tasks_category_id;`);
  await db.execute(`DROP INDEX IF EXISTS idx_tasks_due_date;`);
  await db.execute(`DROP INDEX IF EXISTS idx_tasks_status;`);
  await db.execute(`DROP INDEX IF EXISTS idx_tasks_user_id;`);
  await db.execute(`DROP INDEX IF EXISTS idx_users_workos_id;`);
  await db.execute(`DROP INDEX IF EXISTS idx_users_email;`);

  // Drop full-text search indexes
  await db.execute(`DROP INDEX IF EXISTS idx_calendar_events_description_search;`);
  await db.execute(`DROP INDEX IF EXISTS idx_calendar_events_title_search;`);
  await db.execute(`DROP INDEX IF EXISTS idx_tasks_description_search;`);
  await db.execute(`DROP INDEX IF EXISTS idx_tasks_title_search;`);

  // Drop junction tables
  await db.execute(`DROP TABLE IF EXISTS event_tags;`);
  await db.execute(`DROP TABLE IF EXISTS task_tags;`);

  // Drop main tables
  await db.execute(`DROP TABLE IF EXISTS calendar_events;`);
  await db.execute(`DROP TABLE IF EXISTS tasks;`);
  await db.execute(`DROP TABLE IF EXISTS tags;`);
  await db.execute(`DROP TABLE IF EXISTS categories;`);
  await db.execute(`DROP TABLE IF EXISTS users;`);
}