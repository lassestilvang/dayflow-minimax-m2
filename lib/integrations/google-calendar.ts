/**
 * Google Calendar API Integration
 * Implements calendar integration with Google Calendar service
 */

import { BaseIntegrationService, IntegrationConfig, ExternalEvent, EventData, SyncResult, IntegrationError, RateLimitError, ValidationError } from './base'
import { RateLimiter, DataTransformer, ConflictDetector, RetryHandler, WebhookUtils, OAuthUtils } from './utils'
import { CalendarEvent } from '../db/schema'

interface GoogleCalendarEvent {
  id: string
  summary: string
  description?: string
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  location?: string
  attendees?: Array<{
    email: string
    displayName?: string
    responseStatus: 'needsAction' | 'declined' | 'tentative' | 'accepted'
    organizer?: boolean
  }>
  recurrence?: string[]
  status: 'confirmed' | 'tentative' | 'cancelled'
  transparency: 'opaque' | 'transparent'
  visibility: 'default' | 'public' | 'private' | 'confidential'
  created: string
  updated: string
  htmlLink: string
  organizer?: {
    email: string
    displayName?: string
  }
  reminders?: {
    useDefault: boolean
    overrides?: Array<{
      method: 'email' | 'popup'
      minutes: number
    }>
  }
  extendedProperties?: {
    private?: Record<string, string>
    shared?: Record<string, string>
  }
}

interface GoogleCalendar {
  id: string
  summary: string
  description?: string
  location?: string
  timeZone?: string
  colorId?: string
  backgroundColor?: string
  foregroundColor?: string
  selected?: boolean
  accessRole: 'freeBusyReader' | 'reader' | 'writer' | 'owner'
  defaultReminders?: Array<{
    method: 'email' | 'popup'
    minutes: number
  }>
  notificationSettings?: {
    notifications: Array<{
      type: 'eventCreation' | 'eventChange' | 'eventCancellation' | 'eventResponse'
      method: 'email' | 'popup'
    }>
  }
}

interface GoogleUser {
  id: string
  email: string
  name: string
  picture?: string
}

interface GoogleOAuthTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope: string
}

export class GoogleCalendarIntegration extends BaseIntegrationService {
  readonly serviceName = 'google-calendar'
  readonly displayName = 'Google Calendar'
  readonly type = 'calendar'
  readonly scopes = ['https://www.googleapis.com/auth/calendar']
  readonly authUrl = 'https://accounts.google.com/o/oauth2/v2/auth'
  readonly tokenUrl = 'https://oauth2.googleapis.com/token'
  readonly apiBaseUrl = 'https://www.googleapis.com/calendar/v3'

  private calendarId?: string
  private rateLimiter: RateLimiter

  constructor(config: IntegrationConfig = {}) {
    super(config)
    this.rateLimiter = new RateLimiter(1000, 10000) // High quota for Google APIs
  }

  async initialize(): Promise<void> {
    // Get the calendar ID from configuration, default to primary
    this.calendarId = this.config?.fieldMapping?.calendarId || 'primary'
    
    // Test the connection
    await this.testConnection()
  }

  async authenticate(accessToken: string, refreshToken?: string, expiresAt?: Date): Promise<void> {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
    this.expiresAt = expiresAt
    await this.initialize()
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('GET', '/users/me/calendarList')
      return true
    } catch (error) {
      console.error('Google Calendar connection test failed:', error)
      throw new IntegrationError('Failed to connect to Google Calendar', 'CONNECTION_FAILED')
    }
  }

  async refreshToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new ValidationError('No refresh token available', 'refreshToken')
    }

    try {
      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken!,
          client_id: this.clientId || ''
        })
      })

      if (!response.ok) {
        throw new IntegrationError('Failed to refresh Google Calendar token', 'TOKEN_REFRESH_FAILED')
      }

      const data = await response.json()
      this.accessToken = data.access_token
      this.refreshToken = data.refresh_token || this.refreshToken
      this.expiresAt = new Date(Date.now() + (data.expires_in * 1000))
    } catch (error) {
      throw new IntegrationError('Failed to refresh Google Calendar token', 'TOKEN_REFRESH_FAILED', undefined, error)
    }
  }

  async syncTasks(): Promise<SyncResult> {
    // Google Calendar integration doesn't sync tasks, only events
    return {
      operationId: `google-calendar-tasks-${Date.now()}`,
      status: 'success',
      itemsProcessed: 0,
      itemsCreated: 0,
      itemsUpdated: 0,
      itemsDeleted: 0,
      conflicts: [],
      errors: [],
      startedAt: new Date(),
      completedAt: new Date()
    }
  }

  async syncEvents(): Promise<SyncResult> {
    const operationId = `google-calendar-sync-${Date.now()}`
    const startTime = new Date()

    try {
      await this.ensureAuthenticated()
      
      // Get events from external service
      const externalEvents = await this.fetchExternalEvents()
      
      const result: SyncResult = {
        operationId,
        status: 'success',
        itemsProcessed: externalEvents.length,
        itemsCreated: 0,
        itemsUpdated: 0,
        itemsDeleted: 0,
        conflicts: [],
        errors: [],
        startedAt: startTime,
        completedAt: new Date()
      }

      return result
    } catch (error) {
      return {
        operationId,
        status: 'error',
        itemsProcessed: 0,
        itemsCreated: 0,
        itemsUpdated: 0,
        itemsDeleted: 0,
        conflicts: [],
        errors: [{
          type: 'api_error',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        }],
        startedAt: startTime,
        completedAt: new Date()
      }
    }
  }

  async fullSync(): Promise<SyncResult> {
    return this.syncEvents()
  }

  async createTask(task: EventData): Promise<ExternalEvent> {
    // Create calendar event for task
    return this.createEvent(task)
  }

  async updateTask(externalId: string, task: EventData): Promise<ExternalEvent> {
    return this.updateEvent(externalId, task)
  }

  async deleteTask(externalId: string): Promise<void> {
    await this.deleteEvent(externalId)
  }

  async getTask(externalId: string): Promise<ExternalEvent | null> {
    return this.getEvent(externalId)
  }

  async createEvent(event: EventData): Promise<ExternalEvent> {
    this.validateEventData(event)
    await this.ensureAuthenticated()

    const googleEvent: any = {
      summary: event.title,
      start: {
        dateTime: event.startTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: event.endTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }
    }

    if (event.description) {
      googleEvent.description = event.description
    }

    if (event.location) {
      googleEvent.location = event.location
    }

    if (event.isAllDay) {
      const dateFormat = event.startTime.toISOString().split('T')[0]
      const endDate = event.endTime.toISOString().split('T')[0]
      googleEvent.start = { date: dateFormat }
      googleEvent.end = { date: endDate }
      delete googleEvent.start.timeZone
      delete googleEvent.end.timeZone
    }

    if (event.attendees && event.attendees.length > 0) {
      googleEvent.attendees = event.attendees.map(attendee => ({
        email: attendee.email,
        displayName: attendee.name,
        responseStatus: 'needsAction'
      }))
    }

    if (event.recurrence && event.recurrence.type !== 'none') {
      const rrule = this.mapRecurrenceToGoogle(event.recurrence)
      if (rrule) {
        googleEvent.recurrence = [rrule]
      }
    }

    if (event.recurrence?.endDate) {
      const until = event.recurrence.endDate.toISOString().split('T')[0].replace(/-/g, '')
      googleEvent.recurrence = googleEvent.recurrence || []
      googleEvent.recurrence.push(`UNTIL=${until}`)
    }

    if (event.data?.extendedProperties) {
      googleEvent.extendedProperties = {
        private: event.data.extendedProperties
      }
    }

    const response = await this.makeRequest('POST', `/calendars/${this.calendarId}/events`, googleEvent)
    
    return this.mapGoogleEventToExternal(response)
  }

  async updateEvent(externalId: string, event: EventData): Promise<ExternalEvent> {
    this.validateEventData(event)
    await this.ensureAuthenticated()

    const updateData: any = {
      summary: event.title,
      start: {
        dateTime: event.startTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: event.endTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }
    }

    if (event.description !== undefined) {
      updateData.description = event.description
    }

    if (event.location !== undefined) {
      updateData.location = event.location
    }

    if (event.isAllDay !== undefined) {
      if (event.isAllDay) {
        const dateFormat = event.startTime.toISOString().split('T')[0]
        const endDate = event.endTime.toISOString().split('T')[0]
        updateData.start = { date: dateFormat }
        updateData.end = { date: endDate }
        delete updateData.start.timeZone
        delete updateData.end.timeZone
      } else {
        updateData.start = {
          dateTime: event.startTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }
        updateData.end = {
          dateTime: event.endTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }
      }
    }

    if (event.attendees !== undefined) {
      updateData.attendees = event.attendees.map(attendee => ({
        email: attendee.email,
        displayName: attendee.name,
        responseStatus: 'needsAction'
      }))
    }

    const response = await this.makeRequest('PUT', `/calendars/${this.calendarId}/events/${externalId}`, updateData)
    return this.mapGoogleEventToExternal(response)
  }

  async deleteEvent(externalId: string): Promise<void> {
    await this.ensureAuthenticated()
    await this.makeRequest('DELETE', `/calendars/${this.calendarId}/events/${externalId}`)
  }

  async getEvent(externalId: string): Promise<ExternalEvent | null> {
    await this.ensureAuthenticated()

    try {
      const response = await this.makeRequest('GET', `/calendars/${this.calendarId}/events/${externalId}`)
      return this.mapGoogleEventToExternal(response)
    } catch (error) {
      if (error instanceof IntegrationError && error.code === 'NOT_FOUND') {
        return null
      }
      throw error
    }
  }

  async handleWebhook(payload: any, signature?: string): Promise<void> {
    // Google Calendar webhooks don't require signature verification
    // The watch channel provides notifications of changes
    if (payload.resourceState === 'exists' || payload.resourceState === 'not_exists') {
      await this.handleCalendarWebhook(payload)
    }
  }

  async registerWebhook(webhookUrl: string): Promise<any> {
    await this.ensureAuthenticated()

    const channelData = {
      id: WebhookUtils.generateWebhookId(),
      type: 'web_hook',
      address: webhookUrl,
      params: {
        ttl: '86400' // 24 hours
      }
    }

    const response = await this.makeRequest('POST', `/calendars/${this.calendarId}/events/watch`, channelData)
    
    return {
      id: response.id,
      url: webhookUrl,
      events: ['events'],
      active: true,
      createdAt: new Date()
    }
  }

  async unregisterWebhook(webhookId: string): Promise<void> {
    await this.ensureAuthenticated()
    await this.makeRequest('POST', `/channels/stop`, {
      id: webhookId
    })
  }

  async disconnect(): Promise<void> {
    this.accessToken = undefined
    this.refreshToken = undefined
    this.expiresAt = undefined
    this.calendarId = undefined
  }

  // Private helper methods

  private async fetchExternalEvents(): Promise<GoogleCalendarEvent[]> {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000))

    const response = await this.makeRequest(
      'GET',
      `/calendars/${this.calendarId}/events?timeMin=${thirtyDaysAgo.toISOString()}&timeMax=${thirtyDaysFromNow.toISOString()}&singleEvents=true&orderBy=startTime`
    )
    
    return response.items || []
  }

  private async makeRequest(
    method: string,
    path: string,
    data?: any
  ): Promise<any> {
    await this.rateLimiter.acquire()

    return RetryHandler.withRetry(async () => {
      const url = `${this.apiBaseUrl}${path}`
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }

      const options: RequestInit = {
        method,
        headers,
        ...(data && { body: JSON.stringify(data) })
      }

      const response = await fetch(url, options)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '1')
          throw new RateLimitError('Rate limit exceeded', retryAfter)
        }

        if (response.status === 401) {
          throw new IntegrationError('Authentication failed', 'AUTHENTICATION_FAILED', 401)
        }

        if (response.status === 404) {
          throw new IntegrationError('Resource not found', 'NOT_FOUND', 404)
        }

        throw new IntegrationError(
          errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
          'API_ERROR',
          response.status,
          errorData
        )
      }

      return response.json()
    }, 3)
  }

  private mapGoogleEventToExternal(googleEvent: GoogleCalendarEvent): ExternalEvent {
    const title = googleEvent.summary
    const description = googleEvent.description
    const startTime = googleEvent.start.dateTime ? new Date(googleEvent.start.dateTime) : new Date(googleEvent.start.date!)
    const endTime = googleEvent.end.dateTime ? new Date(googleEvent.end.dateTime) : new Date(googleEvent.end.date!)
    const isAllDay = !googleEvent.start.dateTime
    const location = googleEvent.location
    const attendees = googleEvent.attendees?.map(attendee => ({
      email: attendee.email,
      name: attendee.displayName,
      status: this.mapGoogleResponseStatus(attendee.responseStatus)
    }))

    return {
      id: googleEvent.id,
      title,
      description,
      startTime,
      endTime,
      isAllDay,
      location,
      attendees,
      recurrence: this.mapGoogleRecurrence(googleEvent.recurrence),
      url: googleEvent.htmlLink,
      data: {
        ...googleEvent,
        dayflowId: googleEvent.id
      }
    }
  }

  private mapGoogleResponseStatus(status: string): 'pending' | 'accepted' | 'declined' {
    const statusMap: Record<string, 'pending' | 'accepted' | 'declined'> = {
      'needsAction': 'pending',
      'accepted': 'accepted',
      'declined': 'declined',
      'tentative': 'pending'
    }
    return statusMap[status] || 'pending'
  }

  private mapGoogleRecurrence(recurrence?: string[]): ExternalEvent['recurrence'] {
    if (!recurrence || recurrence.length === 0) {
      return { type: 'none' }
    }

    const rrule = recurrence.find(rule => rule.startsWith('RRULE:'))
    if (!rrule) {
      return { type: 'none' }
    }

    const match = rrule.match(/RRULE:([^;]+)/)
    if (!match) {
      return { type: 'none' }
    }

    const rule = match[1]
    const parts = rule.split(';')

    let type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' = 'none'
    let interval = 1

    for (const part of parts) {
      const [key, value] = part.split('=')
      
      switch (key) {
        case 'FREQ':
          if (value === 'DAILY') type = 'daily'
          else if (value === 'WEEKLY') type = 'weekly'
          else if (value === 'MONTHLY') type = 'monthly'
          else if (value === 'YEARLY') type = 'yearly'
          break
        case 'INTERVAL':
          interval = parseInt(value) || 1
          break
      }
    }

    return {
      type,
      interval
    }
  }

  private mapRecurrenceToGoogle(recurrence: EventData['recurrence']): string | null {
    if (!recurrence || recurrence.type === 'none') {
      return null
    }

    const freqMap = {
      'daily': 'DAILY',
      'weekly': 'WEEKLY', 
      'monthly': 'MONTHLY',
      'yearly': 'YEARLY'
    }

    const parts = [`RRULE:FREQ=${freqMap[recurrence.type]}`]
    
    if (recurrence.interval && recurrence.interval > 1) {
      parts.push(`INTERVAL=${recurrence.interval}`)
    }

    if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
      const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
      const byDay = recurrence.daysOfWeek.map(day => dayMap[day]).join(',')
      parts.push(`BYDAY=${byDay}`)
    }

    return parts.join(';')
  }

  private async handleCalendarWebhook(payload: any): Promise<void> {
    // Get the event details
    const eventId = payload.id
    const event = await this.getEvent(eventId)
    
    if (event) {
      // Update or create the corresponding DayFlow event
      // Implementation would map the external event to DayFlow format
      // and update the database
    }
  }
}