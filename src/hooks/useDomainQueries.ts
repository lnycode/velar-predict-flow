/**
 * Domain Query Hooks - Public API
 * 
 * Central export for all domain-related React Query hooks.
 * Import from this file for clean, organized access to data fetching hooks.
 * 
 * Usage:
 *   import { useMigraineEntries, useUserProfile, useLatestPrediction } from '@/hooks/useDomainQueries';
 */

// Migraine hooks
export {
  migraineKeys,
  useMigraineEntries,
  useRecentMigraineEntries,
  useMigraineStatistics,
  useDeleteMigraineEntry,
} from './useMigraineQueries';

// Profile hooks
export {
  profileKeys,
  useUserProfile,
  useUpdateProfile,
  useUpdateSettings,
} from './useProfileQueries';

// Prediction hooks
export {
  predictionKeys,
  useLatestPrediction,
  useUpcomingPredictions,
  usePredictionsInRange,
  usePredictionAccuracy,
  useCurrentRiskLevel,
} from './usePredictionQueries';
