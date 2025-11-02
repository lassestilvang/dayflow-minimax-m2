"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Plus } from "lucide-react"

export function CalendarWidget() {
  return (
    <Card data-testid="calendar-widget">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Calendar</CardTitle>
        <Plus className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={new Date()}
          className="rounded-md border"
        />
      </CardContent>
    </Card>
  )
}