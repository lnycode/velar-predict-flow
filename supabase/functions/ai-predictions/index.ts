import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  conditions: string;
  uvIndex?: number;
  windSpeed?: number;
}

interface PredictionRequest {
  location: { lat: number; lng: number };
  userProfile: {
    weatherSensitivity: string;
    migraineTriggers: string[];
    recentEpisodes: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !userData.user) {
      throw new Error('User not authenticated');
    }

    const { location, userProfile } = await req.json() as PredictionRequest;

    // Get weather data from OpenWeatherMap (you'll need to add this API key too)
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lng}&appid=${Deno.env.get('OPENWEATHER_API_KEY')}&units=metric`
    );
    
    let weatherData: WeatherData;
    if (weatherResponse.ok) {
      const weather = await weatherResponse.json();
      weatherData = {
        temperature: weather.main.temp,
        humidity: weather.main.humidity,
        pressure: weather.main.pressure,
        conditions: weather.weather[0].main,
        uvIndex: weather.uvi || 0,
        windSpeed: weather.wind?.speed || 0
      };
    } else {
      // Fallback to mock data if weather API fails
      weatherData = {
        temperature: 22,
        humidity: 65,
        pressure: 1013,
        conditions: 'Clear',
        uvIndex: 5,
        windSpeed: 10
      };
    }

    // Generate AI prediction using GPT
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are Velar AI, an advanced migraine prediction system. Analyze weather data and user profile to predict migraine risk.
            
            Return a JSON response with:
            - riskLevel: number (1-10 scale)
            - confidence: number (0-1)
            - factors: array of contributing factors
            - recommendation: string with actionable advice
            - timeframe: predicted timeframe for potential migraine`
          },
          {
            role: 'user',
            content: `Weather: ${JSON.stringify(weatherData)}
            User Profile: Weather sensitivity: ${userProfile.weatherSensitivity}, Known triggers: ${userProfile.migraineTriggers.join(', ')}, Recent episodes: ${userProfile.recentEpisodes}
            
            Predict migraine risk for the next 24-48 hours.`
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      }),
    });

    const aiResponse = await openAIResponse.json();
    let prediction;
    
    try {
      prediction = JSON.parse(aiResponse.choices[0].message.content);
    } catch {
      // Fallback prediction if AI response parsing fails
      prediction = {
        riskLevel: Math.min(10, Math.max(1, 
          (weatherData.pressure < 1000 ? 3 : 0) +
          (weatherData.humidity > 80 ? 2 : 0) +
          (userProfile.weatherSensitivity === 'high' ? 3 : 1) +
          (userProfile.recentEpisodes > 2 ? 2 : 0)
        )),
        confidence: 0.75,
        factors: ['Atmospheric pressure changes', 'High humidity levels'],
        recommendation: 'Stay hydrated and consider preventive medication',
        timeframe: 'Next 24 hours'
      };
    }

    // Save prediction to database
    const { error: insertError } = await supabaseClient
      .from('ai_predictions')
      .insert({
        user_id: userData.user.id,
        prediction_type: 'weather_risk',
        risk_level: prediction.riskLevel,
        confidence: prediction.confidence,
        weather_data: weatherData,
        prediction_factors: {
          factors: prediction.factors,
          recommendation: prediction.recommendation,
          timeframe: prediction.timeframe
        },
        predicted_for: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });

    if (insertError) {
      console.error('Error saving prediction:', insertError);
    }

    return new Response(JSON.stringify({
      prediction: {
        riskLevel: prediction.riskLevel,
        confidence: prediction.confidence,
        factors: prediction.factors,
        recommendation: prediction.recommendation,
        timeframe: prediction.timeframe,
        weatherData
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-predictions function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      prediction: {
        riskLevel: 3,
        confidence: 0.5,
        factors: ['Weather data unavailable'],
        recommendation: 'Monitor symptoms and stay hydrated',
        timeframe: 'Next 24 hours'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});