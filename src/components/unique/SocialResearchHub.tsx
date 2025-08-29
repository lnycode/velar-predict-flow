import { useState } from "react";
import { Users, Share, Trophy, Globe } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

export function SocialResearchHub() {
  const [contributionPoints, setContributionPoints] = useState(1247);
  const [researchRank, setResearchRank] = useState("Gold Contributor");

  const achievements = [
    { name: "Data Pioneer", points: 500, unlocked: true },
    { name: "Pattern Hunter", points: 750, unlocked: true },
    { name: "Research Champion", points: 1000, unlocked: true },
    { name: "Neural Network Hero", points: 1500, unlocked: false }
  ];

  const handleShareAnonymousData = () => {
    setContributionPoints(prev => prev + 25);
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-amber-900/20 to-orange-900/20 border-amber-500/30">
      <div className="flex items-center gap-3 mb-4">
        <Globe className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-semibold text-white">Forschungs-Community</h3>
        <Badge variant="secondary" className="bg-amber-500/20 text-amber-300">
          GLOBAL
        </Badge>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-300">Dein Rang</p>
            <p className="text-lg font-bold text-amber-400">{researchRank}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-300">Forschungspunkte</p>
            <p className="text-2xl font-bold text-white">{contributionPoints}</p>
          </div>
        </div>
        
        <Progress value={(contributionPoints % 500) / 5} className="w-full" />
        <p className="text-xs text-gray-400 text-center">
          {500 - (contributionPoints % 500)} Punkte bis zum nächsten Level
        </p>
        
        <Separator className="bg-amber-500/20" />
        
        <Button 
          onClick={handleShareAnonymousData}
          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
        >
          <Share className="w-4 h-4 mr-2" />
          Anonyme Daten teilen (+25 Punkte)
        </Button>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-white">Erfolge</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {achievements.map((achievement, index) => (
              <div 
                key={index}
                className={`p-2 rounded-lg border ${
                  achievement.unlocked 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
                    : 'bg-gray-800/50 border-gray-600/30 text-gray-500'
                }`}
              >
                <p className="text-xs font-medium">{achievement.name}</p>
                <p className="text-xs">{achievement.points}pts</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-black/40 p-3 rounded-lg border border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-white">Community Impact</span>
          </div>
          <p className="text-xs text-gray-300">
            Deine anonymen Daten haben bereits 127 anderen Nutzern geholfen, 
            bessere Vorhersagen zu erhalten.
          </p>
        </div>
      </div>
    </Card>
  );
}