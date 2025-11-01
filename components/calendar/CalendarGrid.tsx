'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useDroppable } from '@dnd-kit/core'
import {
  CalendarWeek,
  CalendarViewSettings,
  EventOrTask,
} from '@/types/calendar'
import { format } from 'date-fns'
import {
  generateTimeSlots,
  getEventsForDay,
  getDayDisplayText,
} from '@/lib/date-utils'
import { cn } from '@/lib/utils'

interface CalendarGridProps {
  currentWeek: CalendarWeek
  events: EventOrTask[]
  viewSettings: CalendarViewSettings
  onTimeSlotClick?: (date: Date, hour: number) => void
  className?: string
}

interface TimeSlotProps {
  date: Date
  hour: number
  dayIndex: number
  onClick?: (date: Date, hour: number) => void
}

interface DayColumnProps {
  day: CalendarWeek['days'][0]
  dayIndex: number
  timeSlots: Array<{ hour: number; label: string }>
  events: EventOrTask[]
  onTimeSlotClick?: (date: Date, hour: number) => void
}

const TimeSlot: React.FC<TimeSlotProps> = ({ date, hour, dayIndex, onClick }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${dayIndex}-${hour}`,
    data: {
      date,
      hour,
      dayIndex,
    },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer min-h-[60px]',
        isOver && 'bg-primary/10'
      )}
      onClick={() => onClick?.(date, hour)}
    />
  )
}

const DayColumn: React.FC<DayColumnProps> = ({
  day,
  dayIndex,
  timeSlots,
  events,
  onTimeSlotClick,
}) => {
  const dayEvents = getEventsForDay(events, day.date)

  return (
    <div className="flex-1 border-r border-border last:border-r-0">
      {/* Day header */}
      <div
        className={cn(
          'sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border p-3 text-center',
          day.isToday && 'bg-primary/10 text-primary font-semibold'
        )}
      >
        <div className="text-sm text-muted-foreground">
          {format(day.date, 'EEE')}
        </div>
        <div className={cn(
          'text-lg font-medium',
          day.isToday && 'text-primary'
        )}>
          {format(day.date, 'd')}
        </div>
      </div>

      {/* Time slots */}
      <div className="relative">
        {timeSlots.map((slot) => (
          <TimeSlot
            key={`slot-${dayIndex}-${slot.hour}`}
            date={day.date}
            hour={slot.hour}
            dayIndex={dayIndex}
            onClick={onTimeSlotClick}
          />
        ))}
      </div>

      {/* Events overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {dayEvents.map((event) => {
          // Skip events without time information
          if (!event.startTime || !event.endTime) {
            return null
          }
          
          const startHour = new Date(event.startTime).getHours()
          const startMinute = new Date(event.startTime).getMinutes()
          const endHour = new Date(event.endTime).getHours()
          const endMinute = new Date(event.endTime).getMinutes()
          
          const startPosition = ((startHour - timeSlots[0].hour) * 60 + startMinute) * (60 / 60) // 1px per minute
          const duration = ((endHour - startHour) * 60 + (endMinute - startMinute))
          const height = Math.max((duration * (60 / 60)), 30) // Minimum 30px height
          
          return (
            <motion.div
              key={event.id}
              className={cn(
                'absolute left-1 right-1 rounded-md border-2 p-2 text-xs font-medium pointer-events-auto',
                'hover:shadow-lg transition-all duration-200',
                event.categoryId === 'work' && 'bg-blue-500/20 border-blue-500 text-blue-100 hover:bg-blue-500/30',
                event.categoryId === 'family' && 'bg-green-500/20 border-green-500 text-green-100 hover:bg-green-500/30',
                event.categoryId === 'personal' && 'bg-orange-500/20 border-orange-500 text-orange-100 hover:bg-orange-500/30',
                event.categoryId === 'travel' && 'bg-purple-500/20 border-purple-500 text-purple-100 hover:bg-purple-500/30'
              )}
              style={{
                top: `${startPosition + 60}px`, // +60px for day header
                height: `${height}px`,
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="font-semibold truncate">{event.title}</div>
              {!event.isAllDay && (
                <div className="text-xs opacity-80 mt-1">
                  {format(new Date(event.startTime), 'HH:mm')} - {format(new Date(event.endTime), 'HH:mm')}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentWeek,
  events,
  viewSettings,
  onTimeSlotClick,
  className,
}) => {
  const timeSlots = generateTimeSlots(viewSettings)
  const daysToShow = viewSettings.showWeekends ? currentWeek.days : currentWeek.days.slice(0, 5)

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Time labels column */}
      <div className="flex">
        <div className="w-16 flex-shrink-0" />
        <div className="flex-1 grid grid-cols-5 border-b border-border">
          {daysToShow.map((day, index) => (
            <div
              key={day.date.toISOString()}
              className={cn(
                'p-3 text-center border-r border-border last:border-r-0',
                day.isToday && 'bg-primary/10'
              )}
            >
              <div className="text-sm text-muted-foreground">
                {format(day.date, 'EEE')}
              </div>
              <div className={cn(
                'text-lg font-medium',
                day.isToday && 'text-primary'
              )}>
                {format(day.date, 'd')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Time labels */}
        <div className="w-16 flex-shrink-0 bg-background">
          <div className="sticky top-[60px]"> {/* Height of day header */}
            {timeSlots.map((slot) => (
              <div
                key={slot.hour}
                className="h-[60px] flex items-start justify-end pr-2 text-xs text-muted-foreground border-b border-border/50"
              >
                {slot.label}
              </div>
            ))}
          </div>
        </div>

        {/* Calendar days */}
        <div className="flex-1 flex relative">
          {daysToShow.map((day, index) => {
            const dayEvents = getEventsForDay(events, day.date)
            return (
              <DayColumn
                key={day.date.toISOString()}
                day={day}
                dayIndex={index}
                timeSlots={timeSlots}
                events={dayEvents}
                onTimeSlotClick={onTimeSlotClick}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default CalendarGrid