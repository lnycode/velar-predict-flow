import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CloudRain, AlertTriangle, Thermometer, Droplets } from "lucide-react";

interface WeatherAlertProps {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  percentage: number;
  triggers: string[];
  temperature: number;
  humidity: number;
  pressure: number;
}

export function WeatherAlert({ riskLevel, percentage, triggers, temperature, humidity, pressure }: WeatherAlertProps) {
  const getRiskColor = () => {
    switch (riskLevel) {
      case 'low': return 'border-success text-success';
      case 'medium': return 'border-warning text-warning';
      case 'high': return 'border-destructive text-destructive';
      case 'critical': return 'border-destructive text-destructive animate-pulse-glow';
      default: return 'border-muted text-muted-foreground';
    }
  };

  const getRiskMessage = () => {
    switch (riskLevel) {
      case 'low': return 'Low migraine risk detected';
      case 'medium': return 'Moderate migraine risk - stay prepared';
      case 'high': return 'High migraine risk - take precautions';
      case 'critical': return 'Critical migraine risk - immediate action recommended';
      default: return 'Weather data unavailable';
    }
  };

  return (
    <div className="velar-card rounded-2xl p-6 animate-scale-in">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl bg-gradient-primary/20 ${getRiskColor()}`}>
            <CloudRain className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Weather Trigger Alert</h3>
            <p className="text-sm text-muted-foreground">Next 4 hours prediction</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-2xl font-bold ${getRiskColor()}`}>
            {percentage}%
          </div>
          <p className="text-xs text-muted-foreground">Risk Level</p>
        </div>
      </div>

      <Alert className={`border ${getRiskColor()} bg-background/50 mb-4`}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="text-sm font-medium">
          {getRiskMessage()}
        </AlertTitle>
        <AlertDescription className="text-xs mt-1">
          {triggers.length > 0 
            ? `Primary triggers: ${triggers.join(', ')}`
            : 'No significant triggers detected'
          }
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Thermometer className="w-4 h-4 text-warning" />
            <span className="text-xs text-muted-foreground">Temp</span>
          </div>
          <div className="text-lg font-semibold text-foreground">{temperature}°C</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Droplets className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Humidity</span>
          </div>
          <div className="text-lg font-semibold text-foreground">{humidity}%</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-4 h-4 rounded-full bg-accent" />
            <span className="text-xs text-muted-foreground">Pressure</span>
          </div>
          <div className="text-lg font-semibold text-foreground">{pressure}</div>
        </div>
      </div>

      <Button className="w-full velar-button-primary" size="sm">
        Learn More
      </Button>
    </div>
  );
}