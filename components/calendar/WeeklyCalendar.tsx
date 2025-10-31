'use client'

import React, { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
  closestCenter,
} from '@dnd-kit/core'
import { motion, AnimatePresence } from 'framer-motion'
import { format, addDays, setHours, setMinutes, isSameDay } from 'date-fns'

import {
  CalendarWeek,
  EventOrTask,
  CalendarViewSettings,
  CalendarDragDropData,
} from '@/types/calendar'
import {
  useWeeklyCalendarStore,
  useCurrentWeek,
  useViewSettings,
} from '@/stores/calendarStore'
import {
  snapToNearestSlot,
  getTimeFromSlot,
  checkEventCollision,
  calculateEventTopPosition,
  calculateEventHeight,
  getEventLeftPosition,
  getEventWidth,
  detectEventCollisions,
  getWeekFromDate,
} from '@/lib/date-utils'

import { WeekNavigation } from './WeekNavigation'
import { CalendarGrid } from './CalendarGrid'
import { CalendarEvent } from './CalendarEvent'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Calendar as CalendarIcon, Clock, MapPin, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

// Form Dialog Component
interface EventFormDialogProps {
  isOpen: boolean
  onClose: () => void
  event?: EventOrTask | null
  selectedDate?: Date
  selectedHour?: number
  onSave: (event: Omit<EventOrTask, 'id' | 'createdAt' | 'updatedAt'>) => void
}

const EventFormDialog: React.FC<EventFormDialogProps> = ({
  isOpen,
  onClose,
  event,
  selectedDate,
  selectedHour,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    startTime: event?.startTime ? new Date(event.startTime) : (selectedDate ? setHours(selectedDate, selectedHour || 9) : new Date()),
    endTime: event?.endTime ? new Date(event.endTime) : (selectedDate ? setHours(selectedDate, selectedHour ? selectedHour + 1 : 10) : new Date()),
    isAllDay: event?.isAllDay || false,
    location: event?.location || '',
    category: event?.category || 'work' as const,
    priority: event && 'priority' in event && event.priority ? event.priority : 'medium' as const,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const eventData = {
      ...formData,
      userId: 'user-1', // In a real app, this would come from auth
    }

    onSave(eventData as Omit<EventOrTask, 'id' | 'createdAt' | 'updatedAt'>)
    onClose()
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      startTime: new Date(),
      endTime: new Date(),
      isAllDay: false,
      location: '',
      category: 'work',
      priority: 'medium',
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {event ? 'Edit Event' : 'Create New Event'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Event title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Event description"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="allDay"
              checked={formData.isAllDay}
              onCheckedChange={(checked) => setFormData({ ...formData, isAllDay: checked })}
            />
            <Label htmlFor="allDay">All day event</Label>
          </div>

          {!formData.isAllDay && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={format(formData.startTime, 'HH:mm')}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':').map(Number)
                    setFormData({
                      ...formData,
                      startTime: setHours(setMinutes(formData.startTime, minutes), hours),
                    })
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={format(formData.endTime, 'HH:mm')}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':').map(Number)
                    setFormData({
                      ...formData,
                      endTime: setHours(setMinutes(formData.endTime, minutes), hours),
                    })
                  }}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Event location"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value: any) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="travel">Travel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!formData.isAllDay && (
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {event ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Main Weekly Calendar Component
export const WeeklyCalendar: React.FC = () => {
  // Store hooks
  const {
    currentWeek,
    events,
    tasks,
    viewSettings,
    error,
    selectedEvent,
    setCurrentWeek,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    addEvent,
    updateEvent,
    deleteEvent,
    moveEvent,
    selectEvent,
    setViewSettings,
    setError,
  } = useWeeklyCalendarStore()

  const allEvents = [...events, ...tasks]

  // Local state
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dragEvent, setDragEvent] = useState<EventOrTask | null>(null)
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [formEvent, setFormEvent] = useState<EventOrTask | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedHour, setSelectedHour] = useState<number | undefined>()

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Event handlers
  const handleEventClick = useCallback((event: EventOrTask) => {
    selectEvent(event)
  }, [selectEvent])

  const handleTimeSlotClick = useCallback((date: Date, hour: number) => {
    setSelectedDate(date)
    setSelectedHour(hour)
    setFormEvent(null)
    setShowFormDialog(true)
  }, [])

  const handleNewEvent = useCallback(() => {
    setFormEvent(null)
    setSelectedDate(undefined)
    setSelectedHour(undefined)
    setShowFormDialog(true)
  }, [])

  const handleEventEdit = useCallback((event: EventOrTask) => {
    setFormEvent(event)
    setShowFormDialog(true)
  }, [])

  const handleEventSave = useCallback((eventData: Omit<EventOrTask, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (formEvent) {
      // Update existing event
      updateEvent(formEvent.id, eventData)
    } else {
      // Create new event
      addEvent(eventData as any)
    }
  }, [formEvent, addEvent, updateEvent])

  const handleEventDelete = useCallback((eventId: string) => {
    if (eventId.startsWith('event-')) {
      const actualEventId = eventId.replace('event-', '')
      deleteEvent(actualEventId)
    }
  }, [deleteEvent])

  // Drag and drop handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    const draggedEvent = allEvents.find(e => `event-${e.id}` === event.active.id)
    setDragEvent(draggedEvent || null)
  }, [allEvents])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    // Handle drag over logic if needed
  }, [])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    
    setActiveId(null)
    setDragEvent(null)

    if (!over || !active.data.current?.event) {
      return
    }

    const draggedEvent = active.data.current.event as EventOrTask
    const overId = over.id as string

    // Handle drop on time slot
    if (overId.startsWith('slot-') && draggedEvent.startTime && draggedEvent.endTime) {
      const [, dayIndexStr, hourStr] = overId.split('-')
      const dayIndex = parseInt(dayIndexStr)
      const hour = parseInt(hourStr)

      const newDate = getTimeFromSlot(dayIndex, hour)
      const duration = new Date(draggedEvent.endTime).getTime() - new Date(draggedEvent.startTime).getTime()
      const newEndTime = new Date(newDate.getTime() + duration)

      const success = await moveEvent(draggedEvent.id, newDate, newEndTime)
      if (!success && error) {
        // Show error message
        console.error('Failed to move event:', error)
      }
    }
  }, [moveEvent, error])

  const handleWeekChange = useCallback((week: CalendarWeek) => {
    setCurrentWeek(week)
  }, [setCurrentWeek])

  const handleViewModeChange = useCallback((view: 'week' | 'month' | 'day') => {
    setViewSettings({ defaultView: view })
  }, [setViewSettings])

  const handleShowWeekendsChange = useCallback((show: boolean) => {
    setViewSettings({ showWeekends: show })
  }, [setViewSettings])

  // Get collision information
  const eventCollisions = React.useMemo(() => {
    return detectEventCollisions(allEvents)
  }, [allEvents])

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Week Navigation */}
      <WeekNavigation
        currentWeek={currentWeek}
        viewSettings={viewSettings}
        onWeekChange={handleWeekChange}
        onTodayClick={goToCurrentWeek}
        onNewEvent={handleNewEvent}
        onViewModeChange={handleViewModeChange}
        onShowWeekendsChange={handleShowWeekendsChange}
      />

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2 flex items-center gap-2"
          >
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="h-auto p-1 ml-auto text-red-500 hover:text-red-600"
            >
              ×
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calendar Grid with DnD Context */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-hidden">
          <CalendarGrid
            currentWeek={currentWeek}
            events={allEvents}
            viewSettings={viewSettings}
            onTimeSlotClick={handleTimeSlotClick}
          />

          {/* Drag Overlay */}
          <DragOverlay>
            {activeId && dragEvent ? (
              <CalendarEvent
                event={dragEvent}
                draggable={false}
                overlay={true}
                className="shadow-xl"
              />
            ) : null}
          </DragOverlay>
        </div>
      </DndContext>

      {/* Event Form Dialog */}
      <EventFormDialog
        isOpen={showFormDialog}
        onClose={() => setShowFormDialog(false)}
        event={formEvent}
        selectedDate={selectedDate}
        selectedHour={selectedHour}
        onSave={handleEventSave}
      />

      {/* Event Details Panel (Optional) */}
      {selectedEvent && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="absolute top-4 right-4 w-80 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-4 shadow-xl z-20"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Event Details</h3>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEventEdit(selectedEvent)}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEventDelete(`event-${selectedEvent.id}`)}
                className="text-red-500 hover:text-red-600"
              >
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => selectEvent(null)}
              >
                ×
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-lg">{selectedEvent.title}</h4>
              {selectedEvent.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedEvent.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              <span>
                {selectedEvent.startTime ? format(new Date(selectedEvent.startTime), 'EEEE, MMMM d, yyyy') : 'No date'}
              </span>
            </div>

            {!selectedEvent.isAllDay && selectedEvent.startTime && selectedEvent.endTime && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {format(new Date(selectedEvent.startTime), 'HH:mm')} - {format(new Date(selectedEvent.endTime), 'HH:mm')}
                </span>
              </div>
            )}

            {selectedEvent.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{selectedEvent.location}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {selectedEvent.category}
              </Badge>
              {'priority' in selectedEvent && (
                <Badge 
                  variant={
                    selectedEvent.priority === 'urgent' ? 'destructive' :
                    selectedEvent.priority === 'high' ? 'default' :
                    'secondary'
                  }
                  className="capitalize"
                >
                  {selectedEvent.priority}
                </Badge>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default WeeklyCalendar