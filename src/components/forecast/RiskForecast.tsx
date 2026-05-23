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
  Thermometer, Droplets, Wind, Eye, ShieldCheck
} from 'lucide-react';
import { EvidenceTooltip } from './EvidenceTooltip';

interface RiskFactor {
  id: string;
  label: string;
  weight: number;
}

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
  factors: RiskFactor[];
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
      const { data, error } = await supabase.functions.invoke('predict-migraine-risk', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      if (!data?.forecasts) throw new Error('No forecast data returned');

      setForecasts(data.forecasts as WeatherForecast[]);
      setLastUpdate(new Date());
    } catch (error: any) {
      const msg = error.message || '';
      if (msg.toLowerCase().includes('location')) {
        toast({
          title: t('forecast.locationRequired'),
          description: t('forecast.locationRequiredDesc'),
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('forecast.loadError'),
          description: msg || t('common.error'),
          variant: 'destructive',
        });
      }
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
                          <EvidenceTooltip key={idx} factorId={factor.id}>
                            <Badge variant="outline" className="text-xs cursor-help">
                              {factor.label}
                            </Badge>
                          </EvidenceTooltip>
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
        
        {/* Evidence-based footer */}
        <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            Forecasts use real-time barometric data combined with your personal attack history. Click any risk factor for source citations.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export const RiskForecast = memo(RiskForecastComponent);