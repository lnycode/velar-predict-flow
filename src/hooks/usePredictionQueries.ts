/**
 * React Query hooks for Prediction domain services
 * Provides caching and automatic refetching for AI predictions
 */

import { useQuery } from '@tanstack/react-query';
import { 
  getLatestPrediction, 
  getPredictionsForDateRange,
  getUpcomingPredictions,
  getPredictionAccuracy,
  getCurrentRiskLevel,
} from '@/domain/services';
import { unwrapResult } from '@/domain/utils';

// Query keys for cache management
export const predictionKeys = {
  all: ['predictions'] as const,
  latest: (userId: string) => [...predictionKeys.all, 'latest', userId] as const,
  upcoming: (userId: string, days: number) => 
    [...predictionKeys.all, 'upcoming', userId, days] as const,
  range: (userId: string, startDate: Date, endDate: Date) => 
    [...predictionKeys.all, 'range', userId, startDate.toISOString(), endDate.toISOString()] as const,
  accuracy: (userId: string) => [...predictionKeys.all, 'accuracy', userId] as const,
  riskLevel: (userId: string) => [...predictionKeys.all, 'riskLevel', userId] as const,
};

/**
 * Hook to fetch the latest prediction
 */
export function useLatestPrediction(userId: string | undefined) {
  return useQuery({
    queryKey: predictionKeys.latest(userId ?? ''),
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');
      const result = await getLatestPrediction(userId);
      return unwrapResult(result);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch upcoming predictions
 */
export function useUpcomingPredictions(userId: string | undefined, days = 7) {
  return useQuery({
    queryKey: predictionKeys.upcoming(userId ?? '', days),
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');
      const result = await getUpcomingPredictions(userId, days);
      return unwrapResult(result);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

/**
 * Hook to fetch predictions within a date range
 */
export function usePredictionsInRange(
  userId: string | undefined,
  startDate: Date,
  endDate: Date
) {
  return useQuery({
    queryKey: predictionKeys.range(userId ?? '', startDate, endDate),
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');
      const result = await getPredictionsForDateRange(userId, startDate, endDate);
      return unwrapResult(result);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Hook to fetch prediction accuracy
 */
export function usePredictionAccuracy(userId: string | undefined) {
  return useQuery({
    queryKey: predictionKeys.accuracy(userId ?? ''),
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');
      const result = await getPredictionAccuracy(userId);
      return unwrapResult(result);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Hook to fetch current risk level
 */
export function useCurrentRiskLevel(userId: string | undefined) {
  return useQuery({
    queryKey: predictionKeys.riskLevel(userId ?? ''),
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');
      const result = await getCurrentRiskLevel(userId);
      return unwrapResult(result);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}
