'use client'

import { useEffect } from 'react'
import { DashboardHeader } from '@/components/dashboard-header'
import { TaskList } from '@/components/task-list'
import { WeeklyCalendar } from '@/components/calendar/WeeklyCalendar'
import { StatsCards } from '@/components/stats-cards'
import { Sidebar } from '@/components/sidebar'
import { useWeeklyCalendarStore } from '@/stores/calendarStore'

export default function Dashboard() {
  const { initializeWithDemoData } = useWeeklyCalendarStore()

  // Initialize with demo data on first load
  useEffect(() => {
    initializeWithDemoData()
  }, [initializeWithDemoData])

  return (
    <div className="flex min-h-screen" data-testid="dashboard-page">
      <Sidebar />
      <div className="flex-1 ml-64 p-6">
        <div data-testid="main-content">
          <DashboardHeader />
          
          {/* Weekly Calendar - Full Width */}
          <div className="mt-6">
            <div className="bg-background border border-border rounded-lg overflow-hidden">
              <WeeklyCalendar />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2">
              <TaskList />
            </div>
            <div className="lg:col-span-1">
              <StatsCards />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}