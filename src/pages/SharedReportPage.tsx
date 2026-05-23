import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldAlert, Stethoscope } from "lucide-react";

interface SharedReport {
  id: string;
  title: string;
  period_start: string;
  period_end: string;
  payload: any;
  expires_at: string;
  created_at: string;
}

export default function SharedReportPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<SharedReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) return;
      try {
        const { data, error } = await supabase.rpc("get_shared_report", { _token: token });
        if (error) throw error;
        if (!data) {
          setError("This link has expired or is no longer valid.");
        } else if (!cancelled) {
          setReport(data as SharedReport);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Could not load report.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-destructive" /> Link unavailable
            </CardTitle>
            <CardDescription>{error ?? "Report not found."}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const entries: any[] = report.payload?.entries ?? [];
  const patient = report.payload?.patient ?? {};

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Stethoscope className="w-6 h-6 text-primary" /> {report.title}
            </CardTitle>
            <CardDescription>
              Period {report.period_start} → {report.period_end} · Link expires{" "}
              {new Date(report.expires_at).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div>
              <span className="text-muted-foreground">Patient:</span>{" "}
              {[patient.first_name, patient.last_name].filter(Boolean).join(" ") || "—"}
            </div>
            {patient.migraine_type && (
              <div><span className="text-muted-foreground">Type:</span> {patient.migraine_type}</div>
            )}
            {patient.known_triggers && (
              <div><span className="text-muted-foreground">Known triggers:</span> {patient.known_triggers}</div>
            )}
            {patient.current_medications && (
              <div><span className="text-muted-foreground">Medications:</span> {patient.current_medications}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Episodes ({entries.length})</CardTitle>
            <CardDescription>Reverse chronological order.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Severity</th>
                    <th className="py-2 pr-3">Duration</th>
                    <th className="py-2 pr-3">Pressure</th>
                    <th className="py-2 pr-3">Trigger</th>
                    <th className="py-2 pr-3">Medication</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, i) => (
                    <tr key={i} className="border-t border-border/40">
                      <td className="py-2 pr-3">{new Date(e.created_at).toLocaleString()}</td>
                      <td className="py-2 pr-3">{e.severity ?? e.intensity ?? "—"}</td>
                      <td className="py-2 pr-3">{e.duration ? `${e.duration} min` : "—"}</td>
                      <td className="py-2 pr-3">{e.pressure ? `${e.pressure} hPa` : "—"}</td>
                      <td className="py-2 pr-3">{e.trigger_detected ? "yes" : "no"}</td>
                      <td className="py-2 pr-3">{e.medication_taken ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          This summary is generated from patient-tracked data and does not constitute medical advice.
          Always interpret in clinical context.
        </p>
      </div>
    </div>
  );
}
