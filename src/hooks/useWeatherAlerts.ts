import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePushNotifications } from './usePushNotifications';
import { toast } from 'sonner';

export interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  pressureChange: number;
  conditions: string;
  uvIndex: number;
  windSpeed: number;
  timestamp: Date;
}

export interface AlertData {
  id: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  triggers: string[];
  recommendation: string;
  weather: WeatherData;
  createdAt: Date;
  acknowledged: boolean;
}

interface UseWeatherAlertsReturn {
  currentAlert: AlertData | null;
  weatherData: WeatherData | null;
  isLoading: boolean;
  isMonitoring: boolean;
  alerts: AlertData[];
  checkWeather: () => Promise<void>;
  acknowledgeAlert: (id: string) => void;
  startMonitoring: () => void;
  stopMonitoring: () => void;
}

// Pressure thresholds for migraine risk (in hPa)
const PRESSURE_THRESHOLDS = {
  lowPressure: 1005, // Low pressure system
  highChange: 8, // Significant change in 3 hours
  moderateChange: 4, // Moderate change
};

function calculateMigraineRisk(
  weather: WeatherData,
  previousPressure: number | null,
  sensitivity: string = 'medium'
): { riskScore: number; triggers: string[] } {
  let riskScore = 0;
  const triggers: string[] = [];

  const sensitivityMultiplier = 
    sensitivity === 'high' ? 1.5 : 
    sensitivity === 'low' ? 0.7 : 1;

  // Pressure analysis
  if (previousPressure) {
    const pressureChange = Math.abs(weather.pressure - previousPressure);
    
    if (pressureChange >= PRESSURE_THRESHOLDS.highChange) {
      riskScore += 35 * sensitivityMultiplier;
      triggers.push(`Significant pressure change: ${pressureChange.toFixed(1)} hPa`);
    } else if (pressureChange >= PRESSURE_THRESHOLDS.moderateChange) {
      riskScore += 20 * sensitivityMultiplier;
      triggers.push(`Moderate pressure change: ${pressureChange.toFixed(1)} hPa`);
    }
  }

  // Low pressure system
  if (weather.pressure < PRESSURE_THRESHOLDS.lowPressure) {
    riskScore += 25 * sensitivityMultiplier;
    triggers.push(`Low pressure system: ${weather.pressure} hPa`);
  }

  // High humidity
  if (weather.humidity > 80) {
    riskScore += 15 * sensitivityMultiplier;
    triggers.push(`High humidity: ${weather.humidity}%`);
  } else if (weather.humidity > 70) {
    riskScore += 8 * sensitivityMultiplier;
  }

  // Temperature extremes
  if (weather.temperature > 32 || weather.temperature < 0) {
    riskScore += 15 * sensitivityMultiplier;
    triggers.push(`Extreme temperature: ${weather.temperature}°C`);
  } else if (weather.temperature > 28 || weather.temperature < 5) {
    riskScore += 8 * sensitivityMultiplier;
  }

  // Weather conditions
  const stormConditions = ['Thunderstorm', 'Storm', 'Rain', 'Drizzle'];
  if (stormConditions.some(c => weather.conditions.includes(c))) {
    riskScore += 20 * sensitivityMultiplier;
    triggers.push(`Storm activity: ${weather.conditions}`);
  }

  // UV Index
  if (weather.uvIndex > 8) {
    riskScore += 10 * sensitivityMultiplier;
    triggers.push(`High UV index: ${weather.uvIndex}`);
  }

  // Wind
  if (weather.windSpeed > 40) {
    riskScore += 10 * sensitivityMultiplier;
    triggers.push(`Strong winds: ${weather.windSpeed} km/h`);
  }

  return {
    riskScore: Math.min(100, Math.round(riskScore)),
    triggers,
  };
}

function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

function getRecommendation(riskLevel: string, triggers: string[]): string {
  switch (riskLevel) {
    case 'critical':
      return 'Take immediate preventive measures. Consider medication, stay hydrated, and avoid screens. A migraine episode is highly likely within the next 4-8 hours.';
    case 'high':
      return 'High risk detected. Prepare preventive medication, stay in a comfortable environment, and monitor symptoms closely.';
    case 'medium':
      return 'Moderate risk. Stay hydrated, avoid known triggers, and keep medication nearby.';
    default:
      return 'Low risk. Continue normal activities while maintaining healthy habits.';
  }
}

export function useWeatherAlerts(): UseWeatherAlertsReturn {
  const { user } = useAuth();
  const { sendLocalNotification, isSubscribed } = usePushNotifications();
  const [currentAlert, setCurrentAlert] = useState<AlertData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  const previousPressureRef = useRef<number | null>(null);
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const userProfileRef = useRef<{ sensitivity: string; lat: number | null; lng: number | null } | null>(null);

  // Fetch user profile for sensitivity settings
  const fetchUserProfile = useCallback(async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('weather_sensitivity, location_lat, location_lng')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      userProfileRef.current = {
        sensitivity: data.weather_sensitivity || 'medium',
        lat: data.location_lat,
        lng: data.location_lng,
      };
    }
  }, [user]);

  const checkWeather = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      await fetchUserProfile();
      
      // Get location (use profile or browser geolocation)
      let lat = userProfileRef.current?.lat;
      let lng = userProfileRef.current?.lng;
      
      if (!lat || !lng) {
        // Try to get browser location
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              maximumAge: 300000, // 5 minutes cache
            });
          });
          lat = position.coords.latitude;
          lng = position.coords.longitude;
        } catch {
          // Use default location (Berlin)
          lat = 52.52;
          lng = 13.405;
        }
      }

      // Fetch weather data
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${import.meta.env.VITE_OPENWEATHER_API_KEY || 'demo'}&units=metric`
      );

      let weather: WeatherData;
      
      if (response.ok) {
        const data = await response.json();
        weather = {
          temperature: Math.round(data.main.temp),
          humidity: data.main.humidity,
          pressure: data.main.pressure,
          pressureChange: previousPressureRef.current 
            ? data.main.pressure - previousPressureRef.current 
            : 0,
          conditions: data.weather[0]?.main || 'Clear',
          uvIndex: data.uvi || 0,
          windSpeed: Math.round((data.wind?.speed || 0) * 3.6), // Convert m/s to km/h
          timestamp: new Date(),
        };
      } else {
        // Fallback mock data for demo
        weather = {
          temperature: 18 + Math.random() * 10,
          humidity: 60 + Math.random() * 30,
          pressure: 1005 + Math.random() * 20 - 10,
          pressureChange: previousPressureRef.current 
            ? (1005 + Math.random() * 20 - 10) - previousPressureRef.current 
            : Math.random() * 8 - 4,
          conditions: ['Clear', 'Clouds', 'Rain', 'Thunderstorm'][Math.floor(Math.random() * 4)],
          uvIndex: Math.floor(Math.random() * 11),
          windSpeed: Math.floor(Math.random() * 50),
          timestamp: new Date(),
        };
      }

      setWeatherData(weather);

      // Calculate risk
      const { riskScore, triggers } = calculateMigraineRisk(
        weather,
        previousPressureRef.current,
        userProfileRef.current?.sensitivity
      );

      previousPressureRef.current = weather.pressure;

      const riskLevel = getRiskLevel(riskScore);
      const recommendation = getRecommendation(riskLevel, triggers);

      const newAlert: AlertData = {
        id: `alert-${Date.now()}`,
        riskLevel,
        riskScore,
        triggers,
        recommendation,
        weather,
        createdAt: new Date(),
        acknowledged: false,
      };

      setCurrentAlert(newAlert);

      // Add to alerts history if significant
      if (riskLevel !== 'low') {
        setAlerts(prev => [newAlert, ...prev].slice(0, 20));

        // Send push notification for high/critical alerts
        if ((riskLevel === 'high' || riskLevel === 'critical') && isSubscribed) {
          await sendLocalNotification(
            `⚠️ ${riskLevel === 'critical' ? 'Critical' : 'High'} Migraine Risk Alert`,
            `${triggers[0] || 'Weather conditions detected'}. ${recommendation.slice(0, 100)}...`,
            { riskLevel, riskScore, alertId: newAlert.id }
          );
        }

        // Show toast for non-subscribed users
        if (riskLevel === 'critical') {
          toast.warning('Critical migraine risk detected!', {
            description: triggers[0] || 'Take preventive action now.',
            duration: 10000,
          });
        }
      }

      // Save prediction to database
      const insertData = {
        user_id: user.id,
        prediction_type: 'weather_alert',
        risk_level: Math.round(riskScore / 10),
        confidence: 0.85,
        weather_data: weather as any,
        prediction_factors: { triggers, recommendation } as any,
        predicted_for: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      };
      
      const { error: insertError } = await supabase
        .from('ai_predictions')
        .insert(insertData);

      if (insertError) {
        console.error('Error saving prediction:', insertError);
      }

    } catch (error) {
      console.error('Error checking weather:', error);
      toast.error('Failed to check weather conditions');
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchUserProfile, isSubscribed, sendLocalNotification]);

  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === id ? { ...alert, acknowledged: true } : alert
      )
    );
    if (currentAlert?.id === id) {
      setCurrentAlert(prev => prev ? { ...prev, acknowledged: true } : null);
    }
  }, [currentAlert]);

  const startMonitoring = useCallback(() => {
    if (monitoringIntervalRef.current) return;
    
    setIsMonitoring(true);
    checkWeather(); // Initial check
    
    // Check every 30 minutes
    monitoringIntervalRef.current = setInterval(() => {
      checkWeather();
    }, 30 * 60 * 1000);

    toast.success('Weather monitoring started', {
      description: 'You will receive alerts for high-risk conditions.',
    });
  }, [checkWeather]);

  const stopMonitoring = useCallback(() => {
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
    setIsMonitoring(false);
    toast.info('Weather monitoring stopped');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
      }
    };
  }, []);

  // Auto-start monitoring if user has weather alerts enabled
  useEffect(() => {
    const initMonitoring = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('weather_alerts')
        .eq('user_id', user.id)
        .single();
      
      if (data?.weather_alerts) {
        startMonitoring();
      }
    };

    initMonitoring();
  }, [user, startMonitoring]);

  return {
    currentAlert,
    weatherData,
    isLoading,
    isMonitoring,
    alerts,
    checkWeather,
    acknowledgeAlert,
    startMonitoring,
    stopMonitoring,
  };
}
