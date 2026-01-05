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
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Professional color palette
const PDF_COLORS = {
  primary: [15, 23, 42] as [number, number, number],       // Slate 900
  accent: [79, 70, 229] as [number, number, number],       // Indigo
  secondary: [51, 65, 85] as [number, number, number],     // Slate 700
  muted: [100, 116, 139] as [number, number, number],      // Slate 500
  light: [241, 245, 249] as [number, number, number],      // Slate 100
  white: [255, 255, 255] as [number, number, number],
  success: [16, 185, 129] as [number, number, number],
  warning: [245, 158, 11] as [number, number, number],
  danger: [239, 68, 68] as [number, number, number],
};

interface EpisodeData {
  date: string;
  time: string;
  severity: string;
  intensity: number;
  duration: string;
  triggers: string[];
  location?: string;
  notes?: string;
}

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const { toast } = useToast();

  // Mock migraine data with intensity
  const migraineDays = [
    new Date(2024, 0, 15),
    new Date(2024, 0, 18),
    new Date(2024, 0, 22),
    new Date(2024, 0, 28),
    new Date(2024, 1, 3),
    new Date(2024, 1, 8),
  ];

  // Enhanced episode data
  const episodeData: EpisodeData[] = [
    { date: '2024-01-15', time: '14:30', severity: 'Moderate', intensity: 6, duration: '4 hours', triggers: ['Weather change', 'Stress'], location: 'Frontal' },
    { date: '2024-01-18', time: '09:15', severity: 'Mild', intensity: 3, duration: '2 hours', triggers: ['Sleep deprivation'], location: 'Right temple' },
    { date: '2024-01-22', time: '16:45', severity: 'Severe', intensity: 8, duration: '6 hours', triggers: ['Bright lights', 'Noise'], location: 'Bilateral' },
    { date: '2024-01-28', time: '11:00', severity: 'Moderate', intensity: 5, duration: '3 hours', triggers: ['Skipped meal'], location: 'Left temple' },
    { date: '2024-02-03', time: '08:30', severity: 'Mild', intensity: 4, duration: '2 hours', triggers: ['Caffeine withdrawal'], location: 'Frontal' },
    { date: '2024-02-08', time: '19:00', severity: 'Severe', intensity: 9, duration: '8 hours', triggers: ['Barometric pressure', 'Stress'], location: 'Bilateral' },
  ];

  const todaysEntries = [
    { time: '14:30', severity: 'Moderate', triggers: ['Weather change', 'Stress'], duration: '4 hours' },
    { time: '09:15', severity: 'Mild', triggers: ['Sleep deprivation'], duration: '2 hours' },
  ];

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const currentMonth = selectedDate 
      ? selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) 
      : new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const reportDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // === HEADER ===
    doc.setFillColor(...PDF_COLORS.primary);
    doc.rect(0, 0, 210, 35, 'F');
    
    // Logo/Brand
    doc.setFontSize(20);
    doc.setTextColor(...PDF_COLORS.white);
    doc.setFont('helvetica', 'bold');
    doc.text('VELAR', 15, 15);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Decision Support Tool', 15, 21);
    
    // Report title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('MIGRAINE CALENDAR REPORT', 15, 30);
    
    // Report info box
    doc.setFillColor(...PDF_COLORS.white);
    doc.roundedRect(130, 5, 65, 25, 2, 2, 'F');
    
    doc.setFontSize(7);
    doc.setTextColor(...PDF_COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('Generated:', 135, 12);
    doc.setFont('helvetica', 'normal');
    doc.text(reportDate, 155, 12);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Period:', 135, 19);
    doc.setFont('helvetica', 'normal');
    doc.text(currentMonth, 155, 19);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Doc ID:', 135, 26);
    doc.setFont('helvetica', 'normal');
    doc.text(`VLR-${Date.now().toString().slice(-8)}`, 155, 26);

    // === SUMMARY CARDS ===
    const cardY = 45;
    const cardWidth = 43;
    const cardHeight = 25;
    
    // Calculate stats
    const totalEpisodes = episodeData.length;
    const avgIntensity = episodeData.reduce((sum, ep) => sum + ep.intensity, 0) / totalEpisodes;
    const severeCount = episodeData.filter(ep => ep.severity === 'Severe').length;
    const avgDuration = episodeData.reduce((sum, ep) => parseFloat(ep.duration) || 0, 0) / totalEpisodes;
    
    const cards = [
      { label: 'Total Episodes', value: totalEpisodes.toString(), color: PDF_COLORS.accent },
      { label: 'Avg. Intensity', value: avgIntensity.toFixed(1) + '/10', color: PDF_COLORS.warning },
      { label: 'Severe Episodes', value: severeCount.toString(), color: PDF_COLORS.danger },
      { label: 'Avg. Duration', value: avgDuration.toFixed(1) + 'h', color: PDF_COLORS.success },
    ];
    
    cards.forEach((card, i) => {
      const x = 15 + (i * (cardWidth + 3));
      
      // Card background
      doc.setFillColor(...PDF_COLORS.light);
      doc.setDrawColor(...card.color);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, cardY, cardWidth, cardHeight, 2, 2, 'FD');
      
      // Top accent
      doc.setFillColor(...card.color);
      doc.rect(x, cardY, cardWidth, 3, 'F');
      
      // Value
      doc.setFontSize(14);
      doc.setTextColor(...card.color);
      doc.setFont('helvetica', 'bold');
      doc.text(card.value, x + cardWidth / 2, cardY + 14, { align: 'center' });
      
      // Label
      doc.setFontSize(7);
      doc.setTextColor(...PDF_COLORS.muted);
      doc.setFont('helvetica', 'normal');
      doc.text(card.label, x + cardWidth / 2, cardY + 21, { align: 'center' });
    });

    // === EPISODE DETAILS TABLE ===
    doc.setFontSize(11);
    doc.setTextColor(...PDF_COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('EPISODE DETAILS', 15, 82);
    
    doc.setDrawColor(...PDF_COLORS.accent);
    doc.setLineWidth(0.8);
    doc.line(15, 84, 55, 84);

    const tableData = episodeData.map((ep, i) => [
      (i + 1).toString(),
      ep.date,
      ep.time,
      ep.severity,
      `${ep.intensity}/10`,
      ep.duration,
      ep.location || '-',
      ep.triggers.slice(0, 2).join(', ')
    ]);

    autoTable(doc, {
      head: [['#', 'Date', 'Time', 'Severity', 'Intensity', 'Duration', 'Location', 'Triggers']],
      body: tableData,
      startY: 88,
      margin: { left: 15, right: 15 },
      styles: { 
        fontSize: 8, 
        cellPadding: 3,
        textColor: PDF_COLORS.primary
      },
      headStyles: { 
        fillColor: PDF_COLORS.primary, 
        textColor: PDF_COLORS.white,
        fontStyle: 'bold',
        fontSize: 8
      },
      alternateRowStyles: { fillColor: PDF_COLORS.light },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 22 },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 18, halign: 'center' },
        6: { cellWidth: 22 },
        7: { cellWidth: 45 }
      }
    });

    const tableEndY = (doc as any).lastAutoTable.finalY + 10;

    // === INTENSITY DISTRIBUTION ===
    doc.setFontSize(11);
    doc.setTextColor(...PDF_COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('INTENSITY DISTRIBUTION', 15, tableEndY);
    
    doc.setDrawColor(...PDF_COLORS.accent);
    doc.setLineWidth(0.8);
    doc.line(15, tableEndY + 2, 62, tableEndY + 2);

    // Simple intensity bar chart
    const intensityGroups = {
      'Mild (1-3)': episodeData.filter(ep => ep.intensity <= 3).length,
      'Moderate (4-6)': episodeData.filter(ep => ep.intensity >= 4 && ep.intensity <= 6).length,
      'Severe (7-10)': episodeData.filter(ep => ep.intensity >= 7).length,
    };

    const barY = tableEndY + 8;
    const barHeight = 8;
    const maxBarWidth = 80;
    const maxCount = Math.max(...Object.values(intensityGroups), 1);
    
    Object.entries(intensityGroups).forEach(([label, count], i) => {
      const y = barY + (i * 14);
      const barWidth = (count / maxCount) * maxBarWidth;
      const color = i === 0 ? PDF_COLORS.success : i === 1 ? PDF_COLORS.warning : PDF_COLORS.danger;
      
      // Label
      doc.setFontSize(8);
      doc.setTextColor(...PDF_COLORS.primary);
      doc.setFont('helvetica', 'normal');
      doc.text(label, 15, y + 6);
      
      // Bar background
      doc.setFillColor(...PDF_COLORS.light);
      doc.roundedRect(55, y, maxBarWidth, barHeight, 1, 1, 'F');
      
      // Bar fill
      if (barWidth > 0) {
        doc.setFillColor(...color);
        doc.roundedRect(55, y, barWidth, barHeight, 1, 1, 'F');
      }
      
      // Count
      doc.setFontSize(8);
      doc.setTextColor(...PDF_COLORS.primary);
      doc.setFont('helvetica', 'bold');
      doc.text(count.toString(), 140, y + 6);
    });

    // === TRIGGER ANALYSIS ===
    const triggerY = barY + 50;
    doc.setFontSize(11);
    doc.setTextColor(...PDF_COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('TOP TRIGGERS', 15, triggerY);
    
    doc.setDrawColor(...PDF_COLORS.accent);
    doc.setLineWidth(0.8);
    doc.line(15, triggerY + 2, 45, triggerY + 2);

    // Count triggers
    const triggerCounts: Record<string, number> = {};
    episodeData.forEach(ep => {
      ep.triggers.forEach(trigger => {
        triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
      });
    });
    
    const sortedTriggers = Object.entries(triggerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    sortedTriggers.forEach(([trigger, count], i) => {
      const y = triggerY + 8 + (i * 6);
      doc.setFontSize(8);
      doc.setTextColor(...PDF_COLORS.primary);
      doc.setFont('helvetica', 'normal');
      doc.text(`• ${trigger}`, 20, y);
      doc.setFont('helvetica', 'bold');
      doc.text(`${count}x`, 100, y);
    });

    // === FOOTER ===
    const pageHeight = doc.internal.pageSize.height;
    
    // Disclaimer box
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(15, pageHeight - 35, 180, 12, 2, 2, 'F');
    
    doc.setFontSize(7);
    doc.setTextColor(...PDF_COLORS.secondary);
    doc.setFont('helvetica', 'bold');
    doc.text('DECISION SUPPORT NOTICE', 20, pageHeight - 28);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'This report is based on user-reported data and is intended to support awareness and preparation, not to replace medical advice.',
      20, 
      pageHeight - 23
    );

    // Footer line
    doc.setDrawColor(...PDF_COLORS.light);
    doc.setLineWidth(0.5);
    doc.line(15, pageHeight - 18, 195, pageHeight - 18);
    
    doc.setFontSize(7);
    doc.setTextColor(...PDF_COLORS.muted);
    doc.text('VELAR Calendar Report', 15, pageHeight - 12);
    doc.text('Confidential - For Personal Use', 15, pageHeight - 8);
    doc.text(`Generated: ${new Date().toISOString()}`, 195, pageHeight - 12, { align: 'right' });
    doc.text('Page 1 of 1', 195, pageHeight - 8, { align: 'right' });
    
    doc.save(`velar-calendar-${currentMonth.toLowerCase().replace(' ', '-')}.pdf`);
    
    toast({
      title: "Report Exported",
      description: "Professional calendar report has been generated.",
    });
  };

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
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
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