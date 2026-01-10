/**
 * Domain Types - Core business entities and value objects
 * This is the source of truth for all domain models in the application
 */

// ============================================================
// User & Authentication Domain
// ============================================================

export interface User {
  id: string;
  email: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  timezone: string;
  locationName: string | null;
  locationLat: number | null;
  locationLng: number | null;
  migraineType: string | null;
  knownTriggers: string | null;
  currentMedications: string | null;
  weatherSensitivity: WeatherSensitivity;
  weatherAlerts: boolean;
  emailNotifications: boolean;
  aiPredictionsEnabled: boolean;
  subscriptionTier: SubscriptionTier;
  subscriptionActive: boolean;
  subscriptionEnd: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type WeatherSensitivity = 'low' | 'medium' | 'high';
export type SubscriptionTier = 'free' | 'premium' | 'enterprise';
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'past_due';

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// Migraine Entry Domain
// ============================================================

export interface MigraineEntry {
  id: string;
  userId: string;
  createdAt: Date;
  severity: number; // 1-10
  intensity: number; // 1-10
  duration: number; // hours
  location: string | null;
  note: string | null;
  medicationTaken: string | null;
  effectiveness: number | null; // 1-10
  triggerDetected: boolean | null;
  forecastMatch: boolean | null;
  // Weather data captured at time of entry
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  weatherType: string | null;
}

export interface MigraineEntryInput {
  severity: number;
  intensity: number;
  duration: number;
  location?: string;
  note?: string;
  medicationTaken?: string;
  effectiveness?: number;
  selectedTriggers?: string[];
  selectedMedications?: string[];
}

export interface MigraineStatistics {
  totalEntries: number;
  averageIntensity: number;
  averageDuration: number;
  triggerPercentage: number;
  recentEpisodes: number;
  monthlyTrend: MonthlyTrend[];
}

export interface MonthlyTrend {
  month: string;
  count: number;
  avgIntensity: number;
}

// ============================================================
// AI Prediction Domain
// ============================================================

export type RiskLevel = 'low' | 'medium' | 'high';
export type PredictionType = 'daily' | 'hourly' | 'weekly';

export interface AIPrediction {
  id: string;
  userId: string;
  predictionType: PredictionType;
  riskLevel: number; // 1-10
  confidence: number; // 0-1
  predictedFor: Date;
  actualOutcome: boolean | null;
  weatherData: WeatherData | null;
  predictionFactors: PredictionFactor[] | null;
  createdAt: Date;
}

export interface PredictionFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number; // 0-1
  description?: string;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed?: number;
  description?: string;
  icon?: string;
}

// ============================================================
// Forecast Domain
// ============================================================

export interface ForecastDay {
  date: Date;
  riskLevel: RiskLevel;
  riskScore: number; // 1-10
  weather: WeatherData;
  triggers: string[];
  recommendation: string;
  confidence: number;
}

export interface WeatherAlert {
  id: string;
  type: 'pressure_drop' | 'temperature_change' | 'storm_front' | 'humidity_spike';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  expiresAt: Date;
}

// ============================================================
// Analytics Domain
// ============================================================

export interface TriggerAnalysis {
  trigger: string;
  count: number;
  percentage: number;
  avgIntensity: number;
}

export interface TimePattern {
  hour: number;
  dayOfWeek: number;
  frequency: number;
}

export interface InsightPattern {
  id: string;
  title: string;
  description: string;
  confidence: number;
  category: 'timing' | 'weather' | 'trigger' | 'lifestyle';
  iconName: string;
  color: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  description: string;
}

// ============================================================
// Email Notification Domain
// ============================================================

export type NotificationType = 'weather_alert' | 'risk_prediction' | 'weekly_summary' | 'system';

export interface EmailNotification {
  id: string;
  userId: string;
  notificationType: NotificationType;
  subject: string;
  content: string;
  status: 'sent' | 'failed' | 'pending';
  metadata: Record<string, unknown> | null;
  sentAt: Date | null;
}

// ============================================================
// Common Value Objects
// ============================================================

export interface DateRange {
  start: Date;
  end: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type Result<T, E = ApiError> = 
  | { success: true; data: T }
  | { success: false; error: E };
