import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { runStandardCorrelations } from "@/domain/services/correlationService";

export function CorrelationCard() {
  const { user } = useAuth();

  const { data: entries, isLoading } = useQuery({
    queryKey: ["entries-for-correlation", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("migraine_entries")
        .select("severity,intensity,pressure,humidity,temperature,trigger_detected")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const results = useMemo(
    () => (entries ? runStandardCorrelations(entries as any) : []),
    [entries],
  );

  const enough = (entries?.length ?? 0) >= 8;

  return (
    <Card className="velar-card border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Activity className="w-5 h-5 text-primary" />
          Variable correlations with severity
        </CardTitle>
        <CardDescription>
          Pearson r with 95% confidence intervals. Values near 0 indicate no linear relationship.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Computing…
          </div>
        ) : !enough ? (
          <p className="text-sm text-muted-foreground">
            At least 8 logged entries are needed before correlations become meaningful.
          </p>
        ) : (
          <div className="space-y-3">
            {results.map((r) => (
              <div
                key={r.variable}
                className="flex items-center justify-between rounded-md border border-border/40 p-3"
              >
                <div>
                  <div className="text-sm font-medium text-foreground">{r.variable}</div>
                  <div className="text-xs text-muted-foreground">
                    r = {r.r}  ·  95% CI [{r.ciLow}, {r.ciHigh}]  ·  n = {r.n}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    r.strength === "strong"
                      ? "border-primary text-primary"
                      : r.strength === "moderate"
                      ? "border-warning text-warning"
                      : "text-muted-foreground"
                  }
                >
                  {r.strength}
                </Badge>
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-2">
              Correlation does not imply causation. Discuss any clinically meaningful pattern with
              your physician.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
