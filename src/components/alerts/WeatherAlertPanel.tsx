import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useWeatherAlerts, AlertData } from '@/hooks/useWeatherAlerts';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { 
  CloudRain, AlertTriangle, Thermometer, Droplets, 
  Gauge, Wind, Bell, BellOff, RefreshCw, CheckCircle,
  Activity, Clock, Shield, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface WeatherAlertPanelProps {
  variant?: 'full' | 'compact';
  showHistory?: boolean;
}

export function WeatherAlertPanel({ variant = 'full', showHistory = true }: WeatherAlertPanelProps) {
  const {
    currentAlert,
    weatherData,
    isLoading,
    isMonitoring,
    alerts,
    checkWeather,
    acknowledgeAlert,
    startMonitoring,
    stopMonitoring,
  } = useWeatherAlerts();

  const {
    isSupported,
    isSubscribed,
    permission,
    isLoading: notificationLoading,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-success bg-success/10 border-success/30';
      case 'medium': return 'text-warning bg-warning/10 border-warning/30';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
      case 'critical': return 'text-destructive bg-destructive/10 border-destructive/30 animate-pulse';
      default: return 'text-muted-foreground bg-muted/10 border-muted/30';
    }
  };

  const getRiskGradient = (level: string) => {
    switch (level) {
      case 'low': return 'from-success/20 to-success/5';
      case 'medium': return 'from-warning/20 to-warning/5';
      case 'high': return 'from-orange-500/20 to-orange-500/5';
      case 'critical': return 'from-destructive/20 to-destructive/5';
      default: return 'from-muted/20 to-muted/5';
    }
  };

  const handleNotificationToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  if (variant === 'compact') {
    return (
      <Card className="velar-card overflow-hidden">
        <div className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-50',
          currentAlert ? getRiskGradient(currentAlert.riskLevel) : 'from-primary/10 to-primary/5'
        )} />
        
        <CardContent className="pt-6 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2 rounded-lg border',
                currentAlert ? getRiskColor(currentAlert.riskLevel) : 'bg-muted/10'
              )}>
                <CloudRain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Weather Alert</h3>
                <p className="text-xs text-muted-foreground">
                  {isMonitoring ? 'Active monitoring' : 'Paused'}
                </p>
              </div>
            </div>
            
            {currentAlert && (
              <Badge className={getRiskColor(currentAlert.riskLevel)}>
                {currentAlert.riskLevel.toUpperCase()}
              </Badge>
            )}
          </div>

          {currentAlert && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-3xl font-bold text-foreground">
                  {currentAlert.riskScore}%
                </span>
                <span className="text-sm text-muted-foreground">Risk Score</span>
              </div>
              
              <Progress 
                value={currentAlert.riskScore} 
                className={cn(
                  'h-2 mb-3',
                  currentAlert.riskLevel === 'critical' && 'animate-pulse'
                )}
              />
              
              {currentAlert.triggers.length > 0 && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {currentAlert.triggers[0]}
                </p>
              )}
            </>
          )}

          {!currentAlert && (
            <div className="text-center py-4">
              <Activity className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No alerts</p>
            </div>
          )}

          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-4"
            onClick={() => checkWeather()}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Check Now
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Alert Card */}
      <Card className="velar-card overflow-hidden">
        <div className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-30',
          currentAlert ? getRiskGradient(currentAlert.riskLevel) : 'from-primary/10 to-primary/5'
        )} />
        
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-3 rounded-xl border',
                currentAlert ? getRiskColor(currentAlert.riskLevel) : 'bg-primary/10 border-primary/30'
              )}>
                <CloudRain className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl">Real-Time Weather Alert</CardTitle>
                <CardDescription>
                  Barometric pressure monitoring for migraine prevention
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => checkWeather()}
                disabled={isLoading}
              >
                <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
              </Button>
              
              <Button
                variant={isMonitoring ? 'default' : 'outline'}
                size="sm"
                onClick={isMonitoring ? stopMonitoring : startMonitoring}
              >
                <Activity className="w-4 h-4 mr-2" />
                {isMonitoring ? 'Monitoring' : 'Start'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-6">
          {/* Risk Display */}
          {currentAlert ? (
            <div className={cn(
              'p-6 rounded-xl border',
              getRiskColor(currentAlert.riskLevel)
            )}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-semibold text-lg">
                      {currentAlert.riskLevel === 'critical' ? 'Critical Alert!' :
                       currentAlert.riskLevel === 'high' ? 'High Risk Detected' :
                       currentAlert.riskLevel === 'medium' ? 'Moderate Risk' : 'Low Risk'}
                    </span>
                  </div>
                  <p className="text-sm opacity-80">
                    Updated {formatDistanceToNow(currentAlert.createdAt, { addSuffix: true })}
                  </p>
                </div>
                
                <div className="text-right">
                  <div className="text-4xl font-bold">{currentAlert.riskScore}%</div>
                  <p className="text-sm opacity-80">Risk Score</p>
                </div>
              </div>

              <Progress 
                value={currentAlert.riskScore} 
                className={cn(
                  'h-3 mb-4',
                  currentAlert.riskLevel === 'critical' && 'animate-pulse'
                )}
              />

              {/* Triggers */}
              {currentAlert.triggers.length > 0 && (
                <div className="space-y-2 mb-4">
                  <h4 className="font-medium text-sm">Active Triggers:</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentAlert.triggers.map((trigger, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        {trigger}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendation */}
              <div className="p-3 rounded-lg bg-background/50">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                  <p className="text-sm">{currentAlert.recommendation}</p>
                </div>
              </div>

              {!currentAlert.acknowledged && currentAlert.riskLevel !== 'low' && (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => acknowledgeAlert(currentAlert.id)}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Acknowledge Alert
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <CloudRain className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">
                No weather data available
              </p>
              <Button onClick={() => checkWeather()} disabled={isLoading}>
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Check Weather Now
              </Button>
            </div>
          )}

          {/* Current Weather */}
          {weatherData && (
            <>
              <Separator />
              
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-primary" />
                  Current Conditions
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-secondary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Thermometer className="w-4 h-4 text-orange-500" />
                      <span className="text-xs text-muted-foreground">Temperature</span>
                    </div>
                    <div className="text-2xl font-bold">{weatherData.temperature.toFixed(1)}°C</div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-secondary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Droplets className="w-4 h-4 text-blue-500" />
                      <span className="text-xs text-muted-foreground">Humidity</span>
                    </div>
                    <div className="text-2xl font-bold">{weatherData.humidity.toFixed(1)}%</div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-secondary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Gauge className="w-4 h-4 text-purple-500" />
                      <span className="text-xs text-muted-foreground">Pressure</span>
                    </div>
                    <div className="text-2xl font-bold">{weatherData.pressure.toFixed(1)}</div>
                    <div className={cn(
                      'text-xs',
                      weatherData.pressureChange > 0 ? 'text-success' : 
                      weatherData.pressureChange < 0 ? 'text-destructive' : 'text-muted-foreground'
                    )}>
                      {weatherData.pressureChange > 0 ? '+' : ''}{weatherData.pressureChange.toFixed(1)} hPa
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-secondary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Wind className="w-4 h-4 text-cyan-500" />
                      <span className="text-xs text-muted-foreground">Wind</span>
                    </div>
                    <div className="text-2xl font-bold">{Math.round(weatherData.windSpeed)}</div>
                    <div className="text-xs text-muted-foreground">km/h</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Notification Settings */}
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isSubscribed ? (
                <Bell className="w-5 h-5 text-primary" />
              ) : (
                <BellOff className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <h4 className="font-medium">Push Notifications</h4>
                <p className="text-sm text-muted-foreground">
                  {isSupported 
                    ? 'Receive alerts even when the app is closed'
                    : 'Not supported in this browser'
                  }
                </p>
              </div>
            </div>
            
            <Switch
              checked={isSubscribed}
              onCheckedChange={handleNotificationToggle}
              disabled={!isSupported || notificationLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Alert History */}
      {showHistory && alerts.length > 0 && (
        <Card className="velar-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Alert History
            </CardTitle>
            <CardDescription>
              Recent weather alerts and triggers
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              {alerts.slice(0, 10).map((alert) => (
                <div 
                  key={alert.id}
                  className={cn(
                    'p-4 rounded-lg border transition-colors',
                    alert.acknowledged 
                      ? 'bg-secondary/10 border-secondary/20' 
                      : getRiskColor(alert.riskLevel)
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getRiskColor(alert.riskLevel)}>
                        {alert.riskLevel}
                      </Badge>
                      <span className="text-sm font-medium">{alert.riskScore}% Risk</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(alert.createdAt, { addSuffix: true })}
                    </span>
                  </div>
                  
                  {alert.triggers.length > 0 && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {alert.triggers.join(' • ')}
                    </p>
                  )}
                  
                  {alert.acknowledged && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-success">
                      <CheckCircle className="w-3 h-3" />
                      Acknowledged
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
