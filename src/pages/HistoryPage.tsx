import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Download, FileText, Search, Filter, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("all");

  // Mock historical data
  const migrainHistory = [
    {
      id: 1,
      date: "2024-01-28",
      time: "14:30",
      severity: "Moderate",
      duration: "4 hours",
      triggers: ["Weather change", "Stress"],
      location: "Temporal",
      medication: "Sumatriptan",
      weatherConditions: { temp: 18, humidity: 82, pressure: 1008 }
    },
    {
      id: 2,
      date: "2024-01-25",
      time: "09:15",
      severity: "Severe",
      duration: "6 hours",
      triggers: ["Sleep deprivation", "Bright lights"],
      location: "Frontal",
      medication: "Rizatriptan",
      weatherConditions: { temp: 22, humidity: 75, pressure: 1012 }
    },
    // ... more entries
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'mild': return 'bg-success/20 text-success';
      case 'moderate': return 'bg-warning/20 text-warning';
      case 'severe': return 'bg-destructive/20 text-destructive';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Migraine History</h1>
          <p className="text-muted-foreground">Comprehensive record of your migraine episodes</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button className="velar-button-primary" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Generate PDF Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="velar-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search episodes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-border/50"
              />
            </div>
            
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="bg-background border-border/50">
                <SelectValue placeholder="Time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="year">This year</SelectItem>
              </SelectContent>
            </Select>
            
            <Select>
              <SelectTrigger className="bg-background border-border/50">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All severities</SelectItem>
                <SelectItem value="mild">Mild</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="severe">Severe</SelectItem>
              </SelectContent>
            </Select>
            
            <Select>
              <SelectTrigger className="bg-background border-border/50">
                <SelectValue placeholder="Trigger type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All triggers</SelectItem>
                <SelectItem value="weather">Weather</SelectItem>
                <SelectItem value="stress">Stress</SelectItem>
                <SelectItem value="sleep">Sleep</SelectItem>
                <SelectItem value="food">Food</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="velar-card border-border/50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">47</div>
            <div className="text-sm text-muted-foreground">Total Episodes</div>
          </CardContent>
        </Card>
        <Card className="velar-card border-border/50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">3.2</div>
            <div className="text-sm text-muted-foreground">Avg Duration (hrs)</div>
          </CardContent>
        </Card>
        <Card className="velar-card border-border/50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">68%</div>
            <div className="text-sm text-muted-foreground">Weather Related</div>
          </CardContent>
        </Card>
        <Card className="velar-card border-border/50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-destructive">12%</div>
            <div className="text-sm text-muted-foreground">Trend (30d)</div>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card className="velar-card border-border/50">
        <CardHeader>
          <CardTitle>Episode History</CardTitle>
          <CardDescription>Detailed record of all migraine episodes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {migrainHistory.map((episode) => (
              <div key={episode.id} className="p-4 bg-secondary/20 rounded-lg border border-border/30">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{episode.date}</span>
                      <span className="text-sm text-muted-foreground">{episode.time}</span>
                    </div>
                    <Badge className={getSeverityColor(episode.severity)}>
                      {episode.severity}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Duration: {episode.duration}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Location</div>
                    <div className="text-sm font-medium text-foreground">{episode.location}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Medication</div>
                    <div className="text-sm font-medium text-foreground">{episode.medication}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Temperature</div>
                    <div className="text-sm font-medium text-foreground">{episode.weatherConditions.temp}°C</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Pressure</div>
                    <div className="text-sm font-medium text-foreground">{episode.weatherConditions.pressure} hPa</div>
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Triggers</div>
                  <div className="flex flex-wrap gap-1">
                    {episode.triggers.map((trigger, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {trigger}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex justify-center">
            <Button variant="outline">Load More Episodes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}