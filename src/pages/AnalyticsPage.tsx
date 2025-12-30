import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { DisclaimerFooter } from "@/components/layout/DisclaimerFooter";
import { TrendingUp, Clock, MapPin, Zap } from "lucide-react";

export default function AnalyticsPage() {
  const monthlyData = [
    { month: 'Jul', episodes: 8, severity: 6.5 },
    { month: 'Aug', episodes: 12, severity: 7.2 },
    { month: 'Sep', episodes: 6, severity: 5.8 },
    { month: 'Oct', episodes: 9, severity: 6.9 },
    { month: 'Nov', episodes: 11, severity: 7.8 },
    { month: 'Dec', episodes: 7, severity: 6.1 },
    { month: 'Jan', episodes: 5, severity: 5.5 }
  ];

  const triggerData = [
    { name: 'Weather Changes', value: 35, color: '#3b82f6' },
    { name: 'Stress', value: 28, color: '#ef4444' },
    { name: 'Sleep Issues', value: 18, color: '#f59e0b' },
    { name: 'Food/Drink', value: 12, color: '#10b981' },
    { name: 'Hormonal', value: 7, color: '#8b5cf6' }
  ];

  const timeData = [
    { time: '6-9 AM', count: 3 },
    { time: '9-12 PM', count: 8 },
    { time: '12-3 PM', count: 12 },
    { time: '3-6 PM', count: 15 },
    { time: '6-9 PM', count: 7 },
    { time: '9-12 AM', count: 2 }
  ];

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
                <div className="text-2xl font-bold text-foreground">24%</div>
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
                <div className="text-2xl font-bold text-foreground">3.2h</div>
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
                <div className="text-2xl font-bold text-foreground">68%</div>
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
                <div className="text-2xl font-bold text-foreground">92%</div>
                <div className="text-sm text-muted-foreground">Prediction Accuracy</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card className="velar-card border-border/50">
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>Episodes and severity over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="episodes"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Trigger Distribution */}
        <Card className="velar-card border-border/50">
          <CardHeader>
            <CardTitle>Trigger Analysis</CardTitle>
            <CardDescription>Distribution of migraine triggers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={triggerData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {triggerData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {triggerData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                  <span className="text-xs font-medium text-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Time of Day Pattern */}
        <Card className="velar-card border-border/50">
          <CardHeader>
            <CardTitle>Time Pattern Analysis</CardTitle>
            <CardDescription>When migraines typically occur</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeData}>
                  <XAxis 
                    dataKey="time" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pattern Insights */}
        <Card className="velar-card border-border/50">
          <CardHeader>
            <CardTitle>AI Pattern Insights</CardTitle>
            <CardDescription>Personalized observations and recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <h4 className="font-semibold text-primary text-sm">Weather Sensitivity</h4>
              <p className="text-xs text-foreground mt-1">
                You're most sensitive to pressure changes below 1010 hPa. 
                Consider monitoring barometric pressure alerts.
              </p>
            </div>
            
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <h4 className="font-semibold text-warning text-sm">Time Pattern</h4>
              <p className="text-xs text-foreground mt-1">
                67% of your migraines occur between 12-6 PM. 
                Afternoon preventive measures may be beneficial.
              </p>
            </div>
            
            <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
              <h4 className="font-semibold text-success text-sm">Improvement Trend</h4>
              <p className="text-xs text-foreground mt-1">
                Your episode frequency has decreased 24% this month. 
                Current prevention strategies are working well.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <DisclaimerFooter />
    </div>
  );
}