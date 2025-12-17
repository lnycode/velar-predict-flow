import { z } from 'zod';

// Profile/Onboarding validation schemas
export const profileSchema = z.object({
  firstName: z.string().trim().min(1, 'Vorname ist erforderlich').max(50, 'Vorname darf maximal 50 Zeichen haben'),
  lastName: z.string().trim().max(50, 'Nachname darf maximal 50 Zeichen haben').optional().or(z.literal('')),
  locationName: z.string().trim().min(1, 'Standort ist erforderlich').max(100, 'Standort darf maximal 100 Zeichen haben'),
  timezone: z.string().min(1),
  weatherSensitivity: z.enum(['low', 'medium', 'high']),
  knownTriggers: z.array(z.string().max(50)).max(50),
  customTriggers: z.string().max(500, 'Benutzerdefinierte Trigger dürfen maximal 500 Zeichen haben').optional().or(z.literal('')),
  migrainetType: z.string().max(100),
  currentMedications: z.string().max(1000, 'Medikamente dürfen maximal 1000 Zeichen haben').optional().or(z.literal('')),
  frequencyPerMonth: z.number().min(0).max(31),
});

// Migraine diary entry validation
export const migraineDiarySchema = z.object({
  severity: z.number().min(1).max(10),
  intensity: z.number().min(1).max(10),
  duration: z.number().min(0).max(168), // max 1 week in hours
  location: z.string().trim().max(100, 'Ort darf maximal 100 Zeichen haben').optional().or(z.literal('')),
  note: z.string().trim().max(2000, 'Notizen dürfen maximal 2000 Zeichen haben').optional().or(z.literal('')),
  selectedTriggers: z.array(z.string().max(50)).max(20),
  selectedMedications: z.array(z.string().max(100)).max(20),
  customTrigger: z.string().max(50).optional().or(z.literal('')),
  customMedication: z.string().max(100).optional().or(z.literal('')),
  effectiveness: z.number().min(1).max(10),
});

// Auth validation schemas
export const authSchema = z.object({
  email: z.string().trim().email('Ungültige E-Mail-Adresse').max(255),
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen haben').max(100),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
export type MigraineDiaryFormData = z.infer<typeof migraineDiarySchema>;
export type AuthFormData = z.infer<typeof authSchema>;
