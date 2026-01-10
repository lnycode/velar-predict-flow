/**
 * Domain Constants - Business rules and configuration values
 * Centralized location for all magic numbers and business constants
 */

// ============================================================
// Migraine Entry Constants
// ============================================================

export const MIGRAINE_SEVERITY = {
  MIN: 1,
  MAX: 10,
  LOW_THRESHOLD: 3,
  HIGH_THRESHOLD: 7,
} as const;

export const MIGRAINE_DURATION = {
  MIN_HOURS: 0,
  MAX_HOURS: 168, // 1 week
  TYPICAL_MIN: 4,
  TYPICAL_MAX: 72,
} as const;

export const MIGRAINE_DEFAULTS = {
  ENTRIES_PER_PAGE: 50,
  RECENT_DAYS: 30,
  HISTORY_DAYS: 365,
} as const;

// ============================================================
// Risk Level Constants
// ============================================================

export const RISK_LEVELS = {
  LOW: { min: 0, max: 3, label: 'Niedrig', labelEn: 'Low' },
  MEDIUM: { min: 4, max: 6, label: 'Mittel', labelEn: 'Medium' },
  HIGH: { min: 7, max: 10, label: 'Hoch', labelEn: 'High' },
} as const;

export const RISK_COLORS = {
  low: {
    text: 'text-success',
    bg: 'bg-success/20',
    border: 'border-success/30',
  },
  medium: {
    text: 'text-warning',
    bg: 'bg-warning/20',
    border: 'border-warning/30',
  },
  high: {
    text: 'text-destructive',
    bg: 'bg-destructive/20',
    border: 'border-destructive/30',
  },
} as const;

// ============================================================
// Weather Constants
// ============================================================

export const WEATHER_THRESHOLDS = {
  PRESSURE_DROP: 5, // hPa drop indicating storm
  HUMIDITY_HIGH: 80,
  HUMIDITY_LOW: 30,
  TEMPERATURE_CHANGE: 10, // Celsius change
} as const;

export const WEATHER_SENSITIVITY_MULTIPLIERS = {
  low: 0.7,
  medium: 1.0,
  high: 1.5,
} as const;

// ============================================================
// Trigger Categories
// ============================================================

export const COMMON_TRIGGERS = [
  'Stress',
  'Schlafmangel',
  'Alkohol',
  'Koffein',
  'Dehydrierung',
  'Bildschirmarbeit',
  'Wetteränderung',
  'Hormonelle Veränderungen',
  'Bestimmte Lebensmittel',
  'Grelles Licht',
  'Laute Geräusche',
  'Starke Gerüche',
  'Körperliche Anstrengung',
  'Überanstrengung',
  'Unregelmäßige Mahlzeiten',
] as const;

export const TRIGGER_CATEGORIES = {
  lifestyle: ['Stress', 'Schlafmangel', 'Überanstrengung', 'Körperliche Anstrengung'],
  dietary: ['Alkohol', 'Koffein', 'Dehydrierung', 'Bestimmte Lebensmittel', 'Unregelmäßige Mahlzeiten'],
  environmental: ['Wetteränderung', 'Grelles Licht', 'Laute Geräusche', 'Starke Gerüche'],
  hormonal: ['Hormonelle Veränderungen'],
  occupational: ['Bildschirmarbeit'],
} as const;

// ============================================================
// Common Medications
// ============================================================

export const COMMON_MEDICATIONS = [
  'Ibuprofen',
  'Paracetamol',
  'Aspirin',
  'Sumatriptan',
  'Rizatriptan',
  'Naproxen',
  'Ergotamin',
  'Metoclopramid',
  'Ondansetron',
  'Topiramat',
  'Propranolol',
  'Amitriptylin',
  'Valproat',
  'Magnesium',
  'Riboflavin (B2)',
] as const;

// ============================================================
// Subscription Tiers
// ============================================================

export const SUBSCRIPTION_FEATURES = {
  free: {
    label: 'Free',
    forecastDays: 3,
    aiPredictions: true,
    weatherAlerts: true,
    exportPdf: false,
    voiceAssistant: false,
    prioritySupport: false,
  },
  premium: {
    label: 'Premium',
    forecastDays: 14,
    aiPredictions: true,
    weatherAlerts: true,
    exportPdf: true,
    voiceAssistant: true,
    prioritySupport: false,
  },
  enterprise: {
    label: 'Enterprise',
    forecastDays: 30,
    aiPredictions: true,
    weatherAlerts: true,
    exportPdf: true,
    voiceAssistant: true,
    prioritySupport: true,
  },
} as const;

// ============================================================
// Time Constants
// ============================================================

export const TIME_PERIODS = {
  HOUR_MS: 3600000,
  DAY_MS: 86400000,
  WEEK_MS: 604800000,
  MONTH_MS: 2592000000,
} as const;

export const ANALYSIS_PERIODS = {
  SHORT: 7, // days
  MEDIUM: 30, // days
  LONG: 90, // days
} as const;

// ============================================================
// Forecast Constants
// ============================================================

export const FORECAST_CONFIG = {
  FREE_DAYS: 3,
  PREMIUM_DAYS: 14,
  CONFIDENCE_MIN: 0.5,
  REFRESH_INTERVAL_MS: 3600000, // 1 hour
} as const;

// ============================================================
// Validation Constants
// ============================================================

export const VALIDATION = {
  NAME_MAX_LENGTH: 50,
  LOCATION_MAX_LENGTH: 100,
  NOTE_MAX_LENGTH: 2000,
  MEDICATION_MAX_LENGTH: 1000,
  EMAIL_MAX_LENGTH: 255,
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 100,
  TRIGGERS_MAX_COUNT: 50,
  MEDICATIONS_MAX_COUNT: 20,
} as const;
