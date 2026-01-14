import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 STT requests per minute per user
const MAX_AUDIO_SIZE_BYTES = 25 * 1024 * 1024; // 25MB max (Whisper limit)

// In-memory rate limit store (resets on cold start)
const rateLimitStore = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const userLimit = rateLimitStore.get(identifier);
  
  if (!userLimit || now - userLimit.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(identifier, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    const resetIn = RATE_LIMIT_WINDOW_MS - (now - userLimit.windowStart);
    return { allowed: false, remaining: 0, resetIn };
  }
  
  userLimit.count++;
  return { 
    allowed: true, 
    remaining: RATE_LIMIT_MAX_REQUESTS - userLimit.count,
    resetIn: RATE_LIMIT_WINDOW_MS - (now - userLimit.windowStart)
  };
}

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768): Uint8Array {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user identity for rate limiting
    const authHeader = req.headers.get('Authorization');
    let rateLimitIdentifier = req.headers.get('x-forwarded-for') || 'anonymous';
    
    // If authenticated, use user ID for more accurate rate limiting
    if (authHeader) {
      try {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
          { auth: { persistSession: false } }
        );
        const token = authHeader.replace('Bearer ', '');
        const { data: userData } = await supabaseClient.auth.getUser(token);
        if (userData?.user) {
          rateLimitIdentifier = userData.user.id;
        }
      } catch {
        // Continue with IP-based rate limiting
      }
    }

    // Rate limiting check
    const rateLimit = checkRateLimit(rateLimitIdentifier);
    const rateLimitHeaders = {
      'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
      'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(rateLimit.resetIn / 1000).toString(),
    };

    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil(rateLimit.resetIn / 1000)
      }), {
        status: 429,
        headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { audio, language } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    // Input validation
    if (!audio || typeof audio !== 'string') {
      return new Response(
        JSON.stringify({ error: "No audio data provided" }),
        { status: 400, headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" } }
      );
    }

    // Estimate decoded size (base64 is ~4/3 of original)
    const estimatedSize = Math.ceil(audio.length * 0.75);
    if (estimatedSize > MAX_AUDIO_SIZE_BYTES) {
      return new Response(
        JSON.stringify({ error: "Audio file too large. Maximum size is 25MB." }),
        { status: 400, headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Processing voice-to-text request...");

    // Process audio in chunks
    const binaryAudio = processBase64Chunks(audio);
    console.log(`Audio size: ${binaryAudio.length} bytes`);

    // Prepare form data for OpenAI Whisper
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: "audio/webm" });
    formData.append("file", blob, "audio.webm");
    formData.append("model", "whisper-1");
    
    if (language && typeof language === 'string' && language.length <= 5) {
      formData.append("language", language);
    }

    // Send to OpenAI Whisper
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    console.log("Transcription successful");

    return new Response(
      JSON.stringify({ text: result.text }),
      { headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in voice-to-text function:", error);
    return new Response(
      JSON.stringify({ error: "Failed to transcribe audio" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
