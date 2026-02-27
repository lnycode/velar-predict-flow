import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { WeatherAlert } from "@/components/dashboard/WeatherAlert";
import { MigrainFrequencyChart } from "@/components/dashboard/MigrainFrequencyChart";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { Statistics } from "@/components/dashboard/Statistics";
import { RiskForecast } from "@/components/forecast/RiskForecast";
import { WeatherAlertPanel } from "@/components/alerts/WeatherAlertPanel";
import { DisclaimerFooter } from "@/components/layout/DisclaimerFooter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar, Activity, TrendingUp, Brain, 
  ArrowRight, Clock, AlertTriangle 
} from 'lucide-react';
import { VoiceCommandPanel } from "@/components/unique/VoiceCommandPanel";
import { BiometricIntegration } from "@/components/unique/BiometricIntegration";
import { SocialResearchHub } from "@/components/unique/SocialResearchHub";

export default function Dashboard() {
  const { t } = useTranslation();
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
        event: t('dashboard.episodeDocumented'),
        severity: entry.intensity > 7 ? t('common.severe') : entry.intensity > 4 ? t('common.moderate') : t('common.mild'),
        type: 'episode'
      })) || [];

      // Add prediction to activity if exists
      if (prediction) {
        recentActivity.unshift({
          time: `${Math.round((new Date().getTime() - new Date(prediction.created_at).getTime()) / (1000 * 60 * 60))}h ago`,
          event: t('dashboard.riskEstimationCreated'),
          severity: prediction.risk_level > 7 ? t('dashboard.highRisk') : 
                   prediction.risk_level > 4 ? t('dashboard.mediumRisk') : t('dashboard.lowRisk'),
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
    if (risk <= 3) return t('common.low');
    if (risk <= 6) return t('common.medium');
    return t('common.high');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
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
                {t('dashboard.title')}
              </h1>
              <p className="text-muted-foreground">
                {t('dashboard.subtitle')}
              </p>
            </div>
            
            <div className="text-right flex flex-col items-end gap-1">
              <div className={`text-3xl font-bold ${getRiskColor(dashboardData.currentRisk)}`}>
                {dashboardData.currentRisk}/10
              </div>
              <Progress
                value={dashboardData.currentRisk * 10}
                className="w-24 h-2"
              />
              <div className="text-sm text-muted-foreground">
                {t('dashboard.currentRisk')} ({getRiskLabel(dashboardData.currentRisk)})
              </div>
            </div>
          </div>

          {/* Current Alert */}
          {dashboardData.currentRisk > 7 && (
            <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-4">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">{t('dashboard.migraineWarning')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.highRiskDetected')}
                </p>
              </div>
              <Link to="/forecast" className="ml-auto">
                <Button size="sm" variant="destructive">
                  {t('dashboard.viewDetails')}
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
              {t('dashboard.totalEntries')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalEntries}</div>
            <p className="text-xs text-muted-foreground">{t('dashboard.documentedEpisodes')}</p>
          </CardContent>
        </Card>

        <Card className="velar-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              {t('dashboard.last30Days')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.recentEpisodes}</div>
            <p className="text-xs text-muted-foreground">{t('dashboard.newEpisodes')}</p>
          </CardContent>
        </Card>

        <Card className="velar-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              {t('dashboard.avgIntensity')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.avgIntensity}</div>
            <p className="text-xs text-muted-foreground">{t('dashboard.averageValue')}</p>
          </CardContent>
        </Card>

        <Card className="velar-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              {t('dashboard.analysisStatus')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.lastPrediction ? t('common.active') : t('common.ready')}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.lastPrediction ? t('dashboard.estimationAvailable') : t('dashboard.waitingForData')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Forecast */}
        <div className="lg:col-span-2 space-y-6">
          <RiskForecast />
          
          {/* Weather Alert Panel - Compact */}
          <WeatherAlertPanel variant="compact" showHistory={false} />
        </div>

        {/* Right Column - Quick Actions & Stats */}
        <div className="space-y-6">
          <Card className="velar-card">
            <CardHeader>
              <CardTitle className="text-lg">{t('dashboard.quickActions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/diary" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  {t('dashboard.newDiaryEntry')}
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              </Link>
              
              <Link to="/analytics" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  {t('dashboard.viewAnalytics')}
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              </Link>
              
              <Link to="/forecast" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Brain className="w-4 h-4 mr-2" />
                  {t('dashboard.weatherAlerts')}
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Statistics />
        </div>
      </div>

      {/* Premium Features Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <VoiceCommandPanel />
        <BiometricIntegration />
        <SocialResearchHub />
      </div>

      {/* Recent Activity */}
      <Card className="velar-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            {t('dashboard.recentActivities')}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {dashboardData.recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">{t('dashboard.noActivitiesYet')}</p>
              <Link to="/diary">
                <Button className="velar-button-primary mt-4">
                  {t('dashboard.createFirstEntry')}
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

      <DisclaimerFooter />
    </div>
  );
}