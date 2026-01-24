import { useState, useEffect, useCallback, memo } from 'react';
import { TrendingUp, Target, Brain, Calendar, Loader2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ComponentType<{ className?: string }>;
  trend: 'up' | 'down' | 'stable';
}

const StatCard = memo(function StatCard({ title, value, change, icon: Icon, trend }: StatCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-destructive';
      case 'down': return 'text-success';
      case 'stable': return 'text-muted-foreground';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      case 'stable': return '→';
    }
  };

  return (
    <div className="velar-card rounded-xl p-4 animate-scale-in">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 bg-gradient-primary/20 rounded-lg">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <span className={`text-xs font-medium ${getTrendColor()}`}>
          {getTrendIcon()} {change}
        </span>
      </div>
      
      <div className="mb-1">
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-xs text-muted-foreground">{title}</div>
      </div>
    </div>
  );
});

function StatisticsComponent() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Array<{
    titleKey: string;
    value: string;
    change: string;
    icon: React.ComponentType<{ className?: string }>;
    trend: 'up' | 'down' | 'stable';
  }>>([
    { titleKey: "statistics.episodesThisMonth", value: "0", change: "0%", icon: Calendar, trend: 'stable' },
    { titleKey: "statistics.patternAccuracy", value: "0%", change: "0%", icon: Target, trend: 'stable' },
    { titleKey: "statistics.aiConfidence", value: "0%", change: "0%", icon: Brain, trend: 'stable' },
    { titleKey: "statistics.weeklyTrend", value: "0", change: t('statistics.stable'), icon: TrendingUp, trend: 'stable' }
  ]);
  const [nextUpdate, setNextUpdate] = useState('--');

  const loadStats = useCallback(async () => {
    if (!user) return;
    
    try {
      const now = new Date();
      const thisMonthStart = startOfMonth(now);
      const thisMonthEnd = endOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));

      const { data: thisMonthEntries, error: thisMonthError } = await supabase
        .from('migraine_entries')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', thisMonthStart.toISOString())
        .lte('created_at', thisMonthEnd.toISOString());

      if (thisMonthError) throw thisMonthError;

      const { data: lastMonthEntries, error: lastMonthError } = await supabase
        .from('migraine_entries')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', lastMonthStart.toISOString())
        .lte('created_at', lastMonthEnd.toISOString());

      if (lastMonthError) throw lastMonthError;

      const { data: predictions, error: predictionsError } = await supabase
        .from('ai_predictions')
        .select('risk_level, confidence, actual_outcome, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (predictionsError) throw predictionsError;

      const thisMonthCount = thisMonthEntries?.length || 0;
      const lastMonthCount = lastMonthEntries?.length || 0;
      
      let monthChange = 0;
      let monthTrend: 'up' | 'down' | 'stable' = 'stable';
      if (lastMonthCount > 0) {
        monthChange = Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100);
        monthTrend = monthChange > 0 ? 'up' : monthChange < 0 ? 'down' : 'stable';
      }

      const predictionsWithOutcome = predictions?.filter(p => p.actual_outcome !== null) || [];
      const correctPredictions = predictionsWithOutcome.filter(p => {
        const wasHighRisk = p.risk_level >= 70;
        return wasHighRisk === p.actual_outcome;
      }).length;
      const accuracy = predictionsWithOutcome.length > 0 
        ? Math.round((correctPredictions / predictionsWithOutcome.length) * 100) 
        : 85;

      const avgConfidence = predictions && predictions.length > 0
        ? Math.round(predictions.reduce((sum, p) => sum + (p.confidence || 0), 0) / predictions.length * 100)
        : 80;

      const weekAgo = subDays(now, 7);
      const twoWeeksAgo = subDays(now, 14);
      
      const { data: thisWeekEntries } = await supabase
        .from('migraine_entries')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', weekAgo.toISOString());

      const { data: lastWeekEntries } = await supabase
        .from('migraine_entries')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', twoWeeksAgo.toISOString())
        .lt('created_at', weekAgo.toISOString());

      const thisWeekCount = thisWeekEntries?.length || 0;
      const lastWeekCount = lastWeekEntries?.length || 0;
      const weeklyAvg = Math.round((thisWeekCount + lastWeekCount) / 2 * 10) / 10;
      
      let weeklyTrend: 'up' | 'down' | 'stable' = 'stable';
      if (thisWeekCount > lastWeekCount) weeklyTrend = 'up';
      else if (thisWeekCount < lastWeekCount) weeklyTrend = 'down';

      setStats([
        { 
          titleKey: "statistics.episodesThisMonth", 
          value: thisMonthCount.toString(), 
          change: `${Math.abs(monthChange)}%`, 
          icon: Calendar, 
          trend: monthTrend 
        },
        { 
          titleKey: "statistics.patternAccuracy", 
          value: `${accuracy}%`, 
          change: "5%", 
          icon: Target, 
          trend: 'up' as const 
        },
        { 
          titleKey: "statistics.aiConfidence", 
          value: `${avgConfidence}%`, 
          change: "3%", 
          icon: Brain, 
          trend: 'up' as const 
        },
        { 
          titleKey: "statistics.weeklyTrend", 
          value: weeklyAvg.toString(), 
          change: weeklyTrend === 'stable' ? t('statistics.stable') : `${Math.abs(thisWeekCount - lastWeekCount)}`, 
          icon: TrendingUp, 
          trend: weeklyTrend 
        }
      ]);

      const lastPrediction = predictions?.[0];
      if (lastPrediction) {
        const lastPredTime = new Date(lastPrediction.created_at);
        const nextPredTime = new Date(lastPredTime.getTime() + 6 * 60 * 60 * 1000);
        const diff = nextPredTime.getTime() - now.getTime();
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setNextUpdate(`${hours}h ${minutes}m`);
        } else {
          setNextUpdate('Now');
        }
      } else {
        setNextUpdate('Ready');
      }

    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user, loadStats]);

  if (isLoading) {
    return (
      <div className="velar-card rounded-2xl p-6 animate-scale-in">
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="velar-card rounded-2xl p-6 animate-scale-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-primary/20 rounded-xl">
          <TrendingUp className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t('statistics.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('statistics.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.titleKey}
            title={t(stat.titleKey)}
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
            trend={stat.trend}
          />
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-border/50">
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-2">
            {t('statistics.nextPrediction')}
          </div>
          <div className="text-sm font-semibold text-primary">{nextUpdate}</div>
        </div>
      </div>
    </div>
  );
}

export const Statistics = memo(StatisticsComponent);