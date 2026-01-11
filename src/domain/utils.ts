/**
 * Domain Utilities - Helper functions for domain operations
 */

import type { Result, ApiError } from '@/domain/types';

/**
 * Unwraps a Result type, returning the data if successful or throwing an error if not.
 * This is useful for React Query which expects errors to be thrown.
 */
export function unwrapResult<T>(result: Result<T>): T {
  if (result.success === true) {
    return result.data;
  }
  // TypeScript now knows result.success === false
  const errorResult = result as { success: false; error: ApiError };
  throw new Error(errorResult.error.message);
}

/**
 * Type guard to check if a Result is successful
 */
export function isSuccess<T>(result: Result<T>): result is { success: true; data: T } {
  return result.success === true;
}

/**
 * Type guard to check if a Result is an error
 */
export function isError<T>(result: Result<T>): result is { success: false; error: ApiError } {
  return result.success === false;
}
