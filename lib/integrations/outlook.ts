/**
 * Microsoft Outlook Calendar Integration
 * Implements calendar integration with Microsoft Outlook using Graph API
 */

import { BaseIntegrationService, IntegrationConfig, ExternalEvent, EventData, SyncResult, IntegrationError, RateLimitError, ValidationError } from './base'
import { RateLimiter, DataTransformer, ConflictDetector, RetryHandler, WebhookUtils, OAuthUtils } from './utils'
import { CalendarEvent } from '../db/schema'

interface OutlookEvent {
  id: string
  subject: string
  body: {
    contentType: 'Text' | 'HTML'
    content: string
  }
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  location?: {
    displayName: string
    locationEmailAddress?: string
  }
  attendees: Array<{
    emailAddress: {
      address: string
      name?: string
    }
    type: 'required' | 'optional' | 'resource'
    status: {
      response: 'none' | 'accepted' | 'declined' | 'tentativelyAccepted' | 'organizer'
      time?: string
    }
  }>
  recurrence?: {
    pattern: {
      type: 'daily' | 'weekly' | 'absoluteMonthly' | 'relativeMonthly' | 'absoluteYearly' | 'relativeYearly'
      interval: number
      dayOfMonth?: number
      month?: number
      daysOfWeek?: string[]
      firstDayOfWeek?: 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'
      index?: 'first' | 'second' | 'third' | 'fourth' | 'last'
    }
    range: {
      type: 'noEnd' | 'endDate' | 'numbered'
      startDate: string
      endDate?: string
      numberOfOccurrences?: number
      recurrenceTimeZone?: string
    }
  }
  isAllDay: boolean
  showAs: 'free' | 'tentative' | 'busy' | 'oof' | 'workingElsewhere' | 'unknown'
  sensitivity: 'normal' | 'personal' | 'private' | 'confidential'
  importance: 'low' | 'normal' | 'high'
  isOnlineMeeting?: boolean
  onlineMeetingProvider?: 'teamsForBusiness'
  onlineMeeting?: {
    joinUrl: string
  }
  responseStatus: {
    response: 'none' | 'accepted' | 'declined' | 'tentativelyAccepted' | 'organizer'
    time?: string
  }
  organizer: {
    emailAddress: {
      address: string
      name?: string
    }
  }
  webLink: string
  createdDateTime: string
  lastModifiedDateTime: string
}

interface OutlookCalendar {
  id: string
  name: string
  color: 'auto' | 'lightBlue' | 'lightGreen' | 'lightOrange' | 'lightGray' | 'lightYellow' | 'lightPink' | 'lightBrown' | 'lightRed' | 'maxColor'
  isDefault?: boolean
  canEdit?: boolean
  canShare?: boolean
  canViewPrivateItems?: boolean
  owner?: {
    name: string
    address: string
  }
}

interface OutlookUser {
  id: string
  displayName: string
  mail?: string
  userPrincipalName: string
}

interface OutlookOAuthTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope: string
}

export class OutlookCalendarIntegration extends BaseIntegrationService {
  readonly serviceName = 'outlook'
  readonly displayName = 'Microsoft Outlook'
  readonly type = 'calendar'
  readonly scopes = ['Calendars.ReadWrite']
  readonly authUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
  readonly tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
  readonly apiBaseUrl = 'https://graph.microsoft.com/v1.0'

  private calendarId?: string
  private rateLimiter: RateLimiter

  constructor(config: IntegrationConfig = {}) {
    super(config)
    this.rateLimiter = new RateLimiter(100, 1000) // 100 per minute, 1000 per hour
  }

  async initialize(): Promise<void> {
    // Get the calendar ID from configuration, default to calendar
    this.calendarId = this.config?.fieldMapping?.calendarId || 'calendar'
    
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
      await this.makeRequest('GET', '/me')
      return true
    } catch (error) {
      console.error('Outlook connection test failed:', error)
      throw new IntegrationError('Failed to connect to Outlook', 'CONNECTION_FAILED')
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
          client_id: this.clientId || '',
          client_secret: this.clientSecret || ''
        })
      })

      if (!response.ok) {
        throw new IntegrationError('Failed to refresh Outlook token', 'TOKEN_REFRESH_FAILED')
      }

      const data = await response.json()
      this.accessToken = data.access_token
      this.refreshToken = data.refresh_token || this.refreshToken
      this.expiresAt = new Date(Date.now() + (data.expires_in * 1000))
    } catch (error) {
      throw new IntegrationError('Failed to refresh Outlook token', 'TOKEN_REFRESH_FAILED', undefined, error)
    }
  }

  async syncTasks(): Promise<SyncResult> {
    // Outlook integration doesn't sync tasks, only calendar events
    return {
      operationId: `outlook-tasks-${Date.now()}`,
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
    const operationId = `outlook-sync-${Date.now()}`
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

    const outlookEvent: any = {
      subject: event.title,
      start: {
        dateTime: event.startTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: event.endTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      isAllDay: event.isAllDay
    }

    if (event.description) {
      outlookEvent.body = {
        contentType: 'Text',
        content: event.description
      }
    }

    if (event.location) {
      outlookEvent.location = {
        displayName: event.location
      }
    }

    if (event.attendees && event.attendees.length > 0) {
      outlookEvent.attendees = event.attendees.map(attendee => ({
        emailAddress: {
          address: attendee.email,
          name: attendee.name
        },
        type: 'required'
      }))
    }

    if (event.recurrence && event.recurrence.type !== 'none') {
      outlookEvent.recurrence = this.mapRecurrenceToOutlook(event.recurrence)
    }

    const response = await this.makeRequest('POST', `/me/calendar/events`, outlookEvent)
    
    return this.mapOutlookEventToExternal(response)
  }

  async updateEvent(externalId: string, event: EventData): Promise<ExternalEvent> {
    this.validateEventData(event)
    await this.ensureAuthenticated()

    const updateData: any = {
      subject: event.title,
      start: {
        dateTime: event.startTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: event.endTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      isAllDay: event.isAllDay
    }

    if (event.description !== undefined) {
      updateData.body = {
        contentType: 'Text',
        content: event.description || ''
      }
    }

    if (event.location !== undefined) {
      updateData.location = event.location ? {
        displayName: event.location
      } : null
    }

    if (event.attendees !== undefined) {
      updateData.attendees = event.attendees.map(attendee => ({
        emailAddress: {
          address: attendee.email,
          name: attendee.name
        },
        type: 'required'
      }))
    }

    const response = await this.makeRequest('PATCH', `/me/calendar/events/${externalId}`, updateData)
    return this.mapOutlookEventToExternal(response)
  }

  async deleteEvent(externalId: string): Promise<void> {
    await this.ensureAuthenticated()
    await this.makeRequest('DELETE', `/me/calendar/events/${externalId}`)
  }

  async getEvent(externalId: string): Promise<ExternalEvent | null> {
    await this.ensureAuthenticated()

    try {
      const response = await this.makeRequest('GET', `/me/calendar/events/${externalId}`)
      return this.mapOutlookEventToExternal(response)
    } catch (error) {
      if (error instanceof IntegrationError && error.code === 'NOT_FOUND') {
        return null
      }
      throw error
    }
  }

  async handleWebhook(payload: any, signature?: string): Promise<void> {
    // Microsoft Graph subscriptions don't use webhook signatures
    if (payload.changeType && payload.resource) {
      await this.handleCalendarWebhook(payload)
    }
  }

  async registerWebhook(webhookUrl: string): Promise<any> {
    await this.ensureAuthenticated()

    const subscriptionData = {
      changeType: 'created,updated,deleted',
      notificationUrl: webhookUrl,
      resource: '/me/calendar/events',
      expirationDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      clientState: WebhookUtils.generateWebhookSecret()
    }

    const response = await this.makeRequest('POST', '/subscriptions', subscriptionData)
    
    return {
      id: response.id,
      url: webhookUrl,
      events: ['created', 'updated', 'deleted'],
      active: true,
      createdAt: new Date(response.createdDateTime)
    }
  }

  async unregisterWebhook(webhookId: string): Promise<void> {
    await this.ensureAuthenticated()
    await this.makeRequest('DELETE', `/subscriptions/${webhookId}`)
  }

  async disconnect(): Promise<void> {
    this.accessToken = undefined
    this.refreshToken = undefined
    this.expiresAt = undefined
    this.calendarId = undefined
  }

  // Private helper methods

  private async fetchExternalEvents(): Promise<OutlookEvent[]> {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000))

    const response = await this.makeRequest(
      'GET',
      `/me/calendar/events?$filter=lastModifiedDateTime ge ${thirtyDaysAgo.toISOString()}&$orderby=lastModifiedDateTime desc`
    )
    
    return response.value || []
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

  private mapOutlookEventToExternal(outlookEvent: OutlookEvent): ExternalEvent {
    const title = outlookEvent.subject
    const description = outlookEvent.body?.content
    const startTime = new Date(outlookEvent.start.dateTime)
    const endTime = new Date(outlookEvent.end.dateTime)
    const isAllDay = outlookEvent.isAllDay
    const location = outlookEvent.location?.displayName
    const attendees = outlookEvent.attendees?.map(attendee => ({
      email: attendee.emailAddress.address,
      name: attendee.emailAddress.name,
      status: this.mapOutlookResponseStatus(attendee.status.response)
    }))

    return {
      id: outlookEvent.id,
      title,
      description,
      startTime,
      endTime,
      isAllDay,
      location,
      attendees,
      recurrence: this.mapOutlookRecurrence(outlookEvent.recurrence),
      url: outlookEvent.webLink,
      data: {
        ...outlookEvent,
        dayflowId: outlookEvent.id
      }
    }
  }

  private mapOutlookResponseStatus(status: string): 'pending' | 'accepted' | 'declined' {
    const statusMap: Record<string, 'pending' | 'accepted' | 'declined'> = {
      'none': 'pending',
      'accepted': 'accepted',
      'declined': 'declined',
      'tentativelyAccepted': 'pending',
      'organizer': 'accepted'
    }
    return statusMap[status] || 'pending'
  }

  private mapOutlookRecurrence(recurrence?: OutlookEvent['recurrence']): ExternalEvent['recurrence'] {
    if (!recurrence) {
      return { type: 'none' }
    }

    return {
      type: this.mapOutlookRecurrenceType(recurrence.pattern.type),
      interval: recurrence.pattern.interval,
      endDate: recurrence.range.endDate ? new Date(recurrence.range.endDate) : undefined,
      daysOfWeek: recurrence.pattern.daysOfWeek ? 
        recurrence.pattern.daysOfWeek.map(day => this.mapOutlookDayToNumber(day)) : undefined
    }
  }

  private mapOutlookRecurrenceType(type: string): 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' {
    const typeMap: Record<string, 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'> = {
      'daily': 'daily',
      'weekly': 'weekly',
      'absoluteMonthly': 'monthly',
      'relativeMonthly': 'monthly',
      'absoluteYearly': 'yearly',
      'relativeYearly': 'yearly'
    }
    return typeMap[type] || 'none'
  }

  private mapOutlookDayToNumber(day: string): number {
    const dayMap: Record<string, number> = {
      'sunday': 0,
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6
    }
    return dayMap[day.toLowerCase()] || 0
  }

  private mapRecurrenceToOutlook(recurrence: EventData['recurrence']): OutlookEvent['recurrence'] | undefined {
    if (!recurrence || recurrence.type === 'none') {
      return undefined
    }

    return {
      pattern: {
        type: this.mapDayFlowTypeToOutlook(recurrence.type),
        interval: recurrence.interval || 1,
        daysOfWeek: recurrence.daysOfWeek ? 
          recurrence.daysOfWeek.map(day => this.mapNumberToOutlookDay(day)) : undefined
      },
      range: {
        type: recurrence.endDate ? 'endDate' : 'noEnd',
        startDate: new Date().toISOString().split('T')[0],
        endDate: recurrence.endDate?.toISOString().split('T')[0]
      }
    }
  }

  private mapDayFlowTypeToOutlook(type: EventData['recurrence']['type']): OutlookEvent['recurrence']['pattern']['type'] {
    const typeMap: Record<EventData['recurrence']['type'], OutlookEvent['recurrence']['pattern']['type']> = {
      'none': 'daily', // Should not happen
      'daily': 'daily',
      'weekly': 'weekly',
      'monthly': 'absoluteMonthly',
      'yearly': 'absoluteYearly'
    }
    return typeMap[type]
  }

  private mapNumberToOutlookDay(day: number): string {
    const dayMap: Record<number, string> = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday'
    }
    return dayMap[day] || 'sunday'
  }

  private async handleCalendarWebhook(payload: any): Promise<void> {
    // Get the event details
    const eventId = payload.resourceData?.id
    if (eventId) {
      const event = await this.getEvent(eventId)
      
      if (event) {
        // Update or create the corresponding DayFlow event
        // Implementation would map the external event to DayFlow format
        // and update the database
      }
    }
  }
}