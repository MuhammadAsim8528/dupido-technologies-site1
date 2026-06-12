import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, User, MessageSquare, Send, CheckCircle2, MapPin, Clock, Phone, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('All fields are required');
      return;
    }
    setLoading(true);
    try {
      const { error: insertError } = await supabase.from('contact_messages').insert({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });
      if (insertError) throw insertError;
      setSuccess(true);
      addToast('success', 'Message sent! We\'ll get back to you soon.');
    } catch {
      setError('Failed to send message. Please try again.');
      addToast('error', 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Dupido</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/projects" className="btn-ghost text-sm">Projects</Link>
            <Link to="/ai-chat" className="btn-ghost text-sm">AI Chat</Link>
            <Link to="/contact" className="btn-ghost text-sm text-emerald-400">Contact</Link>
            <Link to="/login" className="btn-primary text-sm !px-4 !py-2">Sign in</Link>
          </div>
        </div>
      </nav>

      <div className="pt-28 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-12">
            <span className="badge-info mb-4">Get in Touch</span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
              Let's <span className="gradient-text">Build Together</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Have a question, partnership idea, or just want to chat? Drop us a message.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Info cards */}
            <div className="lg:col-span-2 space-y-4">
              {[
                { icon: Mail, label: 'Email', value: 'hello@dupiotechnologies.me' },
                { icon: MapPin, label: 'Location', value: 'Remote-first, worldwide' },
                { icon: Clock, label: 'Response time', value: 'Within 24 hours' },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="card flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">{item.label}</div>
                    <div className="text-sm text-slate-300">{item.value}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-3 card"
            >
              {success ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Message sent!</h2>
                  <p className="text-sm text-slate-400 mb-6">We'll get back to you within 24 hours.</p>
                  <button onClick={() => { setSuccess(false); setName(''); setEmail(''); setMessage(''); }} className="btn-secondary text-sm">
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className="input-field !pl-11"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="input-field !pl-11"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Message</label>
                    <div className="relative">
                      <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-slate-600" />
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell us about your project, question, or idea..."
                        rows={5}
                        className="input-field !pl-11 resize-none"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Send message <Send className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-700">
          <span>&copy; 2026 Dupido Technologies</span>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-slate-400 transition-colors">Home</Link>
            <Link to="/projects" className="hover:text-slate-400 transition-colors">Projects</Link>
            <Link to="/ai-chat" className="hover:text-slate-400 transition-colors">AI Chat</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
