/**
 * React Query hooks for Migraine domain services
 * Provides caching, automatic refetching, and optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getMigraineEntries, 
  deleteMigraineEntry, 
  getMigraineStatistics,
  getRecentMigraineEntries,
} from '@/domain/services';
import { unwrapResult } from '@/domain/utils';
import type { MigraineEntry } from '@/domain/types';
import { toast } from 'sonner';

// Query keys for cache management
export const migraineKeys = {
  all: ['migraine'] as const,
  entries: (userId: string) => [...migraineKeys.all, 'entries', userId] as const,
  recentEntries: (userId: string, days: number) => 
    [...migraineKeys.entries(userId), 'recent', days] as const,
  statistics: (userId: string) => [...migraineKeys.all, 'statistics', userId] as const,
};

/**
 * Hook to fetch migraine entries with caching
 */
export function useMigraineEntries(userId: string | undefined, limit = 50) {
  return useQuery({
    queryKey: migraineKeys.entries(userId ?? ''),
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');
      const result = await getMigraineEntries(userId, limit);
      return unwrapResult(result);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch recent migraine entries within a number of days
 */
export function useRecentMigraineEntries(userId: string | undefined, days = 30) {
  return useQuery({
    queryKey: migraineKeys.recentEntries(userId ?? '', days),
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');
      const result = await getRecentMigraineEntries(userId, days);
      return unwrapResult(result);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch migraine statistics
 */
export function useMigraineStatistics(userId: string | undefined, days = 30) {
  return useQuery({
    queryKey: migraineKeys.statistics(userId ?? ''),
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');
      const result = await getMigraineStatistics(userId, days);
      return unwrapResult(result);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to delete a migraine entry with optimistic updates
 */
export function useDeleteMigraineEntry(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: string) => {
      if (!userId) throw new Error('User ID required');
      const result = await deleteMigraineEntry(userId, entryId);
      return unwrapResult(result);
    },
    onMutate: async (entryId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: migraineKeys.entries(userId ?? '') });

      // Snapshot previous value
      const previousEntries = queryClient.getQueryData<MigraineEntry[]>(
        migraineKeys.entries(userId ?? '')
      );

      // Optimistically remove the entry
      if (previousEntries) {
        queryClient.setQueryData<MigraineEntry[]>(
          migraineKeys.entries(userId ?? ''),
          previousEntries.filter(entry => entry.id !== entryId)
        );
      }

      return { previousEntries };
    },
    onError: (err, entryId, context) => {
      // Rollback on error
      if (context?.previousEntries) {
        queryClient.setQueryData(
          migraineKeys.entries(userId ?? ''),
          context.previousEntries
        );
      }
      toast.error('Fehler beim Löschen des Eintrags');
    },
    onSuccess: () => {
      toast.success('Eintrag gelöscht');
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: migraineKeys.entries(userId ?? '') });
      queryClient.invalidateQueries({ queryKey: migraineKeys.statistics(userId ?? '') });
    },
  });
}
