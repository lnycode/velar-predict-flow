import { useState, useEffect, useCallback, useMemo } from 'react';
import { MigraineDiary } from '@/components/migraine/MigraineDiary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  getMigraineEntries, 
  deleteMigraineEntry, 
  getMigraineStatistics 
} from '@/domain/services';
import type { MigraineEntry, MigraineStatistics } from '@/domain/types';
import { 
  Calendar, Search, Filter, Trash2, Edit, 
  TrendingUp, BarChart3, Clock, MapPin 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function DiaryPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [entries, setEntries] = useState<MigraineEntry[]>([]);
  const [statistics, setStatistics] = useState<MigraineStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewEntryForm, setShowNewEntryForm] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const [entriesResult, statsResult] = await Promise.all([
        getMigraineEntries(user.id, 50),
        getMigraineStatistics(user.id)
      ]);

      if (entriesResult.success) {
        setEntries(entriesResult.data);
      } else {
        toast.error(t('diaryPage.errorLoading'));
      }

      if (statsResult.success) {
        setStatistics(statsResult.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error(t('diaryPage.errorLoadingData'));
    } finally {
      setIsLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const handleEntryAdded = useCallback(() => {
    loadData();
    setShowNewEntryForm(false);
  }, [loadData]);

  const handleDeleteEntry = useCallback(async (entryId: string) => {
    if (!user) return;

    const result = await deleteMigraineEntry(entryId, user.id);
    
    if (result.success) {
      toast.success(t('diaryPage.entryDeleted'));
      loadData();
    } else {
      toast.error(t('diaryPage.errorDeleting'));
    }
  }, [user, loadData, t]);

  const filteredEntries = useMemo(() => 
    entries.filter(entry => 
      entry.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.medicationTaken?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [entries, searchTerm]
  );

  const getIntensityColor = (intensity: number) => {
    if (intensity <= 3) return 'text-success';
    if (intensity <= 6) return 'text-warning';
    return 'text-destructive';
  };

  const getIntensityBg = (intensity: number) => {
    if (intensity <= 3) return 'bg-success/20';
    if (intensity <= 6) return 'bg-warning/20';
    return 'bg-destructive/20';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('diaryPage.title')}</h1>
          <p className="text-muted-foreground">
            {t('diaryPage.subtitle')}
          </p>
        </div>
        
        <Button 
          onClick={() => setShowNewEntryForm(!showNewEntryForm)}
          className="velar-button-primary"
        >
          <Calendar className="w-4 h-4 mr-2" />
          {t('diaryPage.newEntry')}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="velar-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('diaryPage.totalEpisodes')}</p>
                <p className="text-2xl font-bold">{statistics?.totalEntries ?? 0}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="velar-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('diaryPage.avgIntensity')}</p>
                <p className="text-2xl font-bold">
                  {statistics?.averageIntensity?.toFixed(1) ?? '0'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="velar-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('diaryPage.avgDuration')}</p>
                <p className="text-2xl font-bold">
                  {statistics?.averageDuration?.toFixed(1) ?? '0'}h
                </p>
              </div>
              <Clock className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="velar-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('diaryPage.withTriggers')}</p>
                <p className="text-2xl font-bold">
                  {statistics?.triggerPercentage?.toFixed(0) ?? 0}%
                </p>
              </div>
              <Filter className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Entry Form */}
      {showNewEntryForm && (
        <div className="animate-fade-in-up">
          <MigraineDiary onEntryAdded={handleEntryAdded} />
        </div>
      )}

      {/* Search */}
      <Card className="velar-card">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={t('diaryPage.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entries List */}
      <Card className="velar-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {t('diaryPage.entriesCount', { count: filteredEntries.length })}
          </CardTitle>
          <CardDescription>
            {t('diaryPage.chronologicalOverview')}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-24 bg-secondary/30 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                {entries.length === 0 ? t('diaryPage.noEntriesYet') : t('diaryPage.noEntriesFound')}
              </h3>
              <p className="text-muted-foreground">
                {entries.length === 0 
                  ? t('diaryPage.noEntriesDesc')
                  : t('diaryPage.tryOtherSearch')
                }
              </p>
              {entries.length === 0 && (
                <Button 
                  onClick={() => setShowNewEntryForm(true)}
                  className="velar-button-primary mt-4"
                >
                  {t('diaryPage.createFirstEntry')}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEntries.map((entry) => (
                <div 
                  key={entry.id}
                  className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                    getIntensityBg(entry.intensity)
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-sm font-medium">
                          {entry.createdAt.toLocaleDateString('de-DE', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        
                        <Badge 
                          variant="secondary"
                          className={getIntensityColor(entry.intensity)}
                        >
                          {t('diaryPage.intensity')} {entry.intensity}/10
                        </Badge>
                        
                        {entry.triggerDetected && (
                          <Badge variant="outline">
                            {t('diaryPage.triggerDetected')}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground mb-2">
                        <div>{t('diaryPage.severity')}: {entry.severity}/10</div>
                        <div>{t('diaryPage.duration')}: {entry.duration}h</div>
                        {entry.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {entry.location}
                          </div>
                        )}
                        {entry.effectiveness && entry.effectiveness > 0 && (
                          <div>{t('diaryPage.effectiveness')}: {entry.effectiveness}/10</div>
                        )}
                      </div>
                      
                      {entry.medicationTaken && (
                        <div className="text-sm mb-2">
                          <span className="font-medium">{t('diaryPage.medications')}:</span> {entry.medicationTaken}
                        </div>
                      )}
                      
                      {entry.note && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">{t('diaryPage.note')}:</span> {entry.note}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
