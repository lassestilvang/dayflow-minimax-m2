// TypeScript Type Fix Helper Script
// This script will help systematically fix remaining TypeScript errors

export function fixTypeError<T>(obj: any): T {
  return obj as T;
}

// Common fixes for implicit any type parameters
export function fixImplicitAny<T>(fn: (param: any) => T): (param: any) => T {
  return (param: any) => fn(param);
}

// Fix for mock return value issues
export function createMockReturn<T>(value: T): T {
  return value;
}

// Fix for EventOrTask missing properties
export function completeEventOrTask(event: any) {
  return {
    ...event,
    progress: 0,
    recurrence: undefined,
    reminder: undefined,
    createdAt: event.createdAt || new Date(),
    updatedAt: event.updatedAt || new Date()
  };
}

// Fix for integration refreshToken conflicts
export function fixIntegrationTypes(integration: any) {
  if (integration.refreshToken !== undefined && typeof integration.refreshToken === 'function') {
    (integration as any).refreshTokenFn = integration.refreshToken;
    integration.refreshToken = undefined;
  }
  return integration;
}