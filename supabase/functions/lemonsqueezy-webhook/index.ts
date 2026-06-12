import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.43.4";
import * as crypto from "jsr:@std/crypto@1.0.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const encoder = new TextEncoder();
  const hmac = crypto.subtle.sign("HMAC",
    crypto.subtle.importKey("raw", encoder.encode(secret), { hash: "SHA-256", name: "HMAC" }, false, ["sign"]),
    encoder.encode(body)
  );

  // Using synchronous approach with crypto
  const hmacKey = crypto.getRandomValues(new Uint8Array(32));
  const keyStr = crypto.subtle.importKey("raw", encoder.encode(secret), { hash: "SHA-256", name: "HMAC" }, false, ["sign"]);

  // Use a simpler approach: compute HMAC-SHA256
  const key = new TextEncoder().encode(secret);
  const data = new TextEncoder().encode(body);

  // For Lemon Squeezy, the signature format is typically base64 encoded
  const computedHmac = crypto.subtle.sign(
    "HMAC",
    await crypto.subtle.importKey("raw", key, { hash: "SHA-256", name: "HMAC" }, false, ["sign"]),
    data
  );

  return signature === btoa(String.fromCharCode(...new Uint8Array(computedHmac)));
}

function mapVariantToPlan(variantName: string): "free" | "starter" | "pro" | "enterprise" {
  const lower = variantName.toLowerCase();
  if (lower.includes("enterprise")) return "enterprise";
  if (lower.includes("pro")) return "pro";
  if (lower.includes("starter")) return "starter";
  return "free";
}

function getUsageLimit(plan: string): number {
  switch (plan) {
    case "free":
      return 100;
    case "starter":
      return 5000;
    case "pro":
      return 50000;
    case "enterprise":
      return -1;
    default:
      return 100;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("x-signature");

    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify webhook signature
    const secret = Deno.env.get("LEMON_SQUEEZY_WEBHOOK_SECRET");
    if (!secret) {
      return new Response(JSON.stringify({ error: "Missing webhook secret" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Compute HMAC-SHA256 signature
    const encoder = new TextEncoder();
    const key = encoder.encode(secret);
    const data = encoder.encode(body);
    const hmacBuffer = await crypto.subtle.sign("HMAC",
      await crypto.subtle.importKey("raw", key, { hash: "SHA-256", name: "HMAC" }, false, ["sign"]),
      data
    );
    const computedSignature = btoa(String.fromCharCode(...new Uint8Array(hmacBuffer)));

    if (computedSignature !== signature) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse the payload
    const payload = JSON.parse(body);
    const eventType = payload.meta?.event_name;

    if (!["subscription_created", "order_created"].includes(eventType)) {
      return new Response(JSON.stringify({ message: "Event type not processed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = payload.data;
    const userEmail = data.attributes?.user_email;

    // Extract variant name based on event type
    let variantName = "";
    if (eventType === "subscription_created") {
      variantName = data.attributes?.variant_name || "";
    } else if (eventType === "order_created") {
      variantName = data.attributes?.first_order_item?.variant_name || "";
    }

    if (!userEmail || !variantName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map variant to plan tier
    const plan = mapVariantToPlan(variantName);
    const usageLimit = getUsageLimit(plan);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase config" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the user by email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", userEmail)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update or insert subscription
    const { error: subscriptionError } = await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id: profile.id,
          plan,
          usage_limit: usageLimit,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (subscriptionError) {
      return new Response(JSON.stringify({ error: "Failed to update subscription" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ message: "Webhook processed successfully" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
