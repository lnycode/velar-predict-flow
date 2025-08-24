import { useState } from 'react';
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
import { 
  User, MapPin, Zap, Brain, Heart, CheckCircle, 
  ArrowRight, ArrowLeft, Star, AlertTriangle 
} from 'lucide-react';

interface OnboardingFlowProps {
  onComplete?: () => void;
}

const steps = [
  { id: 1, title: 'Persönliche Daten', icon: User },
  { id: 2, title: 'Standort & Präferenzen', icon: MapPin },
  { id: 3, title: 'Migräne-Trigger', icon: Zap },
  { id: 4, title: 'Medizinische Details', icon: Brain },
  { id: 5, title: 'Abschluss', icon: CheckCircle },
];

const commonTriggers = [
  'Stress', 'Schlafmangel', 'Wetteränderungen', 'Hormonschwankungen',
  'Alkohol', 'Koffein-Entzug', 'Helles Licht', 'Lärm', 
  'Menstruation', 'Hunger', 'Bestimmte Lebensmittel', 'Bildschirmarbeit'
];

const migrainetTypes = [
  'Migräne mit Aura', 'Migräne ohne Aura', 'Chronische Migräne', 
  'Vestibulare Migräne', 'Hemiplegische Migräne', 'Nicht sicher'
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1: Personal Data
    firstName: '',
    lastName: '',
    
    // Step 2: Location & Preferences
    locationName: '',
    timezone: 'Europe/Berlin',
    weatherSensitivity: 'medium',
    
    // Step 3: Triggers
    knownTriggers: [] as string[],
    customTriggers: '',
    
    // Step 4: Medical Details
    migrainetType: '',
    currentMedications: '',
    frequencyPerMonth: 0,
  });

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

  const handleTriggerToggle = (trigger: string) => {
    setFormData(prev => ({
      ...prev,
      knownTriggers: prev.knownTriggers.includes(trigger)
        ? prev.knownTriggers.filter(t => t !== trigger)
        : [...prev.knownTriggers, trigger]
    }));
  };

  const handleComplete = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const allTriggers = [
        ...formData.knownTriggers,
        ...(formData.customTriggers ? formData.customTriggers.split(',').map(t => t.trim()) : [])
      ].filter(t => t.length > 0);

      await updateProfile({
        first_name: formData.firstName,
        last_name: formData.lastName,
        location_name: formData.locationName,
        timezone: formData.timezone,
        weather_sensitivity: formData.weatherSensitivity,
        known_triggers: allTriggers.join(', '),
        migraine_type: formData.migrainetType,
        current_medications: formData.currentMedications,
      });

      toast({
        title: 'Willkommen bei Velar! 🎉',
        description: 'Ihr Profil wurde erfolgreich eingerichtet. Ihre KI-gestützte Migräne-Vorhersage ist jetzt aktiv.',
      });

      onComplete?.();
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message || 'Fehler beim Speichern der Daten',
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
        return formData.locationName.trim().length > 0;
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
              <h3 className="text-xl font-semibold">Hallo! Schön, Sie kennenzulernen.</h3>
              <p className="text-muted-foreground">
                Lassen Sie uns mit den Grundlagen beginnen.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Vorname</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Ihr Vorname"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Nachname</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Ihr Nachname"
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
              <h3 className="text-xl font-semibold">Wo befinden Sie sich?</h3>
              <p className="text-muted-foreground">
                Ihr Standort hilft uns, präzise Wettervorhersagen zu erstellen.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location">Stadt/Region</Label>
                <Input
                  id="location"
                  value={formData.locationName}
                  onChange={(e) => setFormData(prev => ({ ...prev, locationName: e.target.value }))}
                  placeholder="z.B. München, Bayern"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timezone">Zeitzone</Label>
                <Select 
                  value={formData.timezone} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Berlin">Europa/Berlin (MEZ)</SelectItem>
                    <SelectItem value="Europe/London">Europa/London (GMT)</SelectItem>
                    <SelectItem value="America/New_York">Amerika/New York (EST)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Amerika/Los Angeles (PST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Wettersensitivität</Label>
                <Select 
                  value={formData.weatherSensitivity} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, weatherSensitivity: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Niedrig - Wetter beeinflusst mich selten</SelectItem>
                    <SelectItem value="medium">Mittel - Ich bemerke Wetteränderungen manchmal</SelectItem>
                    <SelectItem value="high">Hoch - Wetteränderungen beeinflussen mich stark</SelectItem>
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
              <h3 className="text-xl font-semibold">Was löst Ihre Migräne aus?</h3>
              <p className="text-muted-foreground">
                Wählen Sie bekannte Trigger aus oder fügen Sie eigene hinzu.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Häufige Auslöser</Label>
                <div className="flex flex-wrap gap-2">
                  {commonTriggers.map((trigger) => (
                    <Badge
                      key={trigger}
                      variant={formData.knownTriggers.includes(trigger) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => handleTriggerToggle(trigger)}
                    >
                      {trigger}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customTriggers">Weitere Trigger (getrennt durch Komma)</Label>
                <Textarea
                  id="customTriggers"
                  value={formData.customTriggers}
                  onChange={(e) => setFormData(prev => ({ ...prev, customTriggers: e.target.value }))}
                  placeholder="z.B. Schokolade, Rotwein, Parfüm..."
                  rows={3}
                />
              </div>
              
              {formData.knownTriggers.length > 0 && (
                <div className="p-3 bg-secondary/20 rounded-lg">
                  <p className="text-sm font-medium mb-2">Ausgewählte Trigger:</p>
                  <div className="flex flex-wrap gap-1">
                    {formData.knownTriggers.map((trigger, index) => (
                      <Badge key={index} variant="secondary">
                        {trigger}
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
              <h3 className="text-xl font-semibold">Medizinische Details</h3>
              <p className="text-muted-foreground">
                Diese Informationen helfen bei der Personalisierung Ihrer Vorhersagen.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Art der Migräne</Label>
                <Select 
                  value={formData.migrainetType} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, migrainetType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen Sie Ihren Migräne-Typ" />
                  </SelectTrigger>
                  <SelectContent>
                    {migrainetTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="medications">Aktuelle Medikamente</Label>
                <Textarea
                  id="medications"
                  value={formData.currentMedications}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentMedications: e.target.value }))}
                  placeholder="z.B. Sumatriptan 50mg bei Bedarf, Topiramat 25mg täglich zur Prophylaxe..."
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="frequency">Durchschnittliche Häufigkeit pro Monat</Label>
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
                  placeholder="z.B. 5"
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
              <h3 className="text-2xl font-bold text-foreground mb-2">Herzlich willkommen bei Velar!</h3>
              <p className="text-lg text-muted-foreground mb-4">
                Ihr personalisiertes Migräne-Vorhersagesystem ist bereit.
              </p>
            </div>
            
            <div className="bg-gradient-primary/10 p-6 rounded-2xl border border-primary/20">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Star className="w-5 h-5 text-primary" />
                <span className="font-semibold text-primary">Ihre KI ist jetzt aktiv</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Basierend auf Ihren Angaben erstellt Velar personalisierte Vorhersagen und 
                Warnungen für Ihre Migräne-Episoden. Je mehr Sie das System nutzen, 
                desto präziser werden die Vorhersagen.
              </p>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-warning/10 rounded-lg border border-warning/20">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
              <p className="text-sm text-warning text-left">
                <strong>Wichtig:</strong> Velar ersetzt nicht die ärztliche Beratung. 
                Konsultieren Sie bei schweren oder häufigen Symptomen immer einen Arzt.
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
            Schritt {currentStep} von {steps.length}
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
            Zurück
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
            className="velar-button-primary flex items-center gap-2"
          >
            {currentStep === steps.length ? (
              isSubmitting ? 'Abschließen...' : 'Abschließen'
            ) : (
              <>
                Weiter
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};