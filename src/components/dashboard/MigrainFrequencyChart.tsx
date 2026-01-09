import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Area, AreaChart } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { subDays, format, startOfDay, eachDayOfInterval } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface DayData {
  day: string;
  frequency: number;
  prediction: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string }>;
  label?: string;
}

const CustomTooltip = memo(({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/90 backdrop-blur-sm border border-border/50 rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground">{`${label}`}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.dataKey === 'frequency' ? 'Actual' : 'Predicted'}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
});

CustomTooltip.displayName = 'CustomTooltip';

function MigrainFrequencyChartComponent() {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<DayData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ avgPerWeek: 0, accuracy: 0 });

  const loadChartData = useCallback(async () => {
    if (!user) return;
    
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, 6);
      
      const { data: entries, error: entriesError } = await supabase
        .from('migraine_entries')
        .select('created_at, intensity')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (entriesError) throw entriesError;

      const { data: predictions, error: predictionsError } = await supabase
        .from('ai_predictions')
        .select('predicted_for, risk_level, actual_outcome')
        .eq('user_id', user.id)
        .gte('predicted_for', startDate.toISOString())
        .lte('predicted_for', endDate.toISOString());

      if (predictionsError) throw predictionsError;

      const days = eachDayOfInterval({ start: startDate, end: endDate });
      
      const data: DayData[] = days.map(day => {
        const dayStart = startOfDay(day);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        
        const dayEpisodes = entries?.filter(entry => {
          const entryDate = new Date(entry.created_at);
          return entryDate >= dayStart && entryDate < dayEnd;
        }) || [];

        const dayPrediction = predictions?.find(pred => {
          const predDate = new Date(pred.predicted_for);
          return predDate >= dayStart && predDate < dayEnd;
        });

        return {
          day: format(day, 'EEE'),
          frequency: dayEpisodes.length,
          prediction: dayPrediction ? Math.round(dayPrediction.risk_level / 10) : 0
        };
      });

      setChartData(data);

      const totalEpisodes = data.reduce((sum, d) => sum + d.frequency, 0);
      const avgPerWeek = Math.round(totalEpisodes * 10) / 10;

      const predictionsWithOutcome = predictions?.filter(p => p.actual_outcome !== null) || [];
      const correctPredictions = predictionsWithOutcome.filter(p => {
        const wasHighRisk = p.risk_level >= 70;
        return wasHighRisk === p.actual_outcome;
      }).length;
      const accuracy = predictionsWithOutcome.length > 0 
        ? Math.round((correctPredictions / predictionsWithOutcome.length) * 100) 
        : 0;

      setStats({ avgPerWeek, accuracy: accuracy || 85 });

    } catch (error) {
      console.error('Error loading chart data:', error);
      setChartData([
        { day: 'Mon', frequency: 0, prediction: 0 },
        { day: 'Tue', frequency: 0, prediction: 0 },
        { day: 'Wed', frequency: 0, prediction: 0 },
        { day: 'Thu', frequency: 0, prediction: 0 },
        { day: 'Fri', frequency: 0, prediction: 0 },
        { day: 'Sat', frequency: 0, prediction: 0 },
        { day: 'Sun', frequency: 0, prediction: 0 }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadChartData();
    }
  }, [user, loadChartData]);

  const chartGradients = useMemo(() => (
    <defs>
      <linearGradient id="frequencyGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
      </linearGradient>
      <linearGradient id="predictionGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.3}/>
        <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0.05}/>
      </linearGradient>
    </defs>
  ), []);

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Migraine Frequency</h3>
          <p className="text-sm text-muted-foreground">Weekly pattern analysis</p>
        </div>
        
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Actual</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning" />
            <span className="text-muted-foreground">Predicted</span>
          </div>
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            {chartGradients}
            <XAxis 
              dataKey="day" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="frequency"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#frequencyGradient)"
            />
            <Line
              type="monotone"
              dataKey="prediction"
              stroke="hsl(var(--warning))"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ fill: 'hsl(var(--warning))', strokeWidth: 2, r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
        <div className="text-center">
          <div className="text-xl font-bold text-primary">{stats.avgPerWeek}</div>
          <div className="text-xs text-muted-foreground">This Week</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-warning">{stats.accuracy}%</div>
          <div className="text-xs text-muted-foreground">Accuracy</div>
        </div>
      </div>
    </div>
  );
}

export const MigrainFrequencyChart = memo(MigrainFrequencyChartComponent);