import { Info } from 'lucide-react';

export function DisclaimerFooter() {
  return (
    <div className="mt-8 p-4 bg-secondary/10 border border-secondary/20 rounded-lg">
      <div className="flex items-start gap-3">
        <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong>Decision Support Tool:</strong> This risk estimation is based on historical patterns, 
          weather data, and user-reported information. It is intended to support awareness and preparation, 
          not to replace medical advice. Always consult a healthcare professional for medical decisions.
        </p>
      </div>
    </div>
  );
}