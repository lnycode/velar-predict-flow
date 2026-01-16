import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function VoiceCommandPanel() {
  const { t } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState("");

  const toggleListening = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setLastCommand(t('voice.readyForCommand'));
      setTimeout(() => {
        const commands = [
          t('voice.commands.newEntry'),
          t('voice.commands.showStats'),
          t('voice.commands.riskToday'),
          t('voice.commands.openCalendar')
        ];
        setLastCommand(commands[Math.floor(Math.random() * commands.length)]);
      }, 2000);
    } else {
      setLastCommand("");
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30">
      <div className="flex items-center gap-3 mb-3">
        <Volume2 className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">{t('voice.title')}</h3>
        <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
          {t('common.beta')}
        </Badge>
      </div>
      
      <div className="space-y-3">
        <Button
          onClick={toggleListening}
          variant={isListening ? "destructive" : "secondary"}
          className="w-full"
        >
          {isListening ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
          {isListening ? t('common.stop') : t('common.activate')}
        </Button>
        
        {lastCommand && (
          <div className="p-3 bg-black/40 rounded-lg border border-purple-500/30">
            <p className="text-sm text-purple-300 mb-1">{t('voice.recognized')}</p>
            <p className="text-white font-medium">{lastCommand}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
