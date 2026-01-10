/**
 * Profile Service - Business logic for user profile operations
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  mapDbProfileToUserProfile, 
  mapUserProfileToDbUpdate 
} from '@/domain/mappers';
import type { UserProfile, Result } from '@/domain/types';
import { logger } from '@/lib/logger';

// ============================================================
// Fetch Operations
// ============================================================

export async function getUserProfile(userId: string): Promise<Result<UserProfile | null>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      logger.error('Failed to fetch user profile', error);
      return { success: false, error: { code: 'FETCH_FAILED', message: error.message } };
    }

    const profile = data ? mapDbProfileToUserProfile(data) : null;
    return { success: true, data: profile };
  } catch (err) {
    logger.error('Unexpected error fetching user profile', err);
    return { success: false, error: { code: 'UNEXPECTED_ERROR', message: 'Ein unerwarteter Fehler ist aufgetreten' } };
  }
}

// ============================================================
// Update Operations
// ============================================================

export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<Result<UserProfile>> {
  try {
    const dbUpdates = mapUserProfileToDbUpdate(updates);

    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update user profile', error);
      return { success: false, error: { code: 'UPDATE_FAILED', message: error.message } };
    }

    return { success: true, data: mapDbProfileToUserProfile(data) };
  } catch (err) {
    logger.error('Unexpected error updating user profile', err);
    return { success: false, error: { code: 'UNEXPECTED_ERROR', message: 'Ein unerwarteter Fehler ist aufgetreten' } };
  }
}

// ============================================================
// Onboarding Operations
// ============================================================

export async function checkOnboardingComplete(userId: string): Promise<Result<boolean>> {
  try {
    const result = await getUserProfile(userId);
    
    if (!result.success) {
      return result as { success: false; error: { code: string; message: string } };
    }

    const profile = result.data;
    if (!profile) {
      return { success: true, data: false };
    }

    const isComplete = Boolean(
      profile.firstName && 
      profile.locationName && 
      profile.knownTriggers
    );

    return { success: true, data: isComplete };
  } catch (err) {
    logger.error('Unexpected error checking onboarding status', err);
    return { success: false, error: { code: 'UNEXPECTED_ERROR', message: 'Ein unerwarteter Fehler ist aufgetreten' } };
  }
}

// ============================================================
// Notification Settings
// ============================================================

export async function updateNotificationSettings(
  userId: string,
  settings: {
    weatherAlerts?: boolean;
    emailNotifications?: boolean;
    aiPredictionsEnabled?: boolean;
  }
): Promise<Result<void>> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        weather_alerts: settings.weatherAlerts,
        email_notifications: settings.emailNotifications,
        ai_predictions_enabled: settings.aiPredictionsEnabled,
      })
      .eq('user_id', userId);

    if (error) {
      logger.error('Failed to update notification settings', error);
      return { success: false, error: { code: 'UPDATE_FAILED', message: error.message } };
    }

    return { success: true, data: undefined };
  } catch (err) {
    logger.error('Unexpected error updating notification settings', err);
    return { success: false, error: { code: 'UNEXPECTED_ERROR', message: 'Ein unerwarteter Fehler ist aufgetreten' } };
  }
}
