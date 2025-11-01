/**
 * Integration Card Component
 * Displays integration status and management options
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Settings, Link, Unlink, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IntegrationCardProps {
  service: {
    id: string
    name: string
    displayName: string
    type: 'task_management' | 'calendar'
    provider: string
    iconUrl?: string
    isEnabled: boolean
  }
  integration?: {
    id: string
    isActive: boolean
    lastSyncAt?: Date
    syncStatus: 'idle' | 'syncing' | 'error' | 'success'
    syncError?: string
  }
  onConnect: (serviceName: string) => void
  onDisconnect: (integrationId: string) => void
  onSync: (integrationId: string, operation: string) => void
  onToggleActive: (integrationId: string, isActive: boolean) => void
}

export function IntegrationCard({
  service,
  integration,
  onConnect,
  onDisconnect,
  onSync,
  onToggleActive
}: IntegrationCardProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      await onConnect(service.name)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSync = async (operation: string) => {
    if (!integration) return
    
    setIsSyncing(true)
    try {
      await onSync(integration.id, operation)
    } finally {
      setIsSyncing(false)
    }
  }

  const getStatusIcon = () => {
    if (!integration) return null
    
    switch (integration.syncStatus) {
      case 'syncing':
        return <Clock className="h-4 w-4 animate-spin text-blue-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return null
    }
  }

  const getStatusBadge = () => {
    if (!integration) {
      return <Badge variant="secondary">Not Connected</Badge>
    }

    const statusConfig = {
      idle: { label: 'Connected', variant: 'default' as const },
      syncing: { label: 'Syncing...', variant: 'default' as const },
      error: { label: 'Error', variant: 'destructive' as const },
      success: { label: 'Synced', variant: 'default' as const }
    }

    const config = statusConfig[integration.syncStatus]
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {getStatusIcon()}
        {config.label}
      </Badge>
    )
  }

  return (
    <Card className={cn(
      "transition-all duration-200",
      !integration && "opacity-75 hover:opacity-100",
      integration?.isActive && "ring-1 ring-primary"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              {service.iconUrl ? (
                <Image
                  src={service.iconUrl}
                  alt={service.displayName}
                  width={24}
                  height={24}
                  className="h-6 w-6"
                />
              ) : (
                service.displayName.charAt(0)
              )}
            </div>
            <div>
              <CardTitle className="text-lg">{service.displayName}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {service.type === 'task_management' ? 'Task Management' : 'Calendar Service'}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {integration ? (
          <div className="space-y-3">
            {/* Sync Status */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last Sync</span>
              <span className="font-medium">
                {integration.lastSyncAt 
                  ? new Date(integration.lastSyncAt).toLocaleDateString()
                  : 'Never'
                }
              </span>
            </div>

            {integration.syncError && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200">
                <p className="text-sm text-red-800">{integration.syncError}</p>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={integration.isActive}
                  onCheckedChange={(checked) => onToggleActive(integration.id, checked)}
                  disabled={isSyncing}
                />
                <span className="text-sm font-medium">Active</span>
              </div>

              <div className="flex items-center gap-2">
                <Dialog open={showSettings} onOpenChange={setShowSettings}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{service.displayName} Settings</DialogTitle>
                      <DialogDescription>
                        Configure synchronization settings for {service.displayName}
                      </DialogDescription>
                    </DialogHeader>
                    <IntegrationSettings 
                      integration={integration} 
                      onClose={() => setShowSettings(false)} 
                    />
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSync('full_sync')}
                  disabled={isSyncing || !integration.isActive}
                >
                  <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
                  Sync
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDisconnect(integration.id)}
                >
                  <Unlink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect {service.displayName} to sync your tasks and events
            </p>
            
            <Button
              onClick={handleConnect}
              disabled={isConnecting || !service.isEnabled}
              className="w-full"
            >
              <Link className="h-4 w-4 mr-2" />
              {isConnecting ? 'Connecting...' : `Connect ${service.displayName}`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function IntegrationSettings({ integration, onClose }: { integration: any, onClose: () => void }) {
  const [settings, setSettings] = useState({
    autoSync: integration?.syncSettings?.autoSync ?? true,
    syncInterval: integration?.syncSettings?.syncInterval ?? 15,
    syncDirection: integration?.syncSettings?.syncDirection ?? 'two_way',
    syncTasks: integration?.syncSettings?.syncTasks ?? true,
    syncEvents: integration?.syncSettings?.syncEvents ?? true,
    conflictResolution: integration?.syncSettings?.conflictResolution ?? 'manual'
  })

  const handleSave = async () => {
    // Implementation would save settings to backend
    console.log('Saving settings:', settings)
    onClose()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">Auto Sync</label>
            <p className="text-xs text-muted-foreground">
              Automatically sync data at regular intervals
            </p>
          </div>
          <Switch
            checked={settings.autoSync}
            onCheckedChange={(checked) => 
              setSettings(prev => ({ ...prev, autoSync: checked }))
            }
          />
        </div>

        {settings.autoSync && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Sync Interval (minutes)</label>
            <input
              type="number"
              min="5"
              max="1440"
              value={settings.syncInterval}
              onChange={(e) => 
                setSettings(prev => ({ 
                  ...prev, 
                  syncInterval: parseInt(e.target.value) || 15 
                }))
              }
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Sync Direction</label>
          <select
            value={settings.syncDirection}
            onChange={(e) => 
              setSettings(prev => ({ 
                ...prev, 
                syncDirection: e.target.value 
              }))
            }
            className="w-full px-3 py-2 border border-border rounded-md bg-background"
          >
            <option value="one_way">One Way (External → DayFlow)</option>
            <option value="two_way">Two Way (Bidirectional)</option>
            <option value="manual">Manual Only</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Conflict Resolution</label>
          <select
            value={settings.conflictResolution}
            onChange={(e) => 
              setSettings(prev => ({ 
                ...prev, 
                conflictResolution: e.target.value 
              }))
            }
            className="w-full px-3 py-2 border border-border rounded-md bg-background"
          >
            <option value="manual">Manual (Ask User)</option>
            <option value="latest">Use Latest Version</option>
            <option value="source">Prefer External Source</option>
            <option value="merge">Merge Changes</option>
          </select>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">Data Types</label>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Tasks</span>
              <Switch
                checked={settings.syncTasks}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, syncTasks: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Calendar Events</span>
              <Switch
                checked={settings.syncEvents}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, syncEvents: checked }))
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save Settings
        </Button>
      </div>
    </div>
  )
}