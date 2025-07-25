import { WeatherAlert } from "@/components/dashboard/WeatherAlert";
import { MigrainFrequencyChart } from "@/components/dashboard/MigrainFrequencyChart";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { Statistics } from "@/components/dashboard/Statistics";

export default function Dashboard() {
  // Mock data - in real app this would come from API
  const weatherData = {
    riskLevel: 'high' as const,
    percentage: 78,
    triggers: ['Pressure drop', 'Humidity increase', 'Temperature change'],
    temperature: 22,
    humidity: 85,
    pressure: 1008
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Welcome Section */}
      <div className="velar-card rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Welcome back, Alex! 
              <span className="velar-text-glow ml-2">✨</span>
            </h1>
            <p className="text-muted-foreground">
              Your personalized migraine intelligence dashboard is ready.
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold text-primary mb-1">
              {weatherData.percentage}%
            </div>
            <div className="text-sm text-muted-foreground">
              Current Risk Level
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <WeatherAlert {...weatherData} />
          <MigrainFrequencyChart />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Statistics />
          <div className="velar-card rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
            <QuickActions />
          </div>
        </div>
      </div>

      {/* Bottom Section - Recent Activity */}
      <div className="velar-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[
            { time: '2 hours ago', event: 'Migraine episode logged', severity: 'Moderate' },
            { time: '1 day ago', event: 'Weather alert triggered', severity: 'High Risk' },
            { time: '3 days ago', event: 'Pattern detected', severity: 'Storm front' },
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div>
                <div className="font-medium text-foreground">{activity.event}</div>
                <div className="text-sm text-muted-foreground">{activity.time}</div>
              </div>
              <div className="text-sm font-medium text-primary">{activity.severity}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}