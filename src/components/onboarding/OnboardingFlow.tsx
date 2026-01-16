import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { profileSchema } from '@/lib/validations';
import { geocodeLocation } from '@/domain/services/geocodingService';
import type { GeocodingResult } from '@/domain/types';
import { 
  User, MapPin, Zap, Brain, Heart, CheckCircle, 
  ArrowRight, ArrowLeft, Star, AlertTriangle, Loader2, Search
} from 'lucide-react';

interface OnboardingFlowProps {
  onComplete?: () => void;
}

const triggerKeys = [
  'stress', 'sleepDeprivation', 'weatherChanges', 'hormoneFluctuations',
  'alcohol', 'caffeineWithdrawal', 'brightLight', 'noise', 
  'menstruation', 'hunger', 'certainFoods', 'screenWork'
];

const migraineTypeKeys = [
  'withAura', 'withoutAura', 'chronic', 
  'vestibular', 'hemiplegic', 'notSure'
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { id: 1, title: t('onboarding.steps.personalData'), icon: User },
    { id: 2, title: t('onboarding.steps.locationPreferences'), icon: MapPin },
    { id: 3, title: t('onboarding.steps.migraineTriggers'), icon: Zap },
    { id: 4, title: t('onboarding.steps.medicalDetails'), icon: Brain },
    { id: 5, title: t('onboarding.steps.finish'), icon: CheckCircle },
  ];

  const commonTriggers = triggerKeys.map(key => ({
    key,
    label: t(`triggers.${key}`)
  }));

  const migraineTypes = migraineTypeKeys.map(key => ({
    key,
    label: t(`migraineTypes.${key}`)
  }));

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    locationName: '',
    locationLat: null as number | null,
    locationLng: null as number | null,
    selectedLocationDisplay: '',
    timezone: 'Europe/Berlin',
    weatherSensitivity: 'medium',
    knownTriggers: [] as string[],
    customTriggers: '',
    migrainetType: '',
    currentMedications: '',
    frequencyPerMonth: 0,
  });

  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingResults, setGeocodingResults] = useState<GeocodingResult[]>([]);
  const [showLocationResults, setShowLocationResults] = useState(false);

  const progress = (currentStep / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleLocationSearch = useCallback(async () => {
    const query = formData.locationName.trim();
    if (!query || query.length < 2) {
      setGeocodingResults([]);
      setShowLocationResults(false);
      return;
    }

    setIsGeocoding(true);
    setShowLocationResults(true);
    
    const result = await geocodeLocation(query);
    
    if (result.success === true) {
      setGeocodingResults(result.data);
      if (result.data.length === 0) {
        toast({
          title: t('onboarding.step2.noLocationFound'),
          description: t('onboarding.step2.noLocationFoundDesc'),
          variant: 'destructive',
        });
      }
    } 
    
    if (result.success === false) {
      toast({
        title: t('onboarding.step2.locationSearchError'),
        description: result.error.message,
        variant: 'destructive',
      });
      setGeocodingResults([]);
    }
    
    setIsGeocoding(false);
  }, [formData.locationName, toast, t]);

  const handleSelectLocation = (location: GeocodingResult) => {
    setFormData(prev => ({
      ...prev,
      locationName: location.name,
      locationLat: location.lat,
      locationLng: location.lng,
      selectedLocationDisplay: location.displayName,
    }));
    setShowLocationResults(false);
    setGeocodingResults([]);
  };

  const handleTriggerToggle = (triggerKey: string) => {
    setFormData(prev => ({
      ...prev,
      knownTriggers: prev.knownTriggers.includes(triggerKey)
        ? prev.knownTriggers.filter(t => t !== triggerKey)
        : [...prev.knownTriggers, triggerKey]
    }));
  };

  const handleComplete = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const triggerLabels = formData.knownTriggers.map(key => 
        t(`triggers.${key}`)
      );

      const validationResult = profileSchema.safeParse({
        firstName: formData.firstName,
        lastName: formData.lastName,
        locationName: formData.locationName,
        timezone: formData.timezone,
        weatherSensitivity: formData.weatherSensitivity,
        knownTriggers: triggerLabels,
        customTriggers: formData.customTriggers,
        migrainetType: formData.migrainetType,
        currentMedications: formData.currentMedications,
        frequencyPerMonth: formData.frequencyPerMonth,
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          title: t('onboarding.validationError'),
          description: firstError.message,
          variant: 'destructive',
        });
        return;
      }

      const validatedData = validationResult.data;
      const allTriggers = [
        ...validatedData.knownTriggers,
        ...(validatedData.customTriggers ? validatedData.customTriggers.split(',').map(t => t.trim()).filter(t => t.length > 0 && t.length <= 50) : [])
      ].slice(0, 50);

      await updateProfile({
        first_name: validatedData.firstName,
        last_name: validatedData.lastName || '',
        location_name: formData.selectedLocationDisplay || validatedData.locationName,
        location_lat: formData.locationLat,
        location_lng: formData.locationLng,
        timezone: validatedData.timezone,
        weather_sensitivity: validatedData.weatherSensitivity,
        known_triggers: allTriggers.join(', '),
        migraine_type: validatedData.migrainetType,
        current_medications: validatedData.currentMedications || '',
      });

      toast({
        title: t('onboarding.welcomeToast'),
        description: t('onboarding.welcomeToastDesc'),
      });

      onComplete?.();
    } catch (error: any) {
      console.error('Profile save error:', error);
      toast({
        title: t('common.error'),
        description: t('onboarding.saveError'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.firstName.trim().length > 0;
      case 2:
        return formData.locationLat !== null && formData.locationLng !== null;
      case 3:
        return formData.knownTriggers.length > 0 || formData.customTriggers.trim().length > 0;
      case 4:
        return formData.migrainetType.length > 0;
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <User className="w-16 h-16 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold">{t('onboarding.step1.greeting')}</h3>
              <p className="text-muted-foreground">
                {t('onboarding.step1.subtitle')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('onboarding.step1.firstName')}</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder={t('onboarding.step1.firstNamePlaceholder')}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('onboarding.step1.lastName')}</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder={t('onboarding.step1.lastNamePlaceholder')}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <MapPin className="w-16 h-16 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold">{t('onboarding.step2.title')}</h3>
              <p className="text-muted-foreground">
                {t('onboarding.step2.subtitle')}
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location">{t('onboarding.step2.cityRegion')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="location"
                    value={formData.locationName}
                    onChange={(e) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        locationName: e.target.value,
                        locationLat: null,
                        locationLng: null,
                        selectedLocationDisplay: '',
                      }));
                    }}
                    placeholder={t('onboarding.step2.cityPlaceholder')}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleLocationSearch}
                    disabled={isGeocoding || formData.locationName.trim().length < 2}
                    variant="outline"
                  >
                    {isGeocoding ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                
                {showLocationResults && geocodingResults.length > 0 && (
                  <div className="border rounded-lg bg-card shadow-lg overflow-hidden">
                    {geocodingResults.map((location, index) => (
                      <button
                        key={`${location.lat}-${location.lng}-${index}`}
                        type="button"
                        className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center gap-3 border-b last:border-b-0"
                        onClick={() => handleSelectLocation(location)}
                      >
                        <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm">{location.displayName}</span>
                      </button>
                    ))}
                  </div>
                )}
                
                {formData.selectedLocationDisplay && (
                  <div className="flex items-center gap-2 p-3 bg-success/10 rounded-lg border border-success/20">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-success">{t('onboarding.step2.locationConfirmed')}</p>
                      <p className="text-sm text-muted-foreground">{formData.selectedLocationDisplay}</p>
                    </div>
                  </div>
                )}
                
                {!formData.selectedLocationDisplay && (
                  <p className="text-xs text-muted-foreground">
                    {t('onboarding.step2.locationHelper')}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timezone">{t('onboarding.step2.timezone')}</Label>
                <Select 
                  value={formData.timezone} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Berlin">Europe/Berlin (CET)</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                    <SelectItem value="America/New_York">America/New York (EST)</SelectItem>
                    <SelectItem value="America/Los_Angeles">America/Los Angeles (PST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>{t('onboarding.step2.weatherSensitivity')}</Label>
                <Select 
                  value={formData.weatherSensitivity} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, weatherSensitivity: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('onboarding.step2.weatherSensitivityLow')}</SelectItem>
                    <SelectItem value="medium">{t('onboarding.step2.weatherSensitivityMedium')}</SelectItem>
                    <SelectItem value="high">{t('onboarding.step2.weatherSensitivityHigh')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Zap className="w-16 h-16 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold">{t('onboarding.step3.title')}</h3>
              <p className="text-muted-foreground">
                {t('onboarding.step3.subtitle')}
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">{t('onboarding.step3.commonTriggers')}</Label>
                <div className="flex flex-wrap gap-2">
                  {commonTriggers.map((trigger) => (
                    <Badge
                      key={trigger.key}
                      variant={formData.knownTriggers.includes(trigger.key) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => handleTriggerToggle(trigger.key)}
                    >
                      {trigger.label}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customTriggers">{t('onboarding.step3.additionalTriggers')}</Label>
                <Textarea
                  id="customTriggers"
                  value={formData.customTriggers}
                  onChange={(e) => setFormData(prev => ({ ...prev, customTriggers: e.target.value }))}
                  placeholder={t('onboarding.step3.additionalTriggersPlaceholder')}
                  rows={3}
                />
              </div>
              
              {formData.knownTriggers.length > 0 && (
                <div className="p-3 bg-secondary/20 rounded-lg">
                  <p className="text-sm font-medium mb-2">{t('onboarding.step3.selectedTriggers')}</p>
                  <div className="flex flex-wrap gap-1">
                    {formData.knownTriggers.map((triggerKey, index) => (
                      <Badge key={index} variant="secondary">
                        {t(`triggers.${triggerKey}`)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Brain className="w-16 h-16 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold">{t('onboarding.step4.title')}</h3>
              <p className="text-muted-foreground">
                {t('onboarding.step4.subtitle')}
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('onboarding.step4.migraineType')}</Label>
                <Select 
                  value={formData.migrainetType} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, migrainetType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('onboarding.step4.migraineTypePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {migraineTypes.map((type) => (
                      <SelectItem key={type.key} value={type.key}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="medications">{t('onboarding.step4.currentMedications')}</Label>
                <Textarea
                  id="medications"
                  value={formData.currentMedications}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentMedications: e.target.value }))}
                  placeholder={t('onboarding.step4.medicationsPlaceholder')}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="frequency">{t('onboarding.step4.averageFrequency')}</Label>
                <Input
                  id="frequency"
                  type="number"
                  min="0"
                  max="31"
                  value={formData.frequencyPerMonth}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    frequencyPerMonth: parseInt(e.target.value) || 0 
                  }))}
                  placeholder={t('onboarding.step4.frequencyPlaceholder')}
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-6">
            <CheckCircle className="w-20 h-20 text-success mx-auto" />
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2">{t('onboarding.step5.welcome')}</h3>
              <p className="text-lg text-muted-foreground mb-4">
                {t('onboarding.step5.subtitle')}
              </p>
            </div>
            
            <div className="bg-gradient-primary/10 p-6 rounded-2xl border border-primary/20">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Star className="w-5 h-5 text-primary" />
                <span className="font-semibold text-primary">{t('onboarding.step5.aiActive')}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('onboarding.step5.description')}
              </p>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-warning/10 rounded-lg border border-warning/20">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
              <p className="text-sm text-warning text-left">
                <strong>{t('onboarding.step5.disclaimer').split(':')[0]}:</strong> {t('onboarding.step5.disclaimer').split(':')[1]}
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="velar-card max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-xl">Velar Setup</CardTitle>
          <Badge variant="outline">
            {t('onboarding.stepOf', { current: currentStep, total: steps.length })}
          </Badge>
        </div>
        
        <Progress value={progress} className="w-full" />
        
        <div className="flex justify-center mt-4">
          <div className="flex items-center space-x-2">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                    step.id === currentStep
                      ? 'bg-primary border-primary text-primary-foreground'
                      : step.id < currentStep
                      ? 'bg-success border-success text-success-foreground'
                      : 'border-muted-foreground/30 text-muted-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              );
            })}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>
        
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.back')}
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
            className="velar-button-primary flex items-center gap-2"
          >
            {currentStep === steps.length ? (
              isSubmitting ? t('common.finishing') : t('common.finish')
            ) : (
              <>
                {t('common.next')}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
