import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap, Shield, Code2, BarChart3, Globe, ChevronRight, Sparkles,
  ArrowRight, Lock, Cpu, Users, CheckCircle2,
  MousePointer2, Layers, Rocket, FolderOpen, MessageSquare
} from 'lucide-react';
import { PLANS } from '../lib/types';

const features = [
  { icon: Zap, title: 'Ultra-Fast Inference', desc: 'Sub-200ms inference with Groq LPU, NVIDIA NIM GPU clusters, and intelligent caching.', tag: 'Performance' },
  { icon: Shield, title: 'Enterprise Security', desc: 'SOC 2 Type II, end-to-end encryption, RBAC, and prompt injection protection.', tag: 'Security' },
  { icon: Code2, title: 'Developer First', desc: 'OpenAI-compatible API, SDKs in 8 languages, and comprehensive documentation.', tag: 'DX' },
  { icon: BarChart3, title: 'Real-time Analytics', desc: 'Live dashboards with token tracking, cost analysis, latency monitoring, and custom alerts.', tag: 'Analytics' },
  { icon: Globe, title: 'Multi-Model Routing', desc: 'Intelligent routing across NVIDIA NIM, Groq, Gemini, OpenAI, and Hugging Face.', tag: 'Infrastructure' },
  { icon: Lock, title: 'Model Safety', desc: 'Built-in content filtering, PII redaction, and configurable safety guardrails.', tag: 'Compliance' },
];

const stats = [
  { value: '99.9%', label: 'Uptime SLA', icon: Shield },
  { value: '<200ms', label: 'P99 Latency', icon: Zap },
  { value: '50M+', label: 'API Calls/Day', icon: Cpu },
  { value: '10K+', label: 'Developers', icon: Users },
];

export default function Landing() {
  const [email, setEmail] = useState('');
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setActiveFeature(prev => (prev + 1) % features.length), 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* System heartbeat bar */}
      <div className="fixed top-0 inset-x-0 z-50 bg-black border-b border-[#1A1A1C]">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-sm bg-emerald-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">Dupido</span>
          </Link>
          <div className="hidden md:flex items-center gap-1 text-[10px] text-slate-600 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            <span>SYSTEM HEARTBEAT: 99.9% UPTIME</span>
            <span className="mx-3 text-[#1A1A1C]">---</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-500">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <Link to="/projects" className="hover:text-white transition-colors">Projects</Link>
            <Link to="/ai-chat" className="hover:text-white transition-colors">AI Chat</Link>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-sm">Log in</Link>
            <Link to="/signup" className="btn-primary text-sm !px-4 !py-2">Get started</Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative pt-28 pb-20 px-6">
        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0C0C0D] border border-[#1A1A1C] rounded-sm text-sm text-emerald-400 mb-8">
              <Sparkles className="w-4 h-4" />
              <span>Multi-Model AI + Developer Tools Platform</span>
              <ChevronRight className="w-4 h-4" />
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6 leading-[1.05] text-white">
              Build. Deploy.
              <br />
              <span className="gradient-text">Innovate.</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              Multi-model AI orchestration with deep research, file understanding, and token-optimized responses.
              Powered by NVIDIA NIM, Groq, Gemini, OpenAI, and Hugging Face.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link to="/ai-chat" className="btn-primary flex items-center gap-2 text-base !px-8 !py-4">
                <MessageSquare className="w-5 h-5" /> Try AI Chat
              </Link>
              <Link to="/projects" className="btn-secondary flex items-center gap-2 text-base !px-8 !py-4">
                <FolderOpen className="w-5 h-5" /> View Projects
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> No credit card required</span>
              <span className="text-[#1A1A1C]">---</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Free tier available</span>
              <span className="text-[#1A1A1C]">---</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Cancel anytime</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6 border-y border-[#1A1A1C]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.08 }} viewport={{ once: true }} className="text-center">
              <s.icon className="w-4 h-4 text-emerald-500/40 mx-auto mb-2" />
              <div className="text-3xl md:text-4xl font-bold gradient-text">{s.value}</div>
              <div className="text-xs text-slate-600 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="badge-info mb-4">Platform</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">One platform, every model</h2>
            <p className="text-slate-500 max-w-xl mx-auto">From downloading developer tools to chatting with 5+ AI providers through smart routing.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: FolderOpen, title: 'Project Marketplace', desc: 'Browse, download, and upload software projects. AI tools, apps, scripts, and libraries.', link: '/projects', linkLabel: 'Browse projects' },
              { icon: MessageSquare, title: 'Multi-Model AI Chat', desc: 'Chat with 13+ models across NVIDIA NIM, Groq, Gemini, OpenAI, and Hugging Face. Deep research with web search.', link: '/ai-chat', linkLabel: 'Start chatting' },
              { icon: Code2, title: 'Developer API', desc: 'OpenAI-compatible REST API with enterprise security, rate limiting, and real-time analytics.', link: '/dashboard/docs', linkLabel: 'View API docs' },
            ].map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.08 }} viewport={{ once: true }} className="card-hover group">
                <div className="w-10 h-10 rounded-sm bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">{item.desc}</p>
                <Link to={item.link} className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors">
                  {item.linkLabel} <ArrowRight className="w-3 h-3" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-[#050505]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="badge-info mb-4">Features</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Everything you need to ship AI products</h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.06 }} viewport={{ once: true }} onClick={() => setActiveFeature(i)} className={`card group transition-all duration-200 cursor-pointer ${activeFeature === i ? 'border-emerald-500/25 bg-emerald-500/[0.03]' : 'glass-hover'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-9 h-9 rounded-sm flex items-center justify-center transition-all duration-200 ${activeFeature === i ? 'bg-emerald-500/15 border border-emerald-500/20' : 'bg-white/5'}`}>
                    <f.icon className={`w-4 h-4 transition-colors duration-200 ${activeFeature === i ? 'text-emerald-400' : 'text-slate-500'}`} />
                  </div>
                  <span className="badge-neutral">{f.tag}</span>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1.5">{f.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="badge-info mb-4">Architecture</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">How it works</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-3">
            {[
              { icon: MousePointer2, title: '1. Request', desc: 'Your app sends a request through SDK or REST API' },
              { icon: Shield, title: '2. Safety Check', desc: 'Content filtering, PII redaction, injection detection' },
              { icon: Layers, title: '3. Smart Route', desc: 'Intelligent routing to optimal model by cost and speed' },
              { icon: Rocket, title: '4. Response', desc: 'Streamed response with usage tracking and cost attribution' },
            ].map((step, i) => (
              <motion.div key={step.title} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.1 }} viewport={{ once: true }} className="card text-center">
                <div className="w-10 h-10 rounded-sm bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center mx-auto mb-3">
                  <step.icon className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-semibold text-white text-sm mb-1">{step.title}</h3>
                <p className="text-[10px] text-slate-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-[#050505]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="badge-info mb-4">Pricing</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Simple, transparent pricing</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {(Object.entries(PLANS) as [string, typeof PLANS.free][]).map(([key, plan]) => (
              <motion.div key={key} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} viewport={{ once: true }} className={`card relative ${plan.popular ? 'border-emerald-500/30' : ''}`}>
                {plan.popular && <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-emerald-600 text-white text-[10px] font-semibold rounded-sm">Most Popular</div>}
                <h3 className="text-base font-semibold text-white">{plan.name}</h3>
                <p className="text-[10px] text-slate-600 mt-1">{plan.description}</p>
                <div className="mt-4 mb-5"><span className="text-3xl font-bold text-white">{plan.price}</span>{plan.priceCents > 0 && <span className="text-slate-600 text-sm">/mo</span>}</div>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map(f => <li key={f} className="flex items-start gap-2 text-xs text-slate-500"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />{f}</li>)}
                </ul>
                <Link to="/signup" className={`block text-center py-2.5 rounded-sm font-medium transition-all duration-150 text-sm ${plan.popular ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-[#0C0C0D] border border-[#1A1A1C] text-slate-300 hover:border-[#2A2A2C] hover:text-white'}`}>
                  {key === 'enterprise' ? 'Contact sales' : 'Get started'}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Ready to build?</h2>
          <p className="text-slate-500 text-base mb-8">Join thousands of developers shipping AI products with Dupido.</p>
          <form onSubmit={(e) => { e.preventDefault(); if (email) window.location.href = `/signup?email=${encodeURIComponent(email)}`; }} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your work email" className="input-field flex-1" />
            <button type="submit" className="btn-primary whitespace-nowrap">Get started</button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-[#1A1A1C]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-sm bg-emerald-600 flex items-center justify-center"><Zap className="w-3.5 h-3.5 text-white" /></div>
                <span className="font-bold text-white text-sm">Dupido</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">Multi-model AI orchestration platform. Build. Deploy. Innovate.</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-400 mb-3">Product</h4>
              <div className="space-y-1.5 text-xs text-slate-600">
                <Link to="/projects" className="block hover:text-slate-400 transition-colors">Projects</Link>
                <Link to="/ai-chat" className="block hover:text-slate-400 transition-colors">AI Chat</Link>
                <Link to="/dashboard/docs" className="block hover:text-slate-400 transition-colors">API Docs</Link>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-400 mb-3">Company</h4>
              <div className="space-y-1.5 text-xs text-slate-600">
                <Link to="/contact" className="block hover:text-slate-400 transition-colors">Contact</Link>
                <div className="hover:text-slate-400 cursor-pointer transition-colors">Blog</div>
                <div className="hover:text-slate-400 cursor-pointer transition-colors">Careers</div>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-400 mb-3">Legal</h4>
              <div className="space-y-1.5 text-xs text-slate-600">
                <Link to="/privacy" className="block hover:text-slate-400 transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="block hover:text-slate-400 transition-colors">Terms of Service</Link>
                <Link to="/dashboard/security" className="block hover:text-slate-400 transition-colors">Security</Link>
              </div>
            </div>
          </div>
          <div className="divider" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6">
            <div className="text-[10px] text-slate-700">&copy; 2026 Dupido Technologies. All rights reserved.</div>
            <div className="flex items-center gap-4 text-[10px] text-slate-700">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
