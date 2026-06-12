import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity, Key, CreditCard, TrendingUp, Zap, BarChart3,
  ArrowUpRight, Clock, Cpu, MessageSquare, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { UsageLog } from '../../lib/types';
import Sparkline from '../../components/Sparkline';

const sparkData = [12, 18, 15, 22, 28, 35, 30, 42, 38, 45, 50, 48, 55, 52, 60];

export default function Overview() {
  const { user, profile, subscription } = useAuth();
  const [recentUsage, setRecentUsage] = useState<UsageLog[]>([]);
  const [totalTokens, setTotalTokens] = useState({ in: 0, out: 0 });
  const [totalRequests, setTotalRequests] = useState(0);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [usageRes, tokensRes, countRes] = await Promise.all([
      supabase.from('usage_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(8),
      supabase.from('usage_logs').select('tokens_in, tokens_out').eq('user_id', user.id),
      supabase.from('usage_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ]);
    if (usageRes.data) setRecentUsage(usageRes.data as UsageLog[]);
    if (tokensRes.data) {
      setTotalTokens({
        in: tokensRes.data.reduce((s, r) => s + (r.tokens_in || 0), 0),
        out: tokensRes.data.reduce((s, r) => s + (r.tokens_out || 0), 0),
      });
    }
    if (countRes.count !== null) setTotalRequests(countRes.count);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const usagePercent = subscription
    ? Math.min((subscription.usage_used / subscription.usage_limit) * 100, 100)
    : 0;

  const planName = subscription?.plan ?? 'free';
  const planLabel = planName.charAt(0).toUpperCase() + planName.slice(1);

  const statCards = [
    {
      icon: Activity,
      label: 'Total Requests',
      value: totalRequests.toLocaleString(),
      spark: sparkData,
      sparkColor: '#10b981',
      link: undefined,
    },
    {
      icon: Cpu,
      label: 'Tokens Used',
      value: ((totalTokens.in + totalTokens.out) / 1000).toFixed(1) + 'K',
      spark: sparkData.map(d => d * 8),
      sparkColor: '#10b981',
      link: undefined,
    },
    {
      icon: MessageSquare,
      label: 'Chat Messages',
      value: recentUsage.filter(r => r.action === 'chat_completion').length.toLocaleString(),
      spark: sparkData.map(d => d * 0.5),
      sparkColor: '#10b981',
      link: '/dashboard/chat',
    },
    {
      icon: Key,
      label: 'API Keys',
      value: '—',
      spark: null,
      sparkColor: null,
      link: '/dashboard/api-keys',
    },
  ];

  // Activity heatmap data (last 7 days x 24 hours)
  const heatmapData = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => Math.floor(Math.random() * 5))
  );
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Here's your account overview.</p>
        </div>
        <div className="flex items-center gap-3">
          {profile && !profile.email_verified && (
            <Link to="/dashboard/security" className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400 hover:bg-amber-500/15 transition-colors">
              <AlertCircle className="w-3.5 h-3.5" /> Verify your email
            </Link>
          )}
          <Link to="/dashboard/chat" className="btn-primary text-sm !px-4 !py-2.5 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> New chat
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <Link
              to={card.link || '#'}
              className={`card block glass-hover transition-all duration-300 ${card.link ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-sm bg-emerald-500/10 flex items-center justify-center">
                  <card.icon className="w-4.5 h-4.5 text-emerald-400" />
                </div>
                {card.spark && card.sparkColor && (
                  <Sparkline data={card.spark} color={card.sparkColor} width={80} height={24} />
                )}
              </div>
              <div className="text-2xl font-bold text-white">{card.value}</div>
              <div className="text-xs text-slate-500 mt-1">{card.label}</div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Chart */}
        <div className="lg:col-span-3 card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" /> Usage Over Time
            </h2>
            <div className="flex items-center gap-1">
              {['7D', '30D', '90D'].map((p) => (
                <button key={p} className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${p === '7D' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-600 hover:text-slate-400'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="h-52 flex items-end gap-2">
            {[35, 52, 48, 70, 62, 85, 74, 60, 88, 92, 78, 95, 82, 70, 88, 65, 90, 75, 82, 68, 85, 92, 78, 88, 95, 72, 80, 85].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.5, delay: i * 0.03 }}
                  className="w-full bg-gradient-to-t from-emerald-500/50 to-emerald-500/10 rounded-t-md relative group hover:from-emerald-500/70 hover:to-emerald-500/20 transition-all duration-200"
                >
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block text-[10px] text-emerald-400 bg-[#0C0C0D] px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap">
                    {Math.round(h * (subscription?.usage_limit ?? 100) / 100)}
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2 text-[10px] text-slate-700">
            <span>4 weeks ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 card">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" /> Recent Activity
          </h2>
          {recentUsage.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="w-10 h-10 text-slate-800 mx-auto mb-3" />
              <p className="text-sm text-slate-600">No activity yet</p>
              <p className="text-xs text-slate-700 mt-1">Start using the API to see logs</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentUsage.slice(0, 7).map((log) => (
                <div key={log.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.02] transition-colors">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    log.action === 'chat_completion' ? 'bg-emerald-500/10' : 'bg-emerald-500/10'
                  }`}>
                    <ArrowUpRight className={`w-3.5 h-3.5 ${
                      log.action === 'chat_completion' ? 'text-emerald-400' : 'text-emerald-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-300 truncate">{log.action.replace(/_/g, ' ')}</div>
                    <div className="text-[10px] text-slate-600">{log.model || '—'}</div>
                  </div>
                  <div className="text-[10px] text-slate-700">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity Heatmap + Plan */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Heatmap */}
        <div className="card">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" /> Activity Heatmap
          </h2>
          <div className="flex gap-1">
            <div className="flex flex-col gap-1 text-[10px] text-slate-700 pr-2">
              {days.map((d) => (
                <div key={d} className="h-3 flex items-center">{d}</div>
              ))}
            </div>
            <div className="flex-1 flex flex-col gap-1">
              {heatmapData.map((row, di) => (
                <div key={di} className="flex gap-0.5">
                  {row.map((val, hi) => (
                    <div
                      key={hi}
                      className={`flex-1 h-3 rounded-[2px] transition-colors ${
                        val === 0 ? 'bg-[#1A1A1C]' :
                        val === 1 ? 'bg-emerald-500/10' :
                        val === 2 ? 'bg-emerald-500/25' :
                        val === 3 ? 'bg-emerald-500/45' :
                        'bg-emerald-500/70'
                      }`}
                      title={`${val} requests`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3">
            <span className="text-[10px] text-slate-700">Less</span>
            {[0, 1, 2, 3, 4].map((v) => (
              <div key={v} className={`w-3 h-3 rounded-[2px] ${
                v === 0 ? 'bg-[#1A1A1C]' :
                v === 1 ? 'bg-emerald-500/10' :
                v === 2 ? 'bg-emerald-500/25' :
                v === 3 ? 'bg-emerald-500/45' :
                'bg-emerald-500/70'
              }`} />
            ))}
            <span className="text-[10px] text-slate-700">More</span>
          </div>
        </div>

        {/* Plan */}
        <div className="card flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" /> Current Plan
            </h2>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-lg font-semibold text-white">{planLabel} Plan</div>
                <div className="text-xs text-slate-500">
                  {subscription?.usage_used ?? 0} / {subscription?.usage_limit ?? 100} requests used
                </div>
              </div>
              <div className="ml-auto text-right">
                <span className="text-xl font-bold text-white">{subscription?.plan === 'free' ? 'Free' : '$' + (subscription?.plan === 'starter' ? '20' : subscription?.plan === 'pro' ? '60' : 'Custom')}</span>
                {subscription?.plan !== 'free' && subscription?.plan !== 'enterprise' && <span className="text-xs text-slate-500">/mo</span>}
              </div>
            </div>
            <div className="h-1.5 bg-[#1A1A1C] rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-600">
              <span>0</span>
              <span>{subscription?.usage_limit ?? 100} requests</span>
            </div>
          </div>
          <Link to="/dashboard/billing" className="btn-secondary text-sm !px-4 !py-2.5 flex items-center justify-center gap-2 mt-4">
            Upgrade plan <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
