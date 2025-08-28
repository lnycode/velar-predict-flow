import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { WeatherAlert } from "@/components/dashboard/WeatherAlert";
import { MigrainFrequencyChart } from "@/components/dashboard/MigrainFrequencyChart";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { Statistics } from "@/components/dashboard/Statistics";
import { RiskForecast } from "@/components/forecast/RiskForecast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { 
  Calendar, Activity, TrendingUp, Brain, 
  ArrowRight, Clock, AlertTriangle 
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    totalEntries: 0,
    recentEpisodes: 0,
    avgIntensity: 0,
    currentRisk: 5,
    lastPrediction: null as any,
    recentActivity: [] as any[]
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      // Get total migraine entries
      const { count: totalEntries } = await supabase
        .from('migraine_entries')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id);

      // Get recent episodes (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: recentEntries, count: recentCount } = await supabase
        .from('migraine_entries')
        .select('intensity, created_at', { count: 'exact' })
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      // Calculate average intensity
      const avgIntensity = recentEntries && recentEntries.length > 0
        ? recentEntries.reduce((sum, entry) => sum + (entry.intensity || 0), 0) / recentEntries.length
        : 0;

      // Get latest prediction
      const { data: prediction } = await supabase
        .from('ai_predictions')
        .select('risk_level, created_at, prediction_factors')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Create recent activity from entries
      const recentActivity = recentEntries?.slice(0, 5).map(entry => ({
        time: `${Math.round((new Date().getTime() - new Date(entry.created_at).getTime()) / (1000 * 60 * 60))}h ago`,
        event: 'Migräne-Episode dokumentiert',
        severity: entry.intensity > 7 ? 'Schwer' : entry.intensity > 4 ? 'Mittel' : 'Mild',
        type: 'episode'
      })) || [];

      // Add prediction to activity if exists
      if (prediction) {
        recentActivity.unshift({
          time: `${Math.round((new Date().getTime() - new Date(prediction.created_at).getTime()) / (1000 * 60 * 60))}h ago`,
          event: 'KI-Vorhersage erstellt',
          severity: prediction.risk_level > 7 ? 'Hohes Risiko' : 
                   prediction.risk_level > 4 ? 'Mittleres Risiko' : 'Niedriges Risiko',
          type: 'prediction'
        });
      }

      setDashboardData({
        totalEntries: totalEntries || 0,
        recentEpisodes: recentCount || 0,
        avgIntensity: Math.round(avgIntensity * 10) / 10,
        currentRisk: prediction?.risk_level || 5,
        lastPrediction: prediction,
        recentActivity: recentActivity.slice(0, 5)
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk <= 3) return 'text-success';
    if (risk <= 6) return 'text-warning';
    return 'text-destructive';
  };

  const getRiskLabel = (risk: number) => {
    if (risk <= 3) return 'Niedrig';
    if (risk <= 6) return 'Mittel';
    return 'Hoch';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-secondary/30 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Welcome Section */}
      <Card className="velar-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Dashboard 
                <span className="velar-text-glow ml-2">✨</span>
              </h1>
              <p className="text-muted-foreground">
                Ihre personalisierte Migräne-Intelligence im Überblick
              </p>
            </div>
            
            <div className="text-right">
              <div className={`text-3xl font-bold mb-1 ${getRiskColor(dashboardData.currentRisk)}`}>
                {dashboardData.currentRisk}/10
              </div>
              <div className="text-sm text-muted-foreground">
                Aktuelles Risiko ({getRiskLabel(dashboardData.currentRisk)})
              </div>
            </div>
          </div>

          {/* Current Alert */}
          {dashboardData.currentRisk > 7 && (
            <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-4">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Migräne-Warnung</p>
                <p className="text-sm text-muted-foreground">
                  Erhöhtes Risiko in den nächsten 24-48 Stunden erkannt
                </p>
              </div>
              <Link to="/forecast" className="ml-auto">
                <Button size="sm" variant="destructive">
                  Details ansehen
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="velar-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Gesamt Einträge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalEntries}</div>
            <p className="text-xs text-muted-foreground">Dokumentierte Episoden</p>
          </CardContent>
        </Card>

        <Card className="velar-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Letzte 30 Tage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.recentEpisodes}</div>
            <p className="text-xs text-muted-foreground">Neue Episoden</p>
          </CardContent>
        </Card>

        <Card className="velar-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Ø Intensität
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.avgIntensity}</div>
            <p className="text-xs text-muted-foreground">Durchschnittswert</p>
          </CardContent>
        </Card>

        <Card className="velar-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              KI-Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.lastPrediction ? 'Aktiv' : 'Bereit'}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.lastPrediction ? 'Vorhersage verfügbar' : 'Warten auf Daten'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Forecast */}
        <div className="lg:col-span-2">
          <RiskForecast />
        </div>

        {/* Right Column - Quick Actions & Stats */}
        <div className="space-y-6">
          <Card className="velar-card">
            <CardHeader>
              <CardTitle className="text-lg">Schnellaktionen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/diary" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Neuer Tagebuch-Eintrag
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              </Link>
              
              <Link to="/analytics" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Analysen ansehen
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              </Link>
              
              <Link to="/settings" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Brain className="w-4 h-4 mr-2" />
                  KI-Einstellungen
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Statistics />
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="velar-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Letzte Aktivitäten
          </CardTitle>
          <CardDescription>
            Übersicht Ihrer aktuellen Migräne-Dokumentation und KI-Vorhersagen
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {dashboardData.recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">Noch keine Aktivitäten vorhanden</p>
              <Link to="/diary">
                <Button className="velar-button-primary mt-4">
                  Ersten Eintrag erstellen
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {dashboardData.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'prediction' ? 'bg-primary' : 'bg-success'
                    }`} />
                    <div>
                      <div className="font-medium text-foreground">{activity.event}</div>
                      <div className="text-sm text-muted-foreground">{activity.time}</div>
                    </div>
                  </div>
                  <Badge variant={
                    activity.severity.includes('Hoch') || activity.severity === 'Schwer' ? 'destructive' :
                    activity.severity.includes('Mittel') ? 'secondary' : 'default'
                  }>
                    {activity.severity}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}