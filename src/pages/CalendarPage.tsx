import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAddingEntry, setIsAddingEntry] = useState(false);

  // Mock migraine data
  const migraineDays = [
    new Date(2024, 0, 15),
    new Date(2024, 0, 18),
    new Date(2024, 0, 22),
    new Date(2024, 0, 28),
    new Date(2024, 1, 3),
    new Date(2024, 1, 8),
  ];

  const todaysEntries = [
    { time: '14:30', severity: 'Moderate', triggers: ['Weather change', 'Stress'], duration: '4 hours' },
    { time: '09:15', severity: 'Mild', triggers: ['Sleep deprivation'], duration: '2 hours' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Migraine Calendar</h1>
          <p className="text-muted-foreground">Track and analyze your migraine patterns</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Dialog open={isAddingEntry} onOpenChange={setIsAddingEntry}>
            <DialogTrigger asChild>
              <Button className="velar-button-primary" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="velar-card border-border/50">
              <DialogHeader>
                <DialogTitle>Log Migraine Episode</DialogTitle>
                <DialogDescription>Record details about your migraine episode</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" className="bg-background border-border/50" />
                  </div>
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input id="time" type="time" className="bg-background border-border/50" />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="severity">Severity</Label>
                  <Select>
                    <SelectTrigger className="bg-background border-border/50">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mild">Mild</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                      <SelectItem value="debilitating">Debilitating</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="triggers">Triggers</Label>
                  <Input id="triggers" placeholder="e.g., stress, weather, food" className="bg-background border-border/50" />
                </div>
                
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" placeholder="Additional details..." className="bg-background border-border/50" />
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={() => setIsAddingEntry(false)} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={() => setIsAddingEntry(false)} className="flex-1 velar-button-primary">
                    Save Entry
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card className="velar-card border-border/50">
            <CardHeader>
              <CardTitle>Episode Calendar</CardTitle>
              <CardDescription>Click on dates to view migraine episodes</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="pointer-events-auto rounded-lg"
                modifiers={{
                  migraine: migraineDays,
                }}
                modifiersStyles={{
                  migraine: {
                    backgroundColor: 'hsl(var(--destructive) / 0.2)',
                    color: 'hsl(var(--destructive))',
                    fontWeight: 'bold',
                  }
                }}
              />
              
              <div className="mt-4 flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-destructive/20 border border-destructive rounded" />
                  <span className="text-muted-foreground">Migraine days</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary/20 border border-primary rounded" />
                  <span className="text-muted-foreground">Selected</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Day Details */}
        <div className="space-y-6">
          <Card className="velar-card border-border/50">
            <CardHeader>
              <CardTitle>
                {selectedDate ? selectedDate.toDateString() : 'Select a Date'}
              </CardTitle>
              <CardDescription>Episode details for this day</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {todaysEntries.length > 0 ? (
                todaysEntries.map((entry, index) => (
                  <div key={index} className="p-3 bg-secondary/30 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{entry.time}</span>
                      <Badge variant={entry.severity === 'Severe' ? 'destructive' : 'secondary'}>
                        {entry.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Duration: {entry.duration}</p>
                    <div className="flex flex-wrap gap-1">
                      {entry.triggers.map((trigger, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {trigger}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No episodes recorded for this day
                </p>
              )}
            </CardContent>
          </Card>

          {/* Monthly Summary */}
          <Card className="velar-card border-border/50">
            <CardHeader>
              <CardTitle>Monthly Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Episodes</span>
                <span className="font-semibold text-foreground">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Avg Duration</span>
                <span className="font-semibold text-foreground">3.2 hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Most Common Trigger</span>
                <span className="font-semibold text-foreground">Weather</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Severity Trend</span>
                <span className="font-semibold text-success">Improving</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}