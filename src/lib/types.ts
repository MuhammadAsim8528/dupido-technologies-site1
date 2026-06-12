export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  phone_verified: boolean;
  email_verified: boolean;
  role: 'user' | 'admin';
  risk_score: number;
  two_factor_enabled: boolean;
  two_factor_secret: string | null;
  notification_preferences: NotificationPrefs;
  created_at: string;
  updated_at: string;
}

export interface NotificationPrefs {
  email: boolean;
  usage_alerts: boolean;
  security_alerts: boolean;
  marketing: boolean;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'past_due' | 'cancelled' | 'trialing';
  current_period_start: string;
  current_period_end: string | null;
  usage_limit: number;
  usage_used: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  last_used: string | null;
  created_at: string;
  revoked_at: string | null;
}

export interface UsageLog {
  id: string;
  user_id: string;
  api_key_id: string | null;
  action: string;
  model: string | null;
  tokens_in: number;
  tokens_out: number;
  latency_ms: number | null;
  ip_address: string | null;
  created_at: string;
}

export interface SecurityLog {
  id: string;
  user_id: string | null;
  action: string;
  ip_address: string | null;
  user_agent: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  subscription_id: string | null;
  amount_cents: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  stripe_invoice_id: string | null;
  created_at: string;
  paid_at: string | null;
}

export interface UserSession {
  id: string;
  user_id: string;
  token: string;
  device_name: string | null;
  device_type: string | null;
  ip_address: string | null;
  user_agent: string | null;
  last_active: string;
  created_at: string;
}

export interface VerificationOtp {
  id: string;
  user_id: string;
  type: 'email' | 'phone' | '2fa';
  code: string;
  verified: boolean;
  expires_at: string;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string;
  version: string;
  category: ProjectCategory;
  file_url: string;
  file_name: string;
  file_size: number;
  preview_image_url: string | null;
  download_count: number;
  featured: boolean;
  changelog: string | null;
  status: 'published' | 'draft' | 'archived';
  created_at: string;
  updated_at: string;
}

export type ProjectCategory = 'ai_tools' | 'apps' | 'scripts' | 'libraries' | 'other';

export const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  ai_tools: 'AI Tools',
  apps: 'Applications',
  scripts: 'Scripts',
  libraries: 'Libraries',
  other: 'Other',
};

export interface ChatConversation {
  id: string;
  user_id: string | null;
  title: string;
  model: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model: string | null;
  tokens_in: number;
  tokens_out: number;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  read: boolean;
  created_at: string;
}

export type PlanDetails = {
  name: string;
  price: string;
  priceCents: number;
  features: string[];
  usageLimit: number;
  popular?: boolean;
  description: string;
  icon: string;
  lemonVariantId?: string;
};

export const PLANS: Record<Subscription['plan'], PlanDetails> = {
  free: {
    name: 'Free',
    price: '$0',
    priceCents: 0,
    usageLimit: 100,
    description: 'For exploring and prototyping',
    icon: 'zap',
    features: ['100 requests/month', 'Base models (NIM + HF)', 'Community support', '1 API key', 'Basic analytics'],
  },
  starter: {
    name: 'Starter',
    price: '$20',
    priceCents: 2000,
    usageLimit: 5000,
    description: 'For individuals building real projects',
    icon: 'rocket',
    features: ['5,000 requests/month', 'All models + deep research', 'Email support (24h)', '5 API keys', 'File upload & vision', 'Usage analytics'],
  },
  pro: {
    name: 'Pro',
    price: '$60',
    priceCents: 6000,
    usageLimit: 50000,
    description: 'For teams shipping at scale',
    icon: 'crown',
    popular: true,
    features: ['50,000 requests/month', 'Priority access + web search', 'Priority support (4h)', 'Unlimited API keys', 'Advanced analytics & export', 'Deep research + citations', 'Custom fine-tuning'],
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Custom',
    priceCents: 0,
    usageLimit: -1,
    description: 'For organizations with advanced needs',
    icon: 'building',
    features: ['Unlimited requests', 'Custom model hosting', 'Dedicated account manager', '99.99% SLA', 'SSO / SAML / SCIM', 'On-premise deployment', 'Audit logs & compliance'],
  },
};

export const MODEL_OPTIONS = [
  { id: 'meta/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', provider: 'NVIDIA NIM', color: '#10b981', speed: 'Fast', context: '128K', group: 'nvidia' },
  { id: 'nvidia/nemotron-4-340b-instruct', name: 'Nemotron 4 340B', provider: 'NVIDIA NIM', color: '#22d3ee', speed: 'Medium', context: '4K', group: 'nvidia' },
  { id: 'mistralai/mixtral-8x22b-instruct-v0.1', name: 'Mixtral 8x22B', provider: 'NVIDIA NIM', color: '#f59e0b', speed: 'Fast', context: '64K', group: 'nvidia' },
  { id: 'mistralai/Mistral-7B-Instruct-v0.3', name: 'Mistral 7B', provider: 'Hugging Face', color: '#ef4444', speed: 'Very Fast', context: '32K', group: 'huggingface' },
  { id: 'HuggingFaceH4/zephyr-7b-beta', name: 'Zephyr 7B', provider: 'Hugging Face', color: '#8b5cf6', speed: 'Very Fast', context: '32K', group: 'huggingface' },
  { id: 'microsoft/Phi-3-mini-4k-instruct', name: 'Phi-3 Mini', provider: 'Hugging Face', color: '#6366f1', speed: 'Very Fast', context: '4K', group: 'huggingface' },
  { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B', provider: 'Groq', color: '#f55036', speed: 'Ultra Fast', context: '128K', group: 'groq' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', provider: 'Groq', color: '#ff6b4a', speed: 'Ultra Fast', context: '128K', group: 'groq' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', provider: 'Groq', color: '#f97316', speed: 'Ultra Fast', context: '32K', group: 'groq' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google', color: '#4285f4', speed: 'Ultra Fast', context: '1M', group: 'google' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', color: '#34a853', speed: 'Fast', context: '2M', group: 'google' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', color: '#10a37f', speed: 'Fast', context: '128K', group: 'openai' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', color: '#1a7f64', speed: 'Ultra Fast', context: '128K', group: 'openai' },
];
