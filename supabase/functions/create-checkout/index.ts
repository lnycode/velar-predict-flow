import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Input validation schema
const checkoutRequestSchema = z.object({
  tier: z.enum(['premium', 'pro'])
});

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

    // Validate input
    const body = await req.json();
    const validationResult = checkoutRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.errors);
      return new Response(JSON.stringify({ 
        error: "Invalid request data. Tier must be 'premium' or 'pro'."
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { tier } = validationResult.data;
    
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2023-10-16" 
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ 
      email: userData.user.email, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Define pricing tiers
    const pricingPlans = {
      premium: {
        name: "Velar Premium",
        price: 1499, // $14.99
        features: [
          "Advanced AI Predictions",
          "Extended Weather Analysis", 
          "Personalized Insights",
          "Email Notifications",
          "Data Export",
          "Priority Support"
        ]
      },
      pro: {
        name: "Velar Pro", 
        price: 2999, // $29.99
        features: [
          "Everything in Premium",
          "Real-time Risk Monitoring",
          "Advanced Pattern Recognition",
          "Medication Optimization",
          "Telehealth Integration",
          "White-glove Support"
        ]
      }
    };

    const selectedPlan = pricingPlans[tier as keyof typeof pricingPlans];
    if (!selectedPlan) {
      throw new Error("Invalid subscription tier");
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userData.user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: selectedPlan.name,
              description: `${selectedPlan.features.slice(0, 3).join(" • ")} and more`,
              images: ["https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400"],
            },
            unit_amount: selectedPlan.price,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/subscription-success?tier=${tier}`,
      cancel_url: `${req.headers.get("origin")}/settings`,
      metadata: {
        user_id: userData.user.id,
        tier: tier,
      },
      subscription_data: {
        metadata: {
          user_id: userData.user.id,
          tier: tier,
        },
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in create-checkout:", error);
    return new Response(JSON.stringify({ error: "An error occurred while creating checkout session" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});