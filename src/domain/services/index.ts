/**
 * Domain Services - Public API
 * 
 * Export all domain services for clean, organized access.
 * 
 * Usage:
 *   import { getMigraineEntries, getUserProfile } from '@/domain/services';
 */

// Migraine Services
export {
  getMigraineEntries,
  getRecentMigraineEntries,
  getMigraineEntryById,
  createMigraineEntry,
  deleteMigraineEntry,
  getMigraineStatistics,
  getTotalEntriesCount,
} from './migraineService';

// Profile Services
export {
  getUserProfile,
  updateUserProfile,
  checkOnboardingComplete,
  updateNotificationSettings,
} from './profileService';

// Prediction Services
export {
  getLatestPrediction,
  getPredictionsForDateRange,
  getUpcomingPredictions,
  getPredictionAccuracy,
  getCurrentRiskLevel,
} from './predictionService';
