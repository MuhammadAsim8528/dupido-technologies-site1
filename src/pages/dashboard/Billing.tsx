import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Check, Zap, Crown, Building2, Download, Calendar, ArrowUpRight, Sparkles, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import { supabase } from '../../lib/supabase';
import { PLANS, type Subscription, type Invoice } from '../../lib/types';

const planIcons: Record<string, typeof Zap> = { free: Zap, starter: CreditCard, pro: Crown, enterprise: Building2 };

export default function Billing() {
  const { user, subscription, refreshProfile } = useAuth();
  const { addToast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [changing, setChanging] = useState<string | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);

  const fetchInvoices = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('invoices').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setInvoices(data as Invoice[]);
  }, [user]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const handleUpgrade = async (plan: Subscription['plan']) => {
    if (!user || plan === subscription?.plan) return;
    if (plan === 'free') return;

    setChanging(plan);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY as string}`,
        },
        body: JSON.stringify({ user_email: user.email, plan }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Checkout creation failed' }));
        throw new Error(err.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to start checkout');
    } finally {
      setChanging(null);
    }
  };

  const currentPlan = subscription?.plan ?? 'free';
  const PlanIcon = planIcons[currentPlan];

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-emerald-400" /> Billing
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Manage your subscription and view invoices.</p>
      </div>

      {/* Current Plan Card */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-sm bg-emerald-500/15 flex items-center justify-center">
              <PlanIcon className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{PLANS[currentPlan].name} Plan</h2>
              <p className="text-xs text-slate-500">{PLANS[currentPlan].description}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm text-slate-400">
                  {subscription?.usage_used ?? 0} / {subscription?.usage_limit ?? 100} requests
                </span>
                <div className="h-1.5 w-32 bg-[#1A1A1C] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(((subscription?.usage_used ?? 0) / (subscription?.usage_limit ?? 100)) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-white">{PLANS[currentPlan].price}</span>
            {PLANS[currentPlan].priceCents > 0 && <span className="text-slate-500 text-sm">/mo</span>}
          </div>
        </div>
      </div>

      {/* Plans */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Available Plans</h2>
          <button onClick={() => setCompareOpen(!compareOpen)} className="btn-ghost text-xs flex items-center gap-1">
            {compareOpen ? 'Hide' : 'Compare'} features <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.entries(PLANS) as [Subscription['plan'], typeof PLANS.free][]).map(([key, plan]) => {
            const isCurrent = key === currentPlan;
            const PIcon = planIcons[key];
            return (
              <motion.div
                key={key}
                whileHover={{ scale: 1.02 }}
                className={`card relative ${isCurrent ? 'border-emerald-500/30' : ''} ${plan.popular ? 'border-emerald-500/25' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-emerald-600 text-white text-[10px] font-semibold rounded-full shadow-lg shadow-emerald-500/20">
                    Popular
                  </div>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <PIcon className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-semibold text-white text-sm">{plan.name}</h3>
                </div>
                <div className="mb-4">
                  <span className="text-2xl font-bold text-white">{plan.price}</span>
                  {plan.priceCents > 0 && <span className="text-slate-500 text-xs">/mo</span>}
                </div>
                <ul className="space-y-2 mb-5">
                  {plan.features.slice(0, 3).map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-slate-400">
                      <Check className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade(key)}
                  disabled={isCurrent || changing !== null}
                  className={`w-full py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${
                    isCurrent
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 cursor-default'
                      : changing === key
                      ? 'bg-emerald-500/15 text-emerald-300 animate-pulse'
                      : 'glass text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {isCurrent ? 'Current plan' : changing === key ? 'Switching...' : `Switch to ${plan.name}`}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Comparison table */}
        <AnimatePresence>
          {compareOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-5"
            >
              <div className="card !p-0 overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">Feature</th>
                      {(Object.keys(PLANS) as Subscription['plan'][]).map((key) => (
                        <th key={key} className="text-center px-4 py-3 text-xs font-medium text-slate-400">{PLANS[key].name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {['Requests/month', 'Models', 'API keys', 'Support', 'Analytics', 'SSO', 'SLA', 'Fine-tuning'].map((feat, i) => {
                      const rows = [
                        ['100', '5K', '50K', 'Unlimited'],
                        ['Basic', 'All', 'All + Priority', 'Custom'],
                        ['1', '5', 'Unlimited', 'Unlimited'],
                        ['Community', 'Email', 'Priority', 'Dedicated'],
                        ['Basic', 'Full', 'Advanced', 'Custom'],
                        ['—', '—', 'Included', 'SAML/SCIM'],
                        ['—', '—', '99.9%', '99.99%'],
                        ['—', '—', 'Available', 'Custom models'],
                      ];
                      return (
                        <tr key={feat} className={`border-b border-white/[0.03] ${i % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                          <td className="px-5 py-3 text-xs text-slate-400 font-medium">{feat}</td>
                          {rows[i].map((val, j) => (
                            <td key={j} className="text-center px-4 py-3 text-xs text-slate-500">{val}</td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Payment Method */}
      <div className="card">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-emerald-400" /> Payment Method
        </h2>
        <div className="flex items-center gap-4 p-4 glass rounded-xl">
          <div className="w-12 h-8 rounded bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-slate-500" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-slate-300">No payment method on file</div>
            <div className="text-xs text-slate-600">Add a card to upgrade your plan</div>
          </div>
          <button className="btn-secondary text-xs !px-3 !py-2">
            Add card
          </button>
        </div>
      </div>

      {/* Invoices */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" /> Invoice History
        </h2>
        {invoices.length === 0 ? (
          <div className="card text-center py-10">
            <Sparkles className="w-8 h-8 text-slate-800 mx-auto mb-2" />
            <p className="text-sm text-slate-600">No invoices yet</p>
            <p className="text-xs text-slate-700 mt-1">Invoices appear when you upgrade your plan</p>
          </div>
        ) : (
          <div className="card !p-0 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-600 uppercase">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-600 uppercase">Description</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-600 uppercase">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-600 uppercase">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-slate-600 uppercase">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 text-xs text-slate-400">{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-xs text-slate-300">Dupido {PLANS[subscription?.plan ?? 'free'].name} Plan</td>
                    <td className="px-5 py-3 text-xs text-white font-medium">${(inv.amount_cents / 100).toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <span className={inv.status === 'paid' ? 'badge-success' : inv.status === 'pending' ? 'badge-warning' : 'badge-error'}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button className="text-slate-600 hover:text-emerald-400 transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
