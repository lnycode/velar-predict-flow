import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { migraineDiarySchema } from '@/lib/validations';
import { Plus, X, Calendar, Clock, MapPin } from 'lucide-react';

interface MigraineDiaryProps {
  onEntryAdded?: () => void;
}

const commonTriggers = [
  'Stress', 'Schlafmangel', 'Wetter', 'Hormone', 'Alkohol', 
  'Koffein', 'Licht', 'Lärm', 'Menstruation', 'Hunger'
];

const medications = [
  'Ibuprofen', 'Sumatriptan', 'Paracetamol', 'Aspirin', 
  'Rizatriptan', 'Naratriptan', 'Almotriptan'
];

export const MigraineDiary: React.FC<MigraineDiaryProps> = ({ onEntryAdded }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    severity: [5],
    intensity: [5],
    duration: 0,
    location: '',
    note: '',
    selectedTriggers: [] as string[],
    selectedMedications: [] as string[],
    customTrigger: '',
    customMedication: '',
    effectiveness: [5]
  });

  const handleTriggerToggle = (trigger: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTriggers: prev.selectedTriggers.includes(trigger)
        ? prev.selectedTriggers.filter(t => t !== trigger)
        : [...prev.selectedTriggers, trigger]
    }));
  };

  const handleMedicationToggle = (medication: string) => {
    setFormData(prev => ({
      ...prev,
      selectedMedications: prev.selectedMedications.includes(medication)
        ? prev.selectedMedications.filter(m => m !== medication)
        : [...prev.selectedMedications, medication]
    }));
  };

  const addCustomTrigger = () => {
    if (formData.customTrigger.trim()) {
      setFormData(prev => ({
        ...prev,
        selectedTriggers: [...prev.selectedTriggers, prev.customTrigger.trim()],
        customTrigger: ''
      }));
    }
  };

  const addCustomMedication = () => {
    if (formData.customMedication.trim()) {
      setFormData(prev => ({
        ...prev,
        selectedMedications: [...prev.selectedMedications, prev.customMedication.trim()],
        customMedication: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Validate form data before submission
      const validationResult = migraineDiarySchema.safeParse({
        severity: formData.severity[0],
        intensity: formData.intensity[0],
        duration: formData.duration,
        location: formData.location,
        note: formData.note,
        selectedTriggers: formData.selectedTriggers,
        selectedMedications: formData.selectedMedications,
        customTrigger: formData.customTrigger,
        customMedication: formData.customMedication,
        effectiveness: formData.effectiveness[0],
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          title: 'Validierungsfehler',
          description: firstError.message,
          variant: 'destructive',
        });
        return;
      }

      const validatedData = validationResult.data;

      const { error } = await supabase
        .from('migraine_entries')
        .insert([{
          user_id: user.id,
          severity: validatedData.severity,
          intensity: validatedData.intensity,
          duration: validatedData.duration,
          location: validatedData.location || null,
          note: validatedData.note || null,
          medication_taken: validatedData.selectedMedications.length > 0 
            ? validatedData.selectedMedications.join(', ') 
            : null,
          effectiveness: validatedData.effectiveness,
          trigger_detected: validatedData.selectedTriggers.length > 0
        }] as any);

      if (error) throw error;

      toast({
        title: 'Eintrag gespeichert',
        description: 'Ihr Migräne-Tagebucheintrag wurde erfolgreich hinzugefügt.',
      });

      // Reset form
      setFormData({
        severity: [5],
        intensity: [5],
        duration: 0,
        location: '',
        note: '',
        selectedTriggers: [],
        selectedMedications: [],
        customTrigger: '',
        customMedication: '',
        effectiveness: [5]
      });

      onEntryAdded?.();
    } catch (error: any) {
      console.error('Diary entry save error:', error);
      toast({
        title: 'Fehler',
        description: 'Fehler beim Speichern des Eintrags. Bitte versuchen Sie es erneut.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="velar-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Migräne-Tagebuch Eintrag
        </CardTitle>
        <CardDescription>
          Dokumentieren Sie Ihre Migräne-Episode für bessere Vorhersagen
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Severity & Intensity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Schweregrad (1-10): {formData.severity[0]}
              </Label>
              <Slider
                value={formData.severity}
                onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value }))}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Mild</span>
                <span>Schwer</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Schmerzintensität (1-10): {formData.intensity[0]}
              </Label>
              <Slider
                value={formData.intensity}
                onValueChange={(value) => setFormData(prev => ({ ...prev, intensity: value }))}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Gering</span>
                <span>Stark</span>
              </div>
            </div>
          </div>

          {/* Duration & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="duration" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Dauer (Stunden)
              </Label>
              <Input
                id="duration"
                type="number"
                min="0"
                step="0.5"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  duration: parseFloat(e.target.value) || 0 
                }))}
                placeholder="z.B. 4.5"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Ort
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="z.B. München, Büro"
              />
            </div>
          </div>

          {/* Triggers */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Mögliche Auslöser</Label>
            <div className="flex flex-wrap gap-2">
              {commonTriggers.map((trigger) => (
                <Badge
                  key={trigger}
                  variant={formData.selectedTriggers.includes(trigger) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleTriggerToggle(trigger)}
                >
                  {trigger}
                </Badge>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Input
                value={formData.customTrigger}
                onChange={(e) => setFormData(prev => ({ ...prev, customTrigger: e.target.value }))}
                placeholder="Eigener Auslöser..."
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={addCustomTrigger}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {formData.selectedTriggers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.selectedTriggers.map((trigger, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {trigger}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => handleTriggerToggle(trigger)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Medications */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Eingenommene Medikamente</Label>
            <div className="flex flex-wrap gap-2">
              {medications.map((medication) => (
                <Badge
                  key={medication}
                  variant={formData.selectedMedications.includes(medication) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleMedicationToggle(medication)}
                >
                  {medication}
                </Badge>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Input
                value={formData.customMedication}
                onChange={(e) => setFormData(prev => ({ ...prev, customMedication: e.target.value }))}
                placeholder="Anderes Medikament..."
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={addCustomMedication}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {formData.selectedMedications.length > 0 && (
              <>
                <div className="flex flex-wrap gap-2">
                  {formData.selectedMedications.map((medication, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {medication}
                      <X 
                        className="w-3 h-3 cursor-pointer" 
                        onClick={() => handleMedicationToggle(medication)}
                      />
                    </Badge>
                  ))}
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Wirksamkeit (1-10): {formData.effectiveness[0]}
                  </Label>
                  <Slider
                    value={formData.effectiveness}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, effectiveness: value }))}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Unwirksam</span>
                    <span>Sehr wirksam</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="note">Zusätzliche Notizen</Label>
            <Textarea
              id="note"
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              placeholder="Weitere Details zu Symptomen, Begleiterscheinungen, etc."
              rows={3}
            />
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full velar-button-primary"
          >
            {isSubmitting ? 'Speichern...' : 'Eintrag speichern'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};