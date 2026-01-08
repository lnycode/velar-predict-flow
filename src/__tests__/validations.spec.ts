import { describe, it, expect } from 'vitest';
import { profileSchema, migraineDiarySchema, authSchema } from '@/lib/validations';

describe('profileSchema', () => {
  const validProfile = {
    firstName: 'John',
    lastName: 'Doe',
    locationName: 'Berlin',
    timezone: 'Europe/Berlin',
    weatherSensitivity: 'medium' as const,
    knownTriggers: ['Stress', 'Weather'],
    customTriggers: '',
    migrainetType: 'With Aura',
    currentMedications: 'Ibuprofen',
    frequencyPerMonth: 5,
  };

  it('should validate a correct profile', () => {
    const result = profileSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
  });

  it('should reject empty firstName', () => {
    const result = profileSchema.safeParse({ ...validProfile, firstName: '' });
    expect(result.success).toBe(false);
  });

  it('should reject firstName over 50 characters', () => {
    const result = profileSchema.safeParse({ 
      ...validProfile, 
      firstName: 'a'.repeat(51) 
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid weatherSensitivity', () => {
    const result = profileSchema.safeParse({ 
      ...validProfile, 
      weatherSensitivity: 'invalid' 
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative frequencyPerMonth', () => {
    const result = profileSchema.safeParse({ 
      ...validProfile, 
      frequencyPerMonth: -1 
    });
    expect(result.success).toBe(false);
  });

  it('should reject frequencyPerMonth over 31', () => {
    const result = profileSchema.safeParse({ 
      ...validProfile, 
      frequencyPerMonth: 32 
    });
    expect(result.success).toBe(false);
  });

  it('should allow empty lastName', () => {
    const result = profileSchema.safeParse({ ...validProfile, lastName: '' });
    expect(result.success).toBe(true);
  });
});

describe('migraineDiarySchema', () => {
  const validDiaryEntry = {
    severity: 7,
    intensity: 6,
    duration: 4,
    location: 'Berlin',
    note: 'Headache after stressful meeting',
    selectedTriggers: ['Stress'],
    selectedMedications: ['Ibuprofen'],
    customTrigger: '',
    customMedication: '',
    effectiveness: 7,
  };

  it('should validate a correct diary entry', () => {
    const result = migraineDiarySchema.safeParse(validDiaryEntry);
    expect(result.success).toBe(true);
  });

  it('should reject severity below 1', () => {
    const result = migraineDiarySchema.safeParse({ 
      ...validDiaryEntry, 
      severity: 0 
    });
    expect(result.success).toBe(false);
  });

  it('should reject severity above 10', () => {
    const result = migraineDiarySchema.safeParse({ 
      ...validDiaryEntry, 
      severity: 11 
    });
    expect(result.success).toBe(false);
  });

  it('should reject duration above 168 hours', () => {
    const result = migraineDiarySchema.safeParse({ 
      ...validDiaryEntry, 
      duration: 169 
    });
    expect(result.success).toBe(false);
  });

  it('should allow empty optional fields', () => {
    const result = migraineDiarySchema.safeParse({
      ...validDiaryEntry,
      location: '',
      note: '',
      customTrigger: '',
      customMedication: '',
    });
    expect(result.success).toBe(true);
  });

  it('should reject note over 2000 characters', () => {
    const result = migraineDiarySchema.safeParse({ 
      ...validDiaryEntry, 
      note: 'a'.repeat(2001) 
    });
    expect(result.success).toBe(false);
  });
});

describe('authSchema', () => {
  it('should validate correct credentials', () => {
    const result = authSchema.safeParse({
      email: 'test@example.com',
      password: 'securepassword123',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = authSchema.safeParse({
      email: 'not-an-email',
      password: 'securepassword123',
    });
    expect(result.success).toBe(false);
  });

  it('should reject password shorter than 6 characters', () => {
    const result = authSchema.safeParse({
      email: 'test@example.com',
      password: '12345',
    });
    expect(result.success).toBe(false);
  });

  it('should trim email whitespace', () => {
    const result = authSchema.safeParse({
      email: '  test@example.com  ',
      password: 'securepassword123',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('test@example.com');
    }
  });

  it('should reject email over 255 characters', () => {
    const result = authSchema.safeParse({
      email: 'a'.repeat(250) + '@test.com',
      password: 'securepassword123',
    });
    expect(result.success).toBe(false);
  });
});
