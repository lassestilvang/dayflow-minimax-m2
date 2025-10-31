"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckSquare, Clock, Plus } from "lucide-react"

export function TaskList() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Today&apos;s Tasks</CardTitle>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <CheckSquare className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Complete project setup</p>
              <p className="text-xs text-muted-foreground">Due today</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Review daily goals</p>
              <p className="text-xs text-muted-foreground">High priority</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}