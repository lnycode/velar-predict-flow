import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Activity, Heart, Thermometer, Watch } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function BiometricIntegration() {
  const { t } = useTranslation();
  const [biometrics, setBiometrics] = useState({
    heartRate: 72,
    bodyTemp: 36.8,
    stressLevel: 3,
    sleepQuality: 8.2
  });

  useEffect(() => {
    // Simulate real-time biometric updates
    const interval = setInterval(() => {
      setBiometrics(prev => ({
        heartRate: prev.heartRate + (Math.random() - 0.5) * 5,
        bodyTemp: prev.bodyTemp + (Math.random() - 0.5) * 0.2,
        stressLevel: Math.max(1, Math.min(10, prev.stressLevel + (Math.random() - 0.5) * 2)),
        sleepQuality: Math.max(1, Math.min(10, prev.sleepQuality + (Math.random() - 0.5) * 0.5))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStressColor = (level: number) => {
    if (level <= 3) return "text-green-400";
    if (level <= 6) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-green-900/20 to-teal-900/20 border-green-500/30">
      <div className="flex items-center gap-3 mb-4">
        <Watch className="w-5 h-5 text-green-400" />
        <h3 className="text-lg font-semibold text-white">{t('biometric.title')}</h3>
        <Badge variant="secondary" className="bg-green-500/20 text-green-300">
          {t('biometric.live')}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-400" />
            <span className="text-sm text-gray-300">{t('biometric.heartRate')}</span>
          </div>
          <p className="text-xl font-bold text-white">{Math.round(biometrics.heartRate)} BPM</p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-300">{t('biometric.bodyTemp')}</span>
          </div>
          <p className="text-xl font-bold text-white">{biometrics.bodyTemp.toFixed(1)}°C</p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-gray-300">{t('biometric.stressLevel')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={biometrics.stressLevel * 10} className="flex-1" />
            <span className={`text-sm font-bold ${getStressColor(biometrics.stressLevel)}`}>
              {biometrics.stressLevel.toFixed(1)}/10
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-400 rounded-full" />
            <span className="text-sm text-gray-300">{t('biometric.sleepQuality')}</span>
          </div>
          <p className="text-xl font-bold text-purple-300">{biometrics.sleepQuality.toFixed(1)}/10</p>
        </div>
      </div>
    </Card>
  );
}