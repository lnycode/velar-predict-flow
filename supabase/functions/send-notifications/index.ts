import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface NotificationRequest {
  type: 'weather_alert' | 'pattern_detected' | 'medication_reminder' | 'weekly_report';
  recipientEmail: string;
  data: {
    riskLevel?: number;
    factors?: string[];
    recommendation?: string;
    patternDetails?: string;
    medicationName?: string;
    reportData?: any;
  };
}

const getEmailTemplate = (type: string, data: any) => {
  const baseStyle = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0a0f23 0%, #1a1f35 100%); color: white; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🚀 Velar</h1>
        <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Advanced Migraine Intelligence</p>
      </div>
      <div style="padding: 30px;">
  `;

  const footer = `
      </div>
      <div style="background-color: rgba(255, 255, 255, 0.05); padding: 20px; text-align: center; font-size: 14px; color: rgba(255, 255, 255, 0.7);">
        <p>Powered by Velar AI • Improving migraine care through intelligent predictions</p>
        <p><a href="https://velar.app" style="color: #6366f1; text-decoration: none;">Visit Dashboard</a> | <a href="#" style="color: #6366f1; text-decoration: none;">Unsubscribe</a></p>
      </div>
    </div>
  `;

  switch (type) {
    case 'weather_alert':
      return `${baseStyle}
        <h2 style="color: #f59e0b; margin-bottom: 20px;">⚠️ High Migraine Risk Alert</h2>
        <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #f59e0b;">Risk Level: ${data.riskLevel}/10</h3>
          <p><strong>Contributing Factors:</strong></p>
          <ul style="color: rgba(255, 255, 255, 0.9);">
            ${data.factors?.map((factor: string) => `<li>${factor}</li>`).join('') || '<li>Weather pattern changes</li>'}
          </ul>
        </div>
        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 20px;">
          <h3 style="margin-top: 0; color: #10b981;">💡 Recommendation</h3>
          <p style="margin-bottom: 0; color: rgba(255, 255, 255, 0.9);">${data.recommendation || 'Stay hydrated and consider preventive measures'}</p>
        </div>
        ${footer}`;

    case 'pattern_detected':
      return `${baseStyle}
        <h2 style="color: #8b5cf6; margin-bottom: 20px;">🔍 Pattern Detected</h2>
        <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 8px; padding: 20px;">
          <p style="color: rgba(255, 255, 255, 0.9);">${data.patternDetails || 'Our AI has detected a recurring pattern in your migraine episodes.'}</p>
          <p style="margin-bottom: 0;"><strong>Check your dashboard for detailed insights and personalized recommendations.</strong></p>
        </div>
        ${footer}`;

    case 'medication_reminder':
      return `${baseStyle}
        <h2 style="color: #06b6d4; margin-bottom: 20px;">💊 Medication Reminder</h2>
        <div style="background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 8px; padding: 20px;">
          <p style="color: rgba(255, 255, 255, 0.9);">Time to take your preventive medication: <strong>${data.medicationName || 'Your prescribed medication'}</strong></p>
          <p style="margin-bottom: 0;">Consistent medication timing helps optimize effectiveness.</p>
        </div>
        ${footer}`;

    case 'weekly_report':
      return `${baseStyle}
        <h2 style="color: #10b981; margin-bottom: 20px;">📊 Your Weekly Migraine Report</h2>
        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #10b981;">This Week's Summary</h3>
          <p style="color: rgba(255, 255, 255, 0.9);">Episodes: ${data.reportData?.episodes || 0} | Average Duration: ${data.reportData?.avgDuration || 'N/A'} hours</p>
          <p style="margin-bottom: 0;">AI Accuracy: ${data.reportData?.accuracy || '94'}% | Risk Predictions Made: ${data.reportData?.predictions || 12}</p>
        </div>
        <div style="text-align: center;">
          <a href="https://velar.app/analytics" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">View Full Report</a>
        </div>
        ${footer}`;

    default:
      return `${baseStyle}
        <h2>Velar Notification</h2>
        <p>You have a new notification from Velar.</p>
        ${footer}`;
  }
};

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

    const { type, recipientEmail, data } = await req.json() as NotificationRequest;

    const subjects = {
      weather_alert: `⚠️ Migraine Risk Alert - Level ${data.riskLevel}/10`,
      pattern_detected: '🔍 New Pattern Detected in Your Migraine Data',
      medication_reminder: `💊 Time for ${data.medicationName || 'Your Medication'}`,
      weekly_report: '📊 Your Weekly Migraine Intelligence Report'
    };

    const emailResponse = await resend.emails.send({
      from: 'Velar AI <alerts@velar.app>',
      to: [recipientEmail],
      subject: subjects[type] || 'Velar Notification',
      html: getEmailTemplate(type, data),
    });

    // Log notification to database
    const { error: logError } = await supabaseClient
      .from('email_notifications')
      .insert({
        user_id: data.userId || null,
        notification_type: type,
        subject: subjects[type] || 'Velar Notification',
        content: JSON.stringify(data),
        status: emailResponse.error ? 'failed' : 'sent',
        metadata: emailResponse
      });

    if (logError) {
      console.error('Error logging notification:', logError);
    }

    return new Response(JSON.stringify({
      success: true,
      messageId: emailResponse.data?.id,
      error: emailResponse.error
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-notifications function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});