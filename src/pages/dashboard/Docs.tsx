import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Copy, CheckCircle2, ChevronDown, ChevronRight, Zap, Terminal, Shield, Code2 } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { MODEL_OPTIONS } from '../../lib/types';

const endpoints = [
  {
    method: 'POST',
    path: '/v1/chat/completions',
    desc: 'Create a chat completion',
    body: `{
  "model": "gpt-4o",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "temperature": 0.7,
  "max_tokens": 1024
}`,
    response: `{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "model": "gpt-4o",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Hello! How can I help you today?"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 8,
    "total_tokens": 28
  }
}`,
  },
  {
    method: 'POST',
    path: '/v1/completions',
    desc: 'Create a text completion',
    body: `{
  "model": "gpt-4o",
  "prompt": "Once upon a time",
  "max_tokens": 50,
  "temperature": 0.8
}`,
    response: `{
  "id": "cmpl-xyz789",
  "object": "text_completion",
  "model": "gpt-4o",
  "choices": [{
    "text": " there was a small village nestled between two mountains.",
    "index": 0,
    "finish_reason": "length"
  }]
}`,
  },
  {
    method: 'GET',
    path: '/v1/models',
    desc: 'List available models',
    body: null,
    response: `{
  "object": "list",
  "data": [
    {"id": "gpt-4o", "object": "model", "provider": "openai"},
    {"id": "claude-3.5-sonnet", "object": "model", "provider": "anthropic"},
    {"id": "gemini-1.5-pro", "object": "model", "provider": "google"}
  ]
}`,
  },
  {
    method: 'GET',
    path: '/v1/usage',
    desc: 'Get your usage statistics',
    body: null,
    response: `{
  "total_requests": 1247,
  "tokens_used": 89432,
  "period": "2026-06",
  "plan": "pro",
  "limit": 50000,
  "remaining": 48753
}`,
  },
];

const methodColors: Record<string, string> = {
  GET: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  POST: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  PUT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  DELETE: 'bg-red-500/10 text-red-400 border-red-500/20',
};

function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    addToast('info', 'Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border-b border-white/5 rounded-t-lg">
        <span className="text-xs text-slate-600 font-mono">{label || 'json'}</span>
        <button onClick={handleCopy} className="text-slate-600 hover:text-slate-400 transition-colors">
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <pre className="px-4 py-3 text-xs font-mono text-slate-400 overflow-x-auto leading-relaxed bg-slate-900/50 rounded-b-lg">
        {code}
      </pre>
    </div>
  );
}

export default function Docs() {
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>('/v1/chat/completions');
  const [activeTab, setActiveTab] = useState<'curl' | 'python' | 'node'>('curl');

  const getCodeSnippet = (endpoint: typeof endpoints[0]) => {
    const baseUrl = 'https://api.dupido.com';
    const apiKey = 'dp_your_api_key_here';

    if (endpoint.method === 'GET') {
      const snippets = {
        curl: `curl ${baseUrl}${endpoint.path} \\
  -H "Authorization: Bearer ${apiKey}"`,
        python: `import dupido\nclient = dupido.Client("${apiKey}")\nmodels = client.models.list()`,
        node: `import Dupido from 'dupido';\nconst client = new Dupido("${apiKey}");\nconst models = await client.models.list();`,
      };
      return snippets[activeTab];
    }

    const snippets = {
      curl: `curl ${baseUrl}${endpoint.path} \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '${endpoint.body}'`,
      python: `import dupido\nclient = dupido.Client("${apiKey}")\n\nresponse = client.chat.create(\n${endpoint.body?.split('\n').slice(1, -1).join('\n') || ''}\n)`,
      node: `import Dupido from 'dupido';\nconst client = new Dupido("${apiKey}");\n\nconst response = await client.chat.create(\n${endpoint.body?.split('\n').slice(1, -1).join('\n') || ''}\n);`,
    };
    return snippets[activeTab];
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-emerald-400" /> API Reference
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          OpenAI-compatible endpoints. Drop-in replacement for existing integrations.
        </p>
      </div>

      {/* Quick start */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Quick Start</h2>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <p className="text-xs text-slate-500 flex-1">
            Get your API key from the <a href="/dashboard/api-keys" className="text-emerald-400 hover:text-emerald-300">API Keys</a> page, then:
          </p>
          <div className="flex items-center gap-1">
            {(['curl', 'python', 'node'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${activeTab === tab ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-600 hover:text-slate-400'}`}
              >
                {tab === 'node' ? 'Node.js' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <CodeBlock
          code={getCodeSnippet(endpoints[0])}
          label={activeTab}
        />
      </div>

      {/* Authentication */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Authentication</h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed mb-3">
          All API requests require a Bearer token in the Authorization header. Your API keys can be managed from the dashboard.
        </p>
        <CodeBlock code={`Authorization: Bearer dp_your_api_key_here`} label="header" />
      </div>

      {/* Endpoints */}
      <div className="space-y-2">
        <h2 className="section-label flex items-center gap-2"><Terminal className="w-4 h-4" /> Endpoints</h2>

        {endpoints.map((ep) => {
          const isExpanded = expandedEndpoint === ep.path;
          return (
            <div key={ep.path} className="card !p-0 overflow-hidden">
              <button
                onClick={() => setExpandedEndpoint(isExpanded ? null : ep.path)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors text-left"
              >
                <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold border ${methodColors[ep.method]}`}>
                  {ep.method}
                </span>
                <code className="text-sm text-slate-300 font-mono flex-1">{ep.path}</code>
                <span className="text-xs text-slate-500 hidden sm:inline">{ep.desc}</span>
                {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-600" /> : <ChevronRight className="w-4 h-4 text-slate-600" />}
              </button>

              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-t border-white/5 px-5 py-4 space-y-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-slate-500">Request code:</span>
                    <div className="flex items-center gap-1">
                      {(['curl', 'python', 'node'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`px-2 py-0.5 rounded text-[10px] transition-colors ${activeTab === tab ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-600 hover:text-slate-400'}`}
                        >
                          {tab === 'node' ? 'Node' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <CodeBlock code={getCodeSnippet(ep)} label={activeTab} />

                  {ep.body && (
                    <>
                      <p className="text-xs text-slate-500 font-medium">Request Body</p>
                      <CodeBlock code={ep.body} label="body.json" />
                    </>
                  )}
                  <p className="text-xs text-slate-500 font-medium">Response</p>
                  <CodeBlock code={ep.response} label="response.json" />
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Available Models */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Code2 className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Available Models</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          {MODEL_OPTIONS.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 glass rounded-xl">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: m.color }} />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-300 font-medium">{m.name}</div>
                <div className="text-[10px] text-slate-600">{m.provider} · {m.context} context</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
