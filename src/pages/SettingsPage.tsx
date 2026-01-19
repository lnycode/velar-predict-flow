import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { User, Bell, Shield, Download, Trash2, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Profile state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  
  // Notification state
  const [weatherAlerts, setWeatherAlerts] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [aiPredictions, setAiPredictions] = useState(true);
  
  // Medical info state
  const [migraineType, setMigraineType] = useState("");
  const [knownTriggers, setKnownTriggers] = useState("");
  const [currentMedications, setCurrentMedications] = useState("");
  const [weatherSensitivity, setWeatherSensitivity] = useState("medium");

  // Stats
  const [totalEntries, setTotalEntries] = useState(0);
  const [accuracy, setAccuracy] = useState(0);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadStats();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
        setEmail(data.email || user.email || "");
        setTimezone(data.timezone || "UTC");
        setWeatherAlerts(data.weather_alerts ?? true);
        setEmailNotifications(data.email_notifications ?? true);
        setAiPredictions(data.ai_predictions_enabled ?? true);
        setMigraineType(data.migraine_type || "");
        setKnownTriggers(data.known_triggers || "");
        setCurrentMedications(data.current_medications || "");
        setWeatherSensitivity(data.weather_sensitivity || "medium");
      } else {
        setEmail(user.email || "");
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error(t('settings.failedToLoadProfile'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;

    try {
      // Get total entries
      const { count: entriesCount } = await supabase
        .from('migraine_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setTotalEntries(entriesCount || 0);

      // Get prediction accuracy
      const { data: predictions } = await supabase
        .from('ai_predictions')
        .select('*')
        .eq('user_id', user.id)
        .not('actual_outcome', 'is', null);

      if (predictions && predictions.length > 0) {
        const correct = predictions.filter(p => 
          (p.actual_outcome === true && p.risk_level >= 50) || 
          (p.actual_outcome === false && p.risk_level < 50)
        ).length;
        setAccuracy(Math.round((correct / predictions.length) * 100));
      } else {
        setAccuracy(85); // Default
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          first_name: firstName,
          last_name: lastName,
          email: email,
          timezone: timezone,
          weather_alerts: weatherAlerts,
          email_notifications: emailNotifications,
          ai_predictions_enabled: aiPredictions,
          migraine_type: migraineType,
          known_triggers: knownTriggers,
          current_medications: currentMedications,
          weather_sensitivity: weatherSensitivity,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast.success(t('settings.profileSavedSuccess'));
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(t('settings.failedToSaveProfile'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;

    try {
      const { data: entries } = await supabase
        .from('migraine_entries')
        .select('*')
        .eq('user_id', user.id);

      const { data: predictions } = await supabase
        .from('ai_predictions')
        .select('*')
        .eq('user_id', user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const exportData = {
        exportDate: new Date().toISOString(),
        profile: profile,
        migraineEntries: entries,
        predictions: predictions
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `velar-data-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success(t('settings.dataExportedSuccess'));
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error(t('settings.failedToExportData'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('settings.title')}</h1>
        <p className="text-muted-foreground">{t('settings.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <Card className="velar-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              {t('settings.profileInfo')}
            </CardTitle>
            <CardDescription>{t('settings.updatePersonalInfo')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">{t('settings.firstName')}</Label>
                <Input 
                  id="firstName" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-background border-border/50" 
                />
              </div>
              <div>
                <Label htmlFor="lastName">{t('settings.lastName')}</Label>
                <Input 
                  id="lastName" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-background border-border/50" 
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">{t('settings.email')}</Label>
              <Input 
                id="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background border-border/50" 
              />
            </div>
            
            <div>
              <Label htmlFor="timezone">{t('settings.timezone')}</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="bg-background border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="Europe/Berlin">Europe/Berlin (CET)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                  <SelectItem value="America/New_York">Eastern (EST)</SelectItem>
                  <SelectItem value="America/Chicago">Central (CST)</SelectItem>
                  <SelectItem value="America/Denver">Mountain (MST)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific (PST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={saveProfile} disabled={isSaving} className="w-full velar-button-primary">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {t('settings.saveProfile')}
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="velar-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              {t('settings.notifications')}
            </CardTitle>
            <CardDescription>{t('settings.configureAlerts')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="weatherAlerts">{t('settings.weatherAlerts')}</Label>
                <p className="text-sm text-muted-foreground">{t('settings.highRiskWeatherNotifications')}</p>
              </div>
              <Switch 
                id="weatherAlerts" 
                checked={weatherAlerts}
                onCheckedChange={setWeatherAlerts}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotifications">{t('settings.emailNotifications')}</Label>
                <p className="text-sm text-muted-foreground">{t('settings.receiveEmailUpdates')}</p>
              </div>
              <Switch 
                id="emailNotifications" 
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="aiPredictions">{t('settings.aiPredictions')}</Label>
                <p className="text-sm text-muted-foreground">{t('settings.enableAIPredictions')}</p>
              </div>
              <Switch 
                id="aiPredictions" 
                checked={aiPredictions}
                onCheckedChange={setAiPredictions}
              />
            </div>
          </CardContent>
        </Card>

        {/* Medical Information */}
        <Card className="velar-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              {t('settings.medicalInfo')}
            </CardTitle>
            <CardDescription>{t('settings.helpImproveAI')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="migrainType">{t('settings.migraineType')}</Label>
              <Select value={migraineType} onValueChange={setMigraineType}>
                <SelectTrigger className="bg-background border-border/50">
                  <SelectValue placeholder={t('settings.selectMigraineType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="episodic">{t('migraineTypes.episodic')}</SelectItem>
                  <SelectItem value="chronic">{t('migraineTypes.chronic')}</SelectItem>
                  <SelectItem value="aura">{t('migraineTypes.withAura')}</SelectItem>
                  <SelectItem value="basilar">{t('migraineTypes.basilar')}</SelectItem>
                  <SelectItem value="vestibular">{t('migraineTypes.vestibular')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="commonTriggers">{t('settings.knownTriggers')}</Label>
              <Textarea 
                id="commonTriggers" 
                placeholder={t('settings.triggersPlaceholder')}
                className="bg-background border-border/50"
                value={knownTriggers}
                onChange={(e) => setKnownTriggers(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="medications">{t('settings.currentMedications')}</Label>
              <Textarea 
                id="medications" 
                placeholder={t('settings.medicationsPlaceholder')}
                className="bg-background border-border/50"
                value={currentMedications}
                onChange={(e) => setCurrentMedications(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="weatherSensitivity">{t('settings.weatherSensitivity')}</Label>
              <Select value={weatherSensitivity} onValueChange={setWeatherSensitivity}>
                <SelectTrigger className="bg-background border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t('common.low')}</SelectItem>
                  <SelectItem value="medium">{t('common.medium')}</SelectItem>
                  <SelectItem value="high">{t('common.high')}</SelectItem>
                  <SelectItem value="extreme">{t('common.extreme')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={saveProfile} disabled={isSaving} className="w-full velar-button-primary">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {t('settings.saveMedicalInfo')}
            </Button>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card className="velar-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              {t('settings.dataPrivacy')}
            </CardTitle>
            <CardDescription>{t('settings.manageDataPrivacy')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-secondary/20 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">{t('settings.dataSummary')}</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-lg font-bold text-primary">{totalEntries}</div>
                  <div className="text-xs text-muted-foreground">{t('settings.migraineEntries')}</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-success">{accuracy}%</div>
                  <div className="text-xs text-muted-foreground">{t('settings.predictionAccuracy')}</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button variant="outline" className="w-full" onClick={handleExportData}>
                <Download className="w-4 h-4 mr-2" />
                {t('settings.exportMyData')}
              </Button>
              
              <Button variant="outline" className="w-full">
                {t('settings.viewPrivacyPolicy')}
              </Button>
              
              <Button variant="destructive" className="w-full">
                <Trash2 className="w-4 h-4 mr-2" />
                {t('settings.deleteAccount')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* App Information */}
      <Card className="velar-card border-border/50">
        <CardHeader>
          <CardTitle>{t('settings.aboutVelar')}</CardTitle>
          <CardDescription>{t('settings.versionInfo')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-primary">v2.1.0</div>
              <div className="text-sm text-muted-foreground">{t('settings.appVersion')}</div>
            </div>
            <div>
              <div className="text-lg font-bold text-warning">{accuracy}%</div>
              <div className="text-sm text-muted-foreground">{t('settings.yourAIAccuracy')}</div>
            </div>
            <div>
              <div className="text-lg font-bold text-success">{totalEntries}</div>
              <div className="text-sm text-muted-foreground">{t('settings.yourEntries')}</div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-center gap-4">
            <Button variant="outline" size="sm">{t('settings.contactSupport')}</Button>
            <Button variant="outline" size="sm">{t('settings.rateApp')}</Button>
            <Button variant="outline" size="sm">{t('settings.releaseNotes')}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}