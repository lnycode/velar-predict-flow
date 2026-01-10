/**
 * Domain Layer - Public API
 * 
 * This module exports all domain types, constants, mappers, and services.
 * Import from this file for clean, organized access to the domain layer.
 * 
 * Usage:
 *   import { MigraineEntry, RISK_LEVELS, mapDbEntryToMigraineEntry } from '@/domain';
 *   import { getMigraineEntries } from '@/domain/services';
 */

// Types
export * from './types';

// Constants
export * from './constants';

// Mappers
export * from './mappers';

// Services are exported separately to avoid circular dependencies
// import { getMigraineEntries } from '@/domain/services';
