'use client'

import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  EventOrTask,
} from '@/types/calendar'
import {
  formatEventTime,
  getDurationText,
  getEventDurationInMinutes,
} from '@/lib/date-utils'
import { cn } from '@/lib/utils'

interface CalendarEventProps {
  event: EventOrTask
  onClick?: (event: EventOrTask) => void
  onDoubleClick?: (event: EventOrTask) => void
  className?: string
  isDragging?: boolean
  isOverlay?: boolean
}

interface DraggableEventProps extends CalendarEventProps {
  onDragStart?: () => void
  onDragEnd?: (activeId: string, delta: { x: number; y: number }) => void
}

const getCategoryStyles = (categoryId?: string | null, isOverlay = false) => {
  const baseStyles = 'rounded-md border-2 p-3 cursor-pointer transition-all duration-200'
  const overlayStyles = isOverlay ? 'shadow-xl border-2 z-50' : 'hover:shadow-lg hover:scale-[1.02]'
  
  // Default styling for events/tasks without a category or unknown categories
  const defaultStyles = cn(
    'bg-gray-500/20 border-gray-500 text-gray-100',
    isOverlay ? 'bg-gray-500/30' : 'hover:bg-gray-500/30'
  )

  // Category-specific styling based on common patterns
  const categoryStyles: Record<string, string> = {
    work: cn(
      'bg-blue-500/20 border-blue-500 text-blue-100',
      isOverlay ? 'bg-blue-500/30' : 'hover:bg-blue-500/30'
    ),
    personal: cn(
      'bg-orange-500/20 border-orange-500 text-orange-100',
      isOverlay ? 'bg-orange-500/30' : 'hover:bg-orange-500/30'
    ),
  }

  // Use category-specific styling if available, otherwise use default
  const categoryStyle = categoryId ? categoryStyles[categoryId] || defaultStyles : defaultStyles

  return cn(baseStyles, categoryStyle, overlayStyles)
}

const EventContent: React.FC<CalendarEventProps> = ({
  event,
  onClick,
  onDoubleClick,
  className,
  isOverlay = false,
}) => {
  const duration = getEventDurationInMinutes(event)
  
  return (
    <motion.div
      className={cn(
        getCategoryStyles(event.categoryId, isOverlay),
        className
      )}
      onClick={() => onClick?.(event)}
      onDoubleClick={() => onDoubleClick?.(event)}
      whileHover={{ scale: isOverlay ? 1.02 : 1.05 }}
      whileTap={{ scale: 0.98 }}
      layout
      transition={{ duration: 0.2 }}
    >
      <div className="space-y-1">
        {/* Title */}
        <div className="font-semibold text-sm leading-tight truncate">
          {event.title}
        </div>

        {/* Time or duration */}
        <div className="text-xs opacity-90">
          {event.isAllDay ? (
            <span>All day</span>
          ) : (
            <span>{formatEventTime(event)}</span>
          )}
        </div>

        {/* Duration for longer events */}
        {duration >= 60 && !event.isAllDay && (
          <div className="text-xs opacity-75">
            {getDurationText(duration)}
          </div>
        )}

        {/* Location if available */}
        {event.location && (
          <div className="text-xs opacity-75 truncate">
            📍 {event.location}
          </div>
        )}

        {/* Description if available */}
        {event.description && (
          <div className="text-xs opacity-75 line-clamp-2">
            {event.description}
          </div>
        )}

        {/* Priority indicator for tasks */}
        {'priority' in event && (
          <div className="flex items-center gap-1">
            <div className={cn(
              'w-2 h-2 rounded-full',
              event.priority === 'urgent' && 'bg-red-400',
              event.priority === 'high' && 'bg-orange-400',
              event.priority === 'medium' && 'bg-yellow-400',
              event.priority === 'low' && 'bg-green-400'
            )} />
            <span className="text-xs opacity-75 capitalize">
              {event.priority}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

const DraggableEvent: React.FC<DraggableEventProps> = ({
  event,
  onClick,
  onDoubleClick,
  onDragStart,
  onDragEnd,
  className,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `event-${event.id}`,
    data: {
      event,
      type: 'event',
    },
    disabled: event.isAllDay, // Don't allow dragging all-day events
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="select-none"
      onMouseDown={() => onDragStart?.()}
      onMouseUp={() => onDragEnd?.(`event-${event.id}`, { x: transform?.x || 0, y: transform?.y || 0 })}
    >
      <EventContent
        event={event}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        className={cn(isDragging && 'opacity-50', className)}
      />
    </div>
  )
}

const StaticEvent: React.FC<CalendarEventProps> = ({
  event,
  onClick,
  onDoubleClick,
  className,
}) => {
  return (
    <EventContent
      event={event}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={className}
      isOverlay={false}
    />
  )
}

// Overlay component for showing the dragged event
const EventOverlay: React.FC<CalendarEventProps> = ({
  event,
  onClick,
  onDoubleClick,
  className,
}) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div className="absolute top-0 left-0 w-full h-full flex items-start justify-center pt-20">
        <div className="w-80 max-w-[90vw]">
          <EventContent
            event={event}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            className={className}
            isOverlay={true}
          />
        </div>
      </div>
    </div>
  )
}

// Main component that chooses between draggable and static
export const CalendarEvent: React.FC<CalendarEventProps & {
  draggable?: boolean
  onDragStart?: () => void
  onDragEnd?: (activeId: string, delta: { x: number; y: number }) => void
  overlay?: boolean
}> = ({
  event,
  onClick,
  onDoubleClick,
  draggable = true,
  onDragStart,
  onDragEnd,
  className,
  overlay = false,
}) => {
  if (overlay) {
    return (
      <EventOverlay
        event={event}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        className={className}
      />
    )
  }

  if (draggable && !event.isAllDay) {
    return (
      <DraggableEvent
        event={event}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className={className}
      />
    )
  }

  return (
    <StaticEvent
      event={event}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={className}
    />
  )
}

// Helper component for events with collision indicators
export const EventWithConflictIndicator: React.FC<CalendarEventProps & {
  hasConflict?: boolean
  conflictCount?: number
}> = ({
  event,
  onClick,
  onDoubleClick,
  hasConflict = false,
  conflictCount = 0,
  className,
}) => {
  return (
    <div className="relative">
      <CalendarEvent
        event={event}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        className={cn(
          hasConflict && 'ring-2 ring-red-500/50 ring-offset-1 ring-offset-background',
          className
        )}
      />
      {hasConflict && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {conflictCount}
        </div>
      )}
    </div>
  )
}

export default CalendarEvent