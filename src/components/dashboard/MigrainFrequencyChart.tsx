import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Area, AreaChart } from 'recharts';

const mockData = [
  { day: 'Mon', frequency: 2, prediction: 3 },
  { day: 'Tue', frequency: 1, prediction: 2 },
  { day: 'Wed', frequency: 4, prediction: 3 },
  { day: 'Thu', frequency: 2, prediction: 1 },
  { day: 'Fri', frequency: 3, prediction: 4 },
  { day: 'Sat', frequency: 1, prediction: 2 },
  { day: 'Sun', frequency: 2, prediction: 3 }
];

export function MigrainFrequencyChart() {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/90 backdrop-blur-sm border border-border/50 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey === 'frequency' ? 'Actual' : 'Predicted'}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

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
          <AreaChart data={mockData}>
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
          <div className="text-xl font-bold text-primary">2.3</div>
          <div className="text-xs text-muted-foreground">Avg/Week</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-warning">85%</div>
          <div className="text-xs text-muted-foreground">Accuracy</div>
        </div>
      </div>
    </div>
  );
}