import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - 7);

    const { data: entries } = await supabase
      .from("migraine_entries")
      .select("created_at, intensity, severity, duration, pressure, temperature, humidity, weather_type, trigger_detected, medication_taken, note")
      .gte("created_at", periodStart.toISOString())
      .lte("created_at", periodEnd.toISOString())
      .order("created_at", { ascending: true });

    const list = entries ?? [];
    const count = list.length;
    const avgSeverity = count ? list.reduce((s, e: any) => s + (e.severity ?? e.intensity ?? 0), 0) / count : 0;
    const avgDuration = count ? list.reduce((s, e: any) => s + (e.duration ?? 0), 0) / count : 0;
    const triggerHits = list.filter((e: any) => e.trigger_detected).length;
    const metrics = {
      count,
      avgSeverity: Math.round(avgSeverity * 10) / 10,
      avgDurationMin: Math.round(avgDuration),
      triggerHits,
      periodStart: periodStart.toISOString().slice(0, 10),
      periodEnd: periodEnd.toISOString().slice(0, 10),
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let summary = "Insufficient data for an AI summary this week.";

    if (LOVABLE_API_KEY && count > 0) {
      const prompt = `You are a clinical neurology assistant. Summarize this patient's last 7 days of migraine data in 4 short paragraphs (neutral, factual, no emojis, no medical advice beyond reminding the reader to consult a physician). Cover: 1) frequency & severity trend, 2) likely environmental correlations from weather fields, 3) notable triggers, 4) one observation worth discussing with their physician.

Metrics: ${JSON.stringify(metrics)}
Entries (oldest first): ${JSON.stringify(list.slice(-20))}`;

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "Clinical, concise, no emojis. Always include a brief disclaimer to consult a physician." },
            { role: "user", content: prompt },
          ],
        }),
      });
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to your Lovable workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const aiJson = await aiRes.json();
      summary = aiJson?.choices?.[0]?.message?.content ?? summary;
    }

    const { data: inserted, error: insErr } = await supabase
      .from("weekly_insights")
      .insert({
        user_id: user.id,
        period_start: metrics.periodStart,
        period_end: metrics.periodEnd,
        summary,
        metrics,
      })
      .select()
      .single();

    if (insErr) throw insErr;

    return new Response(JSON.stringify({ insight: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("weekly-digest error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
