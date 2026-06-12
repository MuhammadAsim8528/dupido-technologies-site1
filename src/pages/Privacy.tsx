import { ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const sections = [
  { title: '1. Information We Collect', content: 'We collect: account information (email, name), usage data (API requests, token consumption, chat histories), device information (browser, IP), uploaded content (files, images), and payment information processed through Lemon Squeezy.' },
  { title: '2. Ingestion Logging Protocols', content: 'All data ingested through API endpoints is logged for service improvement, security monitoring, and compliance. Ingestion logs are retained for 90 days in encrypted storage and automatically purged thereafter. You may request early deletion.' },
  { title: '3. Dynamic Token Retention', content: 'Input tokens are processed in transient memory and not persisted beyond the request lifecycle unless you save conversation history. Output tokens are stored in your history and can be deleted anytime. Token-level data is never used to retrain models without explicit opt-in consent.' },
  { title: '4. Cookies and Analytical Tracking', content: 'We use essential cookies (authentication, CSRF), analytical cookies (usage statistics, performance), and preference cookies (settings, model selections). Third-party analytics services process data under restricted agreements. We do not sell cookie data or use it for cross-site tracking.' },
  { title: '5. Automated Payload Security Scanning', content: 'All payloads are subject to automated security scanning including malware detection, zip bomb detection, content policy scanning, and anomaly detection. Flagged payloads are quarantined and may result in account action per our Terms of Service.' },
  { title: '6. Data Sharing', content: 'Your data is shared with AI inference providers (NVIDIA NIM, Hugging Face, Groq, Google Gemini, OpenAI) only to fulfill your specific requests. For deep research, search queries are sent to Serper and/or Tavily. We do not sell, rent, or trade personal data for marketing purposes.' },
  { title: '7. Your Rights', content: 'You have the right to access, correct, delete, export, object to processing, and withdraw consent. Use dashboard settings or contact privacy@dupido.com. We respond within 30 days.' },
  { title: '8. Data Security', content: 'We implement AES-256 encryption at rest, TLS 1.3 in transit, row-level security policies, regular security audits, access controls, and automated payload scanning. We encourage strong passwords, 2FA, and protecting API keys.' },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-emerald-500/[0.03] rounded-full blur-[120px]" />
      <div className="max-w-3xl mx-auto px-6 py-12 relative">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-400 transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-7 h-7 text-emerald-400" />
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
        </div>
        <p className="text-slate-500 text-sm mb-10">Last updated: June 7, 2026</p>
        <div className="space-y-8">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="text-lg font-semibold text-white mb-3">{s.title}</h2>
              <p className="text-sm text-slate-400 leading-relaxed">{s.content}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-[#1A1A1C]">
          <p className="text-xs text-slate-600">Questions? Contact privacy@dupido.com</p>
        </div>
      </div>
    </div>
  );
}
