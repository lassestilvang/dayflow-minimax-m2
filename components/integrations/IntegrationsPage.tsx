/**
 * Integrations Management Page
 * Main page for managing all external service integrations
 */

'use client'

import { useState, useEffect } from 'react'
import { IntegrationCard } from './IntegrationCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Settings, 
  Plus, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react'

interface IntegrationService {
  id: string
  name: string
  displayName: string
  type: 'task_management' | 'calendar'
  provider: string
  iconUrl?: string
  isEnabled: boolean
}

interface UserIntegration {
  id: string
  serviceName: string
  displayName: string
  isActive: boolean
  lastSyncAt?: Date
  syncStatus: 'idle' | 'syncing' | 'error' | 'success'
  syncError?: string
}

interface SyncJob {
  id: string
  operation: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startedAt: Date
  completedAt?: Date
  conflicts: any[]
}

export function IntegrationsPage({ userId }: { userId: string }) {
  const [services, setServices] = useState<IntegrationService[]>([])
  const [integrations, setIntegrations] = useState<UserIntegration[]>([])
  const [activeJobs, setActiveJobs] = useState<SyncJob[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    loadIntegrations()
    loadActiveJobs()
    
    // Set up polling for job updates
    const interval = setInterval(() => {
      loadActiveJobs()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const loadIntegrations = async () => {
    try {
      const response = await fetch(`/api/integrations?userId=${userId}`)
      const data = await response.json()
      
      setServices(data.services || [])
      setIntegrations(data.services?.filter((s: any) => s.integration).map((s: any) => ({
        ...s.integration,
        displayName: s.displayName
      })) || [])
    } catch (error) {
      console.error('Failed to load integrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadActiveJobs = async () => {
    // This would fetch active sync jobs
    // For now, using mock data
    const mockJobs: SyncJob[] = []
    setActiveJobs(mockJobs)
  }

  const handleConnect = async (serviceName: string) => {
    try {
      // Get authorization URL
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'authorize',
          serviceName,
          userId
        })
      })

      const data = await response.json()
      
      if (data.authUrl) {
        // Store state for OAuth callback
        localStorage.setItem('oauth_state', data.state)
        localStorage.setItem('oauth_service', serviceName)
        
        // Redirect to OAuth provider
        window.location.href = data.authUrl
      }
    } catch (error) {
      console.error('Failed to start OAuth flow:', error)
    }
  }

  const handleDisconnect = async (integrationId: string) => {
    try {
      await fetch(`/api/integrations?integrationId=${integrationId}&userId=${userId}`, {
        method: 'DELETE'
      })
      
      await loadIntegrations()
    } catch (error) {
      console.error('Failed to disconnect integration:', error)
    }
  }

  const handleSync = async (integrationId: string, operation: string) => {
    try {
      await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync',
          serviceName: integrations.find(i => i.id === integrationId)?.serviceName,
          userId,
          operation,
          options: {}
        })
      })
      
      await loadActiveJobs()
    } catch (error) {
      console.error('Failed to start sync:', error)
    }
  }

  const handleToggleActive = async (integrationId: string, isActive: boolean) => {
    try {
      await fetch('/api/integrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integrationId,
          userId,
          updates: { isActive }
        })
      })
      
      await loadIntegrations()
    } catch (error) {
      console.error('Failed to update integration:', error)
    }
  }

  const getServiceWithIntegration = (service: IntegrationService) => {
    const integration = integrations.find(i => i.serviceName === service.name)
    return { service, integration }
  }

  const filteredServices = services.filter(service => {
    if (activeTab === 'all') return true
    if (activeTab === 'tasks') return service.type === 'task_management'
    if (activeTab === 'calendar') return service.type === 'calendar'
    if (activeTab === 'connected') return !!integrations.find(i => i.serviceName === service.name)
    if (activeTab === 'active') return !!integrations.find(i => i.serviceName === service.name && i.isActive)
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Integrations</h1>
          <p className="text-muted-foreground">
            Connect external services to sync your tasks and calendar events
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {integrations.length} Connected
          </Badge>
          <Button onClick={() => loadIntegrations()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Synchronizations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeJobs.map(job => (
              <div key={job.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {job.status === 'running' ? (
                    <Clock className="h-4 w-4 animate-spin text-blue-500" />
                  ) : job.status === 'completed' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : job.status === 'failed' ? (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-gray-500" />
                  )}
                  <span className="capitalize">{job.operation.replace('_', ' ')}</span>
                </div>
                <span className="text-muted-foreground">
                  {job.startedAt.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* OAuth Callback Handling */}
      <OAuthCallbackHandler onComplete={() => {
        loadIntegrations()
        localStorage.removeItem('oauth_state')
        localStorage.removeItem('oauth_service')
      }} />

      {/* Services Grid */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Services</TabsTrigger>
          <TabsTrigger value="tasks">Task Management</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="connected">Connected</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map(({ service, integration }) => (
              <IntegrationCard
                key={service.id}
                service={service}
                integration={integration}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                onSync={handleSync}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>

          {filteredServices.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No services found</h3>
              <p className="text-muted-foreground">
                No services match the current filter. Try selecting a different tab.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Need Help?</CardTitle>
          <CardDescription>
            Learn how to set up and manage your integrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Connecting a Service</p>
              <p className="text-sm text-muted-foreground">
                Click "Connect" on any service to start the OAuth authorization flow
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Synchronization Settings</p>
              <p className="text-sm text-muted-foreground">
                Configure auto-sync intervals and conflict resolution strategies
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Manual Sync</p>
              <p className="text-sm text-muted-foreground">
                Use the Sync button to manually synchronize data at any time
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function OAuthCallbackHandler({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const state = urlParams.get('state')
    const service = localStorage.getItem('oauth_service')
    const storedState = localStorage.getItem('oauth_state')
    const userId = localStorage.getItem('user_id') // Would be set during login

    if (code && state && service && userId && state === storedState) {
      // Handle OAuth callback
      fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'connect',
          serviceName: service,
          userId,
          code,
          state
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          onComplete()
          // Clear URL parameters
          window.history.replaceState({}, document.title, window.location.pathname)
        } else {
          console.error('OAuth callback failed:', data.error)
        }
      })
      .catch(error => {
        console.error('OAuth callback error:', error)
      })
    }
  }, [onComplete])

  return null
}