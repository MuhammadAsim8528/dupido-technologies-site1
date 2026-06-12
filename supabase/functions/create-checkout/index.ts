import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CheckoutRequest {
  user_email: string;
  plan: "starter" | "pro" | "enterprise";
}

function getVariantId(plan: string): string {
  const variantMap: Record<string, string | undefined> = {
    starter: Deno.env.get("LEMON_VARIANT_STARTER"),
    pro: Deno.env.get("LEMON_VARIANT_PRO"),
    enterprise: Deno.env.get("LEMON_VARIANT_ENTERPRISE"),
  };

  const variantId = variantMap[plan];
  if (!variantId) {
    throw new Error(`Missing variant ID for plan: ${plan}`);
  }

  return variantId;
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
    // Get environment variables
    const apiKey = Deno.env.get("LEMON_SQUEEZY_API_KEY");
    const storeId = Deno.env.get("LEMON_SQUEEZY_STORE_ID");

    if (!apiKey || !storeId) {
      return new Response(JSON.stringify({ error: "Missing Lemon Squeezy configuration" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const body: CheckoutRequest = await req.json();
    const { user_email, plan } = body;

    if (!user_email || !plan) {
      return new Response(JSON.stringify({ error: "Missing required fields: user_email and plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["starter", "pro", "enterprise"].includes(plan)) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the variant ID for the plan
    const variantId = getVariantId(plan);

    // Create checkout via Lemon Squeezy API
    const checkoutPayload = {
      data: {
        type: "checkouts",
        attributes: {
          store_id: parseInt(storeId),
          variant_id: parseInt(variantId),
          customer_email: user_email,
          custom_data: {
            user_email,
          },
        },
      },
    };

    const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(checkoutPayload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return new Response(JSON.stringify({ error: `Lemon Squeezy API error: ${response.statusText}`, details: errorData }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const checkoutResponse = await response.json();
    const checkoutUrl = checkoutResponse.data?.attributes?.url;

    if (!checkoutUrl) {
      return new Response(JSON.stringify({ error: "Failed to create checkout" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ url: checkoutUrl }), {
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
