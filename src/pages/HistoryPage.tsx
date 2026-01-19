import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, FileText, Search, Filter, Calendar, Stethoscope, User, CalendarDays, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { generateMigrainePDF, MigrainEpisode } from "@/utils/pdfExport";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, subMonths, isAfter, parseISO } from "date-fns";

function HistoryPageComponent() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [migrainHistory, setMigrainHistory] = useState<MigrainEpisode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEpisodes: 0,
    avgDuration: 0,
    weatherRelated: 0,
    monthlyTrend: 0
  });
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [physicianName, setPhysicianName] = useState("");
  const [reportPeriod, setReportPeriod] = useState("30");

  const loadMigraineHistory = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data: entries, error } = await supabase
        .from('migraine_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const episodes: MigrainEpisode[] = (entries || []).map((entry, index) => {
        const createdAt = new Date(entry.created_at || '');
        const severity = entry.severity || entry.intensity || 5;
        let severityText = t('common.moderate');
        if (severity <= 3) severityText = t('common.mild');
        else if (severity >= 7) severityText = t('common.severe');

        const triggers: string[] = [];
        if (entry.trigger_detected) triggers.push(t('triggers.triggerDetected'));
        if (entry.note) {
          const noteLower = entry.note.toLowerCase();
          if (noteLower.includes('stress')) triggers.push(t('triggers.stress'));
          if (noteLower.includes('sleep') || noteLower.includes('müde') || noteLower.includes('tired')) triggers.push(t('triggers.sleep'));
          if (noteLower.includes('weather') || noteLower.includes('wetter')) triggers.push(t('triggers.weather'));
          if (noteLower.includes('food') || noteLower.includes('essen')) triggers.push(t('triggers.food'));
        }
        if (entry.pressure) triggers.push(t('triggers.pressureChange'));

        return {
          id: index + 1,
          date: format(createdAt, 'yyyy-MM-dd'),
          time: format(createdAt, 'HH:mm'),
          severity: severityText,
          duration: `${entry.duration || 2}h`,
          triggers: triggers.length > 0 ? triggers : [t('common.unknown')],
          location: entry.location || t('common.unknown'),
          medication: entry.medication_taken || t('common.unknown'),
          weatherConditions: {
            temp: entry.temperature || 20,
            humidity: entry.humidity || 50,
            pressure: entry.pressure || 1013
          }
        };
      });

      setMigrainHistory(episodes);

      const totalEpisodes = episodes.length;
      const avgDuration = episodes.length > 0 
        ? Math.round(episodes.reduce((sum, e) => sum + parseInt(e.duration), 0) / episodes.length * 10) / 10
        : 0;
      
      const weatherRelated = episodes.length > 0
        ? Math.round(episodes.filter(e => 
            e.triggers.includes(t('triggers.weather')) || 
            e.triggers.includes(t('triggers.pressureChange'))
          ).length / episodes.length * 100)
        : 0;

      const now = new Date();
      const thisMonthEntries = entries?.filter(e => {
        const date = new Date(e.created_at || '');
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).length || 0;

      const lastMonthEntries = entries?.filter(e => {
        const date = new Date(e.created_at || '');
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
        return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
      }).length || 0;

      const monthlyTrend = lastMonthEntries > 0 
        ? Math.round(((thisMonthEntries - lastMonthEntries) / lastMonthEntries) * 100)
        : 0;

      setStats({
        totalEpisodes,
        avgDuration,
        weatherRelated,
        monthlyTrend
      });

    } catch (error) {
      console.error('Error loading migraine history:', error);
      toast.error(t('history.failedToLoadHistory'));
    } finally {
      setIsLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    if (user) {
      loadMigraineHistory();
    }
  }, [user, loadMigraineHistory]);

  const filteredEpisodes = useMemo(() => {
    let filtered = [...migrainHistory];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(e => 
        e.location.toLowerCase().includes(term) ||
        e.medication.toLowerCase().includes(term) ||
        e.triggers.some(t => t.toLowerCase().includes(term))
      );
    }

    if (filterPeriod !== 'all') {
      const now = new Date();
      let cutoffDate: Date;
      
      switch (filterPeriod) {
        case '30days':
          cutoffDate = subDays(now, 30);
          break;
        case '90days':
          cutoffDate = subDays(now, 90);
          break;
        case 'year':
          cutoffDate = subMonths(now, 12);
          break;
        default:
          cutoffDate = new Date(0);
      }
      
      filtered = filtered.filter(e => isAfter(parseISO(e.date), cutoffDate));
    }

    if (filterSeverity !== 'all') {
      filtered = filtered.filter(e => e.severity.toLowerCase() === filterSeverity);
    }

    return filtered;
  }, [migrainHistory, searchTerm, filterPeriod, filterSeverity]);

  const handleExportPDF = useCallback(() => {
    try {
      if (filteredEpisodes.length === 0) {
        toast.error(t('history.noEpisodesToExport'));
        return;
      }

      generateMigrainePDF(filteredEpisodes, parseInt(reportPeriod), {
        name: patientName || "Patient Name",
        dateOfBirth: dateOfBirth || "Not Provided",
        physicianName: physicianName || undefined,
      });
      toast.success(t('history.reportGenerated'));
      setReportDialogOpen(false);
    } catch (error) {
      toast.error(t('history.failedToGenerateReport'));
      console.error(error);
    }
  }, [filteredEpisodes, reportPeriod, patientName, dateOfBirth, physicianName, t]);

  const handleExportCSV = useCallback(() => {
    try {
      if (filteredEpisodes.length === 0) {
        toast.error(t('history.noEpisodesToExport'));
        return;
      }

      const csvContent = [
        ['Date', 'Time', 'Severity', 'Duration', 'Triggers', 'Location', 'Medication', 'Temperature', 'Humidity', 'Pressure'],
        ...filteredEpisodes.map(episode => [
          episode.date,
          episode.time,
          episode.severity,
          episode.duration,
          episode.triggers.join('; '),
          episode.location,
          episode.medication,
          `${episode.weatherConditions.temp}°C`,
          `${episode.weatherConditions.humidity}%`,
          `${episode.weatherConditions.pressure} hPa`
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `velar-migraine-data-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success(t('history.csvExported'));
    } catch (error) {
      toast.error(t('history.failedToExportCSV'));
      console.error(error);
    }
  }, [filteredEpisodes, t]);

  const getSeverityColor = useCallback((severity: string) => {
    const lowerSeverity = severity.toLowerCase();
    if (lowerSeverity === 'mild' || lowerSeverity === t('common.mild').toLowerCase()) 
      return 'bg-success/20 text-success';
    if (lowerSeverity === 'moderate' || lowerSeverity === t('common.moderate').toLowerCase()) 
      return 'bg-warning/20 text-warning';
    if (lowerSeverity === 'severe' || lowerSeverity === t('common.severe').toLowerCase()) 
      return 'bg-destructive/20 text-destructive';
    return 'bg-muted/20 text-muted-foreground';
  }, [t]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('history.title')}</h1>
          <p className="text-muted-foreground">{t('history.subtitle')}</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            {t('history.exportCSV')}
          </Button>
          
          <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
            <DialogTrigger asChild>
              <Button className="velar-button-primary" size="sm">
                <Stethoscope className="w-4 h-4 mr-2" />
                {t('history.healthcareReport')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  {t('history.generateReport')}
                </DialogTitle>
                <DialogDescription>
                  {t('history.reportDescription')}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="patientName" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {t('history.patientName')}
                  </Label>
                  <Input
                    id="patientName"
                    placeholder={t('history.enterFullName')}
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="dob" className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    {t('history.dateOfBirth')}
                  </Label>
                  <Input
                    id="dob"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="physician" className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4" />
                    {t('history.attendingPhysician')}
                  </Label>
                  <Input
                    id="physician"
                    placeholder="Dr. Name"
                    value={physicianName}
                    onChange={(e) => setPhysicianName(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="period">{t('history.reportPeriod')}</Label>
                  <Select value={reportPeriod} onValueChange={setReportPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('history.selectPeriod')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">{t('history.last30Days')}</SelectItem>
                      <SelectItem value="60">{t('history.last60Days')}</SelectItem>
                      <SelectItem value="90">{t('history.last90Days')}</SelectItem>
                      <SelectItem value="180">{t('history.last6Months')}</SelectItem>
                      <SelectItem value="365">{t('history.lastYear')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <h4 className="font-medium text-sm text-primary mb-1">{t('history.reportContents')}</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• {t('history.executiveSummary')}</li>
                    <li>• {t('history.monthlyPatterns')}</li>
                    <li>• {t('history.triggerCorrelation')}</li>
                    <li>• {t('history.treatmentEffectiveness')}</li>
                    <li>• {t('history.weatherCorrelations')}</li>
                    <li>• {t('history.detailedLog')}</li>
                    <li>• {t('history.clinicalObservations')}</li>
                  </ul>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleExportPDF} className="velar-button-primary">
                  <FileText className="w-4 h-4 mr-2" />
                  {t('history.generateReportBtn')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="velar-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            {t('history.filtersSearch')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('history.searchEpisodes')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-border/50"
              />
            </div>
            
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="bg-background border-border/50">
                <SelectValue placeholder={t('history.timePeriod')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('history.allTime')}</SelectItem>
                <SelectItem value="30days">{t('history.last30Days')}</SelectItem>
                <SelectItem value="90days">{t('history.last90Days')}</SelectItem>
                <SelectItem value="year">{t('history.thisYear')}</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="bg-background border-border/50">
                <SelectValue placeholder={t('history.severity')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('history.allSeverities')}</SelectItem>
                <SelectItem value="mild">{t('common.mild')}</SelectItem>
                <SelectItem value="moderate">{t('common.moderate')}</SelectItem>
                <SelectItem value="severe">{t('common.severe')}</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="text-sm text-muted-foreground flex items-center">
              {t('history.showingEpisodes', { filtered: filteredEpisodes.length, total: migrainHistory.length })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="velar-card border-border/50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{stats.totalEpisodes}</div>
            <div className="text-sm text-muted-foreground">{t('history.totalEpisodes')}</div>
          </CardContent>
        </Card>
        <Card className="velar-card border-border/50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">{stats.avgDuration}h</div>
            <div className="text-sm text-muted-foreground">{t('history.avgDuration')}</div>
          </CardContent>
        </Card>
        <Card className="velar-card border-border/50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">{stats.weatherRelated}%</div>
            <div className="text-sm text-muted-foreground">{t('history.weatherRelated')}</div>
          </CardContent>
        </Card>
        <Card className="velar-card border-border/50">
          <CardContent className="p-4">
            <div className={`text-2xl font-bold ${stats.monthlyTrend <= 0 ? 'text-success' : 'text-destructive'}`}>
              {stats.monthlyTrend > 0 ? '+' : ''}{stats.monthlyTrend}%
            </div>
            <div className="text-sm text-muted-foreground">{t('history.trend30d')}</div>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card className="velar-card border-border/50">
        <CardHeader>
          <CardTitle>{t('history.episodeHistory')}</CardTitle>
          <CardDescription>{t('history.detailedRecord')}</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEpisodes.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                {migrainHistory.length === 0 ? t('history.noEpisodesRecorded') : t('history.noMatchingFilters')}
              </h3>
              <p className="text-muted-foreground">
                {migrainHistory.length === 0 
                  ? t('history.startLogging')
                  : t('history.adjustFilters')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEpisodes.map((episode) => (
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
                      {t('history.duration')}: {episode.duration}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                    <div>
                      <div className="text-xs text-muted-foreground">{t('history.location')}</div>
                      <div className="text-sm font-medium text-foreground">{episode.location}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">{t('history.medication')}</div>
                      <div className="text-sm font-medium text-foreground">{episode.medication}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">{t('history.temperature')}</div>
                      <div className="text-sm font-medium text-foreground">{episode.weatherConditions.temp}°C</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">{t('history.pressure')}</div>
                      <div className="text-sm font-medium text-foreground">{episode.weatherConditions.pressure} hPa</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">{t('triggers.stress').split(' ')[0]}s</div>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default memo(HistoryPageComponent);