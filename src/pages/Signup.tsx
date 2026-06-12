import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Mail, Lock, Eye, EyeOff, User, ArrowRight, CheckCircle2, Fingerprint, Briefcase, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { classifyEmail } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { PLANS } from '../lib/types';

export default function Signup() {
  const [searchParams] = useSearchParams();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const emailInfo = email.includes('@') ? classifyEmail(email) : null;

  const pwChecks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
    { label: 'Special character', pass: /[^A-Za-z0-9]/.test(password) },
  ];

  const pwStrength = pwChecks.filter(c => c.pass).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (!agreed) { setError('You must agree to the terms'); return; }
    setLoading(true);
    try {
      await signUp(email, password, fullName);
      setSuccess(true);
      addToast('success', 'Account created! Check your email for verification.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Signup failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="w-full max-w-md text-center">
          <div className="card">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Verify your email</h2>
            <p className="text-slate-400 mb-6 text-sm leading-relaxed">
              We sent a verification link to <span className="text-emerald-400 font-medium">{email}</span>.
              Click the link to activate your account.
            </p>
            <div className="glass rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                {emailInfo?.type === 'work' ? (
                  <Briefcase className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Globe className="w-5 h-5 text-emerald-400" />
                )}
                <div className="text-left">
                  <div className="text-sm text-white font-medium">
                    {emailInfo?.type === 'work' ? 'Work account detected' : 'Personal account'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {emailInfo?.type === 'work'
                      ? `You've been auto-assigned the ${PLANS[emailInfo.suggestedPlan].name} plan with higher limits`
                      : `Starting on the Free plan — upgrade anytime`}
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <button onClick={() => navigate('/login')} className="btn-primary w-full">Go to login</button>
              <p className="text-xs text-slate-600">
                Didn't receive the email? Check your spam folder or{' '}
                <button className="text-emerald-400 hover:text-emerald-300 transition-colors">request a new one</button>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6 relative">
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-emerald-500/[0.06] rounded-full blur-[150px]" />
      <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] bg-emerald-500/[0.06] rounded-full blur-[150px]" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-[420px] relative">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">Dupido</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-slate-500 mt-1 text-sm">Start building with AI in minutes. No credit card required.</p>
        </div>

        <div className="card space-y-5">
          {error && <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 px-4 py-3 glass rounded-xl text-sm text-slate-300 hover:bg-white/10 transition-all duration-200">
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-3 glass rounded-xl text-sm text-slate-300 hover:bg-white/10 transition-all duration-200">
              <Fingerprint className="w-4 h-4" /> GitHub
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-slate-600">or create with email</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Full name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Smith" className="input-field !pl-11" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="input-field !pl-11" required />
              </div>
              {/* Email classification indicator */}
              {emailInfo && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg border text-xs">
                  {emailInfo.type === 'work' ? (
                    <>
                      <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Work email detected</span>
                      <span className="text-slate-500">— Auto-assigned {PLANS[emailInfo.suggestedPlan].name} plan with higher limits</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Personal email</span>
                      <span className="text-slate-500">— Free plan with upgrade option</span>
                    </>
                  )}
                </motion.div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a strong password" className="input-field !pl-11 !pr-11" required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && (
                <div className="mt-3 space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= pwStrength ? i <= 1 ? 'bg-red-500' : i <= 2 ? 'bg-amber-500' : i <= 3 ? 'bg-emerald-500' : 'bg-emerald-500' : 'bg-slate-800'}`} />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {pwChecks.map(c => (
                      <div key={c.label} className={`flex items-center gap-1 text-[11px] ${c.pass ? 'text-emerald-400' : 'text-slate-600'}`}>
                        <CheckCircle2 className="w-3 h-3" />{c.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500/50" />
              <span className="text-xs text-slate-500 leading-relaxed">
                I agree to the <a href="#" className="text-emerald-400 hover:text-emerald-300">Terms of Service</a> and <a href="#" className="text-emerald-400 hover:text-emerald-300">Privacy Policy</a>
              </span>
            </label>

            <button type="submit" disabled={loading || !agreed} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Create account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 mt-6 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
