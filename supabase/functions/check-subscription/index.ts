import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !userData.user?.email) {
      throw new Error("User not authenticated");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2023-10-16" 
    });

    // Check if customer exists in Stripe
    const customers = await stripe.customers.list({ 
      email: userData.user.email, 
      limit: 1 
    });

    if (customers.data.length === 0) {
      // No customer found, user is on free tier
      await supabaseClient
        .from("subscriptions")
        .upsert({
          user_id: userData.user.id,
          tier: "free",
          status: "active",
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      return new Response(JSON.stringify({
        subscribed: false,
        tier: "free",
        status: "active"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId = customers.data[0].id;

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    let subscriptionData = {
      subscribed: false,
      tier: "free",
      status: "active",
      current_period_end: null,
      stripe_customer_id: customerId,
      stripe_subscription_id: null,
    };

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      const tier = subscription.metadata.tier || "premium";
      
      subscriptionData = {
        subscribed: true,
        tier,
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
      };
    }

    // Update subscription in database
    await supabaseClient
      .from("subscriptions")
      .upsert({
        user_id: userData.user.id,
        stripe_customer_id: subscriptionData.stripe_customer_id,
        stripe_subscription_id: subscriptionData.stripe_subscription_id,
        tier: subscriptionData.tier,
        status: subscriptionData.status,
        current_period_end: subscriptionData.current_period_end,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    // Also update profile subscription info
    await supabaseClient
      .from("profiles")
      .update({
        subscription_tier: subscriptionData.tier,
        subscription_active: subscriptionData.subscribed,
        subscription_end: subscriptionData.current_period_end,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userData.user.id);

    return new Response(JSON.stringify(subscriptionData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in check-subscription:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      subscribed: false,
      tier: "free"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});