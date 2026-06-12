import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { api_key, action, model, tokens_in, tokens_out } = await req.json();

    if (!api_key) {
      return new Response(JSON.stringify({ error: "API key required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prefix = api_key.slice(0, 7);
    const keyHash = btoa(api_key);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseHeaders = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    };

    // Look up API key
    const keyRes = await fetch(
      `${supabaseUrl}/rest/v1/api_keys?select=user_id,id&key_prefix=eq.${prefix}&key_hash=eq.${keyHash}&revoked_at=is.null`,
      { headers: supabaseHeaders }
    );
    const keys = await keyRes.json();

    if (!keys || keys.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid API key" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id, id: api_key_id } = keys[0];

    // Check subscription limits
    const subRes = await fetch(
      `${supabaseUrl}/rest/v1/subscriptions?select=plan,status,usage_limit,usage_used&user_id=eq.${user_id}`,
      { headers: supabaseHeaders }
    );
    const subs = await subRes.json();

    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ error: "No active subscription" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sub = subs[0];
    if (sub.status !== "active") {
      return new Response(JSON.stringify({ error: "Subscription not active" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (sub.usage_limit > 0 && sub.usage_used >= sub.usage_limit) {
      return new Response(JSON.stringify({ error: "Usage limit exceeded" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log usage
    if (action) {
      await fetch(`${supabaseUrl}/rest/v1/usage_logs`, {
        method: "POST",
        headers: supabaseHeaders,
        body: JSON.stringify({
          user_id,
          api_key_id,
          action,
          model: model || null,
          tokens_in: tokens_in || 0,
          tokens_out: tokens_out || 0,
          ip_address: req.headers.get("x-forwarded-for") || null,
        }),
      });

      // Increment usage counter
      await fetch(
        `${supabaseUrl}/rest/v1/rpc/increment_usage`,
        {
          method: "POST",
          headers: supabaseHeaders,
          body: JSON.stringify({ p_user_id: user_id }),
        }
      ).catch(() => {
        // Fallback: direct update if RPC doesn't exist
        fetch(`${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${user_id}`, {
          method: "PATCH",
          headers: supabaseHeaders,
          body: JSON.stringify({ usage_used: sub.usage_used + 1 }),
        });
      });
    }

    // Update last_used on API key
    fetch(`${supabaseUrl}/rest/v1/api_keys?id=eq.${api_key_id}`, {
      method: "PATCH",
      headers: supabaseHeaders,
      body: JSON.stringify({ last_used: new Date().toISOString() }),
    });

    return new Response(
      JSON.stringify({
        valid: true,
        user_id,
        plan: sub.plan,
        remaining: sub.usage_limit > 0 ? sub.usage_limit - sub.usage_used : -1,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
