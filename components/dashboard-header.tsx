"use client"

import { Button } from "@/components/ui/button"
import { Bell, User } from "lucide-react"

export function DashboardHeader() {
  return (
    <div className="flex items-center justify-between" data-testid="dashboard-header">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back to DayFlow</p>
      </div>
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <User className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}