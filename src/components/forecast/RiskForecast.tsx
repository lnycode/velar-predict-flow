import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar, CloudRain, Sun, Cloud, Snowflake, 
  AlertTriangle, TrendingUp, RefreshCw, MapPin,
  Thermometer, Droplets, Wind, Eye, FlaskConical
} from 'lucide-react';

interface WeatherForecast {
  date: string;
  riskLevel: number;
  confidence: number;
  weather: {
    temperature: number;
    humidity: number;
    pressure: number;
    conditions: string;
    uvIndex?: number;
    windSpeed?: number;
  };
  factors: string[];
  recommendation: string;
}

const RiskForecastComponent: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [forecasts, setForecasts] = useState<WeatherForecast[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const getRiskColor = (risk: number) => {
    if (risk <= 3) return 'text-success';
    if (risk <= 6) return 'text-warning';
    return 'text-destructive';
  };

  const getRiskBgColor = (risk: number) => {
    if (risk <= 3) return 'bg-success/20 border-success/30';
    if (risk <= 6) return 'bg-warning/20 border-warning/30';
    return 'bg-destructive/20 border-destructive/30';
  };

  const getRiskLabel = (risk: number) => {
    if (risk <= 3) return t('common.low');
    if (risk <= 6) return t('common.medium');
    return t('common.high');
  };

  const getWeatherIcon = (conditions: string) => {
    switch (conditions.toLowerCase()) {
      case 'clear':
      case 'sunny':
        return Sun;
      case 'clouds':
      case 'cloudy':
        return Cloud;
      case 'rain':
      case 'drizzle':
        return CloudRain;
      case 'snow':
        return Snowflake;
      default:
        return Cloud;
    }
  };

  const fetchForecast = useCallback(async () => {
    if (!user || !session) return;

    setIsLoading(true);
    try {
      // Get user profile for location
      const { data: profile } = await supabase
        .from('profiles')
        .select('location_lat, location_lng, weather_sensitivity, known_triggers')
        .eq('user_id', user.id)
        .single();

      if (!profile?.location_lat || !profile?.location_lng) {
        toast({
          title: t('forecast.locationRequired'),
          description: t('forecast.locationRequiredDesc'),
          variant: 'destructive',
        });
        return;
      }

      // Get recent episodes count
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: recentEpisodes } = await supabase
        .from('migraine_entries')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Generate forecasts for next 7 days
      const mockForecasts: WeatherForecast[] = [];
      
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        
        // Simulate weather and risk prediction
        const baseRisk = Math.floor(Math.random() * 10) + 1;
        const weatherConditions = ['Clear', 'Clouds', 'Rain', 'Overcast'][Math.floor(Math.random() * 4)];
        const temperature = 15 + Math.random() * 15; // 15-30°C
        const humidity = 40 + Math.random() * 40; // 40-80%
        const pressure = 990 + Math.random() * 40; // 990-1030 hPa
        
        // Adjust risk based on weather sensitivity
        let adjustedRisk = baseRisk;
        if (profile.weather_sensitivity === 'high') {
          adjustedRisk += 2;
        } else if (profile.weather_sensitivity === 'low') {
          adjustedRisk -= 1;
        }
        
        // Adjust for pressure changes (major trigger)
        if (pressure < 1005) adjustedRisk += 2;
        if (humidity > 70) adjustedRisk += 1;
        
        adjustedRisk = Math.max(1, Math.min(10, adjustedRisk));
        
        const factors = [];
        if (pressure < 1005) factors.push(t('forecast.lowPressureSystem'));
        if (humidity > 70) factors.push(t('forecast.highHumidity'));
        if (temperature > 28) factors.push(t('forecast.highTemperatures'));
        if (weatherConditions === 'Rain') factors.push(t('forecast.rainyWeather'));
        
        const triggers = profile.known_triggers?.split(', ') || [];
        if (triggers.some(trigger => 
          trigger.toLowerCase().includes('weather') || 
          trigger.toLowerCase().includes('wetter')
        )) {
          factors.push(t('forecast.personalWeatherTrigger'));
        }

        const recommendation = adjustedRisk > 6 
          ? t('forecast.highRiskRecommendation')
          : adjustedRisk > 3 
          ? t('forecast.mediumRiskRecommendation')
          : t('forecast.lowRiskRecommendation');

        mockForecasts.push({
          date: date.toISOString().split('T')[0],
          riskLevel: adjustedRisk,
          confidence: 0.7 + Math.random() * 0.25, // 70-95% confidence
          weather: {
            temperature: Math.round(temperature * 10) / 10,
            humidity: Math.round(humidity),
            pressure: Math.round(pressure),
            conditions: weatherConditions,
            uvIndex: Math.floor(Math.random() * 11),
            windSpeed: Math.floor(Math.random() * 25)
          },
          factors: factors.length > 0 ? factors : [t('forecast.normalConditions')],
          recommendation
        });
      }

      setForecasts(mockForecasts);
      setLastUpdate(new Date());
      
    } catch (error: any) {
      toast({
        title: t('forecast.loadError'),
        description: error.message || t('common.error'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, session, toast, t]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  const formatDate = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return t('common.today');
    if (date.toDateString() === tomorrow.toDateString()) return t('common.tomorrow');
    
    const locale = i18n.language === 'de' ? 'de-DE' : 'en-US';
    return date.toLocaleDateString(locale, { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  }, [t, i18n.language]);

  return (
    <Card className="velar-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              {t('forecast.title')}
            </CardTitle>
            <CardDescription>
              {t('forecast.description')}
            </CardDescription>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={fetchForecast}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </Button>
        </div>
        
        {lastUpdate && (
          <p className="text-xs text-muted-foreground">
            {t('forecast.lastUpdate')}: {lastUpdate.toLocaleString(i18n.language === 'de' ? 'de-DE' : 'en-US')}
          </p>
        )}
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {forecasts.map((forecast, index) => {
              const WeatherIcon = getWeatherIcon(forecast.weather.conditions);
              const isToday = index === 0;
              
              return (
                <div
                  key={forecast.date}
                  className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                    getRiskBgColor(forecast.riskLevel)
                  } ${isToday ? 'ring-2 ring-primary/30' : ''}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium min-w-[60px]">
                        {formatDate(forecast.date)}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <WeatherIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {forecast.weather.conditions}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={forecast.riskLevel <= 3 ? 'default' : 
                               forecast.riskLevel <= 6 ? 'secondary' : 'destructive'}
                        className="min-w-[70px] justify-center"
                      >
                        {getRiskLabel(forecast.riskLevel)} ({forecast.riskLevel}/10)
                      </Badge>
                      
                      <div className="text-xs text-muted-foreground">
                        {Math.round(forecast.confidence * 100)}% {t('forecast.confident')}
                      </div>
                    </div>
                  </div>
                  
                  {/* Weather Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-muted-foreground" />
                      <span>{forecast.weather.temperature}°C</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-muted-foreground" />
                      <span>{forecast.weather.humidity}%</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-muted-foreground" />
                      <span>{forecast.weather.pressure} hPa</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Wind className="w-3 h-3 text-muted-foreground" />
                      <span>{forecast.weather.windSpeed} km/h</span>
                    </div>
                  </div>
                  
                  {/* Risk Factors */}
                  {forecast.factors.length > 0 && (
                    <div className="mb-2">
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        {t('forecast.riskFactors')}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {forecast.factors.map((factor, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Recommendation */}
                  <div className="text-xs text-muted-foreground italic">
                    💡 {forecast.recommendation}
                  </div>
                  
                  {forecast.riskLevel > 7 && (
                    <div className="mt-2 flex items-center gap-2 text-destructive">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-xs font-medium">
                        {t('forecast.highProbability')}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {/* Simulated Data Banner */}
        <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-warning flex-shrink-0" />
          <p className="text-xs text-warning">
            <strong>Simulated Data</strong> — These forecasts use generated sample data for demonstration. Connect real weather services for live risk estimation.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export const RiskForecast = memo(RiskForecastComponent);