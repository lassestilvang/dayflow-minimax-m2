/**
 * Sync Status Component
 * Real-time status display for synchronization operations
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  RefreshCw, 
  XCircle,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SyncJob {
  id: string
  operation: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  itemsProcessed: number
  itemsCreated: number
  itemsUpdated: number
  itemsDeleted: number
  conflicts: number
  errors: number
  startedAt: Date
  completedAt?: Date
  estimatedDuration?: number
}

interface SyncStatusProps {
  userId: string
  onJobAction?: (jobId: string, action: 'pause' | 'resume' | 'cancel') => void
  className?: string
}

export function SyncStatus({ userId, onJobAction, className }: SyncStatusProps) {
  const [jobs, setJobs] = useState<SyncJob[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadSyncJobs()
    
    // Set up real-time updates
    const interval = setInterval(loadSyncJobs, 2000)
    
    return () => clearInterval(interval)
  }, [userId])

  const loadSyncJobs = async () => {
    setIsRefreshing(true)
    try {
      // In a real implementation, this would fetch from the sync engine
      const response = await fetch(`/api/integrations/jobs?userId=${userId}`)
      const data = await response.json()
      setJobs(data.jobs || [])
    } catch (error) {
      console.error('Failed to load sync jobs:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const getStatusIcon = (status: SyncJob['status']) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: SyncJob['status']) => {
    const configs = {
      pending: { label: 'Pending', variant: 'secondary' as const },
      running: { label: 'Running', variant: 'default' as const },
      completed: { label: 'Completed', variant: 'default' as const },
      failed: { label: 'Failed', variant: 'destructive' as const },
      cancelled: { label: 'Cancelled', variant: 'secondary' as const }
    }

    const config = configs[status]
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {config.label}
      </Badge>
    )
  }

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date()
    const duration = end.getTime() - startTime.getTime()
    const seconds = Math.floor(duration / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  const getTotalItems = (job: SyncJob) => {
    return job.itemsProcessed + job.itemsCreated + job.itemsUpdated + job.itemsDeleted
  }

  if (jobs.length === 0) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">No active synchronizations</p>
          <p className="text-xs text-muted-foreground mt-1">
            Your integrations will appear here when syncing
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Synchronization Status</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadSyncJobs}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {jobs.map(job => (
          <Card key={job.id} className={cn(
            "transition-all duration-200",
            job.status === 'running' && "ring-1 ring-blue-200",
            job.status === 'failed' && "ring-1 ring-red-200"
          )}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base capitalize">
                    {job.operation.replace('_', ' ')} Sync
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Started {job.startedAt.toLocaleTimeString()} • 
                    Duration {formatDuration(job.startedAt, job.completedAt)}
                  </CardDescription>
                </div>
                {getStatusBadge(job.status)}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Progress Bar */}
              {job.status === 'running' && job.estimatedDuration && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span>{job.progress}%</span>
                  </div>
                  <Progress value={job.progress} className="h-2" />
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="font-semibold text-lg text-blue-600">
                    {getTotalItems(job)}
                  </div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="font-semibold text-lg text-green-600">
                    {job.itemsCreated}
                  </div>
                  <div className="text-xs text-muted-foreground">Created</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="font-semibold text-lg text-orange-600">
                    {job.itemsUpdated}
                  </div>
                  <div className="text-xs text-muted-foreground">Updated</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="font-semibold text-lg text-red-600">
                    {job.itemsDeleted}
                  </div>
                  <div className="text-xs text-muted-foreground">Deleted</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="font-semibold text-lg text-yellow-600">
                    {job.conflicts}
                  </div>
                  <div className="text-xs text-muted-foreground">Conflicts</div>
                </div>
              </div>

              {/* Conflicts and Errors */}
              {(job.conflicts > 0 || job.errors > 0) && (
                <div className="flex items-center gap-4 text-sm">
                  {job.conflicts > 0 && (
                    <div className="flex items-center gap-1 text-yellow-600">
                      <AlertCircle className="h-4 w-4" />
                      {job.conflicts} conflicts need resolution
                    </div>
                  )}
                  {job.errors > 0 && (
                    <div className="flex items-center gap-1 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {job.errors} errors occurred
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              {onJobAction && job.status === 'running' && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onJobAction(job.id, 'pause')}
                  >
                    <Pause className="h-4 w-4 mr-1" />
                    Pause
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onJobAction(job.id, 'cancel')}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              )}

              {onJobAction && job.status === 'completed' && job.conflicts > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/integrations/conflicts/${job.id}`, '_blank')}
                >
                  Resolve Conflicts
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}