/**
 * Migraine Service - Business logic for migraine entry operations
 * Handles all CRUD operations and statistics calculations
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  mapDbEntryToMigraineEntry, 
  mapMigraineEntryToDbInsert 
} from '@/domain/mappers';
import type { 
  MigraineEntry, 
  MigraineEntryInput,
  MigraineStatistics,
  PaginatedResult,
  Result,
} from '@/domain/types';
import { MIGRAINE_DEFAULTS } from '@/domain/constants';
import { logger } from '@/lib/logger';

// ============================================================
// Fetch Operations
// ============================================================

export async function getMigraineEntries(
  userId: string,
  limit: number = MIGRAINE_DEFAULTS.ENTRIES_PER_PAGE
): Promise<Result<MigraineEntry[]>> {
  try {
    const { data, error } = await supabase
      .from('migraine_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to fetch migraine entries', error);
      return { success: false, error: { code: 'FETCH_FAILED', message: error.message } };
    }

    const entries = (data || []).map(mapDbEntryToMigraineEntry);
    return { success: true, data: entries };
  } catch (err) {
    logger.error('Unexpected error fetching migraine entries', err);
    return { success: false, error: { code: 'UNEXPECTED_ERROR', message: 'Ein unerwarteter Fehler ist aufgetreten' } };
  }
}

export async function getRecentMigraineEntries(
  userId: string,
  days: number = MIGRAINE_DEFAULTS.RECENT_DAYS
): Promise<Result<MigraineEntry[]>> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('migraine_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch recent migraine entries', error);
      return { success: false, error: { code: 'FETCH_FAILED', message: error.message } };
    }

    const entries = (data || []).map(mapDbEntryToMigraineEntry);
    return { success: true, data: entries };
  } catch (err) {
    logger.error('Unexpected error fetching recent entries', err);
    return { success: false, error: { code: 'UNEXPECTED_ERROR', message: 'Ein unerwarteter Fehler ist aufgetreten' } };
  }
}

export async function getMigraineEntryById(
  userId: string,
  entryId: string
): Promise<Result<MigraineEntry | null>> {
  try {
    const { data, error } = await supabase
      .from('migraine_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('id', entryId)
      .maybeSingle();

    if (error) {
      logger.error('Failed to fetch migraine entry', error);
      return { success: false, error: { code: 'FETCH_FAILED', message: error.message } };
    }

    const entry = data ? mapDbEntryToMigraineEntry(data) : null;
    return { success: true, data: entry };
  } catch (err) {
    logger.error('Unexpected error fetching migraine entry', err);
    return { success: false, error: { code: 'UNEXPECTED_ERROR', message: 'Ein unerwarteter Fehler ist aufgetreten' } };
  }
}

// ============================================================
// Create/Update/Delete Operations
// ============================================================

export async function createMigraineEntry(
  userId: string,
  input: MigraineEntryInput
): Promise<Result<MigraineEntry>> {
  try {
    const dbEntry = {
      user_id: userId,
      created_at: new Date().toISOString(),
      severity: input.severity,
      intensity: input.intensity,
      duration: input.duration,
      location: input.location || null,
      note: input.note || null,
      medication_taken: input.medicationTaken || input.selectedMedications?.join(', ') || null,
      effectiveness: input.effectiveness || null,
      trigger_detected: (input.selectedTriggers?.length ?? 0) > 0,
      forecast_match: null,
      temperature: null,
      humidity: null,
      pressure: null,
      weather_type: null,
    };

    const { data, error } = await supabase
      .from('migraine_entries')
      .insert(dbEntry)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create migraine entry', error);
      return { success: false, error: { code: 'CREATE_FAILED', message: error.message } };
    }

    return { success: true, data: mapDbEntryToMigraineEntry(data) };
  } catch (err) {
    logger.error('Unexpected error creating migraine entry', err);
    return { success: false, error: { code: 'UNEXPECTED_ERROR', message: 'Ein unerwarteter Fehler ist aufgetreten' } };
  }
}

export async function deleteMigraineEntry(
  userId: string,
  entryId: string
): Promise<Result<void>> {
  try {
    const { error } = await supabase
      .from('migraine_entries')
      .delete()
      .eq('user_id', userId)
      .eq('id', entryId);

    if (error) {
      logger.error('Failed to delete migraine entry', error);
      return { success: false, error: { code: 'DELETE_FAILED', message: error.message } };
    }

    return { success: true, data: undefined };
  } catch (err) {
    logger.error('Unexpected error deleting migraine entry', err);
    return { success: false, error: { code: 'UNEXPECTED_ERROR', message: 'Ein unerwarteter Fehler ist aufgetreten' } };
  }
}

// ============================================================
// Statistics Operations
// ============================================================

export async function getMigraineStatistics(
  userId: string,
  days: number = MIGRAINE_DEFAULTS.RECENT_DAYS
): Promise<Result<MigraineStatistics>> {
  try {
    const result = await getRecentMigraineEntries(userId, days);
    
    if (!result.success) {
      return result as { success: false; error: { code: string; message: string } };
    }

    const entries = result.data;
    const totalEntries = entries.length;

    if (totalEntries === 0) {
      return {
        success: true,
        data: {
          totalEntries: 0,
          averageIntensity: 0,
          averageDuration: 0,
          triggerPercentage: 0,
          recentEpisodes: 0,
          monthlyTrend: [],
        },
      };
    }

    const averageIntensity = 
      entries.reduce((sum, e) => sum + e.intensity, 0) / totalEntries;
    
    const averageDuration = 
      entries.reduce((sum, e) => sum + e.duration, 0) / totalEntries;
    
    const triggeredEntries = entries.filter(e => e.triggerDetected).length;
    const triggerPercentage = (triggeredEntries / totalEntries) * 100;

    // Calculate monthly trend
    const monthlyMap = new Map<string, { count: number; totalIntensity: number }>();
    
    entries.forEach(entry => {
      const month = entry.createdAt.toLocaleString('de-DE', { month: 'short', year: 'numeric' });
      const existing = monthlyMap.get(month) || { count: 0, totalIntensity: 0 };
      monthlyMap.set(month, {
        count: existing.count + 1,
        totalIntensity: existing.totalIntensity + entry.intensity,
      });
    });

    const monthlyTrend = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      count: data.count,
      avgIntensity: Math.round((data.totalIntensity / data.count) * 10) / 10,
    }));

    return {
      success: true,
      data: {
        totalEntries,
        averageIntensity: Math.round(averageIntensity * 10) / 10,
        averageDuration: Math.round(averageDuration * 10) / 10,
        triggerPercentage: Math.round(triggerPercentage),
        recentEpisodes: totalEntries,
        monthlyTrend,
      },
    };
  } catch (err) {
    logger.error('Unexpected error calculating statistics', err);
    return { success: false, error: { code: 'UNEXPECTED_ERROR', message: 'Ein unerwarteter Fehler ist aufgetreten' } };
  }
}

export async function getTotalEntriesCount(userId: string): Promise<Result<number>> {
  try {
    const { count, error } = await supabase
      .from('migraine_entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      logger.error('Failed to get entries count', error);
      return { success: false, error: { code: 'FETCH_FAILED', message: error.message } };
    }

    return { success: true, data: count || 0 };
  } catch (err) {
    logger.error('Unexpected error getting entries count', err);
    return { success: false, error: { code: 'UNEXPECTED_ERROR', message: 'Ein unerwarteter Fehler ist aufgetreten' } };
  }
}
