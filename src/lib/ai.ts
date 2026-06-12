export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.5);
}

export function trimMessagesToContext(
  messages: { role: string; content: string }[],
  maxTokens: number,
  systemPrompt?: string
): { role: string; content: string }[] {
  const systemTokens = systemPrompt ? estimateTokens(systemPrompt) : 0;
  const available = maxTokens - systemTokens - 512;
  let total = 0;
  const trimmed: { role: string; content: string }[] = [];

  for (let i = messages.length - 1; i >= 0; i--) {
    const msgTokens = estimateTokens(messages[i].content);
    if (total + msgTokens > available) {
      if (trimmed.length < messages.length) {
        trimmed.unshift({
          role: 'system',
          content: `[Earlier conversation context summarized: ${i} messages omitted. Key points preserved.]`,
        });
      }
      break;
    }
    total += msgTokens;
    trimmed.unshift(messages[i]);
  }

  return trimmed;
}

export function condenseHistory(
  messages: { role: string; content: string }[],
  threshold: number = 8
): { role: string; content: string }[] {
  if (messages.length <= threshold) return messages;

  const older = messages.slice(0, messages.length - threshold + 2);
  const recent = messages.slice(messages.length - threshold + 2);

  const summaryParts = older
    .filter(m => m.role !== 'system')
    .map(m => `${m.role}: ${m.content.slice(0, 100)}`)
    .join('; ');

  return [
    {
      role: 'system',
      content: `[Condensed context from ${older.length} earlier messages: ${summaryParts}]`,
    },
    ...recent,
  ];
}

export function formatTokenCount(tokens: number): string {
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
  return String(tokens);
}

export const CONTEXT_WINDOWS: Record<string, number> = {
  'meta/llama-3.1-405b-instruct': 128000,
  'nvidia/nemotron-4-340b-instruct': 4096,
  'mistralai/mixtral-8x22b-instruct-v0.1': 64000,
  'mistralai/Mistral-7B-Instruct-v0.3': 32000,
  'HuggingFaceH4/zephyr-7b-beta': 32000,
  'microsoft/Phi-3-mini-4k-instruct': 4096,
  'llama-3.1-70b-versatile': 128000,
  'llama-3.1-8b-instant': 128000,
  'mixtral-8x7b-32768': 32000,
  'gemini-2.0-flash': 1048576,
  'gemini-1.5-pro': 2097152,
  'gpt-4o': 128000,
  'gpt-4o-mini': 128000,
};

export const DEFAULT_CONTEXT = 32000;

export type QueryComplexity = 'simple' | 'moderate' | 'complex' | 'vision' | 'audio';

export function analyzeQueryComplexity(
  text: string,
  hasFiles: boolean,
  fileTypes: string[],
  deepResearch: boolean
): QueryComplexity {
  if (deepResearch) return 'complex';
  if (hasFiles && fileTypes.some(t => t.startsWith('image/'))) return 'vision';
  if (hasFiles && fileTypes.some(t => t.startsWith('audio/'))) return 'audio';

  const lower = text.toLowerCase();
  const complexIndicators = [
    'explain', 'analyze', 'compare', 'evaluate', 'synthesize',
    'design', 'architect', 'debug', 'refactor', 'optimize',
    'implement', 'create a', 'build a', 'write a', 'how does',
    'why does', 'what if', 'calculate', 'derive', 'prove',
    'research', 'investigate', 'deep dive',
  ];
  const simpleIndicators = [
    'hi', 'hello', 'hey', 'thanks', 'thank you', 'ok', 'yes', 'no',
    'sure', 'got it', 'cool', 'nice', 'bye', 'good',
  ];

  if (simpleIndicators.some(ind => lower.trim() === ind)) return 'simple';
  if (text.length < 30 && !lower.includes('?') && !lower.includes('code')) return 'simple';
  if (complexIndicators.some(ind => lower.includes(ind))) return 'complex';
  if (text.length > 200 || (text.includes('```') || lower.includes('code'))) return 'moderate';

  return 'moderate';
}

export function getRouteForComplexity(
  complexity: QueryComplexity
): { provider: string; model: string; reason: string } {
  switch (complexity) {
    case 'simple':
      return { provider: 'groq', model: 'llama-3.1-8b-instant', reason: 'Query complexity minimal. Directing pipeline to Groq for maximum speed.' };
    case 'moderate':
      return { provider: 'groq', model: 'llama-3.1-70b-versatile', reason: 'Standard query detected. Routing to Groq Llama 3 70B for balanced speed and quality.' };
    case 'complex':
      return { provider: 'nim', model: 'meta/llama-3.1-405b-instruct', reason: 'Complex reasoning detected. Routing to NVIDIA NIM Llama 405B for deep analysis.' };
    case 'vision':
      return { provider: 'nim', model: 'meta/llama-3.1-405b-instruct', reason: 'Vision payload detected. Routing to NVIDIA NIM multimodal vision endpoints.' };
    case 'audio':
      return { provider: 'groq', model: 'llama-3.1-70b-versatile', reason: 'Audio transcription detected. Routing through Groq Whisper for instant transcription.' };
  }
}
