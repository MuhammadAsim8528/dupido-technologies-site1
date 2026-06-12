import { ArrowLeft, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';

const sections = [
  { title: '1. Acceptance of Terms', content: 'By accessing or using the Dupido platform ("Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.' },
  { title: '2. Dynamic Data Scraping Compliance', content: 'Dupido employs automated data ingestion pipelines to process user-submitted content, API payloads, and uploaded files. All data scraping activities comply with applicable data protection regulations including GDPR and CCPA. Users retain full ownership of their data.' },
  { title: '3. Fair Use Limits', content: 'Usage is subject to plan-specific limits. Exceeding your plan\'s request, token, or compute limits may result in throttling or temporary suspension. Fair use includes not circumventing rate limits, not using the Service for unauthorized bulk extraction, and not reselling access without authorization.' },
  { title: '4. Prohibited Activities', content: 'You shall not use the Service to: (a) Submit zip bombs or decompression bombs designed to exhaust computational resources. (b) Distribute malware, ransomware, or any malicious software. (c) Launch or facilitate DoS/DDoS attacks. (d) Generate content for phishing or credential harvesting. (e) Attempt to reverse-engineer proprietary model weights. (f) Circumvent security measures. Violations result in immediate account termination.' },
  { title: '5. AI-Generated Content Disclaimer', content: 'AI-generated responses may contain inaccuracies or hallucinations. You are solely responsible for verifying accuracy before relying on content for critical decisions. Dupido does not guarantee factual correctness or fitness for any purpose.' },
  { title: '6. Limitation of Liability', content: 'Dupido shall not be liable for indirect, incidental, or consequential damages arising from AI model errors, service interruptions, data loss from automated processing, or decisions made based on AI-generated content. Total liability shall not exceed the amount paid in the 12 months preceding the claim.' },
  { title: '7. Account Termination', content: 'We may suspend or terminate accounts for violations. Upon termination: API keys are revoked, data is retained for 30 days then deleted, and active subscriptions are cancelled with pro-rata refunds.' },
  { title: '8. Modifications', content: 'We may modify these Terms with 30 days\' notice. Continued use constitutes acceptance of modified Terms.' },
];

export default function Terms() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-emerald-500/[0.03] rounded-full blur-[120px]" />
      <div className="max-w-3xl mx-auto px-6 py-12 relative">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-400 transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <Scale className="w-7 h-7 text-emerald-400" />
          <h1 className="text-3xl font-bold">Terms of Service</h1>
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
          <p className="text-xs text-slate-600">Questions? Contact legal@dupido.com</p>
        </div>
      </div>
    </div>
  );
}
