import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Filter, Loader2, CalendarIcon, FileText, Clock, TrendingUp, ChevronRight } from "lucide-react";
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
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 18;
      const contentWidth = pageWidth - margin * 2;
      const reportDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      });
      const docId = `VLR-${Date.now().toString().slice(-8)}`;

      // Calculate stats
      const totalEpisodes = filteredData.length;
      const avgIntensity = totalEpisodes > 0 ? filteredData.reduce((sum, ep) => sum + ep.intensity, 0) / totalEpisodes : 0;
      const severeCount = filteredData.filter(ep => ep.severity === 'Severe').length;
      const moderateCount = filteredData.filter(ep => ep.severity === 'Moderate').length;
      const mildCount = filteredData.filter(ep => ep.severity === 'Mild').length;
      const avgDuration = totalEpisodes > 0 ? filteredData.reduce((sum, ep) => parseFloat(ep.duration) || 0, 0) / totalEpisodes : 0;

      // --- Reusable drawing helpers ---
      const drawSectionTitle = (title: string, yPos: number, underlineWidth = 40) => {
        doc.setFontSize(12);
        doc.setTextColor(...PDF_COLORS.primary);
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin, yPos);
        doc.setDrawColor(...PDF_COLORS.accent);
        doc.setLineWidth(0.8);
        doc.line(margin, yPos + 2.5, margin + underlineWidth, yPos + 2.5);
        // Subtle secondary line
        doc.setDrawColor(220, 225, 235);
        doc.setLineWidth(0.3);
        doc.line(margin + underlineWidth + 2, yPos + 2.5, pageWidth - margin, yPos + 2.5);
      };

      const drawPageHeader = () => {
        // Deep dark header
        doc.setFillColor(...PDF_COLORS.primary);
        doc.rect(0, 0, pageWidth, 46, 'F');

        // Accent stripe with gradient effect
        doc.setFillColor(...PDF_COLORS.accent);
        doc.rect(0, 46, pageWidth, 2, 'F');
        doc.setFillColor(99, 102, 241); // lighter indigo
        doc.rect(0, 48, pageWidth, 0.5, 'F');

        // Brand mark — geometric accent
        doc.setFillColor(79, 70, 229);
        doc.rect(margin, 8, 4, 18, 'F');

        // Brand name
        doc.setFontSize(26);
        doc.setTextColor(...PDF_COLORS.white);
        doc.setFont('helvetica', 'bold');
        doc.text('VELAR', margin + 8, 20);

        // Tagline
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(160, 175, 200);
        doc.text('Migraine Intelligence Platform', margin + 8, 26);

        // Report type badge
        doc.setFillColor(30, 41, 59);
        doc.roundedRect(margin, 32, 72, 9, 2, 2, 'F');
        doc.setFontSize(8);
        doc.setTextColor(...PDF_COLORS.white);
        doc.setFont('helvetica', 'bold');
        doc.text('⬛  CALENDAR REPORT', margin + 5, 38);

        // Right side — report metadata card
        const cardX = pageWidth - margin - 68;
        doc.setFillColor(30, 41, 59);
        doc.roundedRect(cardX, 6, 68, 34, 3, 3, 'F');
        // Inner border
        doc.setDrawColor(50, 60, 80);
        doc.setLineWidth(0.3);
        doc.roundedRect(cardX + 1, 7, 66, 32, 2.5, 2.5, 'S');

        doc.setFontSize(6.5);
        doc.setTextColor(130, 145, 170);
        doc.setFont('helvetica', 'normal');
        doc.text('REPORT DATE', cardX + 6, 14);
        doc.setFontSize(8);
        doc.setTextColor(...PDF_COLORS.white);
        doc.setFont('helvetica', 'bold');
        doc.text(reportDate, cardX + 6, 20);

        doc.setFontSize(6.5);
        doc.setTextColor(130, 145, 170);
        doc.setFont('helvetica', 'normal');
        doc.text('PERIOD', cardX + 6, 28);
        doc.setFontSize(8);
        doc.setTextColor(...PDF_COLORS.white);
        doc.setFont('helvetica', 'bold');
        doc.text(periodLabel, cardX + 6, 34);

        // Doc ID small
        doc.setFontSize(5.5);
        doc.setTextColor(90, 100, 120);
        doc.text(docId, cardX + 48, 14);
      };

      const drawPageFooter = (pageNum: number, totalPages: number) => {
        // Medical disclaimer
        doc.setFillColor(255, 251, 235);
        doc.setDrawColor(253, 230, 138);
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, pageHeight - 34, contentWidth, 12, 2, 2, 'FD');
        doc.setFontSize(5.5);
        doc.setTextColor(146, 64, 14);
        doc.setFont('helvetica', 'italic');
        doc.text(
          'MEDICAL DISCLAIMER: This report is generated from self-reported data and is intended as a decision support tool only. It does not constitute medical advice. Always consult a qualified healthcare professional.',
          pageWidth / 2, pageHeight - 27, { align: 'center', maxWidth: contentWidth - 12 }
        );

        // Footer bar
        doc.setDrawColor(210, 215, 225);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);

        doc.setFontSize(6.5);
        doc.setTextColor(...PDF_COLORS.muted);
        doc.setFont('helvetica', 'normal');
        doc.text('VELAR  •  Confidential Health Report', margin, pageHeight - 12);
        doc.text(`${docId}`, pageWidth / 2, pageHeight - 12, { align: 'center' });
        doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 12, { align: 'right' });

        // Bottom accent
        doc.setFillColor(...PDF_COLORS.accent);
        doc.rect(0, pageHeight - 3, pageWidth, 3, 'F');
      };

      // ==========================================
      // PAGE 1 — Executive Summary & Analysis
      // ==========================================
      drawPageHeader();
      let y = 58;

      // --- Patient / User Summary Bar ---
      doc.setFillColor(246, 248, 252);
      doc.setDrawColor(220, 225, 235);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');
      doc.setFontSize(8);
      doc.setTextColor(...PDF_COLORS.muted);
      doc.setFont('helvetica', 'normal');
      doc.text(`Report generated for authenticated user  •  ${totalEpisodes} episodes recorded  •  Period: ${periodLabel}`, margin + 6, y + 9);
      y += 22;

      // --- Executive Summary ---
      drawSectionTitle('Executive Summary', y, 38);
      y += 12;

      // KPI Cards
      const cardCount = 4;
      const cardGap = 5;
      const cardW = (contentWidth - cardGap * (cardCount - 1)) / cardCount;
      const cardH = 38;

      const cards = [
        { label: 'Total Episodes', value: totalEpisodes.toString(), subtitle: 'in period', color: PDF_COLORS.accent, icon: '◆' },
        { label: 'Avg Intensity', value: avgIntensity.toFixed(1), subtitle: 'out of 10', color: PDF_COLORS.warning, icon: '▲' },
        { label: 'Severe Episodes', value: severeCount.toString(), subtitle: `${totalEpisodes > 0 ? Math.round((severeCount / totalEpisodes) * 100) : 0}% of total`, color: PDF_COLORS.danger, icon: '●' },
        { label: 'Avg Duration', value: avgDuration.toFixed(1), subtitle: 'hours', color: PDF_COLORS.success, icon: '◷' },
      ];

      cards.forEach((card, i) => {
        const x = margin + i * (cardW + cardGap);

        // Card with subtle shadow effect (double rect)
        doc.setFillColor(240, 242, 248);
        doc.roundedRect(x + 0.5, y + 0.5, cardW, cardH, 3, 3, 'F');
        doc.setFillColor(...PDF_COLORS.white);
        doc.setDrawColor(220, 225, 235);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, y, cardW, cardH, 3, 3, 'FD');

        // Top color bar
        doc.setFillColor(...card.color);
        doc.roundedRect(x, y, cardW, 4, 3, 3, 'F');
        doc.setFillColor(...PDF_COLORS.white);
        doc.rect(x, y + 3, cardW, 2, 'F'); // clean bottom corners of bar

        // Value
        doc.setFontSize(20);
        doc.setTextColor(...card.color);
        doc.setFont('helvetica', 'bold');
        doc.text(card.value, x + cardW / 2, y + 18, { align: 'center' });

        // Label
        doc.setFontSize(7);
        doc.setTextColor(...PDF_COLORS.primary);
        doc.setFont('helvetica', 'bold');
        doc.text(card.label, x + cardW / 2, y + 26, { align: 'center' });

        // Subtitle
        doc.setFontSize(6.5);
        doc.setTextColor(...PDF_COLORS.muted);
        doc.setFont('helvetica', 'normal');
        doc.text(card.subtitle, x + cardW / 2, y + 32, { align: 'center' });
      });

      y += cardH + 14;

      // --- Severity Distribution ---
      drawSectionTitle('Severity Distribution', y, 40);
      y += 10;

      const severityBars = [
        { label: 'Mild (1–3)', count: mildCount, color: PDF_COLORS.success },
        { label: 'Moderate (4–6)', count: moderateCount, color: PDF_COLORS.warning },
        { label: 'Severe (7–10)', count: severeCount, color: PDF_COLORS.danger },
      ];
      const maxBarW = contentWidth - 80;
      const maxCount = Math.max(...severityBars.map(b => b.count), 1);

      severityBars.forEach((bar, i) => {
        const barY = y + i * 18;

        // Row background
        if (i % 2 === 0) {
          doc.setFillColor(250, 251, 253);
          doc.rect(margin, barY - 2, contentWidth, 16, 'F');
        }

        // Label
        doc.setFontSize(9);
        doc.setTextColor(...PDF_COLORS.primary);
        doc.setFont('helvetica', 'normal');
        doc.text(bar.label, margin + 4, barY + 8);

        // Track
        const trackX = margin + 48;
        doc.setFillColor(230, 232, 240);
        doc.roundedRect(trackX, barY + 2, maxBarW, 9, 3, 3, 'F');

        // Fill
        const fillW = Math.max((bar.count / maxCount) * maxBarW, 3);
        doc.setFillColor(...bar.color);
        doc.roundedRect(trackX, barY + 2, fillW, 9, 3, 3, 'F');

        // Count badge
        const pct = totalEpisodes > 0 ? Math.round((bar.count / totalEpisodes) * 100) : 0;
        doc.setFontSize(8);
        doc.setTextColor(...PDF_COLORS.primary);
        doc.setFont('helvetica', 'bold');
        doc.text(`${bar.count}`, trackX + maxBarW + 6, barY + 8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...PDF_COLORS.muted);
        doc.text(`(${pct}%)`, trackX + maxBarW + 14, barY + 8);
      });

      y += severityBars.length * 18 + 10;

      // --- Weekly Pattern Analysis ---
      drawSectionTitle('Weekly Pattern', y, 34);
      y += 10;

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayCounts = new Array(7).fill(0);
      filteredData.forEach(ep => {
        const dow = new Date(ep.date).getDay();
        dayCounts[dow]++;
      });
      const maxDayCount = Math.max(...dayCounts, 1);
      const cellW = (contentWidth - 6) / 7;
      const cellH = 28;

      dayNames.forEach((day, i) => {
        const x = margin + i * (cellW + 1);
        const count = dayCounts[i];
        const intensity = count / maxDayCount;

        // Cell background with heat intensity
        const r = Math.round(246 - intensity * 180);
        const g = Math.round(248 - intensity * 180);
        const b = Math.round(252 - intensity * 20);
        doc.setFillColor(r, g, b);
        doc.setDrawColor(220, 225, 235);
        doc.setLineWidth(0.2);
        doc.roundedRect(x, y, cellW, cellH, 2, 2, 'FD');

        // Day name
        doc.setFontSize(7);
        doc.setTextColor(...PDF_COLORS.muted);
        doc.setFont('helvetica', 'bold');
        doc.text(day, x + cellW / 2, y + 8, { align: 'center' });

        // Count
        doc.setFontSize(13);
        const textColor = intensity > 0.5 ? PDF_COLORS.white : PDF_COLORS.primary;
        doc.setTextColor(...textColor);
        doc.setFont('helvetica', 'bold');
        doc.text(count.toString(), x + cellW / 2, y + 21, { align: 'center' });
      });

      y += cellH + 12;

      // --- Top Triggers ---
      drawSectionTitle('Trigger Analysis', y, 34);
      y += 8;

      const triggerCounts: Record<string, number> = {};
      filteredData.forEach(ep => {
        ep.triggers.forEach(trigger => {
          triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
        });
      });
      const sortedTriggers = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

      if (sortedTriggers.length > 0) {
        const triggerTableData = sortedTriggers.map(([trigger, count], idx) => {
          const pct = Math.round((count / totalEpisodes) * 100);
          const significance = pct >= 40 ? 'High' : pct >= 20 ? 'Moderate' : 'Low';
          return [(idx + 1).toString(), trigger, count.toString(), `${pct}%`, significance];
        });

        autoTable(doc, {
          head: [['#', 'Trigger Factor', 'Count', 'Correlation', 'Significance']],
          body: triggerTableData,
          startY: y,
          margin: { left: margin, right: margin },
          tableWidth: contentWidth,
          styles: { fontSize: 8, cellPadding: 3.5, textColor: PDF_COLORS.primary, lineColor: [230, 232, 240], lineWidth: 0.15 },
          headStyles: {
            fillColor: PDF_COLORS.primary,
            textColor: PDF_COLORS.white,
            fontStyle: 'bold',
            fontSize: 8,
          },
          alternateRowStyles: { fillColor: [248, 249, 252] },
          columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            1: { cellWidth: 55 },
            2: { halign: 'center', cellWidth: 20 },
            3: { halign: 'center', cellWidth: 24 },
            4: { halign: 'center', cellWidth: 26 },
          },
          didParseCell: (data: any) => {
            if (data.section === 'body' && data.column.index === 4) {
              const val = data.cell.raw;
              if (val === 'High') data.cell.styles.textColor = PDF_COLORS.danger;
              else if (val === 'Moderate') data.cell.styles.textColor = PDF_COLORS.warning;
              else data.cell.styles.textColor = PDF_COLORS.success;
              data.cell.styles.fontStyle = 'bold';
            }
          },
        });
      }

      // ==========================================
      // PAGE 2 — Detailed Episode Log
      // ==========================================
      doc.addPage();
      drawPageHeader();
      y = 58;

      // User bar
      doc.setFillColor(246, 248, 252);
      doc.setDrawColor(220, 225, 235);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');
      doc.setFontSize(8);
      doc.setTextColor(...PDF_COLORS.muted);
      doc.setFont('helvetica', 'normal');
      doc.text(`Detailed Episode Log  •  ${totalEpisodes} entries  •  Sorted by date (newest first)`, margin + 6, y + 9);
      y += 22;

      drawSectionTitle('Episode Detail Log', y, 36);
      y += 10;

      const tableData = filteredData.map((ep, i) => [
        (i + 1).toString(),
        ep.date,
        ep.time,
        ep.severity,
        `${ep.intensity}/10`,
        ep.duration,
        ep.location || '—',
        ep.triggers.slice(0, 2).join(', '),
      ]);

      autoTable(doc, {
        head: [['#', 'Date', 'Time', 'Severity', 'Intensity', 'Duration', 'Location', 'Primary Triggers']],
        body: tableData,
        startY: y,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 8,
          cellPadding: 3.5,
          textColor: PDF_COLORS.primary,
          lineColor: [230, 232, 240],
          lineWidth: 0.15,
        },
        headStyles: {
          fillColor: PDF_COLORS.primary,
          textColor: PDF_COLORS.white,
          fontStyle: 'bold',
          fontSize: 8,
        },
        alternateRowStyles: { fillColor: [248, 249, 252] },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 22 },
          2: { cellWidth: 16, halign: 'center' },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 18, halign: 'center' },
          5: { cellWidth: 18, halign: 'center' },
          6: { cellWidth: 22 },
          7: { cellWidth: 42 },
        },
        didParseCell: (data: any) => {
          if (data.section === 'body' && data.column.index === 3) {
            const val = data.cell.raw;
            if (val === 'Severe') data.cell.styles.textColor = PDF_COLORS.danger;
            else if (val === 'Moderate') data.cell.styles.textColor = PDF_COLORS.warning;
            else data.cell.styles.textColor = PDF_COLORS.success;
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });

      // --- Notes section after table ---
      const tableEndY = (doc as any).lastAutoTable.finalY + 10;
      if (tableEndY < pageHeight - 80) {
        drawSectionTitle('Clinical Notes', tableEndY, 30);
        doc.setFillColor(248, 249, 252);
        doc.setDrawColor(220, 225, 235);
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, tableEndY + 6, contentWidth, 40, 3, 3, 'FD');

        doc.setFontSize(8);
        doc.setTextColor(...PDF_COLORS.primary);
        doc.setFont('helvetica', 'normal');
        const notes = [
          `• Episode frequency: ${totalEpisodes} episodes over the reporting period (avg ${(totalEpisodes / Math.max(parseInt(exportDateRange) || 30, 1) * 7).toFixed(1)}/week)`,
          `• Severity profile: ${severeCount} severe (${totalEpisodes > 0 ? Math.round((severeCount / totalEpisodes) * 100) : 0}%), ${moderateCount} moderate, ${mildCount} mild`,
          `• Average episode intensity: ${avgIntensity.toFixed(1)}/10 — Average duration: ${avgDuration.toFixed(1)} hours`,
          `• Most common trigger: ${sortedTriggers.length > 0 ? sortedTriggers[0][0] : 'N/A'} (${sortedTriggers.length > 0 ? sortedTriggers[0][1] : 0} occurrences)`,
          `• Recommendation: Review trigger patterns with healthcare provider for preventive strategies.`,
        ];
        notes.forEach((note, i) => {
          doc.text(note, margin + 6, tableEndY + 14 + i * 7, { maxWidth: contentWidth - 12 });
        });
      }

      // Draw footers on all pages
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        drawPageFooter(p, totalPages);
      }

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
            <DialogContent className="velar-card border-border/50 sm:max-w-lg p-0 overflow-hidden">
              {/* Professional Header with Gradient */}
              <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 border-b border-border/30">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
                <div className="relative flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-xl font-bold text-foreground mb-1">
                      {t('calendar.exportDialogTitle')}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground text-sm">
                      {t('calendar.exportDialogDesc')}
                    </DialogDescription>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Date Range Selection */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <Label className="text-sm font-semibold text-foreground">{t('calendar.dateRange')}</Label>
                  </div>
                  <Select value={exportDateRange} onValueChange={setExportDateRange}>
                    <SelectTrigger className="bg-secondary/30 border-border/50 h-12 rounded-lg hover:bg-secondary/50 transition-colors">
                      <SelectValue placeholder={t('calendar.dateRange')} />
                    </SelectTrigger>
                    <SelectContent className="border-border/50">
                      <SelectItem value="7" className="py-3">{t('calendar.last7Days')}</SelectItem>
                      <SelectItem value="30" className="py-3">{t('calendar.last30Days')}</SelectItem>
                      <SelectItem value="60" className="py-3">{t('calendar.last60Days')}</SelectItem>
                      <SelectItem value="90" className="py-3">{t('calendar.last3Months')}</SelectItem>
                      <SelectItem value="180" className="py-3">{t('calendar.last6Months')}</SelectItem>
                      <SelectItem value="365" className="py-3">{t('calendar.lastYear')}</SelectItem>
                      <SelectItem value="custom" className="py-3">{t('calendar.customRange')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Custom Date Range with improved styling */}
                {exportDateRange === "custom" && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/20 rounded-xl border border-border/30">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('calendar.startDate')}</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full h-11 justify-center text-center font-normal bg-background/50 hover:bg-background/80 transition-colors",
                              !customStartDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
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
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('calendar.endDate')}</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full h-11 justify-center text-center font-normal bg-background/50 hover:bg-background/80 transition-colors",
                              !customEndDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
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

                {/* Episode Count Info Box - Enhanced */}
                <div className="relative overflow-hidden rounded-xl border border-border/30 bg-gradient-to-br from-secondary/40 to-secondary/20">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Episodes Found</p>
                        <p className="text-2xl font-bold text-foreground">
                          {getFilteredEpisodes().length}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {episodeData.length > 0 
                          ? t('calendar.episodesInRange', { count: getFilteredEpisodes().length })
                          : t('calendar.noEpisodesRecorded')}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons - Professional styling */}
                <div className="flex gap-3 pt-2">
                  <Button 
                    onClick={() => setIsExportDialogOpen(false)} 
                    variant="outline" 
                    className="flex-1 h-12 rounded-lg border-border/50 hover:bg-secondary/50 transition-all"
                  >
                    {t('calendar.cancel')}
                  </Button>
                  <Button 
                    onClick={handleExportPDF} 
                    className="flex-1 h-12 rounded-lg velar-button-primary group"
                    disabled={
                      isExporting || 
                      (exportDateRange === "custom" && (!customStartDate || !customEndDate)) ||
                      getFilteredEpisodes().length === 0
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
                        <ChevronRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
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
                className="pointer-events-auto rounded-lg w-full"
                modifiers={{
                  migraine: migraineDays,
                }}
                modifiersClassNames={{
                  migraine: cn(
                    "bg-gradient-to-br from-destructive/30 to-destructive/20",
                    "text-destructive font-bold",
                    "border-2 border-destructive/50",
                    "shadow-md shadow-destructive/20",
                    "hover:from-destructive/40 hover:to-destructive/30",
                    "hover:border-destructive/70",
                    "hover:shadow-lg hover:shadow-destructive/30",
                    "relative",
                    "after:content-[''] after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2",
                    "after:w-1 after:h-1 after:rounded-full after:bg-destructive"
                  ),
                }}
              />
              
              {/* Legend */}
              <div className="mt-6 pt-4 border-t border-border/30 flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8 bg-gradient-to-br from-destructive/30 to-destructive/20 border-2 border-destructive/50 rounded-md shadow-sm shadow-destructive/20 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-destructive absolute bottom-0.5" />
                    <span className="text-xs font-bold text-destructive">12</span>
                  </div>
                  <span className="text-muted-foreground font-medium">{t('calendar.migraineDays')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-md ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg shadow-primary/25 flex items-center justify-center">
                    <span className="text-xs font-bold">15</span>
                  </div>
                  <span className="text-muted-foreground font-medium">{t('calendar.selected')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-accent/50 border border-accent rounded-md flex items-center justify-center">
                    <span className="text-xs font-semibold text-accent-foreground">26</span>
                  </div>
                  <span className="text-muted-foreground font-medium">{t('common.today')}</span>
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