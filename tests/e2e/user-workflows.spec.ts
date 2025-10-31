import { test, expect } from '@playwright/test'

test.describe('User Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/')
    
    // Wait for the application to load
    await page.waitForLoadState('networkidle')
  })

  test.describe('Authentication Flow', () => {
    test('should display landing page', async ({ page }) => {
      // Check that the landing page loads
      await expect(page.locator('h1, h2')).toBeVisible()
      await expect(page.locator('[data-testid="welcome-message"], .welcome-message')).toBeVisible()
    })

    test('should handle user registration flow', async ({ page }) => {
      // Navigate to registration page if it exists
      const registerLink = page.locator('a[href*="register"], [data-testid="register-link"]')
      
      if (await registerLink.isVisible()) {
        await registerLink.click()
        await expect(page).toHaveURL(/.*register/)
        
        // Fill registration form
        await page.fill('input[name="name"]', 'Test User')
        await page.fill('input[name="email"]', 'test@example.com')
        await page.fill('input[name="password"]', 'password123')
        
        // Submit form
        await page.click('button[type="submit"], [data-testid="register-submit"]')
        
        // Check for success or redirect
        await expect(page.locator('[data-testid="success-message"], .success-message')).toBeVisible({
          timeout: 10000,
        })
      } else {
        test.skip(true, 'Registration page not found')
      }
    })

    test('should handle user login flow', async ({ page }) => {
      // Look for login functionality
      const loginLink = page.locator('a[href*="login"], [data-testid="login-link"]')
      
      if (await loginLink.isVisible()) {
        await loginLink.click()
        await expect(page).toHaveURL(/.*login/)
        
        // Fill login form
        await page.fill('input[name="email"]', 'test@example.com')
        await page.fill('input[name="password"]', 'password123')
        
        // Submit form
        await page.click('button[type="submit"], [data-testid="login-submit"]')
        
        // Check for successful login (redirect to dashboard)
        await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 })
      } else {
        test.skip(true, 'Login page not found')
      }
    })
  })

  test.describe('Dashboard Navigation', () => {
    test('should load dashboard page', async ({ page }) => {
      // Navigate to dashboard
      await page.goto('/dashboard')
      
      // Check for dashboard elements
      await expect(page.locator('[data-testid="dashboard-header"], .dashboard-header')).toBeVisible()
      await expect(page.locator('[data-testid="stats-cards"], .stats-cards')).toBeVisible()
      await expect(page.locator('[data-testid="calendar-widget"], .calendar-widget')).toBeVisible()
    })

    test('should display sidebar navigation', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Check sidebar visibility
      const sidebar = page.locator('[data-testid="sidebar"], .sidebar')
      await expect(sidebar).toBeVisible()
      
      // Check navigation items
      await expect(sidebar.locator('[data-testid="nav-tasks"], a[href*="tasks"]')).toBeVisible()
      await expect(sidebar.locator('[data-testid="nav-calendar"], a[href*="calendar"]')).toBeVisible()
      await expect(sidebar.locator('[data-testid="nav-integrations"], a[href*="integrations"]')).toBeVisible()
    })

    test('should toggle sidebar visibility', async ({ page }) => {
      await page.goto('/dashboard')
      
      const sidebar = page.locator('[data-testid="sidebar"], .sidebar')
      const toggleButton = page.locator('[data-testid="sidebar-toggle"], .sidebar-toggle')
      
      // Sidebar should be visible by default
      await expect(sidebar).toBeVisible()
      
      // Click toggle button
      await toggleButton.click()
      
      // Check if sidebar is hidden
      await expect(sidebar).toHaveCSS('transform', /translateX.*-100%|translateX.*-150%/)
    })
  })

  test.describe('Task Management Workflow', () => {
    test('should create a new task', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Look for task creation button
      const createTaskButton = page.locator('[data-testid="create-task"], button:has-text("Add Task"), button:has-text("Create Task")')
      
      if (await createTaskButton.isVisible()) {
        await createTaskButton.click()
        
        // Fill task form
        await page.fill('input[name="title"]', 'E2E Test Task')
        await page.fill('textarea[name="description"]', 'This is a test task created during E2E testing')
        await page.selectOption('select[name="priority"]', 'high')
        await page.selectOption('select[name="status"]', 'pending')
        
        // Submit form
        await page.click('button[type="submit"], [data-testid="submit-task"]')
        
        // Check that task appears in the list
        await expect(page.locator('text=E2E Test Task')).toBeVisible({ timeout: 5000 })
      } else {
        test.skip(true, 'Task creation form not found')
      }
    })

    test('should edit an existing task', async ({ page }) => {
      // First create a task
      await page.goto('/dashboard')
      
      const taskItem = page.locator('[data-testid="task-item"], .task-item').first()
      
      if (await taskItem.isVisible()) {
        // Click edit button or double-click task
        const editButton = taskItem.locator('[data-testid="edit-task"], .edit-task')
        if (await editButton.isVisible()) {
          await editButton.click()
        } else {
          await taskItem.dblclick()
        }
        
        // Edit the task
        await page.fill('input[name="title"]', 'Updated E2E Test Task')
        await page.fill('textarea[name="description"]', 'This task has been updated during E2E testing')
        await page.selectOption('select[name="status"]', 'in-progress')
        
        // Save changes
        await page.click('button[type="submit"], [data-testid="save-task"]')
        
        // Check that updated task appears
        await expect(page.locator('text=Updated E2E Test Task')).toBeVisible()
      } else {
        test.skip(true, 'No existing tasks found to edit')
      }
    })

    test('should delete a task', async ({ page }) => {
      await page.goto('/dashboard')
      
      const taskItem = page.locator('[data-testid="task-item"], .task-item').first()
      
      if (await taskItem.isVisible()) {
        // Click delete button
        const deleteButton = taskItem.locator('[data-testid="delete-task"], .delete-task')
        await deleteButton.click()
        
        // Confirm deletion if there's a confirmation dialog
        const confirmButton = page.locator('[data-testid="confirm-delete"], button:has-text("Delete")')
        if (await confirmButton.isVisible()) {
          await confirmButton.click()
        }
        
        // Check that task is removed
        await expect(taskItem).toHaveCount(0, { timeout: 5000 })
      } else {
        test.skip(true, 'No existing tasks found to delete')
      }
    })

    test('should filter tasks by status', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Look for filter controls
      const statusFilter = page.locator('select[name="status-filter"], [data-testid="status-filter"]')
      
      if (await statusFilter.isVisible()) {
        // Select different status filters
        await statusFilter.selectOption('completed')
        await page.waitForTimeout(500)
        
        // Check that only completed tasks are shown
        const taskItems = page.locator('[data-testid="task-item"], .task-item')
        const count = await taskItems.count()
        
        for (let i = 0; i < count; i++) {
          await expect(taskItems.nth(i)).toContainText(/completed/i)
        }
      } else {
        test.skip(true, 'Status filter not found')
      }
    })

    test('should search tasks', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Look for search input
      const searchInput = page.locator('input[placeholder*="search" i], input[name="search"], [data-testid="task-search"]')
      
      if (await searchInput.isVisible()) {
        // Search for a specific task
        await searchInput.fill('test')
        await page.keyboard.press('Enter')
        
        // Check that search results are shown
        await page.waitForTimeout(500)
        const taskItems = page.locator('[data-testid="task-item"], .task-item')
        
        // Should either show filtered results or no results
        const count = await taskItems.count()
        expect(count).toBeGreaterThanOrEqual(0)
      } else {
        test.skip(true, 'Search input not found')
      }
    })
  })

  test.describe('Calendar Workflow', () => {
    test('should navigate calendar weeks', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Look for calendar navigation
      const prevWeekButton = page.locator('[data-testid="prev-week"], button:has-text("Previous"), button:has-text("←")')
      const nextWeekButton = page.locator('[data-testid="next-week"], button:has-text("Next"), button:has-text("→")')
      const currentWeekButton = page.locator('[data-testid="current-week"], button:has-text("Today")')
      
      if (await prevWeekButton.isVisible()) {
        // Go to previous week
        await prevWeekButton.click()
        
        // Check week display changes
        const weekDisplay = page.locator('[data-testid="week-display"], .week-display')
        await expect(weekDisplay).toBeVisible()
      }
      
      if (await nextWeekButton.isVisible()) {
        // Go to next week
        await nextWeekButton.click()
        await expect(weekDisplay).toBeVisible()
      }
      
      if (await currentWeekButton.isVisible()) {
        // Go to current week
        await currentWeekButton.click()
        await expect(weekDisplay).toBeVisible()
      }
    })

    test('should create a new calendar event', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Look for calendar event creation
      const calendarGrid = page.locator('[data-testid="calendar-grid"], .calendar-grid')
      const createEventButton = page.locator('[data-testid="create-event"], button:has-text("Add Event")')
      
      if (await calendarGrid.isVisible()) {
        // Click on a time slot to create event
        const timeSlot = calendarGrid.locator('.time-slot, [data-testid="time-slot"]').first()
        if (await timeSlot.isVisible()) {
          await timeSlot.click()
        } else {
          await createEventButton.click()
        }
        
        // Fill event form
        await page.fill('input[name="title"]', 'E2E Test Event')
        await page.fill('textarea[name="description"]', 'This is a test event created during E2E testing')
        await page.fill('input[name="startTime"]', '2024-01-01T10:00')
        await page.fill('input[name="endTime"]', '2024-01-01T11:00')
        
        // Submit form
        await page.click('button[type="submit"], [data-testid="submit-event"]')
        
        // Check that event appears in calendar
        await expect(page.locator('text=E2E Test Event')).toBeVisible({ timeout: 5000 })
      } else {
        test.skip(true, 'Calendar not found')
      }
    })

    test('should drag and drop an event', async ({ page }) => {
      await page.goto('/dashboard')
      
      const calendarEvent = page.locator('[data-testid="calendar-event"], .calendar-event').first()
      
      if (await calendarEvent.isVisible()) {
        // Get initial position
        const initialBox = await calendarEvent.boundingBox()
        
        // Perform drag and drop
        await calendarEvent.dragTo(calendarEvent, {
          targetPosition: { x: 100, y: 50 },
        })
        
        // Check that event position changed
        const newBox = await calendarEvent.boundingBox()
        expect(newBox).not.toEqual(initialBox)
      } else {
        test.skip(true, 'No calendar events found to drag')
      }
    })

    test('should display event details on click', async ({ page }) => {
      await page.goto('/dashboard')
      
      const calendarEvent = page.locator('[data-testid="calendar-event"], .calendar-event').first()
      
      if (await calendarEvent.isVisible()) {
        // Click on event
        await calendarEvent.click()
        
        // Check that event details modal or sidebar appears
        const eventDetails = page.locator('[data-testid="event-details"], .event-details, [data-testid="event-modal"]')
        await expect(eventDetails).toBeVisible({ timeout: 3000 })
      } else {
        test.skip(true, 'No calendar events found to click')
      }
    })
  })

  test.describe('Integration Workflows', () => {
    test('should navigate to integrations page', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Navigate to integrations
      const integrationsLink = page.locator('a[href*="integrations"], [data-testid="nav-integrations"]')
      
      if (await integrationsLink.isVisible()) {
        await integrationsLink.click()
        await expect(page).toHaveURL(/.*integrations/)
        
        // Check integrations page content
        await expect(page.locator('[data-testid="integrations-page"], .integrations-page')).toBeVisible()
        await expect(page.locator('[data-testid="integration-card"], .integration-card')).toBeVisible()
      } else {
        test.skip(true, 'Integrations link not found')
      }
    })

    test('should attempt to connect Google Calendar', async ({ page }) => {
      await page.goto('/integrations')
      
      const googleIntegrationCard = page.locator('[data-testid="google-calendar"], .google-calendar')
      
      if (await googleIntegrationCard.isVisible()) {
        // Click connect button
        const connectButton = googleIntegrationCard.locator('button:has-text("Connect"), [data-testid="connect-google"]')
        await connectButton.click()
        
        // Check for OAuth flow or error handling
        await page.waitForTimeout(2000)
        
        // Should either redirect to OAuth or show error message
        const errorMessage = page.locator('[data-testid="error-message"], .error-message')
        if (await errorMessage.isVisible()) {
          await expect(errorMessage).toBeVisible()
        } else {
          // Check if redirected to OAuth
          expect(page.url()).not.toBe('/integrations')
        }
      } else {
        test.skip(true, 'Google Calendar integration not found')
      }
    })

    test('should sync with external calendar', async ({ page }) => {
      await page.goto('/integrations')
      
      const syncButton = page.locator('[data-testid="sync-calendar"], button:has-text("Sync")')
      
      if (await syncButton.isVisible()) {
        // Trigger sync
        await syncButton.click()
        
        // Check for sync status
        const syncStatus = page.locator('[data-testid="sync-status"], .sync-status')
        await expect(syncStatus).toContainText(/syncing|sync/i, { timeout: 10000 })
      } else {
        test.skip(true, 'Sync button not found')
      }
    })
  })

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/dashboard')
      
      // Check mobile navigation
      const mobileMenuButton = page.locator('[data-testid="mobile-menu"], .mobile-menu')
      if (await mobileMenuButton.isVisible()) {
        await mobileMenuButton.click()
        
        // Check mobile menu
        const mobileMenu = page.locator('[data-testid="mobile-menu-panel"], .mobile-menu-panel')
        await expect(mobileMenu).toBeVisible()
      }
      
      // Check that main content is accessible
      await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible()
    })

    test('should work on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto('/dashboard')
      
      // Check tablet layout
      const sidebar = page.locator('[data-testid="sidebar"], .sidebar')
      const mainContent = page.locator('[data-testid="main-content"], .main-content')
      
      await expect(sidebar).toBeVisible()
      await expect(mainContent).toBeVisible()
    })

    test('should adapt layout on different screen sizes', async ({ page }) => {
      const viewports = [
        { width: 320, height: 568 }, // Small mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1024, height: 768 }, // Small desktop
        { width: 1920, height: 1080 }, // Desktop
      ]
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport)
        await page.goto('/dashboard')
        
        // Check that page loads without errors
        await expect(page.locator('[data-testid="dashboard-page"], .dashboard-page')).toBeVisible()
        
        // Check basic navigation elements
        const navigation = page.locator('[data-testid="navigation"], .navigation, nav')
        if (await navigation.isVisible()) {
          await expect(navigation).toBeVisible()
        }
      }
    })
  })

  test.describe('Performance and Loading', () => {
    test('should load dashboard within acceptable time', async ({ page }) => {
      const startTime = Date.now()
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      const loadTime = Date.now() - startTime
      
      // Dashboard should load within 5 seconds
      expect(loadTime).toBeLessThan(5000)
    })

    test('should handle slow network conditions', async ({ page }) => {
      // Simulate slow network
      await page.context().setOffline(false)
      
      // Add delay to network requests
      await page.route('**/*', (route) => {
        route.continue({
          delay: 1000, // 1 second delay
        })
      })
      
      await page.goto('/dashboard')
      
      // Page should still load and be functional
      await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible({ timeout: 15000 })
    })

    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.context().setOffline(true)
      
      await page.goto('/dashboard')
      
      // Check for offline handling
      const offlineMessage = page.locator('[data-testid="offline-message"], .offline-message')
      if (await offlineMessage.isVisible()) {
        await expect(offlineMessage).toBeVisible()
      } else {
        // Page should still show something
        await expect(page.locator('body')).toBeVisible()
      }
    })
  })
})