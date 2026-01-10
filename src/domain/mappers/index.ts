/**
 * Domain Mappers - Transform between database/API types and domain types
 * Provides a clean separation between persistence layer and domain layer
 */

import type { Tables } from '@/integrations/supabase/types';
import type {
  UserProfile,
  MigraineEntry,
  AIPrediction,
  Subscription,
  EmailNotification,
  WeatherData,
  PredictionFactor,
  WeatherSensitivity,
  SubscriptionTier,
  SubscriptionStatus,
  NotificationType,
  PredictionType,
} from '../types';

// ============================================================
// Profile Mappers
// ============================================================

export function mapDbProfileToUserProfile(
  dbProfile: Tables<'profiles'>
): UserProfile {
  return {
    id: dbProfile.id,
    userId: dbProfile.user_id,
    email: dbProfile.email,
    firstName: dbProfile.first_name,
    lastName: dbProfile.last_name,
    timezone: dbProfile.timezone ?? 'UTC',
    locationName: dbProfile.location_name,
    locationLat: dbProfile.location_lat,
    locationLng: dbProfile.location_lng,
    migraineType: dbProfile.migraine_type,
    knownTriggers: dbProfile.known_triggers,
    currentMedications: dbProfile.current_medications,
    weatherSensitivity: (dbProfile.weather_sensitivity ?? 'medium') as WeatherSensitivity,
    weatherAlerts: dbProfile.weather_alerts ?? true,
    emailNotifications: dbProfile.email_notifications ?? true,
    aiPredictionsEnabled: dbProfile.ai_predictions_enabled ?? true,
    subscriptionTier: (dbProfile.subscription_tier ?? 'free') as SubscriptionTier,
    subscriptionActive: dbProfile.subscription_active ?? false,
    subscriptionEnd: dbProfile.subscription_end ? new Date(dbProfile.subscription_end) : null,
    createdAt: new Date(dbProfile.created_at),
    updatedAt: new Date(dbProfile.updated_at),
  };
}

export function mapUserProfileToDbUpdate(
  profile: Partial<UserProfile>
): Partial<Tables<'profiles'>> {
  const dbUpdate: Record<string, unknown> = {};

  if (profile.firstName !== undefined) dbUpdate.first_name = profile.firstName;
  if (profile.lastName !== undefined) dbUpdate.last_name = profile.lastName;
  if (profile.timezone !== undefined) dbUpdate.timezone = profile.timezone;
  if (profile.locationName !== undefined) dbUpdate.location_name = profile.locationName;
  if (profile.locationLat !== undefined) dbUpdate.location_lat = profile.locationLat;
  if (profile.locationLng !== undefined) dbUpdate.location_lng = profile.locationLng;
  if (profile.migraineType !== undefined) dbUpdate.migraine_type = profile.migraineType;
  if (profile.knownTriggers !== undefined) dbUpdate.known_triggers = profile.knownTriggers;
  if (profile.currentMedications !== undefined) dbUpdate.current_medications = profile.currentMedications;
  if (profile.weatherSensitivity !== undefined) dbUpdate.weather_sensitivity = profile.weatherSensitivity;
  if (profile.weatherAlerts !== undefined) dbUpdate.weather_alerts = profile.weatherAlerts;
  if (profile.emailNotifications !== undefined) dbUpdate.email_notifications = profile.emailNotifications;
  if (profile.aiPredictionsEnabled !== undefined) dbUpdate.ai_predictions_enabled = profile.aiPredictionsEnabled;

  return dbUpdate as Partial<Tables<'profiles'>>;
}

// ============================================================
// Migraine Entry Mappers
// ============================================================

export function mapDbEntryToMigraineEntry(
  dbEntry: Tables<'migraine_entries'>
): MigraineEntry {
  return {
    id: dbEntry.id,
    userId: dbEntry.user_id,
    createdAt: dbEntry.created_at ? new Date(dbEntry.created_at) : new Date(),
    severity: dbEntry.severity ?? 0,
    intensity: Number(dbEntry.intensity ?? 0),
    duration: dbEntry.duration ?? 0,
    location: dbEntry.location,
    note: dbEntry.note,
    medicationTaken: dbEntry.medication_taken,
    effectiveness: dbEntry.effectiveness,
    triggerDetected: dbEntry.trigger_detected,
    forecastMatch: dbEntry.forecast_match,
    temperature: dbEntry.temperature,
    humidity: dbEntry.humidity ? Number(dbEntry.humidity) : null,
    pressure: dbEntry.pressure ? Number(dbEntry.pressure) : null,
    weatherType: dbEntry.weather_type,
  };
}

export function mapMigraineEntryToDbInsert(
  entry: Omit<MigraineEntry, 'id' | 'createdAt'>,
  userId: string
): Omit<Tables<'migraine_entries'>, 'id'> {
  return {
    user_id: userId,
    created_at: new Date().toISOString(),
    severity: entry.severity,
    intensity: entry.intensity,
    duration: entry.duration,
    location: entry.location,
    note: entry.note,
    medication_taken: entry.medicationTaken,
    effectiveness: entry.effectiveness,
    trigger_detected: entry.triggerDetected,
    forecast_match: entry.forecastMatch,
    temperature: entry.temperature,
    humidity: entry.humidity,
    pressure: entry.pressure,
    weather_type: entry.weatherType,
  };
}

// ============================================================
// AI Prediction Mappers
// ============================================================

export function mapDbPredictionToAIPrediction(
  dbPrediction: Tables<'ai_predictions'>
): AIPrediction {
  return {
    id: dbPrediction.id,
    userId: dbPrediction.user_id,
    predictionType: dbPrediction.prediction_type as PredictionType,
    riskLevel: dbPrediction.risk_level,
    confidence: dbPrediction.confidence,
    predictedFor: new Date(dbPrediction.predicted_for),
    actualOutcome: dbPrediction.actual_outcome,
    weatherData: dbPrediction.weather_data as unknown as WeatherData | null,
    predictionFactors: dbPrediction.prediction_factors as unknown as PredictionFactor[] | null,
    createdAt: new Date(dbPrediction.created_at),
  };
}

// ============================================================
// Subscription Mappers
// ============================================================

export function mapDbSubscriptionToSubscription(
  dbSubscription: Tables<'subscriptions'>
): Subscription {
  return {
    id: dbSubscription.id,
    userId: dbSubscription.user_id,
    tier: dbSubscription.tier as SubscriptionTier,
    status: dbSubscription.status as SubscriptionStatus,
    stripeCustomerId: dbSubscription.stripe_customer_id,
    stripeSubscriptionId: dbSubscription.stripe_subscription_id,
    currentPeriodStart: dbSubscription.current_period_start 
      ? new Date(dbSubscription.current_period_start) 
      : null,
    currentPeriodEnd: dbSubscription.current_period_end 
      ? new Date(dbSubscription.current_period_end) 
      : null,
    cancelAtPeriodEnd: dbSubscription.cancel_at_period_end ?? false,
    createdAt: new Date(dbSubscription.created_at),
    updatedAt: new Date(dbSubscription.updated_at),
  };
}

// ============================================================
// Email Notification Mappers
// ============================================================

export function mapDbNotificationToEmailNotification(
  dbNotification: Tables<'email_notifications'>
): EmailNotification {
  return {
    id: dbNotification.id,
    userId: dbNotification.user_id,
    notificationType: dbNotification.notification_type as NotificationType,
    subject: dbNotification.subject,
    content: dbNotification.content,
    status: dbNotification.status as 'sent' | 'failed' | 'pending',
    metadata: dbNotification.metadata as Record<string, unknown> | null,
    sentAt: dbNotification.sent_at ? new Date(dbNotification.sent_at) : null,
  };
}

// ============================================================
// Helper Functions
// ============================================================

export function parseRiskLevel(riskScore: number): 'low' | 'medium' | 'high' {
  if (riskScore <= 3) return 'low';
  if (riskScore <= 6) return 'medium';
  return 'high';
}

export function getRiskColor(riskLevel: 'low' | 'medium' | 'high'): string {
  switch (riskLevel) {
    case 'low': return 'text-success';
    case 'medium': return 'text-warning';
    case 'high': return 'text-destructive';
  }
}

export function getRiskBackgroundColor(riskLevel: 'low' | 'medium' | 'high'): string {
  switch (riskLevel) {
    case 'low': return 'bg-success/20';
    case 'medium': return 'bg-warning/20';
    case 'high': return 'bg-destructive/20';
  }
}
