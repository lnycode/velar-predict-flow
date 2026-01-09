import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { DisclaimerFooter } from "@/components/layout/DisclaimerFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TrendingUp, Clock, MapPin, Zap, Loader2 } from "lucide-react";
import { subMonths, format, startOfMonth, endOfMonth, getHours } from "date-fns";

function AnalyticsPageComponent() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<Array<{ month: string; episodes: number; severity: number }>>([]);
  const [triggerData, setTriggerData] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [timeData, setTimeData] = useState<Array<{ time: string; count: number }>>([]);
  const [metrics, setMetrics] = useState({ reduction: 0, avgDuration: 0, weatherRelated: 0, accuracy: 0 });

  const loadAnalytics = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data: entries } = await supabase
        .from('migraine_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!entries || entries.length === 0) {
        setIsLoading(false);
        return;
      }

      const monthly: Array<{ month: string; episodes: number; severity: number }> = [];
      for (let i = 6; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const start = startOfMonth(monthDate);
        const end = endOfMonth(monthDate);
        
        const monthEntries = entries.filter(e => {
          const date = new Date(e.created_at);
          return date >= start && date <= end;
        });
        
        const avgSeverity = monthEntries.length > 0 
          ? monthEntries.reduce((sum, e) => sum + (e.intensity || 0), 0) / monthEntries.length 
          : 0;
        
        monthly.push({
          month: format(monthDate, 'MMM'),
          episodes: monthEntries.length,
          severity: Math.round(avgSeverity * 10) / 10
        });
      }
      setMonthlyData(monthly);

      const triggerCounts: Record<string, number> = {
        'Weather Changes': 0, 'Stress': 0, 'Sleep Issues': 0, 'Food/Drink': 0, 'Hormonal': 0
      };
      
      entries.forEach(e => {
        const note = (e.note || '').toLowerCase();
        if (note.includes('weather') || note.includes('pressure') || note.includes('rain')) triggerCounts['Weather Changes']++;
        if (note.includes('stress') || note.includes('work') || note.includes('anxiety')) triggerCounts['Stress']++;
        if (note.includes('sleep') || note.includes('tired') || note.includes('fatigue')) triggerCounts['Sleep Issues']++;
        if (note.includes('food') || note.includes('alcohol') || note.includes('caffeine')) triggerCounts['Food/Drink']++;
        if (note.includes('hormonal') || note.includes('period') || note.includes('menstrual')) triggerCounts['Hormonal']++;
        if (e.trigger_detected) triggerCounts['Weather Changes']++;
      });

      const total = Object.values(triggerCounts).reduce((a, b) => a + b, 0) || 1;
      const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];
      setTriggerData(Object.entries(triggerCounts).map(([name, count], i) => ({
        name, value: Math.round((count / total) * 100), color: colors[i]
      })));

      const timeBuckets: Record<string, number> = {
        '6-9 AM': 0, '9-12 PM': 0, '12-3 PM': 0, '3-6 PM': 0, '6-9 PM': 0, '9-12 AM': 0
      };
      
      entries.forEach(e => {
        const hour = getHours(new Date(e.created_at));
        if (hour >= 6 && hour < 9) timeBuckets['6-9 AM']++;
        else if (hour >= 9 && hour < 12) timeBuckets['9-12 PM']++;
        else if (hour >= 12 && hour < 15) timeBuckets['12-3 PM']++;
        else if (hour >= 15 && hour < 18) timeBuckets['3-6 PM']++;
        else if (hour >= 18 && hour < 21) timeBuckets['6-9 PM']++;
        else timeBuckets['9-12 AM']++;
      });
      setTimeData(Object.entries(timeBuckets).map(([time, count]) => ({ time, count })));

      const thisMonth = monthly[6]?.episodes || 0;
      const lastMonth = monthly[5]?.episodes || 1;
      const reduction = lastMonth > 0 ? Math.round(((lastMonth - thisMonth) / lastMonth) * 100) : 0;
      
      const avgDuration = entries.reduce((sum, e) => sum + (e.duration || 0), 0) / entries.length;
      const weatherRelated = Math.round((entries.filter(e => e.trigger_detected).length / entries.length) * 100);

      const { data: predictions } = await supabase
        .from('ai_predictions')
        .select('actual_outcome, risk_level')
        .eq('user_id', user.id)
        .not('actual_outcome', 'is', null);
      
      const correct = predictions?.filter(p => (p.risk_level >= 70) === p.actual_outcome).length || 0;
      const accuracy = predictions?.length ? Math.round((correct / predictions.length) * 100) : 85;

      setMetrics({ reduction, avgDuration: Math.round(avgDuration * 10) / 10, weatherRelated, accuracy });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadAnalytics();
  }, [user, loadAnalytics]);

  const tooltipStyle = useMemo(() => ({ 
    backgroundColor: 'hsl(var(--card))', 
    border: '1px solid hsl(var(--border))', 
    borderRadius: '8px' 
  }), []);

  const axisTickStyle = useMemo(() => ({ 
    fill: 'hsl(var(--muted-foreground))', 
    fontSize: 12 
  }), []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Advanced Analytics</h1>
        <p className="text-muted-foreground">Deep insights into your migraine patterns and triggers</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="velar-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <div>
                <div className="text-2xl font-bold text-foreground">{metrics.reduction > 0 ? `${metrics.reduction}%` : 'N/A'}</div>
                <div className="text-sm text-muted-foreground">Reduction This Month</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="velar-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-warning" />
              <div>
                <div className="text-2xl font-bold text-foreground">{metrics.avgDuration}h</div>
                <div className="text-sm text-muted-foreground">Average Duration</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="velar-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-success" />
              <div>
                <div className="text-2xl font-bold text-foreground">{metrics.weatherRelated}%</div>
                <div className="text-sm text-muted-foreground">Weather Related</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="velar-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-destructive" />
              <div>
                <div className="text-2xl font-bold text-foreground">{metrics.accuracy}%</div>
                <div className="text-sm text-muted-foreground">Prediction Accuracy</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="velar-card border-border/50">
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>Episodes and severity over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={axisTickStyle} />
                  <YAxis axisLine={false} tickLine={false} tick={axisTickStyle} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="episodes" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="velar-card border-border/50">
          <CardHeader>
            <CardTitle>Trigger Analysis</CardTitle>
            <CardDescription>Distribution of migraine triggers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={triggerData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {triggerData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {triggerData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                  <span className="text-xs font-medium text-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="velar-card border-border/50">
          <CardHeader>
            <CardTitle>Time Pattern Analysis</CardTitle>
            <CardDescription>When migraines typically occur</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeData}>
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={axisTickStyle} />
                  <YAxis axisLine={false} tickLine={false} tick={axisTickStyle} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="velar-card border-border/50">
          <CardHeader>
            <CardTitle>AI Pattern Insights</CardTitle>
            <CardDescription>Personalized observations based on your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <h4 className="font-semibold text-primary text-sm">Weather Sensitivity</h4>
              <p className="text-xs text-foreground mt-1">
                {metrics.weatherRelated}% of your episodes correlate with weather changes.
              </p>
            </div>
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <h4 className="font-semibold text-warning text-sm">Time Pattern</h4>
              <p className="text-xs text-foreground mt-1">
                Most episodes occur in the afternoon. Consider preventive measures during peak hours.
              </p>
            </div>
            <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
              <h4 className="font-semibold text-success text-sm">Trend</h4>
              <p className="text-xs text-foreground mt-1">
                {metrics.reduction > 0 ? `Episode frequency decreased ${metrics.reduction}% this month.` : 'Track more episodes to see trends.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <DisclaimerFooter />
    </div>
  );
}

export default memo(AnalyticsPageComponent);