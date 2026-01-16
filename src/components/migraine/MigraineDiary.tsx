import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

const triggerKeys = ['stress', 'sleepDeprivation', 'weather', 'hormones', 'alcohol', 'caffeine', 'light', 'noise', 'menstruation', 'hunger'];

const medications = [
  'Ibuprofen', 'Sumatriptan', 'Paracetamol', 'Aspirin', 
  'Rizatriptan', 'Naratriptan', 'Almotriptan'
];

export const MigraineDiary: React.FC<MigraineDiaryProps> = ({ onEntryAdded }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const commonTriggers = triggerKeys.map(key => ({
    key,
    label: t(`triggers.${key}`)
  }));

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
          title: t('onboarding.validationError'),
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
        title: t('diary.entrySaved'),
        description: t('diary.entrySavedDesc'),
      });

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
        title: t('common.error'),
        description: t('diary.saveError'),
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
          {t('diary.title')}
        </CardTitle>
        <CardDescription>
          {t('diary.description')}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t('diary.severity')}: {formData.severity[0]}
              </Label>
              <Slider value={formData.severity} onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value }))} max={10} min={1} step={1} className="w-full" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t('diary.mild')}</span>
                <span>{t('diary.severe')}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t('diary.intensity')}: {formData.intensity[0]}
              </Label>
              <Slider value={formData.intensity} onValueChange={(value) => setFormData(prev => ({ ...prev, intensity: value }))} max={10} min={1} step={1} className="w-full" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t('diary.low')}</span>
                <span>{t('diary.strong')}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="duration" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t('diary.duration')}
              </Label>
              <Input id="duration" type="number" min="0" step="0.5" value={formData.duration} onChange={(e) => setFormData(prev => ({ ...prev, duration: parseFloat(e.target.value) || 0 }))} placeholder={t('diary.durationPlaceholder')} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {t('diary.location')}
              </Label>
              <Input id="location" value={formData.location} onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))} placeholder={t('diary.locationPlaceholder')} />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">{t('diary.possibleTriggers')}</Label>
            <div className="flex flex-wrap gap-2">
              {commonTriggers.map((trigger) => (
                <Badge key={trigger.key} variant={formData.selectedTriggers.includes(trigger.label) ? "default" : "outline"} className="cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => handleTriggerToggle(trigger.label)}>
                  {trigger.label}
                </Badge>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Input value={formData.customTrigger} onChange={(e) => setFormData(prev => ({ ...prev, customTrigger: e.target.value }))} placeholder={t('diary.customTriggerPlaceholder')} className="flex-1" />
              <Button type="button" variant="outline" onClick={addCustomTrigger}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {formData.selectedTriggers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.selectedTriggers.map((trigger, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {trigger}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => handleTriggerToggle(trigger)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">{t('diary.medicationsTaken')}</Label>
            <div className="flex flex-wrap gap-2">
              {medications.map((medication) => (
                <Badge key={medication} variant={formData.selectedMedications.includes(medication) ? "default" : "outline"} className="cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => handleMedicationToggle(medication)}>
                  {medication}
                </Badge>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Input value={formData.customMedication} onChange={(e) => setFormData(prev => ({ ...prev, customMedication: e.target.value }))} placeholder={t('diary.customMedicationPlaceholder')} className="flex-1" />
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
                      <X className="w-3 h-3 cursor-pointer" onClick={() => handleMedicationToggle(medication)} />
                    </Badge>
                  ))}
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t('diary.effectiveness')}: {formData.effectiveness[0]}
                  </Label>
                  <Slider value={formData.effectiveness} onValueChange={(value) => setFormData(prev => ({ ...prev, effectiveness: value }))} max={10} min={1} step={1} className="w-full" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t('diary.ineffective')}</span>
                    <span>{t('diary.veryEffective')}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">{t('diary.additionalNotes')}</Label>
            <Textarea id="note" value={formData.note} onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))} placeholder={t('diary.notesPlaceholder')} rows={3} />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full velar-button-primary">
            {isSubmitting ? t('diary.saving') : t('diary.saveEntry')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
