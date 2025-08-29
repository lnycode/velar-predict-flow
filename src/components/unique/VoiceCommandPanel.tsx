import { useState } from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function VoiceCommandPanel() {
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState("");

  const toggleListening = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setLastCommand("Bereit für Sprachbefehl...");
      // Simulate voice recognition
      setTimeout(() => {
        const commands = [
          "Neuen Migräne-Eintrag erstellen",
          "Zeige meine Statistiken",
          "Wie ist mein Risiko heute?",
          "Öffne Kalender"
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
        <h3 className="text-lg font-semibold text-white">Sprach-KI</h3>
        <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
          BETA
        </Badge>
      </div>
      
      <div className="space-y-3">
        <Button
          onClick={toggleListening}
          variant={isListening ? "destructive" : "secondary"}
          className="w-full"
        >
          {isListening ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
          {isListening ? "Stoppen" : "Aktivieren"}
        </Button>
        
        {lastCommand && (
          <div className="p-3 bg-black/40 rounded-lg border border-purple-500/30">
            <p className="text-sm text-purple-300 mb-1">Erkannt:</p>
            <p className="text-white font-medium">{lastCommand}</p>
          </div>
        )}
      </div>
    </Card>
  );
}