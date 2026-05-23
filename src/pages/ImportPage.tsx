import { Helmet } from "react-helmet-async";
import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { FileUp, ArrowLeft, AlertTriangle, CheckCircle2, Download } from 'lucide-react';

interface ParsedRow {
  created_at: string;
  severity: number;
  intensity: number;
  duration: number;
  note: string | null;
  medication_taken: string | null;
}

// Heuristic field mapping: tries common headers from Migraine Buddy, N1-Headache, generic CSV
const HEADER_MAP: Record<string, keyof ParsedRow> = {
  date: 'created_at',
  datetime: 'created_at',
  'start time': 'created_at',
  start: 'created_at',
  timestamp: 'created_at',
  severity: 'severity',
  intensity: 'intensity',
  pain: 'intensity',
  'pain level': 'intensity',
  duration: 'duration',
  'duration (hours)': 'duration',
  notes: 'note',
  note: 'note',
  comment: 'note',
  medication: 'medication_taken',
  medications: 'medication_taken',
  'meds taken': 'medication_taken',
};

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/_/g, ' ');
}

function toIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function toInt(value: string, fallback = 0, max = 10): number {
  const n = parseInt(String(value).replace(/[^\d-]/g, ''), 10);
  if (isNaN(n)) return fallback;
  return Math.max(0, Math.min(max, n));
}

export default function ImportPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);

  const onFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setErrors([]);
    setRows([]);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const parseErrors: string[] = [];
        const mapped: ParsedRow[] = [];

        for (let i = 0; i < result.data.length; i++) {
          const row = result.data[i];
          const normalized: Partial<ParsedRow> = {};
          for (const [k, v] of Object.entries(row)) {
            const key = HEADER_MAP[normalize(k)];
            if (key) (normalized as any)[key] = v;
          }

          const iso = toIso(normalized.created_at as string);
          if (!iso) {
            parseErrors.push(`Row ${i + 2}: missing or invalid date`);
            continue;
          }

          mapped.push({
            created_at: iso,
            severity: toInt(String(normalized.severity ?? normalized.intensity ?? 5), 5),
            intensity: toInt(String(normalized.intensity ?? normalized.severity ?? 5), 5),
            duration: toInt(String(normalized.duration ?? 0), 0, 240),
            note: (normalized.note as string) || null,
            medication_taken: (normalized.medication_taken as string) || null,
          });
        }

        setRows(mapped);
        setErrors(parseErrors.slice(0, 10));
        if (mapped.length === 0) {
          toast.error('No valid rows detected. Check column headers.');
        } else {
          toast.success(`Parsed ${mapped.length} rows`);
        }
      },
      error: (err) => {
        toast.error(`Parse error: ${err.message}`);
      },
    });
  }, []);

  const onImport = useCallback(async () => {
    if (!user || rows.length === 0) return;
    setImporting(true);
    setProgress(0);

    const CHUNK = 100;
    let inserted = 0;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK).map((r) => ({
        user_id: user.id,
        created_at: r.created_at,
        severity: r.severity,
        intensity: r.intensity,
        duration: r.duration,
        note: r.note,
        medication_taken: r.medication_taken,
        trigger_detected: false,
      }));
      const { error } = await supabase.from('migraine_entries').insert(chunk);
      if (error) {
        toast.error(`Import stopped at row ${i + 1}: ${error.message}`);
        setImporting(false);
        return;
      }
      inserted += chunk.length;
      setProgress(Math.round((inserted / rows.length) * 100));
    }

    await queryClient.invalidateQueries({ queryKey: ['migraine-entries'] });
    await queryClient.invalidateQueries({ queryKey: ['migraine-statistics'] });
    toast.success(`Imported ${inserted} entries`);
    setImporting(false);
    setRows([]);
    setFileName(null);
  }, [rows, user, queryClient]);

  const downloadTemplate = () => {
    const csv = 'date,intensity,duration,medication,notes\n2025-01-15T08:30:00Z,7,6,Sumatriptan 50mg,Pressure drop before storm\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'velar-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <Helmet>
        <title>Import Data — Velar</title>
        <meta name="description" content="Import migraine data from CSV files including Migraine Buddy and N1-Headache exports." />
        <link rel="canonical" href="https://velarv1.lovable.app/import" />
      </Helmet>
      <Link to="/settings" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Link>

      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Import episode history</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload a CSV from Migraine Buddy, N1-Headache, Apple Health export, or any spreadsheet.
        </p>
      </header>

      <Card className="velar-card">
        <CardHeader>
          <CardTitle className="text-base">1. Select a CSV file</CardTitle>
          <CardDescription>
            We auto-detect common columns: date, intensity, duration, medication, notes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Label htmlFor="csv" className="sr-only">CSV file</Label>
            <Input id="csv" type="file" accept=".csv,text/csv" onChange={onFile} className="max-w-md" />
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" /> Template
            </Button>
          </div>
          {fileName && (
            <p className="text-sm text-muted-foreground">
              <FileUp className="inline h-4 w-4 mr-1" />
              {fileName}
            </p>
          )}
        </CardContent>
      </Card>

      {errors.length > 0 && (
        <Alert variant="destructive" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-1">{errors.length} row(s) skipped:</p>
            <ul className="list-disc list-inside text-xs space-y-0.5">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {rows.length > 0 && (
        <Card className="velar-card mt-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>2. Preview <Badge variant="secondary" className="ml-2">{rows.length} rows</Badge></span>
              <Button onClick={onImport} disabled={importing}>
                {importing ? `Importing… ${progress}%` : `Import ${rows.length} entries`}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {importing && <Progress value={progress} className="mb-4" />}
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Intensity</TableHead>
                    <TableHead>Duration (h)</TableHead>
                    <TableHead>Medication</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 10).map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs">{new Date(r.created_at).toLocaleString()}</TableCell>
                      <TableCell>{r.intensity}</TableCell>
                      <TableCell>{r.duration}</TableCell>
                      <TableCell className="text-xs">{r.medication_taken ?? '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">{r.note ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {rows.length > 10 && (
              <p className="text-xs text-muted-foreground mt-2">Showing first 10 of {rows.length} rows.</p>
            )}
            <Alert className="mt-4">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Imported entries are stored under your account and protected by row-level security.
                Weather correlations will be backfilled by your next forecast refresh.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
