import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Lightbulb, Target, TrendingUp, Calendar, Clock, MapPin } from "lucide-react";

export default function InsightsPage() {
  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-primary/10 blur-3xl rounded-full" />
        <div className="relative">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Neural Intelligence Center
          </h1>
          <p className="text-cyan-400 text-lg">Advanced AI-powered migraine analysis and predictive insights</p>
          <div className="flex items-center gap-2 mt-4">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse-glow" />
            <span className="text-sm text-green-400 font-medium">AI Models Active • Real-time Analysis</span>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="velar-card border-primary/20 shadow-glow hover:shadow-primary/20 transition-all duration-300 group">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-primary rounded-lg group-hover:animate-pulse-glow">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="bg-gradient-primary bg-clip-text text-transparent">Neural Pattern Recognition</span>
            </CardTitle>
            <CardDescription className="text-cyan-400">Advanced AI analysis of your migraine patterns and triggers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold text-primary">Weekly Cycle Detected</h4>
                  <p className="text-sm text-foreground mt-1">
                    Your migraines follow a 5-7 day pattern, with 78% occurring on weekdays. 
                    This suggests stress-related triggers linked to work schedule.
                  </p>
                  <Badge className="mt-2 text-xs bg-primary/20 text-primary">92% Confidence</Badge>
                </div>
              </div>
            </div>

            <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-warning mt-1" />
                <div>
                  <h4 className="font-semibold text-warning">Afternoon Peak</h4>
                  <p className="text-sm text-foreground mt-1">
                    67% of episodes begin between 2-4 PM, coinciding with typical blood sugar dips. 
                    Consider afternoon snacks and hydration.
                  </p>
                  <Badge className="mt-2 text-xs bg-warning/20 text-warning">85% Confidence</Badge>
                </div>
              </div>
            </div>

            <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-success mt-1" />
                <div>
                  <h4 className="font-semibold text-success">Weather Sensitivity Map</h4>
                  <p className="text-sm text-foreground mt-1">
                    Barometric pressure drops below 1010 hPa trigger 73% of your weather-related episodes. 
                    6-hour advance warnings are optimal.
                  </p>
                  <Badge className="mt-2 text-xs bg-success/20 text-success">94% Confidence</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="velar-card border-cyan-400/20 shadow-glow hover:shadow-cyan-400/20 transition-all duration-300 group">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg group-hover:animate-pulse-glow">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Intelligent Recommendations</span>
            </CardTitle>
            <CardDescription className="text-cyan-400">AI-powered personalized strategies for migraine prevention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 border border-border/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-foreground">Sleep Schedule Optimization</h4>
                  <Badge variant="outline" className="text-xs">High Impact</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Maintain 7-8 hours sleep, especially before predicted high-risk days.
                </p>
                <Button variant="outline" size="sm" className="text-xs">
                  Set Sleep Reminders
                </Button>
              </div>

              <div className="p-3 border border-border/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-foreground">Hydration Protocol</h4>
                  <Badge variant="outline" className="text-xs">Medium Impact</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Increase water intake 2-3 hours before predicted weather changes.
                </p>
                <Button variant="outline" size="sm" className="text-xs">
                  Enable Hydration Alerts
                </Button>
              </div>

              <div className="p-3 border border-border/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-foreground">Stress Management</h4>
                  <Badge variant="outline" className="text-xs">High Impact</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Practice breathing exercises during 12-4 PM high-risk window.
                </p>
                <Button variant="outline" size="sm" className="text-xs">
                  Learn Techniques
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prediction Model */}
      <Card className="velar-card border-gradient-primary/30 shadow-2xl hover:shadow-primary/30 transition-all duration-500">
        <CardHeader className="pb-6 relative">
          <div className="absolute top-4 right-4 w-12 h-12 bg-gradient-primary/20 rounded-full animate-pulse-glow" />
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-3 bg-gradient-primary rounded-xl animate-pulse-glow">
              <Target className="w-7 h-7 text-white" />
            </div>
            <span className="bg-gradient-primary bg-clip-text text-transparent">Predictive AI Performance Matrix</span>
          </CardTitle>
          <CardDescription className="text-cyan-400 text-lg">Real-time accuracy metrics from our advanced neural networks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">92%</div>
              <div className="text-sm text-muted-foreground">Overall Accuracy</div>
              <div className="text-xs text-muted-foreground mt-1">Last 90 days</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-warning mb-2">87%</div>
              <div className="text-sm text-muted-foreground">Weather Predictions</div>
              <div className="text-xs text-muted-foreground mt-1">6-hour window</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-success mb-2">94%</div>
              <div className="text-sm text-muted-foreground">Pattern Recognition</div>
              <div className="text-xs text-muted-foreground mt-1">Personal triggers</div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-secondary/20 rounded-lg">
            <h4 className="font-semibold text-foreground mb-2">Model Improvements</h4>
            <p className="text-sm text-muted-foreground">
              Your prediction accuracy has improved by 15% this month as our AI learns more about your 
              unique patterns. The model becomes more accurate with each logged episode.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Trend Analysis */}
      <Card className="velar-card border-green-400/20 shadow-glow hover:shadow-green-400/20 transition-all duration-300 group">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg group-hover:animate-pulse-glow">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Neural Progress Analytics</span>
          </CardTitle>
          <CardDescription className="text-cyan-400">Advanced tracking of your migraine management evolution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">This Month's Achievements</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-success rounded-full" />
                  <span className="text-sm text-foreground">24% reduction in episode frequency</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-sm text-foreground">Improved sleep consistency by 18%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-warning rounded-full" />
                  <span className="text-sm text-foreground">Better weather trigger management</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Focus Areas</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-destructive rounded-full" />
                  <span className="text-sm text-foreground">Stress management during workdays</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-warning rounded-full" />
                  <span className="text-sm text-foreground">Afternoon hydration routine</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-sm text-foreground">Preventive medication timing</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}