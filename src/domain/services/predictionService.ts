/**
 * Prediction Service - Business logic for AI predictions
 */

import { supabase } from '@/integrations/supabase/client';
import { mapDbPredictionToAIPrediction, parseRiskLevel } from '@/domain/mappers';
import type { AIPrediction, Result, RiskLevel } from '@/domain/types';
import { logger } from '@/lib/logger';

// ============================================================
// Fetch Operations
// ============================================================

export async function getLatestPrediction(userId: string): Promise<Result<AIPrediction | null>> {
  try {
    const { data, error } = await supabase
      .from('ai_predictions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error('Failed to fetch latest prediction', error);
      return { success: false, error: { code: 'FETCH_FAILED', message: error.message } };
    }

    const prediction = data ? mapDbPredictionToAIPrediction(data) : null;
    return { success: true, data: prediction };
  } catch (err) {
    logger.error('Unexpected error fetching latest prediction', err);
    return { success: false, error: { code: 'UNEXPECTED_ERROR', message: 'Ein unerwarteter Fehler ist aufgetreten' } };
  }
}

export async function getPredictionsForDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Result<AIPrediction[]>> {
  try {
    const { data, error } = await supabase
      .from('ai_predictions')
      .select('*')
      .eq('user_id', userId)
      .gte('predicted_for', startDate.toISOString())
      .lte('predicted_for', endDate.toISOString())
      .order('predicted_for', { ascending: true });

    if (error) {
      logger.error('Failed to fetch predictions for date range', error);
      return { success: false, error: { code: 'FETCH_FAILED', message: error.message } };
    }

    const predictions = (data || []).map(mapDbPredictionToAIPrediction);
    return { success: true, data: predictions };
  } catch (err) {
    logger.error('Unexpected error fetching predictions', err);
    return { success: false, error: { code: 'UNEXPECTED_ERROR', message: 'Ein unerwarteter Fehler ist aufgetreten' } };
  }
}

export async function getUpcomingPredictions(
  userId: string,
  days: number = 7
): Promise<Result<AIPrediction[]>> {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);

  return getPredictionsForDateRange(userId, startDate, endDate);
}

// ============================================================
// Analytics Operations
// ============================================================

export async function getPredictionAccuracy(userId: string): Promise<Result<number>> {
  try {
    const { data, error } = await supabase
      .from('ai_predictions')
      .select('actual_outcome')
      .eq('user_id', userId)
      .not('actual_outcome', 'is', null);

    if (error) {
      logger.error('Failed to calculate prediction accuracy', error);
      return { success: false, error: { code: 'FETCH_FAILED', message: error.message } };
    }

    if (!data || data.length === 0) {
      return { success: true, data: 0 };
    }

    const correctPredictions = data.filter(p => p.actual_outcome === true).length;
    const accuracy = (correctPredictions / data.length) * 100;

    return { success: true, data: Math.round(accuracy) };
  } catch (err) {
    logger.error('Unexpected error calculating prediction accuracy', err);
    return { success: false, error: { code: 'UNEXPECTED_ERROR', message: 'Ein unerwarteter Fehler ist aufgetreten' } };
  }
}

export async function getCurrentRiskLevel(userId: string): Promise<Result<RiskLevel>> {
  try {
    const result = await getLatestPrediction(userId);
    
    if (!result.success) {
      return result as { success: false; error: { code: string; message: string } };
    }

    if (!result.data) {
      return { success: true, data: 'medium' };
    }

    return { success: true, data: parseRiskLevel(result.data.riskLevel) };
  } catch (err) {
    logger.error('Unexpected error getting current risk level', err);
    return { success: false, error: { code: 'UNEXPECTED_ERROR', message: 'Ein unerwarteter Fehler ist aufgetreten' } };
  }
}
