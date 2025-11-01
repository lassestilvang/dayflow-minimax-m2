/**
 * OAuth 2.0 Authentication Manager
 * Handles OAuth flows for all integrated services
 */

import { IntegrationError, ValidationError, OAuthUtils } from './utils'

interface OAuthConfig {
  clientId: string
  clientSecret?: string
  serviceName: string
  authUrl: string
  tokenUrl: string
  redirectUri: string
  scopes: string[]
  refreshToken?: boolean
  stateParameter?: string
  codeChallenge?: string
  codeVerifier?: string
}

interface OAuthTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  scope?: string
  id_token?: string
}

interface OAuthState {
  serviceName: string
  userId: string
  timestamp: number
  nonce?: string
  codeChallenge?: string
  codeVerifier?: string
}

export class OAuthManager {
  private states = new Map<string, OAuthState>()
  private clientSecrets = new Map<string, string>()

  constructor() {
    // Initialize with known service configurations
    this.initializeServiceConfigs()
  }

  private initializeServiceConfigs(): void {
    // These would typically be loaded from environment variables or database
    const configs: Record<string, OAuthConfig> = {
      notion: {
        clientId: process.env.NOTION_CLIENT_ID || '',
        serviceName: 'notion',
        authUrl: 'https://api.notion.com/v1/oauth/authorize',
        tokenUrl: 'https://api.notion.com/v1/oauth/token',
        redirectUri: process.env.NOTION_REDIRECT_URI || '',
        scopes: ['read', 'write']
      },
      clickup: {
        clientId: process.env.CLICKUP_CLIENT_ID || '',
        serviceName: 'clickup',
        authUrl: 'https://app.clickup.com/api',
        tokenUrl: 'https://api.clickup.com/api/v2/oauth/token',
        redirectUri: process.env.CLICKUP_REDIRECT_URI || '',
        scopes: ['read', 'write']
      },
      linear: {
        clientId: process.env.LINEAR_CLIENT_ID || '',
        serviceName: 'linear',
        authUrl: 'https://linear.app/oauth/authorize',
        tokenUrl: 'https://api.linear.app/oauth/token',
        redirectUri: process.env.LINEAR_REDIRECT_URI || '',
        scopes: ['read', 'write']
      },
      todoist: {
        clientId: process.env.TODOIST_CLIENT_ID || '',
        serviceName: 'todoist',
        authUrl: 'https://todoist.com/oauth2/authorize',
        tokenUrl: 'https://todoist.com/oauth2/access_token',
        redirectUri: process.env.TODOIST_REDIRECT_URI || '',
        scopes: ['read', 'write']
      },
      'google-calendar': {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        serviceName: 'google-calendar',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
        scopes: ['https://www.googleapis.com/auth/calendar']
      },
      outlook: {
        clientId: process.env.OUTLOOK_CLIENT_ID || '',
        clientSecret: process.env.OUTLOOK_CLIENT_SECRET || '',
        serviceName: 'outlook',
        authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        redirectUri: process.env.OUTLOOK_REDIRECT_URI || '',
        scopes: ['Calendars.ReadWrite']
      }
    }

    // Store client secrets for services that require them
    for (const [service, config] of Object.entries(configs)) {
      if (config.clientSecret) {
        this.clientSecrets.set(service, config.clientSecret)
      }
    }
  }

  /**
   * Generate authorization URL for OAuth flow
   */
  async getAuthorizationUrl(
    serviceName: string,
    userId: string,
    state?: string
  ): Promise<{ url: string; state: string }> {
    const config = this.getServiceConfig(serviceName)
    if (!config) {
      throw new ValidationError(`Unsupported service: ${serviceName}`, 'serviceName')
    }

    const oauthState = this.generateState(serviceName, userId, state)
    const authUrl = this.buildAuthUrl(config, oauthState)
    
    // Store state for later validation
    this.states.set(oauthState, {
      serviceName,
      userId,
      timestamp: Date.now()
    })

    return { url: authUrl, state: oauthState }
  }

  /**
   * Handle OAuth callback and exchange authorization code for tokens
   */
  async handleCallback(
    serviceName: string,
    code: string,
    state: string,
    userId?: string
  ): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }> {
    // Validate state parameter
    const savedState = this.states.get(state)
    if (!savedState) {
      throw new ValidationError('Invalid or expired state parameter', 'state')
    }

    if (savedState.serviceName !== serviceName) {
      throw new ValidationError('State parameter does not match service', 'state')
    }

    if (userId && savedState.userId !== userId) {
      throw new ValidationError('State parameter does not match user', 'userId')
    }

    // Check state expiration (10 minutes)
    if (Date.now() - savedState.timestamp > 10 * 60 * 1000) {
      this.states.delete(state)
      throw new ValidationError('State parameter has expired', 'state')
    }

    const config = this.getServiceConfig(serviceName)
    if (!config) {
      throw new ValidationError(`Unsupported service: ${serviceName}`, 'serviceName')
    }

    try {
      // Exchange authorization code for tokens
      const tokens = await this.exchangeCodeForTokens(config, code, savedState)
      
      // Clean up used state
      this.states.delete(state)
      
      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expires_in ? new Date(Date.now() + (tokens.expires_in * 1000)) : undefined
      }
    } catch (error) {
      throw new IntegrationError('Failed to exchange authorization code for tokens', 'TOKEN_EXCHANGE_FAILED', undefined, error)
    }
  }

  /**
   * Refresh OAuth access token
   */
  async refreshToken(
    serviceName: string,
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }> {
    const config = this.getServiceConfig(serviceName)
    if (!config) {
      throw new ValidationError(`Unsupported service: ${serviceName}`, 'serviceName')
    }

    if (!config.refreshToken) {
      throw new ValidationError('Service does not support token refresh', 'refreshToken')
    }

    try {
      const tokens = await this.makeTokenRequest(config, {
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || refreshToken,
        expiresAt: tokens.expires_in ? new Date(Date.now() + (tokens.expires_in * 1000)) : undefined
      }
    } catch (error) {
      throw new IntegrationError('Failed to refresh access token', 'TOKEN_REFRESH_FAILED', undefined, error)
    }
  }

  /**
   * Validate OAuth state and extract information
   */
  validateState(state: string): OAuthState | null {
    const savedState = this.states.get(state)
    if (!savedState) {
      return null
    }

    // Check if state has expired (24 hours for better UX)
    if (Date.now() - savedState.timestamp > 24 * 60 * 60 * 1000) {
      this.states.delete(state)
      return null
    }

    return savedState
  }

  /**
   * Get service configuration
   */
  getServiceConfig(serviceName: string): OAuthConfig | null {
    // This would typically be loaded from a database or environment
    const configs: Record<string, OAuthConfig> = {
      notion: {
        clientId: process.env.NOTION_CLIENT_ID || '',
        serviceName: 'notion',
        authUrl: 'https://api.notion.com/v1/oauth/authorize',
        tokenUrl: 'https://api.notion.com/v1/oauth/token',
        redirectUri: process.env.NOTION_REDIRECT_URI || '',
        scopes: ['read', 'write'],
        refreshToken: false
      },
      clickup: {
        clientId: process.env.CLICKUP_CLIENT_ID || '',
        serviceName: 'clickup',
        authUrl: 'https://app.clickup.com/api',
        tokenUrl: 'https://api.clickup.com/api/v2/oauth/token',
        redirectUri: process.env.CLICKUP_REDIRECT_URI || '',
        scopes: ['read', 'write'],
        refreshToken: true
      },
      linear: {
        clientId: process.env.LINEAR_CLIENT_ID || '',
        serviceName: 'linear',
        authUrl: 'https://linear.app/oauth/authorize',
        tokenUrl: 'https://api.linear.app/oauth/token',
        redirectUri: process.env.LINEAR_REDIRECT_URI || '',
        scopes: ['read', 'write'],
        refreshToken: false
      },
      todoist: {
        clientId: process.env.TODOIST_CLIENT_ID || '',
        serviceName: 'todoist',
        authUrl: 'https://todoist.com/oauth2/authorize',
        tokenUrl: 'https://todoist.com/oauth2/access_token',
        redirectUri: process.env.TODOIST_REDIRECT_URI || '',
        scopes: ['read', 'write'],
        refreshToken: true
      },
      'google-calendar': {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        serviceName: 'google-calendar',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
        scopes: ['https://www.googleapis.com/auth/calendar'],
        refreshToken: true
      },
      outlook: {
        clientId: process.env.OUTLOOK_CLIENT_ID || '',
        clientSecret: process.env.OUTLOOK_CLIENT_SECRET || '',
        serviceName: 'outlook',
        authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        redirectUri: process.env.OUTLOOK_REDIRECT_URI || '',
        scopes: ['Calendars.ReadWrite'],
        refreshToken: true
      }
    }

    return configs[serviceName] || null
  }

  /**
   * Clean up expired states
   */
  cleanupExpiredStates(): void {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours

    for (const [state, data] of this.states.entries()) {
      if (now - data.timestamp > maxAge) {
        this.states.delete(state)
      }
    }
  }

  /**
   * Clear all states (useful for testing or logout)
   */
  clearAllStates(): void {
    this.states.clear()
  }

  // Private methods

  private generateState(serviceName: string, userId: string, customState?: string): string {
    if (customState) {
      return customState
    }

    // Create a cryptographically secure state
    const randomBytes = crypto.getRandomValues(new Uint8Array(32))
    const base64State = btoa(String.fromCharCode(...randomBytes))
    
    // Add service and user info to state
    const state = `dayflow_${serviceName}_${userId}_${Date.now()}_${base64State.substring(0, 16)}`
    
    return state
  }

  private buildAuthUrl(config: OAuthConfig, state: string): string {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scopes.join(' '),
      state: state
    })

    // Add PKCE challenge if generated
    const savedState = this.states.get(state)
    if (savedState?.codeChallenge) {
      params.set('code_challenge', savedState.codeChallenge)
      params.set('code_challenge_method', 'S256')
    }

    return `${config.authUrl}?${params.toString()}`
  }

  private async exchangeCodeForTokens(
    config: OAuthConfig,
    code: string,
    state: OAuthState
  ): Promise<OAuthTokenResponse> {
    const tokenData: any = {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: config.redirectUri
    }

    // Add PKCE code verifier if available
    if (state.codeVerifier) {
      tokenData.code_verifier = state.codeVerifier
    }

    return this.makeTokenRequest(config, tokenData)
  }

  private async makeTokenRequest(
    config: OAuthConfig,
    tokenData: any
  ): Promise<OAuthTokenResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    }

    // Add client secret for services that require it
    if (config.clientSecret) {
      const clientSecret = this.clientSecrets.get(config.serviceName) || config.clientSecret
      tokenData.client_secret = clientSecret
    }

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers,
      body: new URLSearchParams(tokenData)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      throw new IntegrationError(
        `Token request failed: ${errorData.error_description || errorData.error || response.statusText}`,
        'TOKEN_REQUEST_FAILED',
        response.status,
        errorData
      )
    }

    return response.json()
  }

  /**
   * Generate PKCE code challenge and verifier for enhanced security
   */
  async generatePKCE(): Promise<{ codeChallenge: string; codeVerifier: string }> {
    const codeVerifier = OAuthUtils.generateStateParameter()
    const codeChallenge = this.base64UrlEncode(await this.sha256(codeVerifier))
    
    return { codeChallenge, codeVerifier }
  }

  private sha256(buffer: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder()
    const data = encoder.encode(buffer)
    return crypto.subtle.digest('SHA-256', data)
  }

  private base64UrlEncode(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }
}

// Export singleton instance
export const oauthManager = new OAuthManager()

// Helper function to get OAuth URL for a service
export async function getServiceAuthUrl(serviceName: string, userId: string): Promise<string> {
  const { url } = await oauthManager.getAuthorizationUrl(serviceName, userId)
  return url
}

// Helper function to handle OAuth callback
export async function handleServiceCallback(
  serviceName: string,
  code: string,
  state: string,
  userId?: string
): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }> {
  return oauthManager.handleCallback(serviceName, code, state, userId)
}

// Helper function to refresh service token
export async function refreshServiceToken(
  serviceName: string,
  refreshToken: string
): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }> {
  return oauthManager.refreshToken(serviceName, refreshToken)
}