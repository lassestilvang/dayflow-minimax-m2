/**
 * Fastmail Calendar Integration
 * Implements calendar integration with Fastmail using CalDAV protocol
 */

import { BaseIntegrationService, IntegrationConfig, ExternalEvent, EventData, SyncResult, IntegrationError, RateLimitError, ValidationError } from './base'
import { RateLimiter, DataTransformer, ConflictDetector, RetryHandler, WebhookUtils, OAuthUtils } from './utils'
import { CalendarEvent } from '../db/schema'

interface FastmailCalDAVEvent {
  uid: string
  etag: string
  lastModified: string
  calendarData: string
  title: string
  description?: string
  location?: string
  url?: string
  startDate: Date
  endDate: Date
  allDay: boolean
  attendees: Array<{
    cua: string
    name?: string
    email?: string
    status: 'needs-action' | 'accepted' | 'declined' | 'tentative' | 'delegated'
    role: 'chair' | 'req-participant' | 'opt-participant' | 'non-participant'
    rsvp: boolean
  }>
  organizer?: {
    name?: string
    email?: string
  }
  status: 'confirmed' | 'tentative' | 'cancelled'
  transparency: 'opaque' | 'transparent'
  recurrence?: {
    type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval: number
    endDate?: Date
    count?: number
    daysOfWeek?: number[]
    byMonth?: number[]
    byMonthDay?: number[]
  }
  alarm?: {
    trigger: {
      value: 'absolute' | 'relative'
      date?: Date
      duration?: number
    }
    action: 'display' | 'audio' | 'email'
  }
}

interface FastmailCalDAVCalendar {
  href: string
  displayName: string
  description?: string
  timezone?: string
  color?: string
  supportedComponents?: string[]
  resourcetype: string[]
  etag?: string
  ctag?: string
  isPersonal?: boolean
  isWritable?: boolean
  isDefault?: boolean
}

interface FastmailPrincipal {
  displayName?: string
  calendarHomeSet?: string
  emailAddress?: string
  alternateCalendars?: string[]
  calendarUserAddressSet?: string[]
}

export class FastmailCalendarIntegration extends BaseIntegrationService {
  readonly serviceName = 'fastmail'
  readonly displayName = 'Fastmail Calendar'
  readonly type = 'calendar'
  readonly scopes = ['calendar']
  readonly authUrl = '' // CalDAV doesn't use OAuth, uses basic auth
  readonly tokenUrl = '' // CalDAV doesn't use OAuth
  readonly apiBaseUrl = ''

  private username?: string
  private password?: string
  private appPassword?: string
  private calendarUrl?: string
  private rateLimiter: RateLimiter

  constructor(config: IntegrationConfig = {}) {
    super(config)
    this.rateLimiter = new RateLimiter(200, 2000) // Fastmail allows more requests
  }

  async initialize(): Promise<void> {
    // Get calendar URL and credentials from configuration
    const calendarUrl = this.config?.fieldMapping?.calendarUrl
    if (!calendarUrl) {
      throw new ValidationError('Fastmail Calendar URL is required', 'calendarUrl')
    }

    this.calendarUrl = calendarUrl
    
    // Test the connection
    await this.testConnection()
  }

  async authenticate(accessToken: string, refreshToken?: string, expiresAt?: Date): Promise<void> {
    // For Fastmail, accessToken is the app password, refreshToken is ignored
    this.appPassword = accessToken
    await this.initialize()
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('GET', '/.well-known/caldav')
      return true
    } catch (error) {
      console.error('Fastmail Calendar connection test failed:', error)
      throw new IntegrationError('Failed to connect to Fastmail Calendar', 'CONNECTION_FAILED')
    }
  }

  async refreshToken(): Promise<void> {
    // CalDAV doesn't require token refresh - tokens are passwords
    return
  }

  async syncTasks(): Promise<SyncResult> {
    // Fastmail Calendar integration doesn't sync tasks, only events
    return {
      operationId: `fastmail-tasks-${Date.now()}`,
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
    const operationId = `fastmail-sync-${Date.now()}`
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

    const ical = this.buildICalEvent(event)
    
    const response = await this.makeRequest('PUT', `/events/${event.title.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.ics`, ical, {
      'Content-Type': 'text/calendar; charset=utf-8',
      'If-None-Match': '*'
    })
    
    return this.mapCalDAVEventToExternal(response)
  }

  async updateEvent(externalId: string, event: EventData): Promise<ExternalEvent> {
    this.validateEventData(event)
    await this.ensureAuthenticated()

    const ical = this.buildICalEvent(event)
    
    // Get current ETag
    const currentEvent = await this.getEvent(externalId)
    const etag = currentEvent?.data?.etag
    
    const response = await this.makeRequest('PUT', `/events/${externalId}.ics`, ical, {
      'Content-Type': 'text/calendar; charset=utf-8',
      ...(etag && { 'If-Match': etag })
    })
    
    return this.mapCalDAVEventToExternal(response)
  }

  async deleteEvent(externalId: string): Promise<void> {
    await this.ensureAuthenticated()
    await this.makeRequest('DELETE', `/events/${externalId}.ics`)
  }

  async getEvent(externalId: string): Promise<ExternalEvent | null> {
    await this.ensureAuthenticated()

    try {
      const response = await this.makeRequest('GET', `/events/${externalId}.ics`)
      return this.mapCalDAVEventToExternal(response)
    } catch (error) {
      if (error instanceof IntegrationError && error.code === 'NOT_FOUND') {
        return null
      }
      throw error
    }
  }

  async handleWebhook(payload: any, signature?: string): Promise<void> {
    // Fastmail doesn't have standard webhooks for CalDAV
    // This would need to be implemented via WebDAV notifications if supported
    console.log('Fastmail Calendar webhook received:', payload)
  }

  async registerWebhook(webhookUrl: string): Promise<any> {
    // Fastmail CalDAV doesn't support webhooks natively
    throw new IntegrationError('Fastmail Calendar does not support webhooks', 'UNSUPPORTED_OPERATION')
  }

  async unregisterWebhook(webhookId: string): Promise<void> {
    // No-op for CalDAV
    return
  }

  async disconnect(): Promise<void> {
    this.accessToken = undefined
    this.appPassword = undefined
    this.calendarUrl = undefined
  }

  // Private helper methods

  private async fetchExternalEvents(): Promise<FastmailCalDAVEvent[]> {
    const now = new Date()
    const thirtyDaysAgo = now.toISOString().split('T')[0].replace(/-/g, '')
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0].replace(/-/g, '')
    
    const response = await this.makeRequest(
      'GET',
      `/events?time-min=${thirtyDaysAgo}T000000Z&time-max=${thirtyDaysFromNow}T000000Z&expand-recurring-master-events=true`
    )
    
    return this.parseCalendarData(response.calendarData || '')
  }

  private async makeRequest(
    method: string,
    path: string,
    data?: any,
    headers: Record<string, string> = {}
  ): Promise<any> {
    await this.rateLimiter.acquire()

    return RetryHandler.withRetry(async () => {
      const url = `${this.calendarUrl}${path}`
      const authHeaders: Record<string, string> = {
        'Authorization': `Basic ${Buffer.from(`${this.username}:${this.appPassword}`).toString('base64')}`,
        'User-Agent': 'DayFlow/1.0 (Fastmail Integration)',
        ...headers
      }

      const options: RequestInit = {
        method,
        headers: authHeaders,
        ...(data && { body: data })
      }

      const response = await fetch(url, options)

      if (!response.ok) {
        const errorData = await response.text().catch(() => '')
        
        if (response.status === 401) {
          throw new IntegrationError('Authentication failed - check your Fastmail app password', 'AUTHENTICATION_FAILED', 401)
        }

        if (response.status === 403) {
          throw new IntegrationError('Access forbidden - check calendar permissions', 'FORBIDDEN', 403)
        }

        if (response.status === 404) {
          throw new IntegrationError('Resource not found', 'NOT_FOUND', 404)
        }

        if (response.status === 412) {
          throw new IntegrationError('Precondition failed - ETag mismatch', 'ETAG_MISMATCH', 412)
        }

        throw new IntegrationError(
          `HTTP ${response.status}: ${response.statusText}`,
          'API_ERROR',
          response.status,
          errorData
        )
      }

      const contentType = response.headers.get('content-type') || ''
      const responseData = await response.text()

      if (contentType.includes('text/calendar')) {
        return {
          calendarData: responseData,
          etag: response.headers.get('etag') || '',
          href: path
        }
      }

      // Parse WebDAV response
      return this.parseWebDAVResponse(responseData)
    }, 3)
  }

  private buildICalEvent(event: EventData): string {
    const now = new Date()
    const uid = `dayflow-${Date.now()}@fastmail.dayflow.app`
    
    let ical = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//DayFlow//Fastmail Integration//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${this.formatICalDate(now)}`,
      `DTSTART:${this.formatICalDate(event.startTime, event.isAllDay)}`,
      `DTEND:${this.formatICalDate(event.endTime, event.isAllDay)}`,
      `SUMMARY:${this.escapeICalText(event.title)}`
    ]

    if (event.description) {
      ical.push(`DESCRIPTION:${this.escapeICalText(event.description)}`)
    }

    if (event.location) {
      ical.push(`LOCATION:${this.escapeICalText(event.location)}`)
    }

    if (event.isAllDay) {
      ical.push('VALUE=DATE')
    }

    if (event.attendees && event.attendees.length > 0) {
      for (const attendee of event.attendees) {
        ical.push('ATTENDEE')
        ical.push(`;CN=${attendee.name || attendee.email}`)
        ical.push(`;EMAIL=${attendee.email}`)
        ical.push(`;RSVP=TRUE`)
        ical.push(`:mailto:${attendee.email}`)
      }
    }

    if (event.recurrence && event.recurrence.type !== 'none') {
      const recurRule = this.buildICalRecurrence(event.recurrence)
      if (recurRule) {
        ical.push(`RRULE:${recurRule}`)
      }
    }

    // Add Fastmail-specific properties
    ical.push('X-MOZ-CREATE-UNCANONICAL')
    
    ical.push('END:VEVENT')
    ical.push('END:VCALENDAR')

    return ical.join('\r\n')
  }

  private buildICalRecurrence(recurrence: EventData['recurrence']): string | null {
    if (!recurrence || recurrence.type === 'none') {
      return null
    }

    const parts = [`FREQ=${recurrence.type.toUpperCase()}`]
    
    if (recurrence.interval && recurrence.interval > 1) {
      parts.push(`INTERVAL=${recurrence.interval}`)
    }

    if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
      const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
      const byDay = recurrence.daysOfWeek.map(day => dayMap[day]).join(',')
      parts.push(`BYDAY=${byDay}`)
    }

    if (recurrence.endDate) {
      const until = this.formatICalDate(recurrence.endDate)
      parts.push(`UNTIL=${until}`)
    } else if (recurrence.count) {
      parts.push(`COUNT=${recurrence.count}`)
    }

    return parts.join(';')
  }

  private parseCalendarData(calendarData: string): FastmailCalDAVEvent[] {
    // Simple iCal parsing - in production, use a proper iCal parser library
    const events: FastmailCalDAVEvent[] = []
    const lines = calendarData.split(/\r?\n/)
    
    let currentEvent: Partial<FastmailCalDAVEvent> = {}
    
    for (const line of lines) {
      const trimmed = line.trim()
      
      if (trimmed === 'BEGIN:VEVENT') {
        currentEvent = {}
      } else if (trimmed === 'END:VEVENT') {
        if (currentEvent.uid && currentEvent.title) {
          events.push(currentEvent as FastmailCalDAVEvent)
        }
        currentEvent = {}
      } else if (trimmed.startsWith('UID:')) {
        currentEvent.uid = trimmed.substring(3)
      } else if (trimmed.startsWith('DTSTART')) {
        currentEvent.startDate = this.parseICalDate(trimmed.substring(7))
      } else if (trimmed.startsWith('DTEND')) {
        currentEvent.endDate = this.parseICalDate(trimmed.substring(5))
      } else if (trimmed.startsWith('SUMMARY:')) {
        currentEvent.title = trimmed.substring(8)
      } else if (trimmed.startsWith('DESCRIPTION:')) {
        currentEvent.description = trimmed.substring(12)
      } else if (trimmed.startsWith('LOCATION:')) {
        currentEvent.location = trimmed.substring(9)
      } else if (trimmed.startsWith('DTSTAMP')) {
        currentEvent.lastModified = trimmed.substring(8)
      } else if (trimmed.startsWith('STATUS:')) {
        currentEvent.status = trimmed.substring(7).toLowerCase() as any
      }
    }
    
    return events
  }

  private parseWebDAVResponse(xml: string): any {
    // Simplified WebDAV response parsing
    const href = xml.match(/<d:href>([^<]+)<\/d:href>/)?.[1] || ''
    const etag = xml.match(/<d:getetag>([^<]+)<\/d:getetag>/)?.[1] || ''
    const calendarData = xml.match(/<cal:calendar-data>([\s\S]*?)<\/cal:calendar-data>/)?.[1] || ''
    
    return {
      href,
      etag,
      calendarData
    }
  }

  private mapCalDAVEventToExternal(calDavEvent: FastmailCalDAVEvent | any): ExternalEvent {
    const event = 'calendarData' in calDavEvent ? this.parseCalendarData(calDavEvent.calendarData)[0] : calDavEvent
    
    const title = event.title
    const description = event.description
    const startTime = event.startDate
    const endTime = event.endDate
    const isAllDay = event.allDay || false
    const location = event.location
    const attendees = event.attendees?.map(attendee => ({
      email: attendee.email || attendee.cua.replace('mailto:', ''),
      name: attendee.name,
      status: this.mapCalDAVResponseStatus(attendee.status)
    }))

    return {
      id: event.uid,
      title,
      description,
      startTime,
      endTime,
      isAllDay,
      location,
      attendees,
      recurrence: this.mapCalDAVRecurrence(event.recurrence),
      url: event.url,
      data: {
        etag: calDavEvent.etag,
        ...event,
        dayflowId: event.uid,
        service: 'fastmail'
      }
    }
  }

  private mapCalDAVResponseStatus(status: string): 'pending' | 'accepted' | 'declined' {
    const statusMap: Record<string, 'pending' | 'accepted' | 'declined'> = {
      'needs-action': 'pending',
      'accepted': 'accepted',
      'declined': 'declined',
      'tentative': 'pending',
      'delegated': 'pending'
    }
    return statusMap[status] || 'pending'
  }

  private mapCalDAVRecurrence(recurrence?: FastmailCalDAVEvent['recurrence']): ExternalEvent['recurrence'] {
    if (!recurrence || recurrence.type === 'none') {
      return { type: 'none' }
    }

    return {
      type: recurrence.type,
      interval: recurrence.interval,
      endDate: recurrence.endDate,
      daysOfWeek: recurrence.daysOfWeek
    }
  }

  private formatICalDate(date: Date, isAllDay = false): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    const second = String(date.getSeconds()).padStart(2, '0')
    
    if (isAllDay) {
      return `${year}${month}${day}`
    }
    
    return `${year}${month}${day}T${hour}${minute}${second}Z`
  }

  private parseICalDate(icalDate: string): Date {
    // Parse iCal date format (YYYYMMDD or YYYYMMDDTHHMMSSZ)
    if (icalDate.includes('T')) {
      const year = parseInt(icalDate.substring(0, 4))
      const month = parseInt(icalDate.substring(4, 6)) - 1
      const day = parseInt(icalDate.substring(6, 8))
      const hour = parseInt(icalDate.substring(9, 11))
      const minute = parseInt(icalDate.substring(11, 13))
      const second = parseInt(icalDate.substring(13, 15))
      
      return new Date(Date.UTC(year, month, day, hour, minute, second))
    } else {
      // Date-only format
      const year = parseInt(icalDate.substring(0, 4))
      const month = parseInt(icalDate.substring(4, 6)) - 1
      const day = parseInt(icalDate.substring(6, 8))
      
      return new Date(Date.UTC(year, month, day, 0, 0, 0))
    }
  }

  private escapeICalText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;')
  }

  private async handleCalendarWebhook(payload: any): Promise<void> {
    // CalDAV doesn't have standard webhooks
    console.log('Fastmail Calendar webhook (non-standard) received:', payload)
  }
}