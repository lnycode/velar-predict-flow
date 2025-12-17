import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import { useWeatherAlerts } from '@/hooks/useWeatherAlerts';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Mic, MicOff, Volume2, VolumeX, Brain, 
  Wind, Activity, Loader2, Play, Pause,
  Heart, Sparkles, CloudRain, BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

type AssistantMode = 'idle' | 'listening' | 'forecast' | 'logging' | 'relaxation';

interface RelaxationExercise {
  name: string;
  duration: number;
  steps: string[];
}

const RELAXATION_EXERCISES: RelaxationExercise[] = [
  {
    name: 'Deep Breathing',
    duration: 180, // 3 minutes
    steps: [
      "Let's begin a deep breathing exercise to help ease your migraine.",
      "Find a comfortable position and close your eyes if you can.",
      "Breathe in slowly through your nose for 4 seconds... 1... 2... 3... 4...",
      "Hold your breath gently for 4 seconds... 1... 2... 3... 4...",
      "Now exhale slowly through your mouth for 6 seconds... releasing all tension...",
      "Continue this pattern. Breathe in... 1... 2... 3... 4...",
      "Hold... 1... 2... 3... 4...",
      "And exhale slowly... letting go of pain and stress...",
      "You're doing great. One more round.",
      "Breathe in deeply... filling your lungs with calm...",
      "Hold gently...",
      "And release... feeling more relaxed with each breath.",
      "When you're ready, slowly open your eyes. Well done."
    ]
  },
  {
    name: 'Progressive Relaxation',
    duration: 300, // 5 minutes
    steps: [
      "Let's do a progressive muscle relaxation to release tension.",
      "Start by tensing your forehead muscles. Raise your eyebrows high...",
      "Hold for 5 seconds... and release. Feel the tension melt away.",
      "Now squeeze your eyes shut tightly... hold...",
      "And relax. Notice the difference.",
      "Clench your jaw... hold the tension...",
      "And let go. Let your jaw hang loose.",
      "Shrug your shoulders up to your ears... hold...",
      "And drop them down. Feel the release in your neck.",
      "Make fists with both hands... squeeze tightly...",
      "And open your hands, letting all tension flow out.",
      "Take a deep breath in... and exhale slowly.",
      "Your body is now more relaxed. The pain may ease."
    ]
  },
  {
    name: 'Guided Imagery',
    duration: 240, // 4 minutes
    steps: [
      "Let's take a mental journey to a peaceful place.",
      "Close your eyes and imagine yourself on a quiet beach.",
      "The sun is setting, painting the sky in soft oranges and pinks.",
      "Feel the warm sand beneath you... supporting your body.",
      "Hear the gentle waves... rhythmically washing onto the shore.",
      "With each wave, imagine your pain flowing out to sea.",
      "A cool breeze touches your face... soothing and refreshing.",
      "You are safe here. Peaceful. Calm.",
      "The tension in your head begins to dissolve...",
      "Replaced by warmth and comfort.",
      "Stay here as long as you need.",
      "When you're ready, slowly return to the present moment.",
      "Open your eyes, carrying this peace with you."
    ]
  }
];

export function VoiceAssistant() {
  const { user } = useAuth();
  const { 
    isListening, isSpeaking, isProcessing, transcript, error,
    speak, stopSpeaking, startListening, stopListening, cancelListening 
  } = useVoiceAssistant();
  
  const { currentAlert, weatherData } = useWeatherAlerts();
  
  const [mode, setMode] = useState<AssistantMode>('idle');
  const [currentExercise, setCurrentExercise] = useState<RelaxationExercise | null>(null);
  const [exerciseStep, setExerciseStep] = useState(0);
  const [isExerciseActive, setIsExerciseActive] = useState(false);
  const [loggedSeverity, setLoggedSeverity] = useState<number | null>(null);

  // Read out forecast
  const readForecast = useCallback(async () => {
    setMode('forecast');
    
    let forecastText = "Here's your current migraine forecast. ";
    
    if (currentAlert) {
      const riskText = currentAlert.riskLevel === 'critical' ? 'critical' :
                       currentAlert.riskLevel === 'high' ? 'high' :
                       currentAlert.riskLevel === 'medium' ? 'moderate' : 'low';
      
      forecastText += `Your current risk level is ${riskText}, at ${currentAlert.riskScore} percent. `;
      
      if (currentAlert.triggers.length > 0) {
        forecastText += `The main triggers are: ${currentAlert.triggers.slice(0, 2).join(' and ')}. `;
      }
      
      forecastText += currentAlert.recommendation;
    } else {
      forecastText += "No significant weather triggers detected at this time. ";
      forecastText += "Remember to stay hydrated and maintain your regular routine.";
    }
    
    if (weatherData) {
      forecastText += ` Current conditions: ${weatherData.temperature} degrees, `;
      forecastText += `${weatherData.humidity}% humidity, `;
      forecastText += `and barometric pressure at ${weatherData.pressure} hectopascals.`;
    }

    try {
      await speak(forecastText);
    } catch (err) {
      toast.error('Failed to read forecast');
    } finally {
      setMode('idle');
    }
  }, [currentAlert, weatherData, speak]);

  // Voice logging
  const startVoiceLogging = useCallback(async () => {
    setMode('logging');
    await speak("Tell me about your symptoms. You can say things like 'I have a level 7 migraine' or describe how you're feeling.");
    await startListening();
  }, [speak, startListening]);

  const processVoiceLog = useCallback(async () => {
    const text = await stopListening();
    
    if (!text) {
      toast.error('No speech detected. Please try again.');
      setMode('idle');
      return;
    }

    // Parse severity from speech
    const severityMatch = text.match(/(\d+)/);
    let severity = severityMatch ? parseInt(severityMatch[1]) : null;
    
    if (severity !== null && severity > 10) severity = 10;
    if (severity !== null && severity < 1) severity = 1;

    if (severity) {
      setLoggedSeverity(severity);
      
      // Save to database
      if (user) {
        const { error: dbError } = await supabase
          .from('migraine_entries')
          .insert({
            user_id: user.id,
            severity,
            intensity: severity,
            note: text,
            created_at: new Date().toISOString(),
          });

        if (dbError) {
          console.error('Error saving entry:', dbError);
          await speak("I had trouble saving your entry. Please try again later.");
        } else {
          await speak(`Got it. I've logged a severity ${severity} migraine. ${
            severity >= 7 ? "That sounds intense. Would you like me to guide you through a relaxation exercise?" :
            severity >= 4 ? "I hope you feel better soon. Stay hydrated and rest if you can." :
            "That's manageable. Keep monitoring your symptoms."
          }`);
        }
      }
    } else {
      await speak(`I heard: "${text}". Could you tell me your pain level from 1 to 10?`);
    }
    
    setMode('idle');
  }, [stopListening, user, speak]);

  // Relaxation exercises
  const startExercise = useCallback(async (exercise: RelaxationExercise) => {
    setMode('relaxation');
    setCurrentExercise(exercise);
    setExerciseStep(0);
    setIsExerciseActive(true);
    
    await speak(exercise.steps[0]);
  }, [speak]);

  const continueExercise = useCallback(async () => {
    if (!currentExercise || !isExerciseActive) return;
    
    const nextStep = exerciseStep + 1;
    
    if (nextStep >= currentExercise.steps.length) {
      setIsExerciseActive(false);
      setMode('idle');
      toast.success('Exercise complete! Well done.');
      return;
    }
    
    setExerciseStep(nextStep);
    await speak(currentExercise.steps[nextStep]);
  }, [currentExercise, exerciseStep, isExerciseActive, speak]);

  const stopExercise = useCallback(() => {
    stopSpeaking();
    setIsExerciseActive(false);
    setCurrentExercise(null);
    setExerciseStep(0);
    setMode('idle');
  }, [stopSpeaking]);

  // Auto-continue exercise after speech ends
  useEffect(() => {
    if (mode === 'relaxation' && isExerciseActive && !isSpeaking && currentExercise) {
      const timer = setTimeout(() => {
        continueExercise();
      }, 2000); // 2 second pause between steps
      
      return () => clearTimeout(timer);
    }
  }, [mode, isExerciseActive, isSpeaking, currentExercise, continueExercise]);

  const isActive = isListening || isSpeaking || isProcessing;

  return (
    <Card className="velar-card overflow-hidden">
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br opacity-30 transition-all duration-500',
        isSpeaking ? 'from-primary/30 to-purple-500/20 animate-pulse' :
        isListening ? 'from-green-500/30 to-cyan-500/20' :
        'from-primary/10 to-primary/5'
      )} />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-3 rounded-xl transition-all duration-300',
              isActive ? 'bg-primary/20 animate-pulse' : 'bg-primary/10'
            )}>
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                Velar Voice Assistant
                {isActive && <Sparkles className="w-4 h-4 text-primary animate-pulse" />}
              </CardTitle>
              <CardDescription>
                Speak to get forecasts, log symptoms, or start relaxation exercises
              </CardDescription>
            </div>
          </div>
          
          {isSpeaking && (
            <Button variant="ghost" size="icon" onClick={stopSpeaking}>
              <VolumeX className="w-5 h-5" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative space-y-6">
        {/* Status Display */}
        <div className={cn(
          'p-4 rounded-xl border transition-all',
          isSpeaking ? 'bg-primary/10 border-primary/30' :
          isListening ? 'bg-green-500/10 border-green-500/30' :
          isProcessing ? 'bg-yellow-500/10 border-yellow-500/30' :
          'bg-secondary/20 border-secondary/30'
        )}>
          <div className="flex items-center gap-3">
            {isSpeaking && <Volume2 className="w-5 h-5 text-primary animate-pulse" />}
            {isListening && <Mic className="w-5 h-5 text-green-500 animate-pulse" />}
            {isProcessing && <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />}
            {!isActive && <Activity className="w-5 h-5 text-muted-foreground" />}
            
            <span className="font-medium">
              {isSpeaking ? 'Speaking...' :
               isListening ? 'Listening...' :
               isProcessing ? 'Processing...' :
               'Ready to assist'}
            </span>
          </div>
          
          {transcript && mode === 'logging' && (
            <p className="mt-2 text-sm text-muted-foreground italic">
              "{transcript}"
            </p>
          )}
          
          {error && (
            <p className="mt-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col gap-2"
            onClick={readForecast}
            disabled={isActive}
          >
            <CloudRain className="w-5 h-5 text-primary" />
            <span className="text-sm">Read Forecast</span>
          </Button>
          
          <Button
            variant={isListening ? 'default' : 'outline'}
            className="h-auto py-4 flex flex-col gap-2"
            onClick={isListening ? processVoiceLog : startVoiceLogging}
            disabled={isSpeaking || isProcessing}
          >
            {isListening ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5 text-green-500" />
            )}
            <span className="text-sm">
              {isListening ? 'Stop & Save' : 'Log Symptoms'}
            </span>
          </Button>
          
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col gap-2"
            onClick={() => startExercise(RELAXATION_EXERCISES[0])}
            disabled={isActive}
          >
            <Heart className="w-5 h-5 text-pink-500" />
            <span className="text-sm">Start Exercise</span>
          </Button>
        </div>

        {/* Relaxation Exercises */}
        <Separator />
        
        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            Guided Relaxation Exercises
          </h3>
          
          <div className="grid gap-3">
            {RELAXATION_EXERCISES.map((exercise, index) => (
              <div
                key={index}
                className={cn(
                  'p-4 rounded-lg border transition-all',
                  currentExercise?.name === exercise.name && isExerciseActive
                    ? 'bg-primary/10 border-primary/30'
                    : 'bg-secondary/10 border-secondary/20 hover:border-primary/30'
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{exercise.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {Math.floor(exercise.duration / 60)} min • {exercise.steps.length} steps
                    </p>
                  </div>
                  
                  {currentExercise?.name === exercise.name && isExerciseActive ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        Step {exerciseStep + 1}/{exercise.steps.length}
                      </Badge>
                      <Button size="sm" variant="ghost" onClick={stopExercise}>
                        <Pause className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startExercise(exercise)}
                      disabled={isActive}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                {currentExercise?.name === exercise.name && isExerciseActive && (
                  <div className="mt-3">
                    <Progress 
                      value={(exerciseStep / exercise.steps.length) * 100} 
                      className="h-2"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Log */}
        {loggedSeverity !== null && (
          <div className="p-3 rounded-lg bg-success/10 border border-success/30">
            <p className="text-sm text-success flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Last logged: Severity {loggedSeverity}/10
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
