#!/usr/bin/env node

/**
 * Comprehensive Test Runner for DayFlow Application
 * Supports running different test suites with various configurations
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

class TestRunner {
  constructor() {
    this.testTypes = {
      unit: {
        command: 'npm run test:unit',
        description: 'Unit tests for individual components and functions',
        patterns: ['tests/unit/**/*.test.ts'],
      },
      integration: {
        command: 'npm run test:integration',
        description: 'Integration tests for API endpoints and services',
        patterns: ['tests/integration/**/*.test.ts'],
      },
      e2e: {
        command: 'npm run test:e2e',
        description: 'End-to-end tests for complete user workflows',
        patterns: ['tests/e2e/**/*.spec.ts'],
      },
      performance: {
        command: 'npm run test:perf',
        description: 'Performance and load testing',
        patterns: ['tests/perf/**/*.test.ts'],
      },
      smoke: {
        command: 'npm run test:smoke',
        description: 'Quick smoke tests to verify basic functionality',
        patterns: ['tests/smoke/**/*.test.ts'],
      },
      regression: {
        command: 'npm run test:regression',
        description: 'Regression tests for known issues',
        patterns: ['tests/regression/**/*.test.ts'],
      },
      coverage: {
        command: 'npm run test:coverage',
        description: 'Test coverage analysis',
        patterns: ['tests/**/*.test.ts'],
      },
      all: {
        command: 'npm run test:all',
        description: 'Run all tests',
        patterns: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
      },
    }
  }

  async runTestSuite(testType, options = {}) {
    const suite = this.testTypes[testType]
    if (!suite) {
      throw new Error(`Unknown test type: ${testType}`)
    }

    console.log(`\n🚀 Running ${suite.description}...`)
    console.log(`📁 Test patterns: ${suite.patterns.join(', ')}`)

    try {
      const command = this.buildCommand(suite.command, options)
      console.log(`⚡ Executing: ${command}\n`)
      
      const startTime = Date.now()
      const result = execSync(command, {
        stdio: 'pipe',
        encoding: 'utf8',
        cwd: process.cwd(),
      })
      const duration = Date.now() - startTime

      console.log(`\n✅ ${testType} tests completed successfully in ${duration}ms`)
      console.log(result)

      if (options.generateReport) {
        await this.generateReport(testType, { duration, success: true })
      }

      return { success: true, duration, output: result }
    } catch (error) {
      console.error(`\n❌ ${testType} tests failed:`, error.message)
      
      if (options.generateReport) {
        await this.generateReport(testType, { 
          success: false, 
          error: error.message,
          output: error.stdout || error.stderr 
        })
      }

      if (!options.continueOnError) {
        throw error
      }

      return { success: false, error: error.message }
    }
  }

  buildCommand(baseCommand, options) {
    let command = baseCommand

    if (options.watch) {
      command += ' --watch'
    }

    if (options.reporter) {
      command += ` --reporter ${options.reporter}`
    }

    if (options.timeout) {
      command += ` --timeout ${options.timeout}`
    }

    if (options.retries) {
      command += ` --retries ${options.retries}`
    }

    if (options.coverage) {
      command += ' --coverage'
    }

    return command
  }

  async runMultipleTestSuites(testTypes, options = {}) {
    const results = {}
    
    console.log(`\n🎯 Running multiple test suites: ${testTypes.join(', ')}`)
    
    for (const testType of testTypes) {
      results[testType] = await this.runTestSuite(testType, options)
      
      if (!results[testType].success && !options.continueOnError) {
        console.error(`\n❌ Stopping due to failure in ${testType} tests`)
        break
      }
    }

    return results
  }

  async generateReport(testType, results) {
    const reportDir = path.join(process.cwd(), 'test-reports')
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }

    const reportFile = path.join(reportDir, `${testType}-report-${Date.now()}.json`)
    const report = {
      testType,
      timestamp: new Date().toISOString(),
      results,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    }

    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2))
    console.log(`📊 Report generated: ${reportFile}`)
  }

  async checkTestEnvironment() {
    console.log('🔍 Checking test environment...')
    
    const checks = [
      {
        name: 'Node.js version',
        check: () => {
          const version = process.version
          const major = parseInt(version.slice(1).split('.')[0])
          return major >= 16 ? `✅ Node.js ${version}` : `❌ Node.js ${version} (requires >= 16)`
        }
      },
      {
        name: 'Test files exist',
        check: () => {
          const testDir = path.join(process.cwd(), 'tests')
          const exists = fs.existsSync(testDir)
          return exists ? '✅ Test directory exists' : '❌ Test directory missing'
        }
      },
      {
        name: 'Vitest config',
        check: () => {
          const configFile = path.join(process.cwd(), 'vitest.config.ts')
          const exists = fs.existsSync(configFile)
          return exists ? '✅ Vitest config exists' : '❌ Vitest config missing'
        }
      },
      {
        name: 'Playwright config',
        check: () => {
          const configFile = path.join(process.cwd(), 'playwright.config.ts')
          const exists = fs.existsSync(configFile)
          return exists ? '✅ Playwright config exists' : '❌ Playwright config missing'
        }
      },
    ]

    for (const check of checks) {
      console.log(check.check())
    }
  }

  showHelp() {
    console.log(`
🧪 DayFlow Test Runner

Usage:
  node scripts/test-runner.js [testType] [options]

Test Types:
  unit          - Run unit tests
  integration   - Run integration tests
  e2e          - Run end-to-end tests
  performance  - Run performance tests
  smoke        - Run smoke tests
  regression   - Run regression tests
  coverage     - Run coverage analysis
  all          - Run all tests
  check        - Check test environment

Options:
  --watch       - Run in watch mode
  --coverage    - Generate coverage report
  --reporter    - Specify reporter (basic, json, html)
  --timeout     - Set test timeout (ms)
  --retries     - Set number of retries
  --continue    - Continue on errors
  --report      - Generate test reports

Examples:
  node scripts/test-runner.js unit --watch
  node scripts/test-runner.js all --coverage --report
  node scripts/test-runner.js e2e --reporter html
  node scripts/test-runner.js check
`)
  }
}

// CLI Interface
const args = process.argv.slice(2)
const testRunner = new TestRunner()

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  testRunner.showHelp()
  process.exit(0)
}

async function main() {
  const testType = args[0]
  const options = {
    watch: args.includes('--watch'),
    coverage: args.includes('--coverage'),
    reporter: args.includes('--reporter') ? args[args.indexOf('--reporter') + 1] : undefined,
    timeout: args.includes('--timeout') ? parseInt(args[args.indexOf('--timeout') + 1]) : undefined,
    retries: args.includes('--retries') ? parseInt(args[args.indexOf('--retries') + 1]) : undefined,
    continueOnError: args.includes('--continue'),
    generateReport: args.includes('--report'),
  }

  try {
    if (testType === 'check') {
      await testRunner.checkTestEnvironment()
    } else if (args.includes('all')) {
      const testTypes = ['unit', 'integration', 'e2e', 'performance']
      await testRunner.runMultipleTestSuites(testTypes, options)
    } else {
      await testRunner.runTestSuite(testType, options)
    }
    
    console.log('\n🎉 Test execution completed!')
    process.exit(0)
  } catch (error) {
    console.error('\n💥 Test execution failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = TestRunner