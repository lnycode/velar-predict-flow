import { useState, useEffect } from 'react';
import { MigraineDiary } from '@/components/migraine/MigraineDiary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Calendar, Search, Filter, Trash2, Edit, 
  TrendingUp, BarChart3, Clock, MapPin 
} from 'lucide-react';

interface MigrainEntry {
  id: string;
  created_at: string;
  severity: number;
  intensity: number;
  duration: number;
  location: string;
  note: string;
  medication_taken: string;
  effectiveness: number;
  trigger_detected: boolean;
}

export default function DiaryPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<MigrainEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewEntryForm, setShowNewEntryForm] = useState(false);

  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user]);

  const loadEntries = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('migraine_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEntryAdded = () => {
    loadEntries();
    setShowNewEntryForm(false);
  };

  const deleteEntry = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('migraine_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user?.id);

      if (error) throw error;
      loadEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const filteredEntries = entries.filter(entry => 
    entry.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.medication_taken?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold text-foreground">Migräne-Tagebuch</h1>
          <p className="text-muted-foreground">
            Dokumentieren Sie Ihre Episoden für präzisere KI-Vorhersagen
          </p>
        </div>
        
        <Button 
          onClick={() => setShowNewEntryForm(!showNewEntryForm)}
          className="velar-button-primary"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Neuer Eintrag
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="velar-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gesamt Episoden</p>
                <p className="text-2xl font-bold">{entries.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="velar-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ø Intensität</p>
                <p className="text-2xl font-bold">
                  {entries.length > 0 
                    ? Math.round(entries.reduce((sum, e) => sum + e.intensity, 0) / entries.length * 10) / 10
                    : '0'
                  }
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
                <p className="text-sm font-medium text-muted-foreground">Ø Dauer</p>
                <p className="text-2xl font-bold">
                  {entries.length > 0 
                    ? Math.round(entries.reduce((sum, e) => sum + e.duration, 0) / entries.length * 10) / 10
                    : '0'
                  }h
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
                <p className="text-sm font-medium text-muted-foreground">Mit Triggern</p>
                <p className="text-2xl font-bold">
                  {entries.length > 0 
                    ? Math.round(entries.filter(e => e.trigger_detected).length / entries.length * 100)
                    : 0
                  }%
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
                placeholder="Einträge durchsuchen (Notizen, Ort, Medikamente...)"
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
            Ihre Migräne-Einträge ({filteredEntries.length})
          </CardTitle>
          <CardDescription>
            Chronologische Übersicht Ihrer dokumentierten Episoden
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
                {entries.length === 0 ? 'Noch keine Einträge' : 'Keine Einträge gefunden'}
              </h3>
              <p className="text-muted-foreground">
                {entries.length === 0 
                  ? 'Erstellen Sie Ihren ersten Tagebucheintrag, um mit der KI-Analyse zu beginnen.'
                  : 'Versuchen Sie andere Suchbegriffe oder löschen Sie den Filter.'
                }
              </p>
              {entries.length === 0 && (
                <Button 
                  onClick={() => setShowNewEntryForm(true)}
                  className="velar-button-primary mt-4"
                >
                  Ersten Eintrag erstellen
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
                          {new Date(entry.created_at).toLocaleDateString('de-DE', {
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
                          Intensität {entry.intensity}/10
                        </Badge>
                        
                        {entry.trigger_detected && (
                          <Badge variant="outline">
                            Trigger erkannt
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground mb-2">
                        <div>Schweregrad: {entry.severity}/10</div>
                        <div>Dauer: {entry.duration}h</div>
                        {entry.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {entry.location}
                          </div>
                        )}
                        {entry.effectiveness > 0 && (
                          <div>Wirksamkeit: {entry.effectiveness}/10</div>
                        )}
                      </div>
                      
                      {entry.medication_taken && (
                        <div className="text-sm mb-2">
                          <span className="font-medium">Medikamente:</span> {entry.medication_taken}
                        </div>
                      )}
                      
                      {entry.note && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Notiz:</span> {entry.note}
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
                        onClick={() => deleteEntry(entry.id)}
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