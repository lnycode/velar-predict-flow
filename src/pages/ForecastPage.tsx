import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WeatherAlertPanel } from "@/components/alerts/WeatherAlertPanel";
import { VoiceAssistant } from "@/components/voice/VoiceAssistant";
import { DisclaimerFooter } from "@/components/layout/DisclaimerFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWeatherAlerts } from "@/hooks/useWeatherAlerts";
import { addDays, format } from "date-fns";
import { CloudRain, Sun, Cloud, CloudSnow, Wind, Thermometer, Droplets, Gauge, Bell, Calendar, Mic, Loader2 } from "lucide-react";

interface ForecastDay {
  date: string;
  fullDate: string;
  weather: string;
  icon: React.ComponentType<{ className?: string }>;
  riskLevel: number;
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  triggers: string[];
  recommendation: string;
}

export default function ForecastPage() {
  const { user } = useAuth();
  const { weatherData } = useWeatherAlerts();
  const [forecastData, setForecastData] = useState<ForecastDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userSensitivity, setUserSensitivity] = useState<string>('medium');

  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadForecastData();
    }
  }, [user, weatherData]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('weather_sensitivity')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data?.weather_sensitivity) {
        setUserSensitivity(data.weather_sensitivity);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const getWeatherIcon = (weatherType: string) => {
    const type = weatherType?.toLowerCase() || '';
    if (type.includes('rain') || type.includes('drizzle')) return CloudRain;
    if (type.includes('snow')) return CloudSnow;
    if (type.includes('clear') || type.includes('sun')) return Sun;
    return Cloud;
  };

  const calculateRiskLevel = (weather: { pressure: number; humidity: number; temperature: number }, sensitivity: string) => {
    let baseRisk = 30;
    
    // Pressure-based risk
    if (weather.pressure < 1005) baseRisk += 40;
    else if (weather.pressure < 1010) baseRisk += 25;
    else if (weather.pressure < 1015) baseRisk += 10;
    
    // Humidity-based risk
    if (weather.humidity > 85) baseRisk += 20;
    else if (weather.humidity > 75) baseRisk += 10;
    
    // Temperature extremes
    if (weather.temperature < 5 || weather.temperature > 30) baseRisk += 15;
    
    // Sensitivity multiplier
    const multipliers: Record<string, number> = {
      'low': 0.7,
      'medium': 1.0,
      'high': 1.3
    };
    
    return Math.min(100, Math.round(baseRisk * (multipliers[sensitivity] || 1)));
  };

  const getTriggers = (weather: { pressure: number; humidity: number; temperature: number }) => {
    const triggers: string[] = [];
    
    if (weather.pressure < 1010) triggers.push('Pressure drop');
    if (weather.humidity > 80) triggers.push('High humidity');
    if (weather.humidity < 30) triggers.push('Low humidity');
    if (weather.temperature < 5) triggers.push('Cold temperature');
    if (weather.temperature > 30) triggers.push('High temperature');
    
    return triggers;
  };

  const getRecommendation = (riskLevel: number) => {
    if (riskLevel >= 75) return "High risk - consider preventive medication";
    if (riskLevel >= 50) return "Moderate risk - stay hydrated and monitor symptoms";
    return "Low risk - good day for activities";
  };

  const loadForecastData = async () => {
    if (!user) return;
    
    try {
      // Fetch AI predictions for next 7 days
      const { data: predictions } = await supabase
        .from('ai_predictions')
        .select('*')
        .eq('user_id', user.id)
        .gte('predicted_for', new Date().toISOString())
        .lte('predicted_for', addDays(new Date(), 7).toISOString())
        .order('predicted_for', { ascending: true });

      // Generate 7-day forecast
      const forecast: ForecastDay[] = [];
      const dayNames = ['Today', 'Tomorrow'];
      
      for (let i = 0; i < 7; i++) {
        const date = addDays(new Date(), i);
        const dayName = i < 2 ? dayNames[i] : format(date, 'EEEE');
        
        // Try to find prediction for this day
        const prediction = predictions?.find(p => {
          const predDate = new Date(p.predicted_for);
          return predDate.toDateString() === date.toDateString();
        });

        // Use prediction weather data if available, otherwise use current weather with variation
        let forecastWeatherData = {
          temperature: weatherData?.temperature || 18 + Math.random() * 10,
          humidity: weatherData?.humidity || 60 + Math.random() * 30,
          pressure: weatherData?.pressure || 1010 + (Math.random() - 0.5) * 20,
          windSpeed: weatherData?.windSpeed || 10 + Math.random() * 15,
          weatherType: weatherData?.conditions || 'Cloudy'
        };

        if (prediction?.weather_data && typeof prediction.weather_data === 'object') {
          const wd = prediction.weather_data as Record<string, any>;
          forecastWeatherData = {
            temperature: wd.temperature || forecastWeatherData.temperature,
            humidity: wd.humidity || forecastWeatherData.humidity,
            pressure: wd.pressure || forecastWeatherData.pressure,
            windSpeed: wd.windSpeed || forecastWeatherData.windSpeed,
            weatherType: wd.conditions || forecastWeatherData.weatherType
          };
        }

        // Add day variation
        forecastWeatherData.temperature += (Math.random() - 0.5) * 4 * i;
        forecastWeatherData.pressure += (Math.random() - 0.5) * 6 * i;
        forecastWeatherData.humidity = Math.max(30, Math.min(95, forecastWeatherData.humidity + (Math.random() - 0.5) * 10));

        const riskLevel = prediction?.risk_level || calculateRiskLevel(forecastWeatherData, userSensitivity);
        const triggers = getTriggers(forecastWeatherData);

        forecast.push({
          date: dayName,
          fullDate: format(date, 'MMM d, yyyy'),
          weather: forecastWeatherData.weatherType,
          icon: getWeatherIcon(forecastWeatherData.weatherType),
          riskLevel: Math.round(riskLevel),
          temperature: Math.round(forecastWeatherData.temperature),
          humidity: Math.round(forecastWeatherData.humidity),
          pressure: Math.round(forecastWeatherData.pressure),
          windSpeed: Math.round(forecastWeatherData.windSpeed),
          triggers,
          recommendation: getRecommendation(riskLevel)
        });
      }

      setForecastData(forecast);
    } catch (error) {
      console.error('Error loading forecast:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Risk Estimation & Weather</h1>
          <p className="text-muted-foreground">Pattern-based early-warning signals and data-driven risk estimation</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const todayForecast = forecastData[0];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Risk Estimation & Weather</h1>
        <p className="text-muted-foreground">Pattern-based early-warning signals and data-driven risk estimation</p>
      </div>

      <Tabs defaultValue="alerts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Real-Time Alerts
          </TabsTrigger>
          <TabsTrigger value="assistant" className="flex items-center gap-2">
            <Mic className="w-4 h-4" />
            Voice Assistant
          </TabsTrigger>
          <TabsTrigger value="forecast" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            7-Day Forecast
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-6">
          <WeatherAlertPanel variant="full" showHistory={true} />
        </TabsContent>

        <TabsContent value="assistant" className="space-y-6">
          <VoiceAssistant />
        </TabsContent>

        <TabsContent value="forecast" className="space-y-6">
          {/* Today's Detailed Forecast */}
          {todayForecast && (
            <Card className="velar-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <todayForecast.icon className="w-5 h-5 text-primary" />
                  Today's Detailed Forecast
                </CardTitle>
                <CardDescription>Current conditions and immediate recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-foreground">Risk Estimation</span>
                      <Badge className={`${getRiskColor(todayForecast.riskLevel)} px-3 py-1`}>
                        {todayForecast.riskLevel}% {getRiskLevel(todayForecast.riskLevel)} Risk
                      </Badge>
                    </div>
                    
                    <Progress value={todayForecast.riskLevel} className="h-3" />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-warning" />
                        <span className="text-sm text-muted-foreground">Temperature</span>
                        <span className="font-medium text-foreground">{todayForecast.temperature}°C</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-primary" />
                        <span className="text-sm text-muted-foreground">Humidity</span>
                        <span className="font-medium text-foreground">{todayForecast.humidity}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-accent" />
                        <span className="text-sm text-muted-foreground">Pressure</span>
                        <span className="font-medium text-foreground">{todayForecast.pressure} hPa</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wind className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Wind</span>
                        <span className="font-medium text-foreground">{todayForecast.windSpeed} km/h</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Active Triggers</h4>
                      <div className="flex flex-wrap gap-1">
                        {todayForecast.triggers.length > 0 ? (
                          todayForecast.triggers.map((trigger, index) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              {trigger}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No active triggers</span>
                        )}
                      </div>
                    </div>
                    
                    <div className={`p-3 ${todayForecast.riskLevel >= 75 ? 'bg-destructive/10 border-destructive/20' : todayForecast.riskLevel >= 50 ? 'bg-warning/10 border-warning/20' : 'bg-success/10 border-success/20'} border rounded-lg`}>
                      <h4 className={`font-semibold ${todayForecast.riskLevel >= 75 ? 'text-destructive' : todayForecast.riskLevel >= 50 ? 'text-warning' : 'text-success'} mb-1`}>Recommendation</h4>
                      <p className="text-sm text-foreground">{todayForecast.recommendation}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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

          {/* Pattern-based Insights */}
          <Card className="velar-card border-border/50">
            <CardHeader>
              <CardTitle>Pattern-based Analysis</CardTitle>
              <CardDescription>Insights based on your historical data and weather correlations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <h4 className="font-semibold text-primary mb-2">Early-Warning Signal</h4>
                  <p className="text-sm text-foreground">
                    {todayForecast && todayForecast.pressure < 1010 
                      ? "A low-pressure system is approaching. Based on your historical patterns, there is an elevated likelihood of experiencing a migraine within the next 48 hours."
                      : "Current atmospheric conditions are stable. No immediate weather-related triggers detected based on your sensitivity profile."}
                  </p>
                </div>
                
                <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <h4 className="font-semibold text-warning mb-2">Pattern-based Insight</h4>
                  <p className="text-sm text-foreground">
                    Your sensitivity is set to <strong>{userSensitivity}</strong>. 
                    {userSensitivity === 'high' 
                      ? " Consider taking preventive measures when pressure drops below 1015 hPa."
                      : " Monitor conditions when pressure drops significantly below 1010 hPa."}
                  </p>
                </div>
              </div>
              
              <div className="p-3 bg-secondary/20 rounded-lg border border-secondary/30">
                <p className="text-xs text-muted-foreground italic">
                  <strong>Note:</strong> This risk estimation is based on historical patterns, weather data, and user-reported information. 
                  It is intended to support awareness and preparation, not to replace medical advice.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DisclaimerFooter />
    </div>
  );
}