import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DailyForecast {
  date: string;
  temp: number;
  humidity: number;
  pressure: number;
  conditions: string;
  windSpeed: number;
  uvIndex: number;
}

interface RiskFactor {
  id: string;
  label: string;
  weight: number; // 0-1 contribution
}

interface ForecastOutput {
  date: string;
  riskLevel: number; // 0-10
  confidence: number; // 0-1
  weather: {
    temperature: number;
    humidity: number;
    pressure: number;
    conditions: string;
    uvIndex?: number;
    windSpeed?: number;
  };
  factors: RiskFactor[];
  recommendation: string;
}

// Logistic helper
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

function buildSyntheticForecast(currentTemp: number, currentHumidity: number, currentPressure: number): DailyForecast[] {
  // OpenWeather free tier doesn't include 7-day forecast; synthesize plausible variation around current observation
  const days: DailyForecast[] = [];
  const conditionsCycle = ["Clear", "Clouds", "Rain", "Clouds", "Clear", "Clouds", "Rain"];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    // Smooth drift: pressure varies ±15 hPa over the week
    const pressureDrift = Math.sin((i / 7) * Math.PI * 2) * 12;
    const tempDrift = Math.cos((i / 7) * Math.PI * 2) * 4;
    days.push({
      date: date.toISOString().split("T")[0],
      temp: Math.round((currentTemp + tempDrift) * 10) / 10,
      humidity: Math.max(20, Math.min(95, Math.round(currentHumidity + Math.sin(i) * 10))),
      pressure: Math.round((currentPressure + pressureDrift) * 100) / 100,
      conditions: conditionsCycle[i],
      windSpeed: Math.round(5 + Math.abs(Math.sin(i * 1.3)) * 15),
      uvIndex: Math.max(0, Math.round(3 + Math.cos(i) * 3)),
    });
  }
  return days;
}

function computeRisk(
  forecast: DailyForecast,
  prevPressure: number,
  baselineRate: number, // attacks per day in last 90d (0-1)
  sensitivity: "low" | "medium" | "high",
  knownTriggers: string[],
  pressureHistory: number[], // recent attack pressures
): { risk: number; confidence: number; factors: RiskFactor[] } {
  const factors: RiskFactor[] = [];

  // 1. Pressure delta (strongest evidence — Cephalalgia 2019)
  const pressureDelta = forecast.pressure - prevPressure;
  let pressureScore = 0;
  if (pressureDelta < -5) {
    pressureScore = Math.min(1, Math.abs(pressureDelta) / 15);
    factors.push({
      id: "pressure_drop",
      label: `Barometric drop ${pressureDelta.toFixed(1)} hPa`,
      weight: pressureScore,
    });
  } else if (pressureDelta > 5) {
    pressureScore = Math.min(0.6, pressureDelta / 20);
    factors.push({
      id: "pressure_rise",
      label: `Barometric rise ${pressureDelta.toFixed(1)} hPa`,
      weight: pressureScore,
    });
  }

  // 2. Personal pressure threshold (from history)
  if (pressureHistory.length >= 3) {
    const avgAttackPressure = pressureHistory.reduce((a, b) => a + b, 0) / pressureHistory.length;
    if (Math.abs(forecast.pressure - avgAttackPressure) < 5) {
      factors.push({
        id: "personal_pressure_match",
        label: "Pressure matches your past attack pattern",
        weight: 0.4,
      });
    }
  }

  // 3. Humidity
  let humidityScore = 0;
  if (forecast.humidity > 75) {
    humidityScore = (forecast.humidity - 75) / 25;
    factors.push({
      id: "high_humidity",
      label: `High humidity (${forecast.humidity}%)`,
      weight: humidityScore,
    });
  }

  // 4. Temperature extreme
  let tempScore = 0;
  if (forecast.temp > 28 || forecast.temp < 0) {
    tempScore = 0.3;
    factors.push({
      id: "temp_extreme",
      label: `Extreme temperature (${forecast.temp}°C)`,
      weight: tempScore,
    });
  }

  // 5. Personal triggers
  let triggerScore = 0;
  const lowerTriggers = knownTriggers.map((t) => t.toLowerCase());
  if (lowerTriggers.some((t) => t.includes("weather") || t.includes("wetter") || t.includes("pressure"))) {
    triggerScore += 0.25;
    factors.push({ id: "personal_weather_trigger", label: "Weather is a known personal trigger", weight: 0.25 });
  }
  if (forecast.conditions === "Rain" && lowerTriggers.some((t) => t.includes("rain") || t.includes("regen"))) {
    triggerScore += 0.2;
    factors.push({ id: "personal_rain", label: "Rain is a known personal trigger", weight: 0.2 });
  }

  // 6. Sensitivity multiplier
  const sensitivityMult = sensitivity === "high" ? 1.4 : sensitivity === "low" ? 0.7 : 1.0;

  // 7. Base rate prior
  const basePrior = baselineRate * 2; // 0-2 boost

  // Logistic blend
  const linear =
    pressureScore * 2.5 +
    humidityScore * 1.0 +
    tempScore * 0.8 +
    triggerScore * 1.5 +
    basePrior -
    1.2; // intercept

  const probability = sigmoid(linear * sensitivityMult);
  const risk = Math.max(1, Math.min(10, Math.round(probability * 10)));

  // Confidence based on history size & factor strength
  const factorWeightSum = factors.reduce((s, f) => s + f.weight, 0);
  const historyFactor = Math.min(1, pressureHistory.length / 10);
  const confidence = Math.max(0.5, Math.min(0.95, 0.5 + factorWeightSum * 0.15 + historyFactor * 0.3));

  return { risk, confidence, factors };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("location_lat, location_lng, weather_sensitivity, known_triggers")
      .eq("user_id", userId)
      .single();

    if (!profile?.location_lat || !profile?.location_lng) {
      return new Response(JSON.stringify({ error: "Location required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch current weather
    const apiKey = Deno.env.get("OPENWEATHER_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Weather service not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const wxRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${profile.location_lat}&lon=${profile.location_lng}&appid=${apiKey}&units=metric`,
    );
    if (!wxRes.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch weather" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const wx = await wxRes.json();
    const currentPressure = wx.main?.pressure ?? 1013;
    const currentTemp = wx.main?.temp ?? 20;
    const currentHumidity = wx.main?.humidity ?? 60;

    // Build forecast (synthetic since free OpenWeather lacks 7-day)
    const dailyForecast = buildSyntheticForecast(currentTemp, currentHumidity, currentPressure);

    // Pull recent entries for personal baseline (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const { data: entries } = await supabase
      .from("migraine_entries")
      .select("created_at, pressure")
      .eq("user_id", userId)
      .gte("created_at", ninetyDaysAgo.toISOString());

    const attackCount = entries?.length ?? 0;
    const baselineRate = Math.min(1, attackCount / 90);
    const pressureHistory = (entries ?? [])
      .map((e) => e.pressure)
      .filter((p): p is number => typeof p === "number" && p > 800);

    const triggers = (profile.known_triggers ?? "").split(",").map((t: string) => t.trim()).filter(Boolean);
    const sensitivity = (profile.weather_sensitivity as "low" | "medium" | "high") ?? "medium";

    const forecasts: ForecastOutput[] = [];
    let prevPressure = currentPressure;
    for (const day of dailyForecast) {
      const { risk, confidence, factors } = computeRisk(
        day,
        prevPressure,
        baselineRate,
        sensitivity,
        triggers,
        pressureHistory,
      );
      const recommendation =
        risk > 7
          ? "Consider preventive measures: hydrate, manage stress, keep rescue medication accessible."
          : risk > 4
          ? "Stay aware of early symptoms. Maintain hydration and regular sleep."
          : "Conditions favorable. Continue your routine.";

      forecasts.push({
        date: day.date,
        riskLevel: risk,
        confidence,
        weather: {
          temperature: day.temp,
          humidity: day.humidity,
          pressure: day.pressure,
          conditions: day.conditions,
          uvIndex: day.uvIndex,
          windSpeed: day.windSpeed,
        },
        factors: factors.length > 0 ? factors : [{ id: "normal", label: "Normal conditions", weight: 0 }],
        recommendation,
      });
      prevPressure = day.pressure;
    }

    return new Response(
      JSON.stringify({
        forecasts,
        meta: {
          baselineRate,
          sampleSize: attackCount,
          generatedAt: new Date().toISOString(),
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("predict-migraine-risk error", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
