import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CloudRain, Sun, Cloud, CloudSnow, Wind, Thermometer, Droplets, Gauge } from "lucide-react";

export default function ForecastPage() {
  const forecastData = [
    {
      date: "Today",
      fullDate: "Jan 29, 2024",
      weather: "Rainy",
      icon: CloudRain,
      riskLevel: 85,
      temperature: 18,
      humidity: 85,
      pressure: 1008,
      windSpeed: 15,
      triggers: ["Pressure drop", "High humidity"],
      recommendation: "High risk - consider preventive medication"
    },
    {
      date: "Tomorrow",
      fullDate: "Jan 30, 2024", 
      weather: "Cloudy",
      icon: Cloud,
      riskLevel: 62,
      temperature: 20,
      humidity: 70,
      pressure: 1012,
      windSpeed: 10,
      triggers: ["Humidity change"],
      recommendation: "Moderate risk - stay hydrated"
    },
    {
      date: "Wednesday",
      fullDate: "Jan 31, 2024",
      weather: "Sunny",
      icon: Sun,
      riskLevel: 25,
      temperature: 24,
      humidity: 55,
      pressure: 1018,
      windSpeed: 8,
      triggers: [],
      recommendation: "Low risk - good day for activities"
    },
    {
      date: "Thursday",
      fullDate: "Feb 1, 2024",
      weather: "Partly Cloudy",
      icon: Cloud,
      riskLevel: 45,
      temperature: 22,
      humidity: 65,
      pressure: 1015,
      windSpeed: 12,
      triggers: ["Temperature change"],
      recommendation: "Moderate risk - monitor symptoms"
    },
    {
      date: "Friday", 
      fullDate: "Feb 2, 2024",
      weather: "Rainy",
      icon: CloudRain,
      riskLevel: 78,
      temperature: 17,
      humidity: 90,
      pressure: 1005,
      windSpeed: 18,
      triggers: ["Pressure drop", "High humidity", "Temperature drop"],
      recommendation: "High risk - avoid known triggers"
    },
    {
      date: "Saturday",
      fullDate: "Feb 3, 2024", 
      weather: "Snow",
      icon: CloudSnow,
      riskLevel: 42,
      temperature: 2,
      humidity: 75,
      pressure: 1020,
      windSpeed: 20,
      triggers: ["Cold temperature"],
      recommendation: "Moderate risk - stay warm"
    },
    {
      date: "Sunday",
      fullDate: "Feb 4, 2024",
      weather: "Sunny",
      icon: Sun,
      riskLevel: 30,
      temperature: 25,
      humidity: 50,
      pressure: 1022,
      windSpeed: 5,
      triggers: [],
      recommendation: "Low risk - enjoy outdoor activities"
    }
  ];

  const getRiskColor = (risk: number) => {
    if (risk >= 75) return "text-destructive bg-destructive/20";
    if (risk >= 50) return "text-warning bg-warning/20";
    return "text-success bg-success/20";
  };

  const getRiskLevel = (risk: number) => {
    if (risk >= 75) return "High";
    if (risk >= 50) return "Moderate";
    return "Low";
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">7-Day Migraine Forecast</h1>
        <p className="text-muted-foreground">AI-powered predictions based on weather patterns and your personal triggers</p>
      </div>

      {/* Today's Detailed Forecast */}
      <Card className="velar-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudRain className="w-5 h-5 text-primary" />
            Today's Detailed Forecast
          </CardTitle>
          <CardDescription>Current conditions and immediate recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-foreground">Migraine Risk</span>
                <Badge className={`${getRiskColor(85)} px-3 py-1`}>
                  85% High Risk
                </Badge>
              </div>
              
              <Progress value={85} className="h-3" />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-warning" />
                  <span className="text-sm text-muted-foreground">Temperature</span>
                  <span className="font-medium text-foreground">18°C</span>
                </div>
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Humidity</span>
                  <span className="font-medium text-foreground">85%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-accent" />
                  <span className="text-sm text-muted-foreground">Pressure</span>
                  <span className="font-medium text-foreground">1008 hPa</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Wind</span>
                  <span className="font-medium text-foreground">15 km/h</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Active Triggers</h4>
                <div className="flex flex-wrap gap-1">
                  {forecastData[0].triggers.map((trigger, index) => (
                    <Badge key={index} variant="destructive" className="text-xs">
                      {trigger}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <h4 className="font-semibold text-destructive mb-1">Recommendation</h4>
                <p className="text-sm text-foreground">{forecastData[0].recommendation}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 7-Day Forecast Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {forecastData.slice(1).map((day, index) => (
          <Card key={index} className="velar-card border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{day.date}</CardTitle>
                  <CardDescription className="text-xs">{day.fullDate}</CardDescription>
                </div>
                <day.icon className="w-6 h-6 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Risk Level</span>
                <Badge className={`${getRiskColor(day.riskLevel)} text-xs`}>
                  {day.riskLevel}% {getRiskLevel(day.riskLevel)}
                </Badge>
              </div>
              
              <Progress value={day.riskLevel} className="h-2" />
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Temp: </span>
                  <span className="text-foreground">{day.temperature}°C</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Humid: </span>
                  <span className="text-foreground">{day.humidity}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Press: </span>
                  <span className="text-foreground">{day.pressure}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Wind: </span>
                  <span className="text-foreground">{day.windSpeed}</span>
                </div>
              </div>
              
              {day.triggers.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Triggers:</div>
                  <div className="flex flex-wrap gap-1">
                    {day.triggers.map((trigger, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {trigger}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground">
                {day.recommendation}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Insights */}
      <Card className="velar-card border-border/50">
        <CardHeader>
          <CardTitle>AI Pattern Analysis</CardTitle>
          <CardDescription>Insights based on your historical data and weather patterns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <h4 className="font-semibold text-primary mb-2">Weather Pattern Alert</h4>
              <p className="text-sm text-foreground">
                A low-pressure system is approaching. Based on your history, you have a 78% chance 
                of experiencing a migraine within the next 48 hours.
              </p>
            </div>
            
            <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <h4 className="font-semibold text-warning mb-2">Personalized Insight</h4>
              <p className="text-sm text-foreground">
                Your migraines typically occur 6-12 hours before barometric pressure drops below 1010 hPa. 
                Consider taking preventive measures tonight.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}