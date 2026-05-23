import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  daysBack: z.number().int().min(1).max(365).default(90),
  expiresInDays: z.number().int().min(1).max(180).default(30),
});

function randomToken(len = 32) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

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

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { title, daysBack, expiresInDays } = parsed.data;

    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - daysBack);

    const { data: entries } = await supabase
      .from("migraine_entries")
      .select("created_at, intensity, severity, duration, pressure, temperature, humidity, weather_type, trigger_detected, medication_taken, location, note")
      .gte("created_at", periodStart.toISOString())
      .order("created_at", { ascending: false })
      .limit(500);

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, migraine_type, known_triggers, current_medications")
      .eq("user_id", user.id)
      .maybeSingle();

    const token = randomToken(24);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const payload = {
      patient: profile ?? null,
      entries: entries ?? [],
      generatedAt: new Date().toISOString(),
    };

    const { data: report, error: insErr } = await supabase
      .from("shared_reports")
      .insert({
        user_id: user.id,
        token,
        title: title ?? "Clinical summary",
        period_start: periodStart.toISOString().slice(0, 10),
        period_end: periodEnd.toISOString().slice(0, 10),
        payload,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insErr) throw insErr;

    return new Response(JSON.stringify({ report, token }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-share-link error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
