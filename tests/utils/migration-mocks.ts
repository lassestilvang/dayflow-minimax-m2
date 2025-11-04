import { vi } from 'vitest'
import type { Mock } from 'vitest'

// Comprehensive Drizzle-ORM Mock Factory
export class DrizzleMockFactory {
  private mockExecute: Mock
  private mockTransaction: Mock
  private mockDrizzleInstance: any

  constructor() {
    this.setupMocks()
  }

  private setupMocks() {
    this.mockExecute = vi.fn()
    this.mockTransaction = vi.fn()
    
    // Create a proper query builder that returns mock query chains
    this.mockDrizzleInstance = {
      execute: this.mockExecute,
      select: this.createQueryBuilder(),
      transaction: this.mockTransaction,
      sql: this.createSqlBuilder()
    }
  }

  private createQueryBuilder() {
    return vi.fn().mockImplementation(() => {
      // Mock the schema parameter
      return {
        from: this.createFromBuilder(),
        all: vi.fn().mockResolvedValue([]),
        get: vi.fn().mockResolvedValue(null)
      }
    })
  }

  private createFromBuilder() {
    return vi.fn().mockImplementation(() => {
      return {
        where: this.createWhereBuilder(),
        orderBy: this.createOrderByBuilder(),
        limit: this.createLimitBuilder(),
        offset: this.createOffsetBuilder()
      }
    })
  }

  private createWhereBuilder() {
    return vi.fn().mockResolvedValue([])
  }

  private createOrderByBuilder() {
    return vi.fn().mockImplementation((field) => {
      return vi.fn().mockResolvedValue([])
    })
  }

  private createLimitBuilder() {
    return vi.fn().mockResolvedValue([])
  }

  private createOffsetBuilder() {
    return vi.fn().mockResolvedValue([])
  }

  private createSqlBuilder() {
    return vi.fn().mockImplementation((strings, ...values) => ({
      sql: strings.join(' '),
      values,
      queryChunks: [{ value: strings }],
      decoder: { mapFromDriverValue: (v: any) => v },
      shouldInlineParams: false,
      usedTables: []
    }))
  }

  public setupTransactionMock(returnValue: any = {}) {
    this.mockTransaction.mockImplementation((callback) => {
      const mockTxClient = {
        execute: this.mockExecute,
        select: this.createQueryBuilder(),
        insert: this.createInsertBuilder(),
        update: this.createUpdateBuilder(),
        delete: this.createDeleteBuilder(),
        transaction: this.mockTransaction // Support nested transactions
      }
      
      if (callback && typeof callback === 'function') {
        const result = callback(mockTxClient)
        return result !== undefined ? result : mockTxClient
      }
      return mockTxClient
    })
  }

  private createInsertBuilder() {
    return vi.fn().mockImplementation(() => {
      return {
        values: this.createValuesBuilder()
      }
    })
  }

  private createValuesBuilder() {
    return vi.fn().mockImplementation(() => {
      return {
        returning: this.createReturningBuilder(),
        execute: this.createExecuteBuilder()
      }
    })
  }

  private createReturningBuilder() {
    return vi.fn().mockResolvedValue([])
  }

  private createExecuteBuilder() {
    return vi.fn().mockResolvedValue([])
  }

  private createUpdateBuilder() {
    return vi.fn().mockImplementation(() => {
      return {
        set: this.createSetBuilder()
      }
    })
  }

  private createSetBuilder() {
    return vi.fn().mockImplementation(() => {
      return {
        where: this.createWhereBuilder(),
        returning: this.createReturningBuilder(),
        execute: this.createExecuteBuilder()
      }
    })
  }

  private createDeleteBuilder() {
    return vi.fn().mockImplementation(() => {
      return {
        where: this.createWhereBuilder(),
        returning: this.createReturningBuilder(),
        execute: this.createExecuteBuilder()
      }
    })
  }

  public setExecuteMock(result: any) {
    this.mockExecute.mockResolvedValue(result)
  }

  public setQueryResult(queryChain: string, result: any) {
    // This would be expanded to handle specific query patterns
    this.mockExecute.mockResolvedValue(result)
  }

  public reset() {
    this.mockExecute.mockClear()
    this.mockTransaction.mockClear()
    this.setupMocks()
  }

  public getMock() {
    return this.mockDrizzleInstance
  }

  public getExecuteMock() {
    return this.mockExecute
  }

  public getTransactionMock() {
    return this.mockTransaction
  }
}

// Comprehensive Migration Import Mock Factory
export class MigrationImportMockFactory {
  private migrationModules: Map<string, any> = new Map()
  private mockImport: Mock

  constructor() {
    this.setupDefaultMigrations()
    this.mockImport = this.createImportMock()
  }

  private setupDefaultMigrations() {
    const createMigration = (id: string, name: string) => ({
      up: vi.fn().mockResolvedValue(undefined),
      down: vi.fn().mockResolvedValue(undefined),
      id,
      name,
      timestamp: new Date()
    })

    const defaultMigrations = [
      '001_initial_schema',
      '002_integration_framework',
      '003_later_migration',
      '001_earlier_migration',
      '001_valid_migration',
      '002_another_migration',
      '002_second_migration'
    ]

    defaultMigrations.forEach(migrationName => {
      const id = migrationName.split('_')[0]
      const name = migrationName.substring(migrationName.indexOf('_') + 1)
      const migrationModule = createMigration(id, name)
      
      // Register with multiple path patterns
      const paths = [
        `${migrationName}.ts`,
        `/test/project/lib/db/migrations/${migrationName}.ts`,
        `lib/db/migrations/${migrationName}.ts`,
        `${id}_${name}.ts`
      ]
      
      paths.forEach(path => {
        this.migrationModules.set(path, migrationModule)
      })
    })
  }

  private createImportMock() {
    return vi.fn().mockImplementation(async (filePath: string) => {
      // Normalize path
      let normalizedPath = filePath
        .replace(/^file:\/\//, '')
        .replace(/^\/test\/project\//, '')
        .replace(/^\.\.\//, '')
        .replace(/^\//, '')

      // Try exact match
      if (this.migrationModules.has(normalizedPath)) {
        return this.migrationModules.get(normalizedPath)
      }

      // Try with different prefixes
      const prefixes = ['', '/test/project/lib/db/migrations/', 'lib/db/migrations/']
      for (const prefix of prefixes) {
        const fullPath = prefix + normalizedPath
        if (this.migrationModules.has(fullPath)) {
          return this.migrationModules.get(fullPath)
        }
      }

      // Try to extract filename and match
      const filename = normalizedPath.split('/').pop() || ''
      for (const [key, migrationModule] of this.migrationModules.entries()) {
        if (key.endsWith(filename)) {
          return { ...migrationModule } // Return a copy to avoid test interference
        }
      }

      // Create dynamic migration for unmatched files
      const match = filename.match(/^(\d+)_.*\.ts$/)
      if (match) {
        const id = match[1]
        const name = filename.replace(/^\d+_/, '').replace('.ts', '')
        return {
          up: vi.fn().mockResolvedValue(undefined),
          down: vi.fn().mockResolvedValue(undefined),
          id,
          name,
          timestamp: new Date()
        }
      }

      // Fallback
      return {
        up: vi.fn().mockResolvedValue(undefined),
        down: vi.fn().mockResolvedValue(undefined),
        id: '999',
        name: 'unknown_migration',
        timestamp: new Date()
      }
    })
  }

  public addMigration(name: string, migrationModule: any) {
    this.migrationModules.set(name, migrationModule)
  }

  public reset() {
    this.mockImport.mockClear()
    this.migrationModules.forEach(migrationModule => {
      if (migrationModule.up) migrationModule.up.mockClear()
      if (migrationModule.down) migrationModule.down.mockClear()
    })
  }

  public getMock() {
    return this.mockImport
  }
}

// Database Query Result Factory
export class QueryResultFactory {
  static appliedMigration(id: string, name: string, appliedAt: Date = new Date(), error: string | null = null) {
    return {
      id,
      name,
      applied_at: appliedAt,
      error
    }
  }

  static emptyResult() {
    return []
  }

  static tableInfo(tableName: string) {
    return { tableName }
  }

  static indexInfo(tableName: string, indexName: string) {
    return { tableName, indexName }
  }

  static databaseSize(size: string) {
    return { size }
  }

  static versionInfo(version: string) {
    return { version }
  }

  static uptimeInfo(uptime: number) {
    return { uptime }
  }

  static connectionInfo(count: number) {
    return { count }
  }
}

// Comprehensive Test Setup Factory
export class MigrationTestSetup {
  public drizzle: DrizzleMockFactory
  public imports: MigrationImportMockFactory
  public fs: any
  public path: any

  constructor() {
    this.drizzle = new DrizzleMockFactory()
    this.imports = new MigrationImportMockFactory()
    this.setupFsMock()
    this.setupPathMock()
  }

  private setupFsMock() {
    this.fs = {
      readdirSync: vi.fn(),
      writeFileSync: vi.fn(),
      existsSync: vi.fn().mockReturnValue(true),
      mkdirSync: vi.fn(),
      readFileSync: vi.fn().mockReturnValue(''),
      constants: {
        F_OK: 0,
        R_OK: 4,
        W_OK: 2,
        X_OK: 1,
      }
    }
  }

  private setupPathMock() {
    this.path = {
      join: vi.fn((...args) => args.join('/')),
      resolve: vi.fn((...args) => args.join('/')),
      dirname: vi.fn((p) => p.split('/').slice(0, -1).join('/')),
      basename: vi.fn((p) => p.split('/').pop() || ''),
      extname: vi.fn((p) => {
        const match = p.match(/\.[^.]+$/)
        return match ? match[0] : ''
      })
    }
  }

  public setupMigrationFiles(files: string[]) {
    this.fs.readdirSync.mockReturnValue(files)
  }

  public setupAppliedMigrations(migrations: any[]) {
    this.drizzle.setExecuteMock({
      select: () => ({
        from: () => ({
          orderBy: () => Promise.resolve(migrations)
        })
      })
    })
  }

  public setupTransactionSuccess() {
    this.drizzle.setupTransactionMock()
  }

  public setupTransactionFailure(error: string = 'Transaction failed') {
    this.drizzle.mockTransaction.mockImplementation(() => {
      throw new Error(error)
    })
  }

  public setupDatabaseInfo(tables: string[], indexes: string[], size: string) {
    let queryCount = 0
    this.drizzle.setExecuteMock(() => {
      queryCount++
      if (queryCount === 1) {
        return {
          select: () => ({
            from: () => ({
              where: () => Promise.resolve(tables.map(t => ({ tableName: t })))
            })
          })
        }
      } else if (queryCount === 2) {
        return {
          select: () => ({
            from: () => ({
              where: () => Promise.resolve(indexes.map(i => {
                const [table, index] = i.split('.')
                return { tableName: table, indexName: index }
              }))
            })
          })
        }
      } else {
        return {
          select: () => ({
            from: () => ({
              where: () => Promise.resolve([{ size }])
            })
          })
        }
      }
    })
  }

  public setupHealthCheck(connected: boolean, version: string = 'unknown', uptime: number = 0, connections: number = 0, error?: string) {
    let queryCount = 0
    this.drizzle.setExecuteMock(() => {
      if (connected && !error) {
        queryCount++
        if (queryCount === 1) {
          return [{ version: `PostgreSQL ${version} on x86_64` }]
        } else if (queryCount === 2) {
          return [{ uptime }]
        } else {
          return {
            select: () => ({
              from: () => ({
                where: () => Promise.resolve([{ count: connections }])
              })
            })
          }
        }
      } else {
        throw new Error(error || 'Connection failed')
      }
    })
  }

  public reset() {
    this.drizzle.reset()
    this.imports.reset()
    this.fs.readdirSync.mockClear()
    this.fs.writeFileSync.mockClear()
  }
}

// Global mock setup function
export function setupMigrationMocks() {
  const setup = new MigrationTestSetup()
  
  // @ts-ignore
  global.import = setup.imports.getMock()
  
  return setup
}