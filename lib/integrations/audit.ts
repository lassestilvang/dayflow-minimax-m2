/**
 * Security & Audit Logging System
 * Comprehensive logging and security monitoring for integration framework
 */

import { UserIntegration, IntegrationAuditLog, integrationAuditLog } from '../db/integrations-schema'
import { db } from '../db'
import { eq, and, gt, desc, inArray } from 'drizzle-orm'

interface AuditEvent {
  userIntegrationId: string
  userId?: string
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  success: boolean
  error?: string
  timestamp: Date
}

interface SecurityAlert {
  id: string
  type: 'failed_authentication' | 'suspicious_activity' | 'rate_limit_exceeded' | 'data_access_anomaly'
  severity: 'low' | 'medium' | 'high' | 'critical'
  userId: string
  integrationId: string
  description: string
  details: Record<string, any>
  createdAt: Date
  acknowledged: boolean
}

interface ComplianceRecord {
  id: string
  userId: string
  integrationId: string
  dataType: 'tasks' | 'events' | 'user_data' | 'oauth_tokens'
  action: 'accessed' | 'modified' | 'exported' | 'deleted'
  purpose: string
  consentGiven: boolean
  legalBasis: 'consent' | 'contract' | 'legitimate_interest' | 'legal_obligation'
  retentionPeriod?: number // days
  createdAt: Date
}

export class AuditLogger {
  private recentEvents: AuditEvent[] = []
  private securityAlerts: SecurityAlert[] = []
  private rateLimitTracker = new Map<string, { count: number; resetAt: number }>()
  private suspiciousActivityThreshold = 100 // events per hour
  private failedAuthThreshold = 5 // failed auths per hour

  /**
   * Log an integration event
   */
  async logEvent(event: Omit<AuditEvent, 'timestamp'>): Promise<void> {
    const auditEvent: AuditEvent = {
      ...event,
      timestamp: new Date()
    }

    // Store in memory for recent events
    this.recentEvents.push(auditEvent)
    
    // Keep only last 1000 events in memory
    if (this.recentEvents.length > 1000) {
      this.recentEvents = this.recentEvents.slice(-1000)
    }

    // Store in database
    try {
      await db.insert(integrationAuditLog).values({
        userIntegrationId: auditEvent.userIntegrationId,
        userId: auditEvent.userId,
        action: auditEvent.action,
        resource: auditEvent.resource,
        resourceId: auditEvent.resourceId,
        details: auditEvent.details,
        ipAddress: auditEvent.ipAddress,
        userAgent: auditEvent.userAgent,
        createdAt: auditEvent.timestamp
      })
    } catch (error) {
      console.error('Failed to log audit event:', error)
    }

    // Check for security alerts
    await this.checkForSecurityAlerts(auditEvent)
  }

  /**
   * Log user authentication event
   */
  async logAuthentication(
    userId: string,
    integrationId: string,
    serviceName: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    error?: string
  ): Promise<void> {
    await this.logEvent({
      userIntegrationId: integrationId,
      userId,
      action: success ? 'authenticated' : 'authentication_failed',
      resource: 'oauth',
      details: { serviceName, userAgent },
      ipAddress,
      userAgent,
      success,
      error
    })

    // Track failed authentication attempts
    if (!success) {
      await this.trackFailedAuthentication(userId, integrationId)
    }
  }

  /**
   * Log data access event
   */
  async logDataAccess(
    userId: string,
    integrationId: string,
    resourceType: 'tasks' | 'events' | 'calendar',
    operation: 'read' | 'create' | 'update' | 'delete',
    resourceId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      userIntegrationId: integrationId,
      userId,
      action: `data_${operation}`,
      resource: resourceType,
      resourceId,
      details,
      success: true
    })
  }

  /**
   * Log synchronization event
   */
  async logSync(
    userId: string,
    integrationId: string,
    operation: string,
    success: boolean,
    details: {
      itemsProcessed?: number
      itemsCreated?: number
      itemsUpdated?: number
      conflicts?: number
      errors?: number
    } = {},
    error?: string
  ): Promise<void> {
    await this.logEvent({
      userIntegrationId: integrationId,
      userId,
      action: success ? 'sync_completed' : 'sync_failed',
      resource: 'synchronization',
      details: { operation, ...details },
      success,
      error
    })
  }

  /**
   * Log configuration change
   */
  async logConfigurationChange(
    userId: string,
    integrationId: string,
    changes: Record<string, { old: any; new: any }>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent({
      userIntegrationId: integrationId,
      userId,
      action: 'configuration_changed',
      resource: 'integration_settings',
      details: { changes },
      ipAddress,
      userAgent,
      success: true
    })
  }

  /**
   * Record compliance event for GDPR/CCPA
   */
  async recordComplianceEvent(
    userId: string,
    integrationId: string,
    dataType: ComplianceRecord['dataType'],
    action: ComplianceRecord['action'],
    purpose: string,
    legalBasis: ComplianceRecord['legalBasis'],
    consentGiven: boolean = true,
    retentionPeriod?: number
  ): Promise<void> {
    try {
      await db.insert(integrationAuditLog).values({
        userIntegrationId: integrationId,
        userId,
        action: `compliance_${action}`,
        resource: 'data_protection',
        details: {
          dataType,
          purpose,
          legalBasis,
          consentGiven,
          retentionPeriod
        },
        createdAt: new Date()
      })
    } catch (error) {
      console.error('Failed to record compliance event:', error)
    }
  }

  /**
   * Get audit trail for a user integration
   */
  async getAuditTrail(
    userIntegrationId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<IntegrationAuditLog[]> {
    try {
      const results = await db.select().from(integrationAuditLog)
        .where(eq(integrationAuditLog.userIntegrationId, userIntegrationId))
        .orderBy(desc(integrationAuditLog.createdAt))
        .limit(limit)
        .offset(offset)

      return results
    } catch (error) {
      console.error('Failed to fetch audit trail:', error)
      return []
    }
  }

  /**
   * Get audit trail for a user
   */
  async getUserAuditTrail(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100
  ): Promise<IntegrationAuditLog[]> {
    try {
      let query = db.select().from(integrationAuditLog)
        .where(eq(integrationAuditLog.userId, userId))

      if (startDate) {
        query = (query as any).where(and(
          eq(integrationAuditLog.userId, userId),
          gt(integrationAuditLog.createdAt, startDate)
        ))
      }

      const results = await query
        .orderBy(desc(integrationAuditLog.createdAt))
        .limit(limit)

      return results
    } catch (error) {
      console.error('Failed to fetch user audit trail:', error)
      return []
    }
  }

  /**
   * Get security alerts for admin review
   */
  async getSecurityAlerts(
    severity?: SecurityAlert['severity'],
    acknowledged?: boolean,
    limit: number = 50
  ): Promise<SecurityAlert[]> {
    let alerts = [...this.securityAlerts]

    if (severity) {
      alerts = alerts.filter(a => a.severity === severity)
    }

    if (acknowledged !== undefined) {
      alerts = alerts.filter(a => a.acknowledged === acknowledged)
    }

    return alerts
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
  }

  /**
   * Acknowledge a security alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): void {
    const alert = this.securityAlerts.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
      alert.details.acknowledgedBy = acknowledgedBy
      alert.details.acknowledgedAt = new Date()
    }
  }

  /**
   * Check for suspicious activity patterns
   */
  private async checkForSecurityAlerts(event: AuditEvent): Promise<void> {
    // Check for rate limiting violations
    await this.checkRateLimitViolations(event)

    // Check for failed authentication patterns
    if (event.action === 'authentication_failed') {
      await this.analyzeFailedAuthPattern(event)
    }

    // Check for unusual data access patterns
    if (event.action.startsWith('data_')) {
      await this.analyzeDataAccessPattern(event)
    }

    // Check for configuration change anomalies
    if (event.action === 'configuration_changed') {
      await this.analyzeConfigurationChanges(event)
    }
  }

  private async checkRateLimitViolations(event: AuditEvent): Promise<void> {
    const key = `${event.userId}:${event.resource}`
    const now = Date.now()
    const hourAgo = now - (60 * 60 * 1000)

    const tracker = this.rateLimitTracker.get(key) || { count: 0, resetAt: hourAgo }

    // Reset counter if hour has passed
    if (now > tracker.resetAt) {
      tracker.count = 0
      tracker.resetAt = now + (60 * 60 * 1000)
    }

    tracker.count++
    this.rateLimitTracker.set(key, tracker)

    // Alert if rate limit exceeded
    if (tracker.count > this.suspiciousActivityThreshold) {
      await this.createSecurityAlert({
        type: 'rate_limit_exceeded',
        severity: 'high',
        userId: event.userId!,
        integrationId: event.userIntegrationId,
        description: `Rate limit exceeded: ${tracker.count} requests in the last hour`,
        details: { event, requestCount: tracker.count }
      })
    }
  }

  private async analyzeFailedAuthPattern(event: AuditEvent): Promise<void> {
    // Count recent failed authentications for this user
    const recentFailures = this.recentEvents.filter(e => 
      e.userId === event.userId && 
      e.action === 'authentication_failed' &&
      Date.now() - e.timestamp.getTime() < (60 * 60 * 1000) // Last hour
    ).length

    if (recentFailures >= this.failedAuthThreshold) {
      await this.createSecurityAlert({
        type: 'failed_authentication',
        severity: 'critical',
        userId: event.userId!,
        integrationId: event.userIntegrationId,
        description: `Multiple failed authentication attempts: ${recentFailures} in the last hour`,
        details: { recentFailures, event }
      })
    }
  }

  private async analyzeDataAccessPattern(event: AuditEvent): Promise<void> {
    // Check for unusual data access patterns
    const recentAccess = this.recentEvents.filter(e => 
      e.userId === event.userId &&
      e.action.startsWith('data_') &&
      Date.now() - e.timestamp.getTime() < (15 * 60 * 1000) // Last 15 minutes
    ).length

    if (recentAccess > 200) { // Very high access rate
      await this.createSecurityAlert({
        type: 'data_access_anomaly',
        severity: 'medium',
        userId: event.userId!,
        integrationId: event.userIntegrationId,
        description: `Unusual data access pattern: ${recentAccess} requests in 15 minutes`,
        details: { recentAccess, event }
      })
    }
  }

  private async analyzeConfigurationChanges(event: AuditEvent): Promise<void> {
    // Check for suspicious configuration changes
    const recentChanges = this.recentEvents.filter(e => 
      e.userId === event.userId &&
      e.action === 'configuration_changed' &&
      Date.now() - e.timestamp.getTime() < (60 * 60 * 1000) // Last hour
    ).length

    if (recentChanges > 10) { // Many configuration changes
      await this.createSecurityAlert({
        type: 'suspicious_activity',
        severity: 'medium',
        userId: event.userId!,
        integrationId: event.userIntegrationId,
        description: `Multiple configuration changes: ${recentChanges} in the last hour`,
        details: { recentChanges, event }
      })
    }
  }

  private async trackFailedAuthentication(userId: string, integrationId: string): Promise<void> {
    const key = `auth:${userId}:${integrationId}`
    const now = Date.now()
    const hourAgo = now - (60 * 60 * 1000)

    const tracker = this.rateLimitTracker.get(key) || { count: 0, resetAt: hourAgo }

    if (now > tracker.resetAt) {
      tracker.count = 0
      tracker.resetAt = now + (60 * 60 * 1000)
    }

    tracker.count++
    this.rateLimitTracker.set(key, tracker)
  }

  private async createSecurityAlert(alert: Omit<SecurityAlert, 'id' | 'createdAt' | 'acknowledged'>): Promise<void> {
    const securityAlert: SecurityAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      acknowledged: false
    }

    this.securityAlerts.push(securityAlert)

    // Keep only last 100 alerts in memory
    if (this.securityAlerts.length > 100) {
      this.securityAlerts = this.securityAlerts.slice(-100)
    }

    // Log high severity alerts
    if (alert.severity === 'critical' || alert.severity === 'high') {
      console.warn('SECURITY ALERT:', securityAlert)
      
      // In production, this would trigger real-time notifications
      // to security teams or monitoring systems
      await this.sendSecurityNotification(securityAlert)
    }
  }

  private async sendSecurityNotification(alert: SecurityAlert): Promise<void> {
    // In production, this would send notifications via:
    // - Email to security team
    // - Slack/Teams webhook
    // - PagerDuty/incident management system
    // - SMS for critical alerts
    
    try {
      // Example: Log to external security monitoring
      console.log('Security Alert Notification:', {
        severity: alert.severity,
        type: alert.type,
        userId: alert.userId,
        description: alert.description,
        timestamp: alert.createdAt
      })
    } catch (error) {
      console.error('Failed to send security notification:', error)
    }
  }

  /**
   * Generate compliance report for a user
   */
  async generateComplianceReport(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    dataAccessed: number
    integrationsUsed: string[]
    consentRecords: number
    deletions: number
    exports: number
  }> {
    try {
      const events = await this.getUserAuditTrail(userId, startDate, endDate, 10000)

      const dataAccessed = events.filter(e => e.action.startsWith('data_')).length
      const integrationsUsed = [...new Set(events.map(e => e.resourceId || '').filter(Boolean))]
      const consentRecords = events.filter(e => e.action.startsWith('compliance_')).length
      const deletions = events.filter(e => e.action === 'data_delete').length
      const exports = events.filter(e => e.action === 'data_export').length

      return {
        dataAccessed,
        integrationsUsed,
        consentRecords,
        deletions,
        exports
      }
    } catch (error) {
      console.error('Failed to generate compliance report:', error)
      return {
        dataAccessed: 0,
        integrationsUsed: [],
        consentRecords: 0,
        deletions: 0,
        exports: 0
      }
    }
  }

  /**
   * Clean up old audit data (for GDPR right to erasure)
   */
  async deleteUserData(userId: string, integrationIds?: string[]): Promise<void> {
    try {
      // Delete audit log entries for user
      let query = db.delete(integrationAuditLog).where(eq(integrationAuditLog.userId, userId))
      
      if (integrationIds && integrationIds.length > 0) {
        query = (query as any).where(
          and(
            eq(integrationAuditLog.userId, userId),
            inArray(integrationAuditLog.userIntegrationId, integrationIds)
          )
        )
      }

      await query
    } catch (error) {
      console.error('Failed to delete user audit data:', error)
      throw new Error('Failed to delete user data')
    }
  }

  /**
   * Get system security status
   */
  getSecurityStatus(): {
    totalEvents: number
    recentAlerts: number
    criticalAlerts: number
    activeUsers: number
    rateLimitViolations: number
  } {
    const now = Date.now()
    const recentEvents = this.recentEvents.filter(e => 
      now - e.timestamp.getTime() < (24 * 60 * 60 * 1000) // Last 24 hours
    )

    const recentAlerts = this.securityAlerts.filter(a => 
      now - a.createdAt.getTime() < (24 * 60 * 60 * 1000)
    ).length

    const criticalAlerts = this.securityAlerts.filter(a => 
      a.severity === 'critical' && 
      now - a.createdAt.getTime() < (24 * 60 * 60 * 1000)
    ).length

    const activeUsers = new Set(
      recentEvents.map(e => e.userId).filter(Boolean)
    ).size

    const rateLimitViolations = this.securityAlerts.filter(a => 
      a.type === 'rate_limit_exceeded' &&
      now - a.createdAt.getTime() < (24 * 60 * 60 * 1000)
    ).length

    return {
      totalEvents: this.recentEvents.length,
      recentAlerts,
      criticalAlerts,
      activeUsers,
      rateLimitViolations
    }
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger()

// Helper functions for easy logging
export async function logIntegrationEvent(
  integrationId: string,
  userId: string,
  action: string,
  resource: string,
  details?: Record<string, any>
): Promise<void> {
  return auditLogger.logEvent({
    userIntegrationId: integrationId,
    userId,
    action,
    resource,
    details,
    success: true
  })
}

export async function logAuthentication(
  userId: string,
  integrationId: string,
  serviceName: string,
  success: boolean,
  ipAddress?: string,
  userAgent?: string,
  error?: string
): Promise<void> {
  return auditLogger.logAuthentication(
    userId,
    integrationId,
    serviceName,
    success,
    ipAddress,
    userAgent,
    error
  )
}

export async function logDataAccess(
  userId: string,
  integrationId: string,
  resourceType: 'tasks' | 'events' | 'calendar',
  operation: 'read' | 'create' | 'update' | 'delete',
  resourceId?: string,
  details?: Record<string, any>
): Promise<void> {
  return auditLogger.logDataAccess(
    userId,
    integrationId,
    resourceType,
    operation,
    resourceId,
    details
  )
}

export async function logSyncEvent(
  userId: string,
  integrationId: string,
  operation: string,
  success: boolean,
  details?: Record<string, any>,
  error?: string
): Promise<void> {
  return auditLogger.logSync(
    userId,
    integrationId,
    operation,
    success,
    details,
    error
  )
}