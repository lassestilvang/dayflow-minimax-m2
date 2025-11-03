declare module 'bun:test' {
  export const describe: (name: string, fn: () => void | Promise<void>) => void
  export const it: (name: string, fn: () => void | Promise<void>) => void
  export const test: (name: string, fn: () => void | Promise<void>) => void
  export const expect: {
    (value: any): {
      toBe: (expected: any) => void
      toEqual: (expected: any) => void
      toHaveProperty: (property: string) => void
      toBeInstanceOf: (constructor: any) => void
      toHaveLength: (length: number) => void
      toBeDefined: () => void
      toBeUndefined: () => void
      toBeNull: () => void
      toBeTrue: () => void
      toBeFalse: () => void
      toBeGreaterThan: (num: number) => void
      toBeLessThan: (num: number) => void
      toBeLessThanOrEqual: (num: number) => void
      toBeGreaterThanOrEqual: (num: number) => void
      toContain: (item: any) => void
      toThrow: (error?: string | RegExp) => void
      toMatch: (pattern: string | RegExp) => void
    }
    assertions: (count: number) => void
  }
  export const beforeEach: (fn: () => void | Promise<void>) => void
  export const afterEach: (fn: () => void | Promise<void>) => void
  export const beforeAll: (fn: () => void | Promise<void>) => void
  export const afterAll: (fn: () => void | Promise<void>) => void

  export interface MockFunction<T extends (...args: any[]) => any = (...args: any[]) => any> {
    (...args: Parameters<T>): ReturnType<T>
    mock: {
      calls: Array<Parameters<T>>
      results: Array<ReturnType<T>>
      instances: Array<ThisParameterType<T>>
    }
    mockReturnValueOnce: (value: ReturnType<T>) => MockFunction<T>
    mockReturnValue: (value: ReturnType<T>) => MockFunction<T>
    mockResolvedValueOnce: (value: ReturnType<T>) => MockFunction<T>
    mockResolvedValue: (value: ReturnType<T>) => MockFunction<T>
    mockImplementationOnce: (fn: T) => MockFunction<T>
    mockImplementation: (fn: T) => MockFunction<T>
    mockName: (name: string) => MockFunction<T>
    getMockName: () => string
    mockClear: () => MockFunction<T>
    mockReset: () => MockFunction<T>
    mockRestore: () => MockFunction<T>
    mockReturnThis: () => MockFunction<T>
  }

  export interface MockVi {
    (): MockFunction
    <T extends (...args: any[]) => any>(implementation?: T): MockFunction<T>
    fn: <T extends (...args: any[]) => any>(implementation?: T) => MockFunction<T>
    spyOn: (object: any, method: string) => MockFunction
    mock: () => {
      clearAllMocks: () => void
      resetAllMocks: () => void
      restoreAllMocks: () => void
    }
    clearAllMocks: () => void
    resetAllMocks: () => void
    restoreAllMocks: () => void
    mockImplementationOnce: (implementation: (...args: any[]) => any) => void
    mockImplementation: (implementation: (...args: any[]) => any) => void
    mockName: (name: string) => void
    getMockName: () => string
    mockReturnOnce: (...values: any[]) => void
    mockReturnOnceOnce: (...values: any[]) => void
    mockReturnValueOnce: (value: any) => void
    mockReturnValue: (value: any) => void
    mockResolvedOnce: (...values: any[]) => void
    mockResolvedValueOnce: (value: any) => void
    mockResolvedValue: (value: any) => void
    mockRejectedOnce: (...values: any[]) => void
    mockRejectedValueOnce: (value: any) => void
    mockRejectedValue: (value: any) => void
    mockClear: () => void
    mockReset: () => void
    mockRestore: () => void
    stubGlobal: (name: string, implementation: (...args: any[]) => any) => void
    unstubAllGlobals: () => void
    unmock: (path: string) => void
    doMock: (path: string, factory?: any) => void
    dontMock: (path: string) => void
    setSystemTime: (date?: number | Date) => void
    useFakeTimers: () => void
    useRealTimers: () => void
  }

  export function vi(): MockFunction
  export const fn: <T extends (...args: any[]) => any = (...args: any[]) => any>(
    implementation?: T
  ) => MockFunction<T>

  export const spyOn: {
    (object: any, method: string): MockFunction
  }

  export const vi: MockVi

  export type Mock<T = any> = MockFunction<T>
}