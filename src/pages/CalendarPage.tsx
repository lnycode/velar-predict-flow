import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Filter, Loader2, CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [migraineEntries, setMigraineEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportDateRange, setExportDateRange] = useState<string>("30");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch real migraine entries from Supabase
  useEffect(() => {
    const fetchMigraineEntries = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('migraine_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setMigraineEntries(data || []);
      } catch (error) {
        console.error('Error fetching migraine entries:', error);
        toast({
          title: t('common.error'),
          description: t('calendar.errorLoadingEntries'),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMigraineEntries();
  }, [user, toast]);

  // Convert entries to calendar dates
  const migraineDays = migraineEntries
    .filter(entry => entry.created_at)
    .map(entry => new Date(entry.created_at));

  // Convert entries to EpisodeData format for PDF
  const episodeData: EpisodeData[] = migraineEntries.map(entry => {
    const date = entry.created_at ? new Date(entry.created_at) : new Date();
    const intensity = entry.intensity || entry.severity || 5;
    const severityLabel = intensity <= 3 ? 'Mild' : intensity <= 6 ? 'Moderate' : 'Severe';
    
    // Parse triggers from note field or use empty array
    const triggers = entry.note 
      ? entry.note.split(',').map((t: string) => t.trim()).filter(Boolean).slice(0, 3)
      : [];

    return {
      date: date.toISOString().split('T')[0],
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      severity: severityLabel,
      intensity: intensity,
      duration: entry.duration ? `${entry.duration} hours` : 'N/A',
      triggers: triggers.length > 0 ? triggers : ['Not specified'],
      location: entry.location || 'Not specified',
      notes: entry.note || ''
    };
  });

  // Get entries for selected date
  const selectedDateEntries = selectedDate 
    ? migraineEntries.filter(entry => {
        if (!entry.created_at) return false;
        const entryDate = new Date(entry.created_at);
        return entryDate.toDateString() === selectedDate.toDateString();
      })
    : [];

  // Get date range for export
  const getExportDateRange = (): { start: Date; end: Date; label: string } => {
    const end = endOfDay(new Date());
    
    if (exportDateRange === "custom" && customStartDate && customEndDate) {
      return {
        start: startOfDay(customStartDate),
        end: endOfDay(customEndDate),
        label: `${format(customStartDate, 'MMM d, yyyy')} - ${format(customEndDate, 'MMM d, yyyy')}`
      };
    }
    
    const days = parseInt(exportDateRange);
    const rangeLabels: Record<string, string> = {
      "7": "Last 7 Days",
      "30": "Last 30 Days",
      "60": "Last 60 Days",
      "90": "Last 3 Months",
      "180": "Last 6 Months",
      "365": "Last Year",
    };
    
    return {
      start: startOfDay(subDays(new Date(), days)),
      end: end,
      label: rangeLabels[exportDateRange] || `Last ${days} Days`
    };
  };

  // Filter episodes by date range
  const getFilteredEpisodes = (): EpisodeData[] => {
    const { start, end } = getExportDateRange();
    
    return episodeData.filter(ep => {
      const episodeDate = new Date(ep.date);
      return episodeDate >= start && episodeDate <= end;
    });
  };

  const handleExportPDF = async () => {
    const filteredData = getFilteredEpisodes();
    const { label: periodLabel } = getExportDateRange();
    
    if (filteredData.length === 0) {
      toast({
        title: t('calendar.noData'),
        description: t('calendar.noDataDesc', { period: periodLabel }),
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    setIsExportDialogOpen(false);
    
    try {
      const doc = new jsPDF();
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
    doc.text(periodLabel, 155, 19);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Doc ID:', 135, 26);
    doc.setFont('helvetica', 'normal');
    doc.text(`VLR-${Date.now().toString().slice(-8)}`, 155, 26);

    // === SUMMARY CARDS ===
    const cardY = 45;
    const cardWidth = 43;
    const cardHeight = 25;
    
    // Calculate stats from filtered data
    const totalEpisodes = filteredData.length;
    const avgIntensity = filteredData.reduce((sum, ep) => sum + ep.intensity, 0) / totalEpisodes;
    const severeCount = filteredData.filter(ep => ep.severity === 'Severe').length;
    const avgDuration = filteredData.reduce((sum, ep) => parseFloat(ep.duration) || 0, 0) / totalEpisodes;
    
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

    const tableData = filteredData.map((ep, i) => [
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
      'Mild (1-3)': filteredData.filter(ep => ep.intensity <= 3).length,
      'Moderate (4-6)': filteredData.filter(ep => ep.intensity >= 4 && ep.intensity <= 6).length,
      'Severe (7-10)': filteredData.filter(ep => ep.intensity >= 7).length,
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
    filteredData.forEach(ep => {
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
    
      doc.save(`velar-calendar-${periodLabel.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`);
      
      toast({
        title: t('calendar.reportExported'),
        description: t('calendar.reportExportedDesc', { count: filteredData.length, period: periodLabel }),
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: t('calendar.exportFailed'),
        description: t('calendar.exportFailedDesc'),
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('calendar.title')}</h1>
          <p className="text-muted-foreground">{t('calendar.subtitle')}</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            {t('calendar.filter')}
          </Button>
          <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={isExporting || isLoading}
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {t('calendar.exportPDF')}
              </Button>
            </DialogTrigger>
            <DialogContent className="velar-card border-border/50 sm:max-w-md">
              <DialogHeader className="text-center pb-4">
                <DialogTitle className="text-xl">{t('calendar.exportDialogTitle')}</DialogTitle>
                <DialogDescription className="text-center">{t('calendar.exportDialogDesc')}</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Date Range Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('calendar.dateRange')}</Label>
                  <Select value={exportDateRange} onValueChange={setExportDateRange}>
                    <SelectTrigger className="bg-background border-border/50 h-11">
                      <SelectValue placeholder={t('calendar.dateRange')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">{t('calendar.last7Days')}</SelectItem>
                      <SelectItem value="30">{t('calendar.last30Days')}</SelectItem>
                      <SelectItem value="60">{t('calendar.last60Days')}</SelectItem>
                      <SelectItem value="90">{t('calendar.last3Months')}</SelectItem>
                      <SelectItem value="180">{t('calendar.last6Months')}</SelectItem>
                      <SelectItem value="365">{t('calendar.lastYear')}</SelectItem>
                      <SelectItem value="custom">{t('calendar.customRange')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Custom Date Range */}
                {exportDateRange === "custom" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">{t('calendar.startDate')}</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full h-11 justify-center text-center font-normal",
                              !customStartDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customStartDate ? format(customStartDate, "PP") : <span>{t('calendar.pickStartDate')}</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="center">
                          <Calendar
                            mode="single"
                            selected={customStartDate}
                            onSelect={setCustomStartDate}
                            disabled={(date) => date > new Date()}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">{t('calendar.endDate')}</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full h-11 justify-center text-center font-normal",
                              !customEndDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customEndDate ? format(customEndDate, "PP") : <span>{t('calendar.pickEndDate')}</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="center">
                          <Calendar
                            mode="single"
                            selected={customEndDate}
                            onSelect={setCustomEndDate}
                            disabled={(date) => date > new Date() || (customStartDate && date < customStartDate)}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}

                {/* Episode Count Info Box */}
                <div className="p-4 bg-secondary/30 rounded-lg border border-border/30 text-center">
                  <p className="text-sm font-medium text-foreground">
                    {episodeData.length > 0 
                      ? t('calendar.episodesInRange', { count: getFilteredEpisodes().length })
                      : t('calendar.noEpisodesRecorded')}
                  </p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button 
                    onClick={() => setIsExportDialogOpen(false)} 
                    variant="outline" 
                    className="flex-1 h-11"
                  >
                    {t('calendar.cancel')}
                  </Button>
                  <Button 
                    onClick={handleExportPDF} 
                    className="flex-1 h-11 velar-button-primary"
                    disabled={
                      isExporting || 
                      (exportDateRange === "custom" && (!customStartDate || !customEndDate))
                    }
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('calendar.exporting')}
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        {t('calendar.exportReport')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddingEntry} onOpenChange={setIsAddingEntry}>
            <DialogTrigger asChild>
              <Button className="velar-button-primary" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                {t('calendar.addEntry')}
              </Button>
            </DialogTrigger>
            <DialogContent className="velar-card border-border/50">
              <DialogHeader>
                <DialogTitle>{t('calendar.logEpisode')}</DialogTitle>
                <DialogDescription>{t('calendar.logEpisodeDesc')}</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">{t('calendar.date')}</Label>
                    <Input id="date" type="date" className="bg-background border-border/50" />
                  </div>
                  <div>
                    <Label htmlFor="time">{t('calendar.time')}</Label>
                    <Input id="time" type="time" className="bg-background border-border/50" />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="severity">{t('calendar.severity')}</Label>
                  <Select>
                    <SelectTrigger className="bg-background border-border/50">
                      <SelectValue placeholder={t('calendar.selectSeverity')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mild">{t('calendar.mild')}</SelectItem>
                      <SelectItem value="moderate">{t('calendar.moderate')}</SelectItem>
                      <SelectItem value="severe">{t('calendar.severe')}</SelectItem>
                      <SelectItem value="debilitating">{t('calendar.debilitating')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="triggers">{t('calendar.triggers')}</Label>
                  <Input id="triggers" placeholder={t('calendar.triggersPlaceholder')} className="bg-background border-border/50" />
                </div>
                
                <div>
                  <Label htmlFor="notes">{t('calendar.notes')}</Label>
                  <Textarea id="notes" placeholder={t('calendar.notesPlaceholder')} className="bg-background border-border/50" />
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={() => setIsAddingEntry(false)} variant="outline" className="flex-1">
                    {t('calendar.cancel')}
                  </Button>
                  <Button onClick={() => setIsAddingEntry(false)} className="flex-1 velar-button-primary">
                    {t('calendar.saveEntry')}
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
              <CardTitle>{t('calendar.episodeCalendar')}</CardTitle>
              <CardDescription>{t('calendar.episodeCalendarDesc')}</CardDescription>
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
                  <span className="text-muted-foreground">{t('calendar.migraineDays')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary/20 border border-primary rounded" />
                  <span className="text-muted-foreground">{t('calendar.selected')}</span>
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
                {selectedDate ? selectedDate.toDateString() : t('calendar.selectDate')}
              </CardTitle>
              <CardDescription>{t('calendar.episodeDetails')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedDateEntries.length > 0 ? (
                selectedDateEntries.map((entry, index) => {
                  const intensity = entry.intensity || entry.severity || 5;
                  const severityLabel = intensity <= 3 ? t('calendar.mild') : intensity <= 6 ? t('calendar.moderate') : t('calendar.severe');
                  const time = entry.created_at 
                    ? new Date(entry.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : 'N/A';
                  const triggers = entry.note 
                    ? entry.note.split(',').map((t: string) => t.trim()).filter(Boolean).slice(0, 3)
                    : [];
                  
                  return (
                    <div key={entry.id || index} className="p-3 bg-secondary/30 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{time}</span>
                        <Badge variant={severityLabel === t('calendar.severe') ? 'destructive' : 'secondary'}>
                          {severityLabel} ({intensity}/10)
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t('calendar.duration')}: {entry.duration ? `${entry.duration} ${t('calendar.hours')}` : t('calendar.notSpecified')}
                      </p>
                      {entry.location && (
                        <p className="text-sm text-muted-foreground">{t('calendar.location')}: {entry.location}</p>
                      )}
                      {triggers.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {triggers.map((trigger: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {trigger}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {isLoading ? t('history.loading') : t('history.noEntriesRecorded')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Monthly Summary */}
          <Card className="velar-card border-border/50">
            <CardHeader>
              <CardTitle>{t('calendar.monthlySummary')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('calendar.totalEpisodes')}</span>
                <span className="font-semibold text-foreground">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('calendar.avgDuration')}</span>
                <span className="font-semibold text-foreground">3.2 {t('calendar.hours')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('calendar.mostCommonTrigger')}</span>
                <span className="font-semibold text-foreground">{t('triggers.weatherChanges')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('calendar.severityTrend')}</span>
                <span className="font-semibold text-success">{t('calendar.improving')}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}