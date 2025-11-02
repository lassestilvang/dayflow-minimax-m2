'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Plus,
  Settings,
  Users,
  Filter
} from 'lucide-react'
import {
  CalendarWeek,
  CalendarViewSettings,
} from '@/types/calendar'
import { format, isToday } from 'date-fns'
import {
  getCurrentWeek,
  getPreviousWeek,
  getNextWeek,
  getWeekDisplayText,
} from '@/lib/date-utils'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface WeekNavigationProps {
  currentWeek: CalendarWeek
  viewSettings: CalendarViewSettings
  onWeekChange: (week: CalendarWeek) => void
  onTodayClick?: () => void
  onNewEvent?: () => void
  onSettingsClick?: () => void
  onViewModeChange?: (view: 'week' | 'month' | 'day') => void
  onShowWeekendsChange?: (show: boolean) => void
  className?: string
}

interface NavigationButtonProps {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
  className?: string
  tooltip?: string
}

const NavigationButton: React.FC<NavigationButtonProps> = ({
  onClick,
  disabled = false,
  children,
  className,
  tooltip,
}) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-8 w-8 p-0 hover:bg-muted/80 transition-colors',
        className
      )}
      title={tooltip}
    >
      {children}
    </Button>
  )
}

const WeekDisplay: React.FC<{ week: CalendarWeek }> = ({ week }) => {
  // Ensure we have valid Date objects, convert from string if needed
  const safeWeek = {
    ...week,
    startDate: week.startDate instanceof Date ? week.startDate : new Date(week.startDate),
    endDate: week.endDate instanceof Date ? week.endDate : new Date(week.endDate),
    days: week.days?.map(day => ({
      ...day,
      date: day.date instanceof Date ? day.date : new Date(day.date)
    })) || []
  }
  
  const currentWeek = getCurrentWeek()
  const isCurrentWeek = currentWeek.startDate.getTime() === safeWeek.startDate.getTime()
  
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        <div className="text-lg font-semibold">
          {getWeekDisplayText(safeWeek)}
        </div>
        {isCurrentWeek && (
          <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-md">
            This Week
          </span>
        )}
      </div>
    </div>
  )
}

const QuickActions: React.FC<{
  onTodayClick: () => void
  onNewEvent: () => void
  onSettingsClick: () => void
}> = ({ onTodayClick, onNewEvent, onSettingsClick }) => {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={onTodayClick}
        className="h-8 px-3 text-xs"
      >
        Today
      </Button>
      <NavigationButton
        onClick={onNewEvent}
        tooltip="Add new event"
        className="text-primary hover:text-primary"
      >
        <Plus className="h-4 w-4" />
      </NavigationButton>
      <NavigationButton
        onClick={onSettingsClick}
        tooltip="Calendar settings"
      >
        <Settings className="h-4 w-4" />
      </NavigationButton>
    </div>
  )
}

const ViewModeSelector: React.FC<{
  currentView: 'week' | 'month' | 'day'
  onViewChange: (view: 'week' | 'month' | 'day') => void
}> = ({ currentView, onViewChange }) => {
  const views = [
    { key: 'week', label: 'Week', count: 7 } as const,
    { key: 'month', label: 'Month', count: 30 } as const,
    { key: 'day', label: 'Day', count: 1 } as const,
  ]

  return (
    <div className="flex items-center bg-muted/50 rounded-md p-1">
      {views.map((view) => (
        <Button
          key={view.key}
          variant={currentView === view.key ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewChange(view.key)}
          className={cn(
            'h-7 px-3 text-xs font-medium transition-all',
            currentView === view.key 
              ? 'bg-background shadow-sm' 
              : 'hover:bg-background/50'
          )}
        >
          {view.label}
        </Button>
      ))}
    </div>
  )
}

const WeekendsToggle: React.FC<{
  showWeekends: boolean
  onToggle: (show: boolean) => void
}> = ({ showWeekends, onToggle }) => {
  return (
    <Button
      variant={showWeekends ? 'default' : 'outline'}
      size="sm"
      onClick={() => onToggle(!showWeekends)}
      className="h-8 px-3 text-xs"
    >
      Weekends {showWeekends ? 'On' : 'Off'}
    </Button>
  )
}

export const WeekNavigation: React.FC<WeekNavigationProps> = ({
  currentWeek,
  viewSettings,
  onWeekChange,
  onTodayClick,
  onNewEvent,
  onSettingsClick,
  onViewModeChange,
  onShowWeekendsChange,
  className,
}) => {
  const handlePreviousWeek = () => {
    const previousWeek = getPreviousWeek(currentWeek)
    onWeekChange(previousWeek)
  }

  const handleNextWeek = () => {
    const nextWeek = getNextWeek(currentWeek)
    onWeekChange(nextWeek)
  }

  const handleTodayClick = () => {
    const today = getCurrentWeek()
    onWeekChange(today)
    onTodayClick?.()
  }

  const handleViewModeChange = (view: 'week' | 'month' | 'day') => {
    onViewModeChange?.(view)
  }

  const handleShowWeekendsChange = (show: boolean) => {
    onShowWeekendsChange?.(show)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex items-center justify-between bg-background/95 backdrop-blur-sm border-b border-border p-4',
        className
      )}
    >
      {/* Left section - Week navigation */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <NavigationButton
            onClick={handlePreviousWeek}
            tooltip="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </NavigationButton>
          
          <WeekDisplay week={currentWeek} />
          
          <NavigationButton
            onClick={handleNextWeek}
            tooltip="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </NavigationButton>
        </div>
      </div>

      {/* Center section - View mode and weekend toggle */}
      <div className="flex items-center gap-3">
        <ViewModeSelector
          currentView={viewSettings.defaultView}
          onViewChange={handleViewModeChange}
        />
        <WeekendsToggle
          showWeekends={viewSettings.showWeekends}
          onToggle={handleShowWeekendsChange}
        />
      </div>

      {/* Right section - Quick actions */}
      <QuickActions
        onTodayClick={handleTodayClick}
        onNewEvent={onNewEvent || (() => {})}
        onSettingsClick={onSettingsClick || (() => {})}
      />
    </motion.div>
  )
}

// Compact version for smaller spaces
export const CompactWeekNavigation: React.FC<Omit<WeekNavigationProps, 'className'> & {
  className?: string
}> = (props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex items-center justify-between bg-background/95 backdrop-blur-sm border-b border-border px-4 py-2',
        props.className
      )}
    >
      {/* Compact navigation */}
      <div className="flex items-center gap-2">
        <NavigationButton
          onClick={() => props.onWeekChange(getPreviousWeek(props.currentWeek))}
          tooltip="Previous week"
        >
          <ChevronLeft className="h-4 w-4" />
        </NavigationButton>
        
        <div className="text-sm font-medium min-w-0">
          {getWeekDisplayText(props.currentWeek)}
        </div>
        
        <NavigationButton
          onClick={() => props.onWeekChange(getNextWeek(props.currentWeek))}
          tooltip="Next week"
        >
          <ChevronRight className="h-4 w-4" />
        </NavigationButton>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => props.onWeekChange(getCurrentWeek())}
          className="h-7 px-2 text-xs"
        >
          Today
        </Button>
        <NavigationButton
          onClick={props.onNewEvent || (() => {})}
          tooltip="Add event"
          className="text-primary hover:text-primary h-7 w-7"
        >
          <Plus className="h-3 w-3" />
        </NavigationButton>
      </div>
    </motion.div>
  )
}

export default WeekNavigation