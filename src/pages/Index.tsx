import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Brain, Zap, Calendar, TrendingUp, Shield, 
  ArrowRight, Star, Sparkles, Activity 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    totalEntries: 0,
    riskLevel: 'medium',
    lastPrediction: null as any
  });

  useEffect(() => {
    if (user) {
      checkOnboardingStatus();
      loadUserStats();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const checkOnboardingStatus = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, location_name, known_triggers')
        .eq('user_id', user?.id)
        .single();

      const needsSetup = !profile?.first_name || !profile?.location_name || !profile?.known_triggers;
      setNeedsOnboarding(needsSetup);
    } catch (error) {
      console.error('Error checking onboarding:', error);
      setNeedsOnboarding(true);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      // Get total migraine entries
      const { count } = await supabase
        .from('migraine_entries')
        .select('id', { count: 'exact' })
        .eq('user_id', user?.id);

      // Get latest prediction
      const { data: prediction } = await supabase
        .from('ai_predictions')
        .select('risk_level, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setUserStats({
        totalEntries: count || 0,
        riskLevel: prediction?.risk_level > 7 ? 'high' : 
                   prediction?.risk_level > 4 ? 'medium' : 'low',
        lastPrediction: prediction
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleOnboardingComplete = () => {
    setNeedsOnboarding(false);
    loadUserStats();
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'high': return t('dashboard.highRisk');
      case 'medium': return t('dashboard.mediumRisk');
      case 'low': return t('dashboard.lowRisk');
      default: return t('dashboard.mediumRisk');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-bg">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('index.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-bg">
        {/* Hero Section */}
        <div className="container mx-auto px-6 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Brain className="w-20 h-20 text-primary" />
                <Sparkles className="w-8 h-8 text-primary absolute -top-2 -right-2 animate-pulse" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Velar
              <span className="velar-text-glow ml-3">✨</span>
            </h1>
            
            <h2 className="text-2xl md:text-3xl font-semibold text-primary mb-4">
              {t('index.aiPoweredPrediction')}
            </h2>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              {t('index.heroDescription')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/auth">
                <Button size="lg" className="velar-button-primary px-8 py-3 text-lg">
                  {t('index.startFree')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              
              <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
                {t('index.watchDemo')}
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="velar-card text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="mb-2">{t('index.aiPredictions')}</CardTitle>
              <p className="text-muted-foreground text-sm">
                {t('index.aiPredictionsDesc')}
              </p>
            </Card>

            <Card className="velar-card text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="mb-2">{t('index.smartTracking')}</CardTitle>
              <p className="text-muted-foreground text-sm">
                {t('index.smartTrackingDesc')}
              </p>
            </Card>

            <Card className="velar-card text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="mb-2">{t('index.proactiveAlerts')}</CardTitle>
              <p className="text-muted-foreground text-sm">
                {t('index.proactiveAlertsDesc')}
              </p>
            </Card>
          </div>

          {/* Stats Section */}
          <div className="mt-20 text-center">
            <p className="text-muted-foreground mb-8">{t('index.trustedBy')}</p>
            <div className="flex justify-center gap-12">
              <div>
                <div className="text-3xl font-bold text-primary">85%</div>
                <div className="text-sm text-muted-foreground">{t('index.accuracy')}</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">72h</div>
                <div className="text-sm text-muted-foreground">{t('index.predictionWindow')}</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">50k+</div>
                <div className="text-sm text-muted-foreground">{t('index.users')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (needsOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-bg py-8">
        <div className="container mx-auto px-6">
          <OnboardingFlow onComplete={handleOnboardingComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg py-8">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Welcome Header */}
          <Card className="velar-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">
                    {t('index.welcomeBack')}
                  </h1>
                  <p className="text-muted-foreground">
                    {t('index.personalizedDashboard')}
                  </p>
                </div>
                
                <div className="text-right">
                  <Badge 
                    variant={userStats.riskLevel === 'high' ? 'destructive' : 
                           userStats.riskLevel === 'medium' ? 'secondary' : 'default'}
                    className="mb-2"
                  >
                    {getRiskLabel(userStats.riskLevel)}
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    {t('index.currentRiskLevel')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="velar-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  {t('index.diaryEntries')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.totalEntries}</div>
                <p className="text-xs text-muted-foreground">{t('index.totalEpisodes')}</p>
              </CardContent>
            </Card>

            <Card className="velar-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  {t('index.aiAccuracy')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87%</div>
                <p className="text-xs text-muted-foreground">{t('index.predictionPrecision')}</p>
              </CardContent>
            </Card>

            <Card className="velar-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  {t('index.lastAnalysis')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userStats.lastPrediction ? t('common.active') : t('index.pending')}
                </div>
                <p className="text-xs text-muted-foreground">
                  {userStats.lastPrediction 
                    ? t('index.hoursAgo', { hours: Math.round((new Date().getTime() - new Date(userStats.lastPrediction.created_at).getTime()) / (1000 * 60 * 60)) })
                    : t('index.firstPredictionAvailable')
                  }
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="velar-card hover:shadow-lg transition-shadow cursor-pointer">
              <Link to="/dashboard">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    {t('index.openDashboard')}
                  </CardTitle>
                  <CardDescription>
                    {t('index.detailedAnalytics')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full velar-button-primary">
                    {t('index.goToDashboard')}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Link>
            </Card>

            <Card className="velar-card hover:shadow-lg transition-shadow cursor-pointer">
              <Link to="/diary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    {t('index.newEntry')}
                  </CardTitle>
                  <CardDescription>
                    {t('index.documentEpisode')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    {t('index.addEntry')}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Link>
            </Card>
          </div>

          {/* Premium Upgrade CTA */}
          <Card className="velar-card bg-gradient-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                {t('index.velarPremium')}
              </CardTitle>
              <CardDescription>
                {t('index.premiumDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="font-medium">✨ {t('index.day14Forecasts')}</p>
                <p className="font-medium">🧠 {t('index.advancedAIModels')}</p>
                <p className="font-medium">📊 {t('index.detailedAnalyticsFeature')}</p>
              </div>
              <Link to="/settings?tab=subscription">
                <Button className="velar-button-primary">
                  {t('index.upgrade')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;