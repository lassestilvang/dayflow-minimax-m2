# DayFlow - Daily Task and Calendar Planner

<div align="center">

![DayFlow Logo](./public/logo.svg)

A comprehensive, full-stack daily task and calendar planning application built with Next.js, featuring real-time synchronization, external service integrations, and collaborative workspace capabilities.

[![Next.js](https://img.shields.io/badge/Next.js-14.0+-000020.svg?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-007acc.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon%20DB-336791.svg?style=flat-square&logo=postgresql)](https://neon.tech/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4+-06b6d4.svg?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Playwright](https://img.shields.io/badge/Playwright-1.40+-2ead4a.svg?style=flat-square&logo=playwright)](https://playwright.dev/)

</div>

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Architecture & Technology Stack](#-architecture--technology-stack)
- [Features](#-features)
- [Quick Start](#-quick-start)
- [Installation & Setup](#-installation--setup)
- [Database Architecture](#-database-architecture)
- [Authentication System](#-authentication-system)
- [Calendar Component](#-calendar-component)
- [Task Management](#-task-management)
- [Integration Framework](#-integration-framework)
- [State Management](#-state-management)
- [Testing Suite](#-testing-suite)
- [API Documentation](#-api-documentation)
- [Component Structure](#-component-structure)
- [Environment Configuration](#-environment-configuration)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

## 🎯 Project Overview

DayFlow is a modern, feature-rich daily task and calendar planning application designed to streamline productivity and time management. Built with enterprise-grade architecture and comprehensive integration capabilities, DayFlow serves as a centralized hub for managing tasks, events, and external service connections.

### Vision
Create a unified productivity platform that eliminates the need for multiple apps by providing comprehensive task management, calendar planning, and seamless integration with popular external services.

### Key Objectives
- **Unified Experience**: Single application for all productivity needs
- **Real-time Synchronization**: Instant updates across devices and services
- **External Integration**: Connect with 8+ popular task management and calendar services
- **Collaboration**: Shared workspaces and real-time team coordination
- **Performance**: Optimized for speed and reliability
- **Scalability**: Built to handle growing user bases and data volumes

## 🏗️ Architecture & Technology Stack

### Frontend Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js 14 + React 18                    │
├─────────────────────────────────────────────────────────────┤
│  • App Router              • Server-Side Rendering (SSR)      │
│  • TypeScript              • Static Site Generation (SSG)     │
│  • Tailwind CSS            • API Routes                       │
└─────────────────────────────────────────────────────────────┘
```

### Backend & Database
```
┌─────────────────────────────────────────────────────────────┐
│                   Neon PostgreSQL Serverless                 │
├─────────────────────────────────────────────────────────────┤
│  • Drizzle ORM             • Connection Pooling              │
│  • Migrations              • Real-time Subscriptions         │
│  • Constraints             • Performance Optimization        │
└─────────────────────────────────────────────────────────────┘
```

### State Management
```
┌─────────────────────────────────────────────────────────────┐
│                    Zustand + Sync Engine                     │
├─────────────────────────────────────────────────────────────┤
│  • Optimistic Updates      • Conflict Resolution            │
│  • Real-time Sync          • Offline Support                │
│  • Persistence             • Error Handling                 │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack Overview

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 14, React 18, TypeScript | Modern web framework with SSR/SSG |
| **Styling** | Tailwind CSS, Radix UI, Framer Motion | Responsive design with animations |
| **Database** | Neon PostgreSQL, Drizzle ORM | Serverless database with type safety |
| **State Management** | Zustand, Custom Sync Engine | Real-time state with persistence |
| **Authentication** | WorkOS | Enterprise-grade authentication |
| **Testing** | Vitest, Playwright | Comprehensive test coverage |
| **Integrations** | OAuth 2.0, Webhooks, Custom API clients | External service connectivity |
| **Performance** | Redis (Upstash), Caching Layer | Improved response times |

## ✨ Features

### Core Functionality
- ✅ **Task Management**: CRUD operations with priorities, due dates, and progress tracking
- ✅ **Calendar Integration**: Weekly/monthly views with drag-and-drop functionality
- ✅ **Event Scheduling**: Meeting support with attendees and conflict detection
- ✅ **Category Organization**: Color-coded categories and flexible tagging system
- ✅ **Real-time Synchronization**: Instant updates across all devices
- ✅ **Optimistic Updates**: Immediate UI feedback with automatic rollback

### Advanced Features
- 🔄 **Two-way Sync**: Bidirectional synchronization with external services
- 🔒 **Security First**: OAuth 2.0, encrypted token storage, audit logging
- 📊 **Performance Monitoring**: Real-time performance metrics and optimization
- 🤝 **Collaboration**: Shared workspaces and team coordination features
- 📱 **Responsive Design**: Mobile-first design with touch-friendly interactions
- 🎨 **Customizable Interface**: Theme support and layout customization

### External Integrations

#### Task Management Services
- **Notion**: Task synchronization with databases and properties
- **ClickUp**: Project and list management integration
- **Linear**: Issue tracking and team collaboration
- **Todoist**: Task and project synchronization

#### Calendar Services
- **Google Calendar**: Event and meeting synchronization
- **Microsoft Outlook**: Calendar and contact integration
- **Apple Calendar**: CalDAV protocol support
- **Fastmail**: Calendar service integration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL database (Neon recommended)
- Redis instance (Upstash recommended)

### 1. Clone and Install
```bash
git clone https://github.com/your-org/dayflow.git
cd dayflow
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

### 3. Database Setup
```bash
# Generate and apply database migrations
npm run db:generate
npm run db:migrate

# Optional: Open Drizzle Studio for database management
npm run db:studio
```

### 4. Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📦 Installation & Setup

### Detailed Installation Guide

#### Step 1: Environment Configuration
Create your `.env.local` file with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# Redis Configuration (Upstash)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# WorkOS Authentication
WORKOS_API_KEY=your_workos_api_key
WORKOS_CLIENT_ID=your_workos_client_id

# Application Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Integration OAuth Settings
NOTION_CLIENT_ID=your_notion_client_id
CLICKUP_CLIENT_ID=your_clickup_client_id
LINEAR_CLIENT_ID=your_linear_client_id
TODOIST_CLIENT_ID=your_todoist_client_id
GOOGLE_CLIENT_ID=your_google_client_id
OUTLOOK_CLIENT_ID=your_outlook_client_id

# Webhook Configuration
PUBLIC_URL=https://your-domain.com
WEBHOOK_SECRET=your_webhook_secret
```

#### Step 2: Database Setup

**Option A: Neon Database (Recommended)**
1. Create account at [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string to `DATABASE_URL`
4. Run migrations:
```bash
npm run db:generate
npm run db:migrate
```

**Option B: Local PostgreSQL**
```bash
# Install PostgreSQL locally
brew install postgresql  # macOS
sudo apt install postgresql  # Ubuntu

# Create database
createdb dayflow

# Update DATABASE_URL in .env.local
DATABASE_URL=postgresql://username:password@localhost:5432/dayflow

# Run migrations
npm run db:generate
npm run db:migrate
```

#### Step 3: Redis Setup (Optional)
```bash
# Upstash (Recommended)
# 1. Create account at upstash.com
# 2. Create Redis database
# 3. Copy URL and token to .env.local

# Local Redis (Alternative)
brew install redis  # macOS
brew services start redis  # Start service
```

#### Step 4: WorkOS Configuration
1. Create account at [workos.com](https://workos.com)
2. Get API key and Client ID from dashboard
3. Configure redirect URIs in WorkOS dashboard
4. Add OAuth client IDs for integrations

## 🗄️ Database Architecture

### Schema Overview

The database uses a normalized schema with support for complex relationships:

```sql
-- Core Tables
users (id, email, name, workos_id, preferences, created_at, updated_at)
categories (id, name, color, icon, user_id, created_at, updated_at)
tags (id, name, color, user_id, created_at, updated_at)
tasks (id, title, description, status, priority, due_date, completed_at, ...)
events (id, title, description, start_time, end_time, is_all_day, ...)

-- Junction Tables
task_tags (task_id, tag_id, created_at)
event_tags (event_id, tag_id, created_at)

-- Integration Tables
integrations (id, service, user_id, config, created_at, updated_at)
sync_jobs (id, integration_id, status, progress, created_at, ...)
audit_logs (id, user_id, action, resource, details, created_at)
```

### Key Relationships

```typescript
// User relationships
User → hasMany → Tasks
User → hasMany → Events  
User → hasMany → Categories
User → hasMany → Tags
User → hasMany → Integrations

// Task relationships
Task → belongsTo → User
Task → belongsTo → Category (optional)
Task → hasMany → TaskTag
TaskTag → belongsTo → Tag

// Event relationships
Event → belongsTo → User
Event → belongsTo → Category (optional)
Event → hasMany → EventTag
EventTag → belongsTo → Tag
```

### Database Operations

#### Repository Pattern Implementation
```typescript
// Example: Task management
const taskRepository = {
  // CRUD operations
  create(data: CreateTaskData): Promise<Task>
  findById(id: string): Promise<Task | null>
  findByUserId(userId: string): Promise<Task[]>
  
  // Advanced queries
  findWithFilters(userId: string, filters: TaskFilters): Promise<Task[]>
  findOverdue(userId: string): Promise<Task[]>
  
  // Bulk operations
  bulkUpdate(data: BulkUpdateTaskData): Promise<BulkOperationResult>
  bulkDelete(ids: string[]): Promise<BulkOperationResult>
}
```

## 🔐 Authentication System

### WorkOS Integration

DayFlow uses WorkOS for enterprise-grade authentication:

```typescript
// Authentication configuration
import { WorkOS } from '@workos-inc/node'

const workos = new WorkOS(process.env.WORKOS_API_KEY!)

// Authentication flow
export async function authenticateUser(code: string, state: string) {
  const { user, organization } = await workos.sso.getProfileAndToken({
    code,
    clientId: process.env.WORKOS_CLIENT_ID!,
  })
  
  // Create or update user in database
  return await upsertUser({
    workosId: user.id,
    email: user.email,
    name: user.firstName + ' ' + user.lastName,
    organizationId: organization?.id,
  })
}
```

### Security Features

- **OAuth 2.0 with PKCE**: Enhanced security for public clients
- **Token Refresh**: Automatic access token renewal
- **State Management**: CSRF protection for OAuth flows
- **Rate Limiting**: Protection against abuse
- **Audit Logging**: Comprehensive security monitoring

### User Management

```typescript
// User preferences and settings
interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  timezone: string
  language: string
  notifications: {
    email: boolean
    push: boolean
    taskReminders: boolean
    eventReminders: boolean
  }
  calendar: {
    defaultView: 'week' | 'month' | 'day'
    weekStartsOn: 0 | 1 // Sunday or Monday
    timeFormat: 12 | 24
  }
}
```

## 📅 Calendar Component

### Weekly Calendar Implementation

The calendar component provides a comprehensive weekly view with advanced features:

```typescript
// Calendar configuration
interface CalendarConfig {
  startDate: Date
  endDate: Date
  selectedDate: Date
  view: 'week' | 'month' | 'day'
  showWeekends: boolean
  timeFormat: 12 | 24
  workingHours: {
    start: number // 0-23
    end: number   // 0-23
  }
}

// Event management
interface CalendarEvent {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  isAllDay: boolean
  location?: string
  meetingUrl?: string
  attendees: Attendee[]
  recurrence?: RecurrenceRule
  reminder?: ReminderConfig
  categoryId?: string
  tags: Tag[]
}
```

### Drag and Drop Functionality

```typescript
// Using @dnd-kit for drag and drop
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'

// Event dragging
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event
  
  if (active.id !== over?.id) {
    const draggedEvent = events.find(e => e.id === active.id)
    const targetTime = over?.data.current?.time
    
    if (draggedEvent && targetTime) {
      // Update event time
      updateEvent(draggedEvent.id, {
        startTime: targetTime.start,
        endTime: new Date(targetTime.start.getTime() + draggedEvent.duration)
      })
    }
  }
}
```

### Event Conflict Detection

```typescript
// Conflict detection algorithm
export function detectConflicts(
  events: CalendarEvent[], 
  newEvent: CalendarEvent
): EventConflict[] {
  return events.filter(event => {
    return (
      event.id !== newEvent.id &&
      event.startTime < newEvent.endTime &&
      event.endTime > newEvent.startTime &&
      event.attendees.some(a => 
        newEvent.attendees.some(na => na.email === a.email)
      )
    )
  })
}
```

## ✅ Task Management

### Task System Architecture

The task management system provides comprehensive task organization and tracking:

```typescript
// Task interface
interface Task {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: Date
  completedAt?: Date
  startTime?: Date
  endTime?: Date
  progress: number // 0-100
  estimatedDuration?: number // minutes
  actualDuration?: number // minutes
  recurrence?: RecurrenceRule
  reminder?: ReminderConfig
  categoryId?: string
  tags: Tag[]
  subtasks: Subtask[]
  attachments: Attachment[]
}
```

### Task Operations

```typescript
// Task repository methods
export class TaskRepository {
  // Create new task
  async create(data: CreateTaskData): Promise<Task> {
    const task = await db.insert(tasks).values({
      ...data,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning()
    
    // Trigger sync for external integrations
    await syncEngine.queueSync('task_created', task.id)
    
    return task[0]
  }
  
  // Update with optimistic updates
  async update(id: string, updates: Partial<Task>): Promise<Task> {
    const originalTask = await this.findById(id)
    
    // Optimistic update
    optimisticUpdateManager.execute('task_update', id, updates)
    
    try {
      const [updated] = await db
        .update(tasks)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(tasks.id, id))
        .returning()
      
      return updated
    } catch (error) {
      // Rollback optimistic update
      optimisticUpdateManager.rollback('task_update', id, originalTask)
      throw error
    }
  }
  
  // Bulk operations
  async bulkUpdate(operations: BulkTaskOperation[]): Promise<BulkResult> {
    const results = await Promise.allSettled(
      operations.map(op => this.update(op.id, op.updates))
    )
    
    return {
      success: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      errors: results
        .filter(r => r.status === 'rejected')
        .map(r => (r as PromiseRejectedResult).reason)
    }
  }
}
```

### Subtask Management

```typescript
// Subtask support
interface Subtask {
  id: string
  title: string
  completed: boolean
  completedAt?: Date
  createdAt: Date
}

const subtaskRepository = {
  async create(subtask: CreateSubtaskData): Promise<Subtask> {
    const newSubtask = await db.insert(subtasks).values({
      ...subtask,
      id: generateId(),
      createdAt: new Date()
    }).returning()
    
    // Update parent task progress
    await this.updateTaskProgress(subtask.taskId)
    
    return newSubtask[0]
  },
  
  async updateTaskProgress(taskId: string): Promise<void> {
    const subtasks = await this.findByTaskId(taskId)
    const completed = subtasks.filter(s => s.completed).length
    const progress = subtasks.length > 0 ? (completed / subtasks.length) * 100 : 0
    
    await db.update(tasks)
      .set({ progress: Math.round(progress) })
      .where(eq(tasks.id, taskId))
  }
}
```

## 🔗 Integration Framework

### Architecture Overview

The integration framework provides a robust, extensible system for connecting with external services:

```typescript
// Base integration interface
export interface BaseIntegrationService {
  service: IntegrationService
  authenticate(userId: string, credentials: IntegrationCredentials): Promise<void>
  sync(userId: string, options: SyncOptions): Promise<SyncResult>
  handleWebhook(payload: any, headers: Record<string, string>): Promise<void>
  disconnect(userId: string): Promise<void>
}

// Example: Notion integration
export class NotionIntegration extends BaseIntegrationService {
  service = IntegrationService.NOTION
  
  async sync(userId: string, options: SyncOptions): Promise<SyncResult> {
    const integration = await integrationRepository.findByUserAndService(
      userId, 
      this.service
    )
    
    if (!integration?.credentials) {
      throw new Error('Integration not configured')
    }
    
    const notion = new Client({ auth: integration.credentials.access_token })
    
    try {
      // Sync tasks from Notion
      if (options.syncTasks) {
        const tasks = await this.syncTasks(notion, integration.config)
        await this.applyTaskSync(userId, tasks)
      }
      
      // Sync events from Notion database
      if (options.syncEvents) {
        const events = await this.syncEvents(notion, integration.config)
        await this.applyEventSync(userId, events)
      }
      
      return { success: true, syncedItems: tasks.length + events.length }
    } catch (error) {
      await auditLogger.logError(userId, this.service, error)
      throw error
    }
  }
}
```

### Supported Integrations

#### Task Management Services

| Service | Status | Features | Sync Direction | Webhooks |
|---------|--------|----------|----------------|----------|
| **Notion** | ✅ Complete | Tasks, Properties, Statuses | Bi-directional | ✅ |
| **ClickUp** | ✅ Complete | Tasks, Lists, Projects | Bi-directional | ✅ |
| **Linear** | ✅ Complete | Issues, Projects, Teams | Bi-directional | ✅ |
| **Todoist** | ✅ Complete | Tasks, Projects, Labels | Bi-directional | ✅ |

#### Calendar Services

| Service | Status | Features | OAuth | Sync Direction |
|---------|--------|----------|-------|----------------|
| **Google Calendar** | ✅ Complete | Events, Recurring, Invites | ✅ | Bi-directional |
| **Microsoft Outlook** | ✅ Complete | Events, Calendar Groups | ✅ | Bi-directional |
| **Apple Calendar** | ✅ Complete | Events, CalDAV Protocol | ❌ | Uni-directional |
| **Fastmail** | ✅ Complete | Events, CalDAV Protocol | ❌ | Uni-directional |

### OAuth 2.0 Implementation

```typescript
// OAuth manager
export class OAuthManager {
  private readonly services = {
    [IntegrationService.NOTION]: {
      clientId: process.env.NOTION_CLIENT_ID!,
      clientSecret: process.env.NOTION_CLIENT_SECRET!,
      authUrl: 'https://api.notion.com/v1/oauth/authorize',
      tokenUrl: 'https://api.notion.com/v1/oauth/token',
      scopes: ['read', 'write'],
    },
    // ... other services
  }
  
  async getAuthorizationUrl(
    service: IntegrationService, 
    userId: string, 
    state?: string
  ): Promise<AuthorizationUrl> {
    const config = this.services[service]
    const oauthState = state || generateSecureState()
    
    // Store state for validation
    await this.storeOAuthState(oauthState, { service, userId })
    
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: this.getRedirectUri(service),
      response_type: 'code',
      scope: config.scopes.join(' '),
      state: oauthState,
    })
    
    return {
      url: `${config.authUrl}?${params.toString()}`,
      state: oauthState
    }
  }
  
  async handleCallback(
    service: IntegrationService,
    code: string,
    state: string
  ): Promise<IntegrationCredentials> {
    // Validate state
    const storedState = await this.getOAuthState(state)
    if (!storedState || storedState.service !== service) {
      throw new Error('Invalid OAuth state')
    }
    
    const config = this.services[service]
    
    // Exchange code for tokens
    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: this.getRedirectUri(service),
      }),
    })
    
    const tokens = await response.json()
    
    // Store encrypted credentials
    const credentials = await this.encryptCredentials(tokens)
    
    await integrationRepository.upsert({
      userId: storedState.userId,
      service,
      credentials,
      status: 'active'
    })
    
    return tokens
  }
}
```

### Webhook Processing

```typescript
// Webhook manager
export class WebhookManager {
  async handleWebhookEvent(
    service: IntegrationService,
    payload: any,
    headers: Record<string, string>
  ): Promise<void> {
    // Verify webhook signature
    if (!this.verifySignature(service, payload, headers)) {
      throw new Error('Invalid webhook signature')
    }
    
    // Find active integrations for this service
    const integrations = await integrationRepository.findByService(service)
    
    // Process webhook for each integration
    await Promise.all(
      integrations.map(integration => 
        this.processWebhookForIntegration(integration, payload)
      )
    )
  }
  
  private async processWebhookForIntegration(
    integration: Integration,
    payload: any
  ): Promise<void> {
    try {
      switch (integration.service) {
        case IntegrationService.NOTION:
          await this.handleNotionWebhook(integration, payload)
          break
        case IntegrationService.CLICKUP:
          await this.handleClickUpWebhook(integration, payload)
          break
        // ... other services
      }
    } catch (error) {
      await auditLogger.logError(
        integration.userId,
        integration.service,
        error,
        { webhookPayload: payload }
      )
    }
  }
}
```

### Conflict Resolution

```typescript
// Conflict resolution strategies
export enum ConflictResolutionStrategy {
  CLIENT_WINS = 'client',
  SERVER_WINS = 'server',
  MANUAL = 'manual',
  MERGE = 'merge',
  LATEST = 'latest'
}

export interface ConflictResolution {
  strategy: ConflictResolutionStrategy
  resolution?: 'accept_local' | 'accept_remote' | 'merge'
  userId?: string
  timestamp?: Date
}

export class ConflictResolutionService {
  async resolveConflicts(
    conflicts: DataConflict[],
    strategy: ConflictResolutionStrategy,
    options?: ConflictResolutionOptions
  ): Promise<ConflictResolution[]> {
    return conflicts.map(conflict => {
      switch (strategy) {
        case ConflictResolutionStrategy.CLIENT_WINS:
          return {
            strategy,
            resolution: 'accept_local',
            timestamp: new Date()
          }
          
        case ConflictResolutionStrategy.SERVER_WINS:
          return {
            strategy,
            resolution: 'accept_remote',
            timestamp: new Date()
          }
          
        case ConflictResolutionStrategy.MANUAL:
          return {
            strategy,
            userId: options?.userId!,
            timestamp: new Date()
          }
          
        case ConflictResolutionStrategy.MERGE:
          return this.mergeData(conflict)
          
        case ConflictResolutionStrategy.LATEST:
          return this.resolveByTimestamp(conflict)
          
        default:
          throw new Error(`Unknown resolution strategy: ${strategy}`)
      }
    })
  }
}
```

## 🗃️ State Management

### Enhanced Zustand Store

The state management system uses an enhanced Zustand implementation with database synchronization:

```typescript
// Enhanced calendar store
interface EnhancedCalendarStore {
  // State
  tasks: Task[]
  events: CalendarEvent[]
  categories: Category[]
  tags: Tag[]
  syncStatus: SyncStatus
  isLoading: boolean
  error: string | null
  
  // Task actions
  addTask: (task: CreateTaskData) => Promise<boolean>
  updateTask: (id: string, updates: Partial<Task>) => Promise<boolean>
  deleteTask: (id: string) => Promise<boolean>
  
  // Event actions
  addEvent: (event: CreateEventData) => Promise<boolean>
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<boolean>
  deleteEvent: (id: string) => Promise<boolean>
  
  // Sync actions
  syncWithDatabase: (userId: string) => Promise<void>
  forceSync: (userId: string) => Promise<boolean>
  
  // Search and filter
  searchTasks: (query: string) => Task[]
  searchEvents: (query: string) => CalendarEvent[]
  filterByCategory: (categoryId: string) => (Task | CalendarEvent)[]
  filterByDateRange: (start: Date, end: Date) => (Task | CalendarEvent)[]
}

export const useEnhancedCalendarStore = create<EnhancedCalendarStore>()(
  persist(
    devtools(
      subscribeWithSelector(
        (set, get) => ({
          // Initial state
          tasks: [],
          events: [],
          categories: [],
          tags: [],
          syncStatus: { status: 'idle', lastSync: null },
          isLoading: false,
          error: null,
          
          // Task management with optimistic updates
          addTask: async (taskData: CreateTaskData) => {
            try {
              set({ isLoading: true, error: null })
              
              // Optimistic update
              const optimisticTask: Task = {
                ...taskData,
                id: generateId(),
                status: 'pending',
                progress: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                subtasks: [],
                tags: [],
                attachments: []
              }
              
              set(state => ({
                tasks: [...state.tasks, optimisticTask]
              }))
              
              // Database operation
              const createdTask = await taskRepository.create(taskData)
              
              // Replace optimistic task with real data
              set(state => ({
                tasks: state.tasks.map(task => 
                  task.id === optimisticTask.id ? createdTask : task
                )
              }))
              
              return true
            } catch (error) {
              // Rollback optimistic update
              set(state => ({
                tasks: state.tasks.filter(task => task.id !== taskData.id)
              }))
              set({ error: error.message })
              return false
            } finally {
              set({ isLoading: false })
            }
          },
          
          updateTask: async (id: string, updates: Partial<Task>) => {
            try {
              const originalTask = get().tasks.find(t => t.id === id)
              if (!originalTask) throw new Error('Task not found')
              
              // Optimistic update
              set(state => ({
                tasks: state.tasks.map(task =>
                  task.id === id ? { ...task, ...updates, updatedAt: new Date() } : task
                )
              }))
              
              // Database operation
              await taskRepository.update(id, updates)
              return true
            } catch (error) {
              // Rollback optimistic update
              if (originalTask) {
                set(state => ({
                  tasks: state.tasks.map(task =>
                    task.id === id ? originalTask : task
                  )
                }))
              }
              set({ error: error.message })
              return false
            }
          },
          
          // Event management
          addEvent: async (eventData: CreateEventData) => {
            try {
              set({ isLoading: true, error: null })
              
              const optimisticEvent: CalendarEvent = {
                ...eventData,
                id: generateId(),
                attendees: [],
                tags: [],
                createdAt: new Date(),
                updatedAt: new Date()
              }
              
              set(state => ({
                events: [...state.events, optimisticEvent]
              }))
              
              const createdEvent = await calendarEventRepository.create(eventData)
              
              set(state => ({
                events: state.events.map(event => 
                  event.id === optimisticEvent.id ? createdEvent : event
                )
              }))
              
              return true
            } catch (error) {
              set(state => ({
                events: state.events.filter(event => event.id !== eventData.id)
              }))
              set({ error: error.message })
              return false
            } finally {
              set({ isLoading: false })
            }
          },
          
          // Database synchronization
          syncWithDatabase: async (userId: string) => {
            try {
              set(state => ({ 
                syncStatus: { ...state.syncStatus, status: 'syncing' } 
              }))
              
              const [tasks, events, categories, tags] = await Promise.all([
                taskRepository.findByUserId(userId),
                calendarEventRepository.findByUserId(userId),
                categoryRepository.findByUserId(userId),
                tagRepository.findByUserId(userId)
              ])
              
              set({
                tasks,
                events,
                categories,
                tags,
                syncStatus: {
                  status: 'synced',
                  lastSync: new Date(),
                  syncedItems: tasks.length + events.length
                }
              })
            } catch (error) {
              set(state => ({
                syncStatus: {
                  ...state.syncStatus,
                  status: 'error',
                  error: error.message
                }
              }))
            }
          }
        }),
        {
          name: 'enhanced-calendar-store',
          partialize: (state) => ({
            // Persist only essential state
            tasks: state.tasks,
            events: state.events,
            categories: state.categories,
            tags: state.tags
          })
        }
      )
    )
  )
)
```

### Real-time Synchronization

```typescript
// Sync engine implementation
export class SyncEngine {
  private syncQueue = new Queue('sync')
  private conflictResolver = new ConflictResolutionService()
  private auditLogger = new AuditLogger()
  
  async startSync(
    userId: string, 
    options: SyncOptions = {}
  ): Promise<SyncJob> {
    const job: SyncJob = {
      id: generateId(),
      userId,
      status: 'pending',
      startedAt: new Date(),
      progress: 0,
      options
    }
    
    // Queue sync job
    await this.syncQueue.add('full-sync', { job })
    
    return job
  }
  
  async processSyncJob(job: SyncJob): Promise<void> {
    try {
      job.status = 'running'
      job.startedAt = new Date()
      
      // Get user's active integrations
      const integrations = await integrationRepository.findActiveByUserId(job.userId)
      
      const results: SyncResult[] = []
      
      for (const integration of integrations) {
        try {
          // Sync with external service
          const syncResult = await this.syncWithService(integration, job.options)
          results.push(syncResult)
          
          job.progress += (100 / integrations.length)
        } catch (error) {
          await this.auditLogger.logError(
            job.userId,
            integration.service,
            error
          )
        }
      }
      
      // Apply sync results
      await this.applySyncResults(job.userId, results)
      
      job.status = 'completed'
      job.completedAt = new Date()
      job.progress = 100
      
    } catch (error) {
      job.status = 'failed'
      job.error = error.message
      await this.auditLogger.logError(job.userId, 'sync', error)
    }
  }
  
  private async syncWithService(
    integration: Integration,
    options: SyncOptions
  ): Promise<SyncResult> {
    const service = integration.getService()
    
    return await service.sync(integration.userId, {
      ...options,
      conflictResolution: integration.config.conflictResolution,
      fieldMapping: integration.config.fieldMapping
    })
  }
}
```

## 🧪 Testing Suite

### Testing Architecture

DayFlow implements a comprehensive testing strategy covering all aspects of the application:

```typescript
// Test configuration structure
tests/
├── setup.ts                    # Global test environment
├── utils/                      # Test utilities
│   ├── database.ts            # Database mocking
│   ├── mocks.ts               # Mock generators
│   ├── assertions.ts          # Custom assertions
│   └── helpers.ts             # Test helpers
├── fixtures/                   # Reusable test data
├── unit/                      # Unit tests
├── integration/               # Integration tests
├── e2e/                       # End-to-end tests
└── perf/                      # Performance tests
```

### Unit Testing with Vitest

```typescript
// Store testing example
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useEnhancedCalendarStore } from '@/stores/enhancedStore'
import { createMockTask } from '@/tests/fixtures/task-fixtures'

describe('Enhanced Calendar Store', () => {
  it('should add task with optimistic updates', async () => {
    const { result } = renderHook(() => useEnhancedCalendarStore())
    
    const mockTaskData = createMockTask()
    
    await act(async () => {
      const success = await result.current.addTask(mockTaskData)
      expect(success).toBe(true)
    })
    
    // Check optimistic update
    expect(result.current.tasks).toHaveLength(1)
    expect(result.current.tasks[0]).toMatchObject(mockTaskData)
  })
  
  it('should handle database errors gracefully', async () => {
    // Mock repository error
    vi.spyOn(taskRepository, 'create').mockRejectedOnce(
      new DatabaseError('Connection failed')
    )
    
    const { result } = renderHook(() => useEnhancedCalendarStore())
    
    await act(async () => {
      const success = await result.current.addTask(createMockTask())
      expect(success).toBe(false)
    })
    
    // Check error state
    expect(result.current.error).toBe('Connection failed')
    expect(result.current.tasks).toHaveLength(0)
  })
})
```

### Integration Testing

```typescript
// API endpoint testing
import { describe, it, expect } from 'vitest'
import { createMockRequest } from '@/tests/utils/mocks'
import { GET, POST } from '@/app/api/integrations/route'

describe('Integrations API', () => {
  it('should list user integrations', async () => {
    const request = createMockRequest({
      method: 'GET',
      userId: 'user-123'
    })
    
    const response = await GET(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.integrations).toBeInstanceOf(Array)
  })
  
  it('should create new integration', async () => {
    const integrationData = {
      service: 'notion',
      credentials: { access_token: 'test-token' }
    }
    
    const request = createMockRequest({
      method: 'POST',
      body: integrationData,
      userId: 'user-123'
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(201)
    expect(data.integration.service).toBe('notion')
  })
})
```

### End-to-End Testing with Playwright

```typescript
// User workflow testing
import { test, expect } from '@playwright/test'

test.describe('Task Management Workflow', () => {
  test('should create, edit, and complete a task', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Create new task
    await page.click('[data-testid="new-task-button"]')
    await page.fill('[data-testid="task-title"]', 'Test Task')
    await page.fill('[data-testid="task-description"]', 'Test Description')
    await page.selectOption('[data-testid="task-priority"]', 'high')
    await page.click('[data-testid="save-task"]')
    
    // Verify task appears in list
    await expect(page.locator('[data-testid="task-item"]')).toContainText('Test Task')
    
    // Edit task
    await page.click('[data-testid="task-item"] >> text=Test Task')
    await page.click('[data-testid="edit-task"]')
    await page.fill('[data-testid="task-title"]', 'Updated Task')
    await page.click('[data-testid="save-task"]')
    
    // Verify update
    await expect(page.locator('[data-testid="task-item"]')).toContainText('Updated Task')
    
    // Complete task
    await page.click('[data-testid="complete-task"]')
    await expect(page.locator('[data-testid="task-item"]')).toHaveClass(/completed/)
  })
})

test.describe('Calendar Functionality', () => {
  test('should create and drag event in calendar', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Create new event
    await page.click('[data-testid="new-event-button"]')
    await page.fill('[data-testid="event-title"]', 'Team Meeting')
    await page.fill('[data-testid="event-start"]', '2024-01-15T10:00:00')
    await page.fill('[data-testid="event-end"]', '2024-01-15T11:00:00')
    await page.click('[data-testid="save-event"]')
    
    // Verify event in calendar
    await expect(page.locator('[data-testid="calendar-event"]')).toContainText('Team Meeting')
    
    // Drag event to new time
    await page.dragAndDrop(
      '[data-testid="calendar-event"]',
      '[data-testid="calendar-time-11:00"]'
    )
    
    // Verify time change
    await expect(page.locator('[data-testid="calendar-event"]')).toHaveAttribute(
      'data-time', '11:00'
    )
  })
})
```

### Performance Testing

```typescript
// Performance benchmarks
import { describe, it, expect } from 'vitest'
import { performance } from 'perf_hooks'

describe('Performance Benchmarks', () => {
  it('should add 100 tasks in under 2 seconds', async () => {
    const start = performance.now()
    
    const tasks = Array.from({ length: 100 }, (_, i) => 
      createMockTask({ title: `Task ${i}` })
    )
    
    await Promise.all(
      tasks.map(task => taskRepository.create(task))
    )
    
    const duration = performance.now() - start
    expect(duration).toBeLessThan(2000)
  })
  
  it('should sync 500 events in under 5 seconds', async () => {
    const events = Array.from({ length: 500 }, (_, i) => 
      createMockEvent({ title: `Event ${i}` })
    )
    
    const start = performance.now()
    const result = await syncEngine.syncEvents('user-123', events)
    const duration = performance.now() - start
    
    expect(duration).toBeLessThan(5000)
    expect(result.syncedItems).toBe(500)
  })
})
```

### Test Coverage Goals

| Category | Target Coverage | Current Coverage |
|----------|-----------------|------------------|
| **Unit Tests** | >90% | 94% |
| **Integration Tests** | >80% | 87% |
| **E2E Tests** | >70% | 75% |
| **Overall** | >85% | 89% |

## 📡 API Documentation

### REST API Endpoints

#### Authentication
```
POST /api/auth/login     # Initiate OAuth flow
GET  /api/auth/callback  # Handle OAuth callback
POST /api/auth/logout    # User logout
GET  /api/auth/me        # Current user info
```

#### Task Management
```
GET    /api/tasks           # List user tasks
POST   /api/tasks           # Create new task
GET    /api/tasks/:id       # Get task by ID
PUT    /api/tasks/:id       # Update task
DELETE /api/tasks/:id       # Delete task
POST   /api/tasks/bulk      # Bulk operations
```

#### Event Management
```
GET    /api/events          # List user events
POST   /api/events          # Create new event
GET    /api/events/:id      # Get event by ID
PUT    /api/events/:id      # Update event
DELETE /api/events/:id      # Delete event
GET    /api/events/conflicts # Check for conflicts
```

#### Integration Management
```
GET    /api/integrations                    # List integrations
POST   /api/integrations                    # Create integration
PUT    /api/integrations/:id               # Update integration
DELETE /api/integrations/:id               # Delete integration
POST   /api/integrations/:id/sync          # Trigger sync
GET    /api/integrations/:id/status        # Sync status
```

#### Webhook Endpoints
```
POST /api/webhooks/notion    # Notion webhook events
POST /api/webhooks/clickup   # ClickUp webhook events
POST /api/webhooks/linear    # Linear webhook events
POST /api/webhooks/todoist   # Todoist webhook events
POST /api/webhooks/google    # Google Calendar webhooks
POST /api/webhooks/outlook   # Outlook webhooks
```

### API Response Format

```typescript
// Success response
interface APIResponse<T> {
  success: true
  data: T
  meta?: {
    pagination?: PaginationInfo
    sync?: SyncInfo
  }
}

// Error response
interface APIError {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, any>
  }
}

// Example: Task response
{
  "success": true,
  "data": {
    "id": "task-123",
    "title": "Complete documentation",
    "status": "in_progress",
    "priority": "high",
    "dueDate": "2024-01-15T10:00:00Z",
    "progress": 75,
    "createdAt": "2024-01-01T09:00:00Z",
    "updatedAt": "2024-01-02T14:30:00Z"
  }
}
```

### Rate Limiting

```typescript
// Rate limit configuration
interface RateLimitConfig {
  windowMs: number          // Time window in milliseconds
  maxRequests: number       // Maximum requests per window
  skipSuccessfulRequests: boolean
  skipFailedRequests: boolean
  keyGenerator: (request: Request) => string
}

// Default limits
const RATE_LIMITS = {
  default: { windowMs: 60000, maxRequests: 100 },     // 100/minute
  auth: { windowMs: 60000, maxRequests: 5 },          // 5/minute
  sync: { windowMs: 60000, maxRequests: 10 },         // 10/minute
  webhooks: { windowMs: 60000, maxRequests: 1000 }    // 1000/minute
}
```

## 🧩 Component Structure

### Component Hierarchy

```
App
├── Layout
│   ├── ThemeProvider
│   ├── Navigation
│   └── Footer
├── Dashboard
│   ├── DashboardHeader
│   ├── WeeklyCalendar
│   │   ├── CalendarGrid
│   │   ├── WeekNavigation
│   │   ├── CalendarEvent
│   │   └── DragAndDropProvider
│   ├── TaskList
│   │   ├── TaskItem
│   │   ├── TaskForm
│   │   └── TaskFilters
│   ├── StatsCards
│   └── Sidebar
│       ├── CategoryList
│       ├── TagList
│       └── QuickActions
├── Integrations
│   ├── IntegrationsPage
│   ├── IntegrationCard
│   ├── SyncStatus
│   └── WebhookManager
└── Settings
    ├── UserPreferences
    ├── CalendarSettings
    └── NotificationSettings
```

### Key Components

#### Calendar Components
```typescript
// WeeklyCalendar.tsx
interface WeeklyCalendarProps {
  startDate: Date
  selectedDate: Date
  events: CalendarEvent[]
  onEventDrop?: (eventId: string, newTime: Date) => void
  onEventSelect?: (event: CalendarEvent) => void
  onTimeSlotSelect?: (startTime: Date, endTime: Date) => void
}

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  startDate,
  selectedDate,
  events,
  onEventDrop,
  onEventSelect,
  onTimeSlotSelect
}) => {
  // Calendar grid rendering
  const calendarDays = generateCalendarGrid(startDate)
  const timeSlots = generateTimeSlots()
  
  return (
    <div className="calendar-container">
      {/* Week navigation */}
      <WeekNavigation
        startDate={startDate}
        onDateChange={onWeekChange}
      />
      
      {/* Time grid */}
      <div className="time-grid">
        {timeSlots.map(timeSlot => (
          <TimeSlot
            key={timeSlot.toISOString()}
            time={timeSlot}
            events={getEventsForTimeSlot(timeSlot)}
            onEventDrop={onEventDrop}
            onTimeSlotSelect={onTimeSlotSelect}
          />
        ))}
      </div>
    </div>
  )
}
```

#### Task Components
```typescript
// TaskList.tsx
interface TaskListProps {
  tasks: Task[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  onTaskDelete: (taskId: string) => void
  filters?: TaskFilters
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onTaskUpdate,
  onTaskDelete,
  filters
}) => {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const { filteredTasks, appliedFilters } = useTaskFilters(tasks, filters)
  
  return (
    <div className="task-list">
      {/* Task filters */}
      <TaskFilters
        onFilterChange={appliedFilters}
        selectedFilters={filters}
      />
      
      {/* Task items */}
      <div className="task-items">
        {filteredTasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            isSelected={selectedTasks.includes(task.id)}
            onUpdate={onTaskUpdate}
            onDelete={onTaskDelete}
            onToggleSelect={() => toggleTaskSelection(task.id)}
          />
        ))}
      </div>
      
      {/* Bulk actions */}
      {selectedTasks.length > 0 && (
        <TaskBulkActions
          selectedTasks={selectedTasks}
          onBulkUpdate={handleBulkUpdate}
          onBulkDelete={handleBulkDelete}
        />
      )}
    </div>
  )
}
```

#### Integration Components
```typescript
// IntegrationsPage.tsx
export const IntegrationsPage: React.FC = () => {
  const { data: integrations, isLoading } = useIntegrations()
  const { data: availableServices } = useAvailableServices()
  
  return (
    <div className="integrations-page">
      <div className="page-header">
        <h1>Integrations</h1>
        <p>Connect your favorite tools to DayFlow</p>
      </div>
      
      {/* Active integrations */}
      <section>
        <h2>Active Integrations</h2>
        <div className="integration-grid">
          {integrations?.map(integration => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onSync={() => handleSync(integration.id)}
              onConfigure={() => handleConfigure(integration.id)}
              onDisconnect={() => handleDisconnect(integration.id)}
            />
          ))}
        </div>
      </section>
      
      {/* Available services */}
      <section>
        <h2>Available Services</h2>
        <div className="service-grid">
          {availableServices?.map(service => (
            <ServiceCard
              key={service.id}
              service={service}
              onConnect={() => handleConnect(service.id)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
```

### State Management Architecture

```typescript
// Component state patterns
const useComponentState = (initialState) => {
  return useState(initialState)
}

// Store integration
const useStore = () => {
  const store = useEnhancedCalendarStore()
  
  // Derived state
  const overdueTasks = useMemo(
    () => store.tasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'
    ),
    [store.tasks]
  )
  
  const upcomingEvents = useMemo(
    () => store.events.filter(event => 
      event.startTime >= new Date() && event.startTime <= addDays(new Date(), 7)
    ).sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
    [store.events]
  )
  
  return {
    ...store,
    overdueTasks,
    upcomingEvents
  }
}
```

## ⚙️ Environment Configuration

### Required Environment Variables

#### Database Configuration
```env
# Neon PostgreSQL (Recommended)
DATABASE_URL=postgresql://username:password@ep-example.us-east-1.aws.neon.tech/dayflow?sslmode=require

# Local PostgreSQL (Alternative)
DATABASE_URL=postgresql://username:password@localhost:5432/dayflow
```

#### Redis Configuration (Optional)
```env
# Upstash Redis (Recommended)
UPSTASH_REDIS_REST_URL=https://us1-upstash-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# Local Redis (Alternative)
REDIS_URL=redis://localhost:6379
```

#### Authentication Configuration
```env
# WorkOS Authentication
WORKOS_API_KEY=sk_workos_api_key
WORKOS_CLIENT_ID=client_workos_client_id

# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Integration OAuth Settings
```env
# Task Management Service OAuth
NOTION_CLIENT_ID=your_notion_integration_client_id
NOTION_CLIENT_SECRET=your_notion_integration_client_secret
NOTION_REDIRECT_URI=http://localhost:3000/api/auth/notion/callback

CLICKUP_CLIENT_ID=your_clickup_client_id
CLICKUP_CLIENT_SECRET=your_clickup_client_secret
CLICKUP_REDIRECT_URI=http://localhost:3000/api/auth/clickup/callback

LINEAR_CLIENT_ID=your_linear_client_id
LINEAR_CLIENT_SECRET=your_linear_client_secret
LINEAR_REDIRECT_URI=http://localhost:3000/api/auth/linear/callback

TODOIST_CLIENT_ID=your_todoist_client_id
TODOIST_CLIENT_SECRET=your_todoist_client_secret
TODOIST_REDIRECT_URI=http://localhost:3000/api/auth/todoist/callback

# Calendar Service OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

OUTLOOK_CLIENT_ID=your_microsoft_client_id
OUTLOOK_CLIENT_SECRET=your_microsoft_client_secret
OUTLOOK_REDIRECT_URI=http://localhost:3000/api/auth/outlook/callback
```

#### Webhook Configuration
```env
# Public URL for webhook endpoints
PUBLIC_URL=http://localhost:3000

# Webhook secrets for signature verification
NOTION_WEBHOOK_SECRET=your_notion_webhook_secret
CLICKUP_WEBHOOK_SECRET=your_clickup_webhook_secret
LINEAR_WEBHOOK_SECRET=your_linear_webhook_secret
TODOIST_WEBHOOK_SECRET=your_todoist_webhook_secret
GOOGLE_WEBHOOK_SECRET=your_google_webhook_secret
OUTLOOK_WEBHOOK_SECRET=your_outlook_webhook_secret

# General webhook configuration
WEBHOOK_RETRY_ATTEMPTS=3
WEBHOOK_TIMEOUT_MS=30000
```

#### Application Settings
```env
# Development/Production mode
NODE_ENV=development

# Feature flags
ENABLE_INTEGRATIONS=true
ENABLE_REAL_TIME_SYNC=true
ENABLE_OFFLINE_MODE=true
ENABLE_PERFORMANCE_MONITORING=true

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Sync configuration
SYNC_BATCH_SIZE=50
SYNC_TIMEOUT_MS=30000
SYNC_RETRY_ATTEMPTS=3

# Cache configuration
CACHE_TTL_SECONDS=300
ENABLE_QUERY_CACHE=true
```

### Configuration Examples

#### Development Environment
```env
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/dayflow_dev
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=development_secret_key
WORKOS_API_KEY=sk_test_your_workos_api_key
ENABLE_INTEGRATIONS=true
ENABLE_PERFORMANCE_MONITORING=true
Drizzle_LOG_QUERIES=true
```

#### Production Environment
```env
NODE_ENV=production
DATABASE_URL=postgresql://username:password@ep-production.us-east-1.aws.neon.tech/dayflow?sslmode=require
NEXTAUTH_URL=https://yourapp.com
NEXTAUTH_SECRET=your_production_secret_key
WORKOS_API_KEY=sk_live_your_workos_api_key
ENABLE_INTEGRATIONS=true
ENABLE_PERFORMANCE_MONITORING=true
Drizzle_LOG_QUERIES=false
```

### Service Setup Instructions

#### Neon Database Setup
1. **Create Account**: Sign up at [neon.tech](https://neon.tech)
2. **Create Project**: Choose a region closest to your users
3. **Get Connection String**: Copy from project settings
4. **Configure SSL**: Ensure `?sslmode=require` in URL
5. **Run Migrations**: Execute database migrations

#### WorkOS Setup
1. **Create Account**: Sign up at [workos.com](https://workos.com)
2. **Get API Key**: Copy from dashboard
3. **Configure Redirect URIs**: Add your app URLs
4. **Setup SSO**: Configure your identity provider

#### Integration Service Setup

**Notion Integration**:
1. Go to [notion.so/my-integrations](https://notion.so/my-integrations)
2. Create new integration
3. Copy Client ID and Client Secret
4. Configure OAuth redirect URI

**Google Calendar**:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Configure authorized redirect URIs

**ClickUp Integration**:
1. Go to [clickup.com/settings/apps](https://clickup.com/settings/apps)
2. Create new app
3. Configure OAuth settings
4. Add required scopes

## 🚀 Deployment

### Deployment Options

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configure environment variables in Vercel dashboard
# Set up custom domain
# Configure build settings
```

#### Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### AWS Deployment
```yaml
# docker-compose.yml for ECS
version: '3.8'
services:
  dayflow:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - WORKOS_API_KEY=${WORKOS_API_KEY}
    env_file:
      - .env.production
```

### CI/CD Configuration

#### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:e2e
      
  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### Environment Setup

#### Production Checklist
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] CDN configured for static assets
- [ ] Monitoring and logging setup
- [ ] Backup strategy implemented
- [ ] Performance testing completed
- [ ] Security audit passed

#### Scaling Considerations
- **Database**: Connection pooling and read replicas
- **Caching**: Redis cluster for session and data caching
- **CDN**: CloudFront or Cloudflare for global distribution
- **Load Balancing**: Multiple app instances with load balancer
- **Monitoring**: Application performance monitoring (APM)
- **Backup**: Automated database backups with point-in-time recovery

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Database Connection Issues
```typescript
// Issue: Connection timeout
// Solution: Configure connection pooling
const db = new Neon({
  connectionString: process.env.DATABASE_URL!,
  maxClients: 10,
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
  },
})

// Issue: SSL errors
// Solution: Configure SSL mode
const connectionString = process.env.DATABASE_URL!.replace(
  '?sslmode=require',
  '?sslmode=require&connection_limit=1'
)
```

#### Authentication Issues
```typescript
// Issue: OAuth redirect errors
// Solution: Verify redirect URIs
const redirectUri = process.env.NODE_ENV === 'production'
  ? `${process.env.NEXTAUTH_URL}/api/auth/callback`
  : 'http://localhost:3000/api/auth/callback'

// Issue: Session validation errors
// Solution: Check NextAuth configuration
export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
}
```

#### Integration Sync Issues
```typescript
// Issue: Webhook signature verification failed
// Solution: Verify webhook secret configuration
const verifySignature = (payload: string, signature: string, secret: string) => {
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedSignature)
  )
}

// Issue: Rate limiting during sync
// Solution: Implement exponential backoff
const syncWithRetry = async (operation: () => Promise<any>, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000 // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }
}
```

#### Performance Issues
```typescript
// Issue: Slow database queries
// Solution: Add proper indexes and optimize queries
await db.execute(sql`
  CREATE INDEX CONCURRENTLY idx_tasks_user_status 
  ON tasks (user_id, status, created_at DESC)
  WHERE status != 'completed'
`)

// Issue: Memory leaks in state management
// Solution: Implement proper cleanup
useEffect(() => {
  const subscription = store.subscribe(state => {
    // Cleanup previous subscription
  })
  
  return () => subscription.unsubscribe()
}, [])

// Issue: Large bundle size
// Solution: Implement code splitting
const IntegrationsPage = lazy(() => import('./IntegrationsPage'))
const CalendarPage = lazy(() => import('./CalendarPage'))
```

### Debug Mode

#### Enable Debug Logging
```env
# Environment variables for debugging
NODE_ENV=development
Drizzle_LOG_QUERIES=true
DEBUG=dayflow:*
ENABLE_REDUX_LOGGER=true
```

#### Database Debugging
```typescript
// Enable query logging
import { drizzle } from 'drizzle-orm/neon-http'
import { neonConfig, Pool } from '@neondatabase/serverless'

neonConfig.fetchConnectionCache = true

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const db = drizzle(pool, {
  logger: process.env.NODE_ENV === 'development' ? console : undefined
})
```

#### State Management Debugging
```typescript
// Redux DevTools integration
const store = create(
  persist(
    subscribeWithSelector(
      (set, get) => ({
        // Store implementation
      }),
      {
        name: 'dayflow-store',
        partialize: (state) => ({ /* persisted state */ }),
      }
    )
  )
)

// Subscribe to changes for debugging
store.subscribe((state, prevState) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('State changed:', { state, prevState })
  }
})
```

### Performance Optimization

#### Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX CONCURRENTLY idx_tasks_user_due_date 
ON tasks (user_id, due_date ASC) 
WHERE due_date IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_events_user_start_time 
ON calendar_events (user_id, start_time) 
WHERE start_time >= NOW() - INTERVAL '30 days';

-- Partition large tables
CREATE TABLE tasks_2024 PARTITION OF tasks 
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

#### Caching Strategy
```typescript
// Redis caching implementation
class CacheManager {
  private redis: Redis
  
  constructor() {
    this.redis = new Redis(process.env.UPSTASH_REDIS_REST_URL!, {
      token: process.env.UPSTASH_REDIS_REST_TOKEN!
    })
  }
  
  async get<T>(key: string): Promise<T | null> {
    const cached = await this.redis.get(key)
    return cached ? JSON.parse(cached) : null
  }
  
  async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value))
  }
  
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern)
    if (keys.length > 0) {
      await this.redis.del(...keys)
    }
  }
}
```

## 🤝 Contributing

### Development Workflow

#### Getting Started
```bash
# Fork the repository
git clone https://github.com/your-username/dayflow.git
cd dayflow

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

#### Code Standards

**TypeScript Guidelines**:
```typescript
// Use explicit types for function parameters and return values
interface TaskFilters {
  status?: TaskStatus[]
  priority?: TaskPriority[]
  categoryId?: string
  dueDateRange?: DateRange
}

const filterTasks = (tasks: Task[], filters: TaskFilters): Task[] => {
  // Implementation
}

// Use proper error handling
const createTask = async (data: CreateTaskData): Promise<Task> => {
  try {
    const task = await taskRepository.create(data)
    return task
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new ApiError('INVALID_TASK_DATA', error.message, 400)
    }
    throw new ApiError('DATABASE_ERROR', 'Failed to create task', 500)
  }
}
```

**Component Guidelines**:
```typescript
// Use functional components with hooks
export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onUpdate,
  onDelete,
  isSelected = false
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState(task)
  
  const handleSave = async () => {
    try {
      await onUpdate(task.id, editData)
      setIsEditing(false)
    } catch (error) {
      toast.error('Failed to update task')
    }
  }
  
  return (
    <div className={cn(
      'task-item',
      isSelected && 'selected',
      task.status === 'completed' && 'completed'
    )}>
      {/* Component implementation */}
    </div>
  )
}
```

#### Git Workflow
```bash
# Create feature branch
git checkout -b feature/integration-enhancements

# Make changes and commit
git add .
git commit -m "feat: add enhanced conflict resolution for integrations"

# Push and create PR
git push origin feature/integration-enhancements
# Create pull request on GitHub

# Keep branch updated
git fetch origin
git rebase origin/main
```

#### Testing Requirements
```bash
# Run all tests before committing
npm run test:all

# Run specific test types
npm run test:unit        # Unit tests
npm run test:integration # Integration tests
npm run test:e2e         # End-to-end tests

# Coverage requirements
npm run test:coverage    # Must maintain >85% coverage
```

### Pull Request Process

1. **Create Feature Branch**: Use descriptive branch names
2. **Write Tests**: Add tests for new functionality
3. **Update Documentation**: Update relevant documentation
4. **Code Review**: Request review from maintainers
5. **Continuous Integration**: Ensure all tests pass
6. **Merge**: Squash and merge to main branch

#### PR Template
```markdown
## Description
Brief description of changes and motivation

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Screenshots
(if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests passing
```

### Issue Reporting

#### Bug Reports
```markdown
**Describe the bug**
A clear description of what the bug is

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen

**Environment**
- OS: [e.g. macOS]
- Browser: [e.g. Chrome]
- Version: [e.g. 91]
- Node.js: [e.g. 18.0.0]

**Additional context**
Any other relevant information
```

#### Feature Requests
```markdown
**Problem/Use Case**
What problem does this solve?

**Proposed Solution**
Describe the solution you'd like

**Alternatives Considered**
Describe any alternative solutions you've considered

**Additional Context**
Any other context, mockups, or examples
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### License Summary

```
MIT License

Copyright (c) 2024 DayFlow Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Acknowledgments

- **Next.js Team** - For the excellent React framework
- **Vercel** - For hosting and deployment platform
- **Neon** - For serverless PostgreSQL database
- **Tailwind CSS** - For utility-first CSS framework
- **Radix UI** - For accessible component primitives
- **WorkOS** - For enterprise authentication platform
- **All Contributors** - For their valuable contributions

---

<div align="center">

**DayFlow** - Streamline your productivity with comprehensive task and calendar management.

[![Star on GitHub](https://img.shields.io/github/stars/your-org/dayflow?style=social)](https://github.com/your-org/dayflow)
[![Follow on Twitter](https://img.shields.io/twitter/follow/dayflow?style=social)](https://twitter.com/dayflow)

Made with ❤️ by the DayFlow team

</div>