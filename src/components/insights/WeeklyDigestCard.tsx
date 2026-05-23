import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface WeeklyInsight {
  id: string;
  summary: string;
  period_start: string;
  period_end: string;
  metrics: Record<string, unknown> | null;
  created_at: string;
}

export function WeeklyDigestCard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [generating, setGenerating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["weekly-insight", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<WeeklyInsight | null> => {
      const { data, error } = await supabase
        .from("weekly_insights")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as WeeklyInsight | null;
    },
  });

  const generate = async () => {
    setGenerating(true);
    try {
      const { error } = await supabase.functions.invoke("weekly-digest", { body: {} });
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["weekly-insight", user?.id] });
      toast.success("Weekly summary generated");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not generate summary");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="velar-card border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="w-5 h-5 text-primary" />
              Weekly clinical summary
            </CardTitle>
            <CardDescription>
              AI-generated narrative of the last 7 days of tracked data.
            </CardDescription>
          </div>
          <Button onClick={generate} disabled={generating} size="sm" variant="outline">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span className="ml-2">{data ? "Regenerate" : "Generate"}</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : data ? (
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">
              Period {data.period_start} → {data.period_end}
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {data.summary}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No summary yet. Generate one to receive a clinical narrative of your past week.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
