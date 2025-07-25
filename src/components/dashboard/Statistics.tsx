import { TrendingUp, Target, Brain, Calendar } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ComponentType<{ className?: string }>;
  trend: 'up' | 'down' | 'stable';
}

function StatCard({ title, value, change, icon: Icon, trend }: StatCardProps) {
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
}

export function Statistics() {
  const stats = [
    {
      title: "Episodes This Month",
      value: "8",
      change: "12%",
      icon: Calendar,
      trend: 'down' as const
    },
    {
      title: "Pattern Accuracy",
      value: "92%",
      change: "5%",
      icon: Target,
      trend: 'up' as const
    },
    {
      title: "AI Confidence",
      value: "87%",
      change: "3%",
      icon: Brain,
      trend: 'up' as const
    },
    {
      title: "Weekly Trend",
      value: "2.1",
      change: "stable",
      icon: TrendingUp,
      trend: 'stable' as const
    }
  ];

  return (
    <div className="velar-card rounded-2xl p-6 animate-scale-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-primary/20 rounded-xl">
          <TrendingUp className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">AI Statistics</h3>
          <p className="text-sm text-muted-foreground">Intelligent pattern analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.title}
            {...stat}
          />
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-border/50">
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-2">
            Next prediction update in
          </div>
          <div className="text-sm font-semibold text-primary">2 hours 15 minutes</div>
        </div>
      </div>
    </div>
  );
}