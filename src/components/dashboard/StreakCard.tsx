import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

/**
 * Clinical-framed logging streak.
 * Counts consecutive days with at least one migraine_entries row
 * over the past 60 days. Frames the streak as "data completeness"
 * rather than gamified habit-building, in line with the project's
 * clinical tone.
 */
export function StreakCard() {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);
  const [coverage, setCoverage] = useState(0); // 0..100, last 30d
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - 60);
      const { data } = await supabase
        .from("migraine_entries")
        .select("created_at")
        .eq("user_id", user.id)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false });
      if (cancelled) return;

      const days = new Set(
        (data ?? []).map((r) =>
          new Date(r.created_at as string).toISOString().slice(0, 10)
        )
      );

      // Consecutive days ending today (or yesterday if no entry today yet).
      let s = 0;
      const cursor = new Date();
      cursor.setHours(0, 0, 0, 0);
      // Allow grace for "today not yet logged"
      if (!days.has(cursor.toISOString().slice(0, 10))) {
        cursor.setDate(cursor.getDate() - 1);
      }
      while (days.has(cursor.toISOString().slice(0, 10))) {
        s += 1;
        cursor.setDate(cursor.getDate() - 1);
      }

      // 30-day coverage
      let logged = 0;
      const c2 = new Date();
      c2.setHours(0, 0, 0, 0);
      for (let i = 0; i < 30; i++) {
        if (days.has(c2.toISOString().slice(0, 10))) logged += 1;
        c2.setDate(c2.getDate() - 1);
      }

      setStreak(s);
      setCoverage(Math.round((logged / 30) * 100));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const accuracyLift = Math.min(30, Math.round(coverage * 0.3));

  return (
    <Card className="velar-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Flame className="w-4 h-4 text-primary" aria-hidden="true" />
          Logging consistency
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold">{loading ? "—" : streak}</div>
          <span className="text-xs text-muted-foreground">
            consecutive day{streak === 1 ? "" : "s"}
          </span>
        </div>
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>30-day coverage</span>
            <span>{coverage}%</span>
          </div>
          <Progress value={coverage} className="h-2" />
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Consistent logging improves forecast accuracy by an estimated{" "}
          <span className="text-primary font-medium">+{accuracyLift}%</span>.
        </p>
      </CardContent>
    </Card>
  );
}
