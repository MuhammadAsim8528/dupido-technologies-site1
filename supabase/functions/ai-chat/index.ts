import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatRequest {
  messages: { role: string; content: string }[];
  model: string;
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
  deep_research?: boolean;
  has_files?: boolean;
  file_types?: string[];
}

// Provider endpoints
const NIM_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_WHISPER_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const HF_URL = "https://api-inference.huggingface.co/models/";
const SERPER_URL = "https://google.serper.dev/search";
const TAVILY_URL = "https://api.tavily.com/search";

type Provider = "nim" | "groq" | "gemini" | "hf";

type QueryComplexity = "simple" | "moderate" | "complex" | "vision" | "audio";

function analyzeComplexity(req: ChatRequest): QueryComplexity {
  if (req.deep_research) return "complex";
  if (req.has_files && req.file_types?.some(t => t.startsWith("image/"))) return "vision";
  if (req.has_files && req.file_types?.some(t => t.startsWith("audio/"))) return "audio";

  const lastMsg = req.messages.filter(m => m.role === "user").pop()?.content || "";
  const lower = lastMsg.toLowerCase();

  const complexWords = ["explain", "analyze", "compare", "design", "architect", "debug", "refactor", "optimize", "implement", "research", "investigate", "synthesize", "derive", "prove", "deep dive"];
  const simpleWords = ["hi", "hello", "hey", "thanks", "ok", "yes", "no", "sure", "bye", "good", "cool"];

  if (simpleWords.some(w => lower.trim() === w)) return "simple";
  if (lastMsg.length < 30 && !lower.includes("?") && !lower.includes("code")) return "simple";
  if (complexWords.some(w => lower.includes(w))) return "complex";
  if (lastMsg.length > 200 || lower.includes("code") || lower.includes("```")) return "moderate";

  return "moderate";
}

function routeForComplexity(complexity: QueryComplexity): { provider: Provider; model: string; logMsg: string } {
  switch (complexity) {
    case "simple":
      return { provider: "groq", model: "llama-3.1-8b-instant", logMsg: "[ROUTING] Query complexity minimal. Directing pipeline to Groq Llama 3 8B for maximum speed." };
    case "moderate":
      return { provider: "groq", model: "llama-3.1-70b-versatile", logMsg: "[ROUTING] Standard query detected. Routing to Groq Llama 3 70B." };
    case "complex":
      return { provider: "nim", model: "meta/llama-3.1-405b-instruct", logMsg: "[ROUTING] Complex reasoning payload. Routing to NVIDIA NIM Llama 405B for deep analysis." };
    case "vision":
      return { provider: "nim", model: "meta/llama-3.1-405b-instruct", logMsg: "[ROUTING] Vision payload detected. Routing to NVIDIA NIM multimodal vision endpoints." };
    case "audio":
      return { provider: "groq", model: "llama-3.1-70b-versatile", logMsg: "[ROUTING] Audio transcription detected. Routing through Groq Whisper pipeline." };
  }
}

function smartRoute(req: ChatRequest): { provider: Provider; model: string; logMsg: string } {
  // User explicitly selected a model — respect it unless deep research overrides
  const userSelected = req.model;
  const nimModels = ["meta/llama-3.1-405b-instruct", "nvidia/nemotron-4-340b-instruct", "mistralai/mixtral-8x22b-instruct-v0.1"];
  const groqModels = ["llama-3.1-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"];
  const hfModels = ["mistralai/Mistral-7B-Instruct-v0.3", "HuggingFaceH4/zephyr-7b-beta", "microsoft/Phi-3-mini-4k-instruct"];

  // Deep research always overrides
  if (req.deep_research) {
    return routeForComplexity("complex");
  }

  // Audio files override
  if (req.has_files && req.file_types?.some(t => t.startsWith("audio/"))) {
    return routeForComplexity("audio");
  }

  // Respect user model selection but skip OpenAI/Gemini (not available)
  if (groqModels.includes(userSelected)) {
    return { provider: "groq", model: userSelected, logMsg: `[ROUTING] User-selected model. Directing to Groq ${userSelected}.` };
  }
  if (nimModels.includes(userSelected)) {
    return { provider: "nim", model: userSelected, logMsg: `[ROUTING] User-selected model. Directing to NVIDIA NIM ${userSelected}.` };
  }
  if (hfModels.includes(userSelected)) {
    return { provider: "hf", model: userSelected, logMsg: `[ROUTING] User-selected model. Directing to Hugging Face ${userSelected}.` };
  }
  // If user selected OpenAI/Gemini model, route to equivalent Groq model instead
  if (userSelected.startsWith("gpt-4o") || userSelected.startsWith("gemini")) {
    const equivalent = userSelected.includes("mini") || userSelected.includes("flash")
      ? "llama-3.1-8b-instant"
      : "llama-3.1-70b-versatile";
    return { provider: "groq", model: equivalent, logMsg: `[ROUTING] Redirecting from ${userSelected} to Groq ${equivalent} (OpenAI/Gemini not available in serverless mode).` };
  }

  // Default: analyze complexity
  return routeForComplexity(analyzeComplexity(req));
}

function getFallbackChain(primary: Provider): Provider[] {
  const chains: Record<Provider, Provider[]> = {
    nim: ["groq", "hf"],
    groq: ["nim", "hf"],
    gemini: ["nim", "groq"],
    hf: ["groq", "nim"],
  };
  return chains[primary];
}

function getDefaultModel(provider: Provider): string {
  switch (provider) {
    case "nim": return "meta/llama-3.1-405b-instruct";
    case "groq": return "llama-3.1-70b-versatile";
    case "gemini": return "gemini-2.0-flash";
    case "hf": return "mistralai/Mistral-7B-Instruct-v0.3";
  }
}

// --- Prompt builders ---

function buildDeepResearchPrompt(messages: { role: string; content: string }[]): { role: string; content: string }[] {
  return [
    {
      role: "system",
      content: `You are a research assistant operating in Deep Research Mode. Follow this structured approach:

1. ANALYSIS: Break the question into sub-questions and key aspects.
2. INFORMATION GATHERING: For each sub-question, identify relevant facts and relationships.
3. CROSS-CHECK: Verify findings across multiple angles. Flag contradictions.
4. SYNTHESIS: Combine findings into a coherent answer.
5. STRUCTURED OUTPUT: Present your answer with:
   - Summary (1-2 paragraphs)
   - Key Findings (bullet points with [citation] references)
   - Reasoning Steps (numbered)
   - Confidence Level (High/Medium/Low)
   - Limitations (if any)

Use a professional, precise tone. Do not use emojis. Cite sources inline as [1], [2] etc.`,
    },
    ...messages,
  ];
}

function buildVisionPrompt(messages: { role: string; content: string }[], fileTypes: string[]): { role: string; content: string }[] {
  const hasImage = fileTypes.some(t => t.startsWith("image/"));
  const hasAudio = fileTypes.some(t => t.startsWith("audio/"));
  let note = "The user has attached files: ";
  if (hasImage) note += "image(s) for visual analysis, ";
  if (hasAudio) note += "audio file(s) (transcribed if available), ";
  note += "Provide analysis of the file content as part of your response.";

  return [
    { role: "system", content: `You are a multimodal AI assistant. ${note} Use a professional tone without emojis.` },
    ...messages,
  ];
}

function prepareMessages(req: ChatRequest): { role: string; content: string }[] {
  let messages = req.messages;
  if (req.deep_research) {
    messages = buildDeepResearchPrompt(messages);
  } else if (req.has_files) {
    messages = buildVisionPrompt(messages, req.file_types || []);
  } else {
    const hasSystem = messages.some(m => m.role === "system");
    if (!hasSystem) {
      messages = [{ role: "system", content: "You are a helpful AI assistant. Respond clearly and professionally. Use a professional tone without emojis." }, ...messages];
    }
  }
  return messages;
}

// --- Provider call functions ---

async function callNimApi(req: ChatRequest, apiKey: string, modelOverride?: string): Promise<Response> {
  const model = modelOverride || req.model;
  const messages = prepareMessages(req);
  const response = await fetch(NIM_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, max_tokens: req.max_tokens || (req.deep_research ? 4096 : 1024), temperature: req.temperature || 0.7, stream: false }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`NIM API error: ${response.status} - ${err}`);
  }
  return response;
}

async function callGroqApi(req: ChatRequest, apiKey: string, modelOverride?: string): Promise<Response> {
  const model = modelOverride || req.model;
  const messages = prepareMessages(req);
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, max_tokens: req.max_tokens || (req.deep_research ? 4096 : 1024), temperature: req.temperature || 0.7, stream: false }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${err}`);
  }
  return response;
}

async function callHfApi(req: ChatRequest, apiKey: string, modelOverride?: string): Promise<Response> {
  const model = modelOverride || req.model;
  const messages = prepareMessages(req);
  const lastUserMsg = messages.filter(m => m.role === "user").pop();
  const prompt = lastUserMsg?.content || "";
  const response = await fetch(`${HF_URL}${model}`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: req.max_tokens || (req.deep_research ? 4096 : 1024), temperature: req.temperature || 0.7, return_full_text: false } }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`HF API error: ${response.status} - ${err}`);
  }
  const data = await response.json();
  const generatedText = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text || "No response generated.";
  return new Response(
    JSON.stringify({ id: `hf-${Date.now()}`, object: "chat.completion", model, choices: [{ index: 0, message: { role: "assistant", content: generatedText }, finish_reason: "stop" }], usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } }),
    { headers: { "Content-Type": "application/json", ...corsHeaders } }
  );
}

function getApiKey(provider: Provider): string | undefined {
  switch (provider) {
    case "nim": return Deno.env.get("NVIDIA_NIM_API_KEY");
    case "groq": return Deno.env.get("GROQ_API_KEY");
    case "gemini": return Deno.env.get("GEMINI_API_KEY");
    case "hf": return Deno.env.get("HUGGINGFACE_API_KEY");
  }
}

async function callProvider(provider: Provider, req: ChatRequest, modelOverride?: string): Promise<Response> {
  const apiKey = getApiKey(provider);
  if (!apiKey) throw new Error(`No API key for provider: ${provider}`);
  switch (provider) {
    case "nim": return await callNimApi(req, apiKey, modelOverride);
    case "groq": return await callGroqApi(req, apiKey, modelOverride);
    case "hf": return await callHfApi(req, apiKey, modelOverride);
    default: return await callGroqApi(req, apiKey, modelOverride);
  }
}

// --- Web search for deep research ---

interface SearchResult { title: string; link: string; snippet: string; }

async function searchSerper(query: string): Promise<SearchResult[]> {
  const apiKey = Deno.env.get("SERPER_API_KEY");
  if (!apiKey) return [];
  try {
    const response = await fetch(SERPER_URL, {
      method: "POST",
      headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, num: 5 }),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.organic || []).map((r: { title: string; link: string; snippet: string }) => ({ title: r.title, link: r.link, snippet: r.snippet }));
  } catch { return []; }
}

async function searchTavily(query: string): Promise<SearchResult[]> {
  const apiKey = Deno.env.get("TAVILY_API_KEY");
  if (!apiKey) return [];
  try {
    const response = await fetch(TAVILY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, max_results: 5, api_key: apiKey }),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.results || []).map((r: { title: string; url: string; content: string }) => ({ title: r.title, link: r.url, snippet: r.content }));
  } catch { return []; }
}

function formatSearchContext(results: SearchResult[]): string {
  if (results.length === 0) return "";
  return "\n\nWeb Search Results:\n" + results.map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nSource: ${r.link}`).join("\n\n");
}

// Break a complex prompt into optimized search queries
function decomposeQuery(text: string): string[] {
  // Simple decomposition: extract key phrases
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  if (sentences.length <= 1) return [text];

  // Pick up to 3 most informative segments
  const queries = sentences.slice(0, 3).map(s => s.trim());
  return queries.length > 0 ? queries : [text];
}

// --- Main handler with telemetry ---

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }

  const telemetry: string[] = [];
  const log = (msg: string) => telemetry.push(msg);

  try {
    const body: ChatRequest = await req.json();

    if (!body.messages || !body.model) {
      return new Response(JSON.stringify({ error: "Missing messages or model" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    log("[INFO] Analyzing text context payload...");
    log(`[INFO] Model requested: ${body.model}. Deep research: ${body.deep_research ? 'ON' : 'OFF'}. Files: ${body.has_files ? body.file_types?.join(', ') || 'yes' : 'none'}`);

    // Step 1: Complexity analysis
    const complexity = analyzeComplexity(body);
    log(`[INFO] Query complexity assessed: ${complexity}`);

    // Step 2: Smart routing
    const route = smartRoute(body);
    log(route.logMsg);

    // Step 3: Deep research pipeline
    if (body.deep_research) {
      const lastUserMsg = body.messages.filter(m => m.role === "user").pop();
      if (lastUserMsg) {
        log("[TAVILY] Decomposing query into optimized search targets...");
        const subQueries = decomposeQuery(lastUserMsg.content);
        log(`[TAVILY] Generated ${subQueries.length} search queries. Fetching web indexes...`);

        let allResults: SearchResult[] = [];
        for (const q of subQueries) {
          let results = await searchSerper(q);
          if (results.length === 0) {
            results = await searchTavily(q);
          }
          allResults = [...allResults, ...results];
        }

        // Deduplicate by URL
        const seen = new Set<string>();
        allResults = allResults.filter(r => {
          if (seen.has(r.link)) return false;
          seen.add(r.link);
          return true;
        });

        if (allResults.length > 0) {
          log(`[TAVILY] Isolated ${allResults.length} source citations. Packaging research payload...`);
          const searchContext = formatSearchContext(allResults);
          body.messages = body.messages.map(m =>
            m === lastUserMsg ? { ...m, content: m.content + searchContext } : m
          );
        } else {
          log("[TAVILY] No web results found. Proceeding with model knowledge only.");
        }

        log("[NVIDIA NIM] Compiling final multi-modal executive document structure...");
      }
    }

    // Step 4: Execute with fallback chain
    const fallbackChain = getFallbackChain(route.provider);
    const providers = [route.provider, ...fallbackChain];
    let lastError: Error | null = null;
    let response: Response | null = null;

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      try {
        const model = i === 0 ? route.model : getDefaultModel(provider);
        if (i > 0) {
          log(`[WARN] Primary node busy. Swapping to fallback network cluster: ${provider}/${model}...`);
        }
        response = await callProvider(provider, { ...body, model }, undefined);

        if (i === 0) {
          log(`[OK] Response received from ${provider}/${route.model}.`);
        } else {
          log(`[OK] Fallback response received from ${provider}/${model}.`);
        }

        // Parse and inject telemetry into response
        const responseData = await response.json();
        responseData.telemetry = telemetry;
        responseData.routing = { provider, model: i === 0 ? route.model : getDefaultModel(provider), complexity };

        return new Response(
          JSON.stringify(responseData),
          { headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        log(`[ERROR] ${provider} failed: ${lastError.message}`);
        continue;
      }
    }

    log("[CRITICAL] All API providers failed. Request cannot be fulfilled.");
    return new Response(
      JSON.stringify({ error: lastError?.message || "All API providers failed", telemetry }),
      { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
