/**
 * React Query hooks for Profile domain services
 * Provides caching, automatic refetching, and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getUserProfile, 
  updateUserProfile, 
  updateNotificationSettings,
} from '@/domain/services';
import { unwrapResult } from '@/domain/utils';
import type { UserProfile } from '@/domain/types';
import { toast } from 'sonner';

// Query keys for cache management
export const profileKeys = {
  all: ['profile'] as const,
  user: (userId: string) => [...profileKeys.all, userId] as const,
};

/**
 * Hook to fetch user profile with caching
 */
export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: profileKeys.user(userId ?? ''),
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');
      const result = await getUserProfile(userId);
      return unwrapResult(result);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutes - profile data changes infrequently
  });
}

/**
 * Hook to update user profile
 */
export function useUpdateProfile(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (!userId) throw new Error('User ID required');
      const result = await updateUserProfile(userId, updates);
      return unwrapResult(result);
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: profileKeys.user(userId ?? '') });

      const previousProfile = queryClient.getQueryData<UserProfile | null>(
        profileKeys.user(userId ?? '')
      );

      // Optimistically update profile
      if (previousProfile) {
        queryClient.setQueryData<UserProfile>(
          profileKeys.user(userId ?? ''),
          { ...previousProfile, ...updates }
        );
      }

      return { previousProfile };
    },
    onError: (err, updates, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(
          profileKeys.user(userId ?? ''),
          context.previousProfile
        );
      }
      toast.error('Fehler beim Aktualisieren des Profils');
    },
    onSuccess: () => {
      toast.success('Profil aktualisiert');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.user(userId ?? '') });
    },
  });
}

/**
 * Hook to update user settings (notifications, AI, weather alerts)
 */
export function useUpdateSettings(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: {
      emailNotifications?: boolean;
      weatherAlerts?: boolean;
      aiPredictionsEnabled?: boolean;
    }) => {
      if (!userId) throw new Error('User ID required');
      const result = await updateNotificationSettings(userId, settings);
      return unwrapResult(result);
    },
    onSuccess: () => {
      toast.success('Einstellungen gespeichert');
      queryClient.invalidateQueries({ queryKey: profileKeys.user(userId ?? '') });
    },
    onError: () => {
      toast.error('Fehler beim Speichern der Einstellungen');
    },
  });
}
