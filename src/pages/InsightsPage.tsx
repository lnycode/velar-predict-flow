import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Lightbulb, Target, TrendingUp, Calendar, Clock, MapPin } from "lucide-react";

export default function InsightsPage() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Insights & Recommendations</h1>
        <p className="text-muted-foreground">Personalized intelligence powered by machine learning</p>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="velar-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Pattern Recognition
            </CardTitle>
            <CardDescription>AI-detected patterns in your migraine data</CardDescription>
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

        <Card className="velar-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-warning" />
              Smart Recommendations
            </CardTitle>
            <CardDescription>Personalized suggestions to reduce migraine frequency</CardDescription>
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
      <Card className="velar-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            AI Prediction Model Performance
          </CardTitle>
          <CardDescription>How accurately our AI predicts your migraines</CardDescription>
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
      <Card className="velar-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-success" />
            Progress Tracking
          </CardTitle>
          <CardDescription>Your migraine management journey</CardDescription>
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