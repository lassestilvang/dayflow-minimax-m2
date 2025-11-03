# Playwright with bunx - Comprehensive Guide

This guide provides comprehensive documentation for using Playwright with bunx in the DayFlow project. It covers all available commands, test modes, and practical examples to help developers effectively use Playwright for end-to-end testing.

## Table of Contents

- [Why bunx with Playwright?](#why-bunx-with-playwright)
- [Quick Start](#quick-start)
- [Available Commands](#available-commands)
- [Test Modes](#test-modes)
- [Browser Installation](#browser-installation)
- [Code Generation](#code-generation)
- [Test Reports](#test-reports)
- [Practical Examples](#practical-examples)
- [Configuration](#configuration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Why bunx with Playwright?

Using `bunx` with Playwright offers several advantages over traditional package managers:

### Speed and Performance
- **Faster execution**: bunx runs packages directly from npm without local installation
- **No dependency conflicts**: Each command uses the exact version specified
- **Instant updates**: No need to update package.json when Playwright releases new versions

### Developer Experience
- **Latest features**: Always use the latest Playwright version without updating package.json
- **Consistent environment**: Same Playwright version across all developers and CI/CD
- **Reduced disk usage**: No local Playwright installation per project
- **Zero configuration**: Works out of the box with existing configurations

### CI/CD Benefits
- **Reproducible builds**: Same version used in development and production
- **Faster CI pipelines**: Reduced download and installation time
- **Automatic updates**: Get bug fixes and new features immediately

## Quick Start

### Prerequisites
- bun installed (follow [bun.sh](https://bun.sh) installation guide)
- Project dependencies installed (`bun install`)

### First Run
```bash
# Install Playwright browsers (one-time setup)
bun run test:e2e:install

# Run all E2E tests
bun run test:e2e

# Run tests in UI mode for interactive debugging
bun run test:e2e:ui
```

## Available Commands

The project provides several pre-configured bunx Playwright commands:

### Test Execution
```bash
# Run all E2E tests
bun run test:e2e

# Run tests in UI mode (interactive)
bun run test:e2e:ui

# Run tests in debug mode
bun run test:e2e:debug

# Run tests in headed mode (visible browser)
bun run test:e2e:headed
```

### Browser Management
```bash
# Install Playwright browsers
bun run test:e2e:install

# Install Playwright browsers and system dependencies
bun run test:e2e:install-deps

# Update Playwright browsers
bun run test:e2e:install
```

### Development Tools
```bash
# Generate test code with codegen
bun run test:e2e:codegen

# View test reports
bun run test:e2e:show-report
```

### Advanced Usage
```bash
# Run specific test file
bunx playwright test tests/e2e/specific-test.spec.ts

# Run tests with custom config
bunx playwright test --config=playwright.custom.config.ts

# Run tests matching pattern
bunx playwright test --grep="task management"

# Run tests in specific browser
bunx playwright test --project=chromium

# Run tests with specific reporter
bunx playwright test --reporter=json
```

## Test Modes

### 1. Headless Mode (Default)
Runs tests without opening browser windows. Fastest for automated testing.

```bash
bun run test:e2e
```

**Use cases:**
- CI/CD pipelines
- Automated testing
- Quick test runs
- Large test suites

### 2. UI Mode
Interactive test runner with time-travel debugging.

```bash
bun run test:e2e:ui
```

**Features:**
- Step through tests
- Inspect selectors
- Time-travel debugging
- Live test results

**Use cases:**
- Debugging failing tests
- Writing new tests
- Understanding test flow
- Inspecting DOM state

### 3. Debug Mode
Runs tests in debug mode with detailed logging.

```bash
bun run test:e2e:debug
```

**Features:**
- Detailed console logs
- Step-by-step execution
- Inspector tools
- Slower execution for analysis

**Use cases:**
- Investigating complex issues
- Understanding test behavior
- Network debugging
- Performance analysis

### 4. Headed Mode
Runs tests with visible browser windows.

```bash
bun run test:e2e:headed
```

**Features:**
- See tests running in real-time
- Visual verification
- Manual interaction if needed

**Use cases:**
- Visual testing
- Demonstrations
- Complex debugging scenarios
- Accessibility testing

## Browser Installation

### Basic Installation
```bash
# Install all browsers (Chromium, Firefox, WebKit)
bun run test:e2e:install
```

### System Dependencies
```bash
# Install browsers and system dependencies
bun run test:e2e:install-deps
```

**Required for:**
- Linux environments
- CI/CD systems
- Server environments

### Browser-Specific Installation
```bash
# Install only specific browsers
bunx playwright install chromium
bunx playwright install firefox
bunx playwright install webkit
```

### Verification
```bash
# Verify installation
bunx playwright install --dry-run
```

## Code Generation

### Generate Test from User Actions
```bash
# Start codegen and record actions
bun run test:e2e:codegen

# Codegen with specific browser
bunx playwright codegen --browser=chromium

# Codegen with viewport settings
bunx playwright codegen --viewport-size=1280,720

# Codegen with specific URL
bunx playwright codegen http://localhost:3000
```

### Usage Workflow
1. Start codegen: `bun run test:e2e:codegen`
2. Navigate to your application
3. Perform actions you want to test
4. Stop codegen
5. Copy generated code to test file
6. Refactor and enhance as needed

### Example Generated Code
```typescript
import { test, expect } from '@playwright/test';

test('user workflow', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('[data-testid="new-task-button"]');
  await page.fill('[data-testid="task-title"]', 'Test Task');
  await page.click('[data-testid="save-task"]');
  await expect(page.locator('[data-testid="task-item"]')).toContainText('Test Task');
});
```

## Test Reports

### HTML Report
```bash
# Generate and open HTML report
bun run test:e2e
bun run test:e2e:show-report
```

### Available Reporters
The project is configured with multiple reporters:

1. **HTML** - Interactive web-based report
2. **JSON** - Machine-readable results (`test-results/results.json`)
3. **JUnit** - XML format for CI/CD integration (`test-results/junit.xml`)

### Custom Reporters
```bash
# Generate specific report format
bunx playwright test --reporter=json
bunx playwright test --reporter=junit
bunx playwright test --reporter=line
bunx playwright test --reporter=list
```

### CI/CD Integration
```bash
# Generate reports for CI
bunx playwright test --reporter=html,junit,json
```

## Practical Examples

### Example 1: Task Management Workflow
```typescript
import { test, expect } from '@playwright/test';

test.describe('Task Management', () => {
  test('should create and complete a task', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Create new task
    await page.click('[data-testid="new-task-button"]');
    await page.fill('[data-testid="task-title"]', 'Buy groceries');
    await page.fill('[data-testid="task-description"]', 'Weekly grocery shopping');
    await page.selectOption('[data-testid="task-priority"]', 'high');
    await page.click('[data-testid="save-task"]');
    
    // Verify task appears in list
    await expect(page.locator('[data-testid="task-item"]')).toContainText('Buy groceries');
    
    // Complete task
    await page.click('[data-testid="complete-task"]');
    await expect(page.locator('[data-testid="task-item"]')).toHaveClass(/completed/);
  });
});
```

**Run this test:**
```bash
bunx playwright test tests/e2e/task-management.spec.ts --headed
```

### Example 2: Calendar Integration
```typescript
import { test, expect } from '@playwright/test';

test.describe('Calendar Integration', () => {
  test('should create and drag event in calendar', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Switch to calendar view
    await page.click('[data-testid="calendar-tab"]');
    
    // Create new event
    await page.click('[data-testid="new-event-button"]');
    await page.fill('[data-testid="event-title"]', 'Team Meeting');
    await page.fill('[data-testid="event-start"]', '2024-01-15T10:00:00');
    await page.fill('[data-testid="event-end"]', '2024-01-15T11:00:00');
    await page.click('[data-testid="save-event"]');
    
    // Verify event in calendar
    await expect(page.locator('[data-testid="calendar-event"]')).toContainText('Team Meeting');
    
    // Drag event to new time
    await page.dragAndDrop(
      '[data-testid="calendar-event"]',
      '[data-testid="calendar-time-11:00"]'
    );
    
    // Verify time change
    await expect(page.locator('[data-testid="calendar-event"]')).toHaveAttribute(
      'data-time', '11:00'
    );
  });
});
```

### Example 3: Integration Sync Testing
```typescript
import { test, expect } from '@playwright/test';

test.describe('External Integration Sync', () => {
  test('should sync tasks with Notion', async ({ page }) => {
    // Setup mock integration
    await page.goto('/integrations');
    
    // Connect Notion
    await page.click('[data-testid="connect-notion"]');
    await page.fill('[data-testid="notion-token"]', 'test-token');
    await page.click('[data-testid="save-connection"]');
    
    // Trigger sync
    await page.click('[data-testid="sync-notion"]');
    
    // Wait for sync completion
    await expect(page.locator('[data-testid="sync-status"]')).toContainText('completed');
    
    // Verify sync results
    await expect(page.locator('[data-testid="synced-items"]')).toContainText('5 tasks synced');
  });
});
```

### Example 4: Responsive Testing
```typescript
import { test, expect, devices } from '@playwright/test';

test.describe('Mobile Responsiveness', () => {
  // Test on different devices
  for (const device of ['iPhone 12', 'Pixel 5']) {
    test(`should work on ${device}`, async ({ browser }) => {
      const context = await browser.newContext({
        ...devices[device],
      });
      const page = await context.newPage();
      
      await page.goto('/dashboard');
      
      // Test mobile-specific interactions
      await page.click('[data-testid="mobile-menu-button"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      // Test touch interactions
      await page.tap('[data-testid="task-item"]');
      
      await context.close();
    });
  }
});
```

**Run mobile tests:**
```bash
bunx playwright test --project="Mobile Chrome"
bunx playwright test --project="Mobile Safari"
```

## Configuration

### Playwright Configuration
The project uses `playwright.config.ts` with the following features:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Multiple reporters
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // Multiple browser projects
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Auto-start development server
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

### Environment Variables
```bash
# Test environment variables
PLAYWRIGHT_BROWSERS_PATH=/path/to/browsers
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0
PLAYWRIGHT_BASE_URL=http://localhost:3000

# CI-specific settings
CI=true
PLAYWRIGHT_WORKERS=1
PLAYWRIGHT_RETRIES=2
```

## Best Practices

### Test Organization
```typescript
// Good: Descriptive test names
test('should create task with valid data', async ({ page }) => {
  // Test implementation
});

// Good: Use test.describe for grouping
test.describe('Task CRUD operations', () => {
  test('should create task', async ({ page }) => { /* ... */ });
  test('should update task', async ({ page }) => { /* ... */ });
  test('should delete task', async ({ page }) => { /* ... */ });
});
```

### Selector Best Practices
```typescript
// Good: Use data-testid attributes
await page.click('[data-testid="save-button"]');

// Good: Use semantic selectors
await page.click('button[type="submit"]');
await page.fill('input[name="email"]', 'test@example.com');

// Avoid: Fragile selectors
await page.click('.btn.btn-primary.btn-large'); // Brittle
await page.click('div:nth-child(3) > button'); // Unreliable
```

### Test Data Management
```typescript
// Good: Use fixtures
import { testData } from '../fixtures/test-data';

test('should create task with fixture data', async ({ page }) => {
  const task = testData.validTask;
  await page.goto('/dashboard');
  // Use task data
});

// Good: Generate unique test data
test('should create unique task', async ({ page }) => {
  const uniqueTitle = `Task ${Date.now()}`;
  await page.fill('[data-testid="task-title"]', uniqueTitle);
  // Test with unique data
});
```

### Error Handling
```typescript
test('should handle network errors', async ({ page }) => {
  // Mock network failure
  await page.route('**/api/tasks', route => {
    route.fulfill({ status: 500, body: 'Server Error' });
  });
  
  await page.goto('/dashboard');
  
  // Verify error handling
  await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
});
```

### Performance Testing
```typescript
test('should load dashboard within 3 seconds', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  
  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(3000);
});
```

## Troubleshooting

### Common Issues

#### Browser Installation Failures
```bash
# Clear browser cache and reinstall
rm -rf ~/.cache/ms-playwright
bun run test:e2e:install-deps

# For CI environments
PLAYWRIGHT_BROWSERS_PATH=/tmp/browsers bun run test:e2e:install
```

#### Network Connectivity Issues
```bash
# Use proxy if behind corporate firewall
PLAYWRIGHT_DOWNLOAD_HOST=proxy.company.com bun run test:e2e:install

# Offline installation
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 bun run test:e2e
```

#### Port Conflicts
```bash
# Change development server port
PORT=3001 bun run dev

# Update Playwright config
webServer: {
  command: 'bun run dev --port 3001',
  url: 'http://localhost:3001',
  // ...
}
```

#### Test Timeouts
```typescript
// Increase timeout for slow tests
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // Test implementation
});

// Configure globally in playwright.config.ts
export default defineConfig({
  timeout: 30000, // 30 seconds
  // ...
});
```

#### Flaky Tests
```typescript
// Add retries for flaky tests
test.describe.configure({ retries: 2 });

// Use stable waits
await page.waitForSelector('[data-testid="element"]', { state: 'visible' });
await page.waitForLoadState('networkidle');
```

### Debug Commands

#### Verbose Logging
```bash
# Run with debug logging
DEBUG=pw:api bunx playwright test --reporter=line
```

#### Screenshots on Failure
```typescript
// Enable in playwright.config.ts
use: {
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
  trace: 'on-first-retry',
}
```

#### Browser Inspector
```bash
# Open browser inspector
PWDEBUG=console bunx playwright test

# Inspector mode
PWDEBUG=1 bunx playwright test --headed
```

### CI/CD Integration

#### GitHub Actions
```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: curl -fsSL https://bun.sh/install | bash
      - run: bun --version
      - run: bun install
      - run: bun run test:e2e:install-deps
      - run: bun run test:e2e
```

#### Jenkins Pipeline
```groovy
pipeline {
    agent any
    
    stages {
        stage('Install') {
            steps {
                sh 'curl -fsSL https://bun.sh/install | bash'
                sh 'export PATH="$HOME/.bun/bin:$PATH"'
                sh 'bun install'
            }
        }
        
        stage('E2E Tests') {
            steps {
                sh 'export PATH="$HOME/.bun/bin:$PATH"'
                sh 'bun run test:e2e:install-deps'
                sh 'bun run test:e2e'
            }
        }
    }
}
```

---

## Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Test Runner](https://playwright.dev/docs/test-runner)
- [bun Documentation](https://bun.sh/docs)
- [Testing Best Practices](./tests/README.md)

For questions or issues related to Playwright testing, please refer to the project's testing documentation or open an issue in the repository.