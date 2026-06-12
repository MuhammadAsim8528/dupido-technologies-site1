import { useState, useEffect, useCallback } from 'react';
import { Shield, Clock, Monitor, Smartphone, Globe, AlertTriangle, CheckCircle2, LogOut, Smartphone as PhoneIcon, Key, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import { supabase } from '../../lib/supabase';
import type { SecurityLog, UserSession } from '../../lib/types';

export default function Security() {
  const { user, profile, updateProfile, sendPhoneOtp, verifyPhoneOtp, verifyEmail } = useAuth();
  const { addToast } = useToast();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPhoneVerify, setShowPhoneVerify] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [phoneStep, setPhoneStep] = useState<'input' | 'verify'>('input');
  const [show2faSetup, setShow2faSetup] = useState(false);
  const [twoFaCode, setTwoFaCode] = useState('');

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [sessRes, logRes] = await Promise.all([
      supabase.from('user_sessions').select('*').eq('user_id', user.id).order('last_active', { ascending: false }),
      supabase.from('security_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(15),
    ]);
    if (sessRes.data) setSessions(sessRes.data as UserSession[]);
    if (logRes.data) setLogs(logRes.data as SecurityLog[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleVerifyEmail = async () => {
    try {
      await verifyEmail();
      addToast('success', 'Email verified successfully');
    } catch {
      addToast('error', 'Failed to verify email');
    }
  };

  const handleSendPhoneOtp = async () => {
    if (!phoneNumber.trim()) return;
    try {
      await sendPhoneOtp(phoneNumber);
      setPhoneStep('verify');
      addToast('success', 'Verification code sent to your phone');
    } catch {
      addToast('error', 'Failed to send verification code');
    }
  };

  const handleVerifyPhone = async () => {
    if (!otpCode.trim()) return;
    try {
      await verifyPhoneOtp(otpCode);
      setShowPhoneVerify(false);
      addToast('success', 'Phone number verified');
    } catch {
      addToast('error', 'Invalid or expired code');
    }
  };

  const handleEnable2fa = async () => {
    if (!user) return;
    try {
      await updateProfile({ two_factor_enabled: true, two_factor_secret: 'demo_secret_' + twoFaCode });
      setShow2faSetup(false);
      addToast('success', '2FA enabled successfully');
    } catch {
      addToast('error', 'Failed to enable 2FA');
    }
  };

  const getDeviceIcon = (type: string | null) => {
    if (!type) return Monitor;
    return type.toLowerCase().includes('mobile') ? Smartphone : Monitor;
  };

  const riskScore = profile?.risk_score ?? 0;
  const riskColor = riskScore <= 20 ? 'text-emerald-400' : riskScore <= 50 ? 'text-amber-400' : 'text-red-400';
  const riskLabel = riskScore <= 20 ? 'Low' : riskScore <= 50 ? 'Medium' : 'High';

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-emerald-400" /> Security
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Monitor your account security and manage verification.</p>
      </div>

      {/* Risk Score */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Security Score</h2>
          <span className={`text-sm font-semibold ${riskColor}`}>{riskLabel} Risk</span>
        </div>
        <div className="h-3 bg-[#1A1A1C] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              riskScore <= 20 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
              riskScore <= 50 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
              'bg-gradient-to-r from-red-500 to-red-400'
            }`}
            style={{ width: `${Math.max(riskScore, 5)}%` }}
          />
        </div>
        <p className="text-xs text-slate-600 mt-2">Complete all verification steps to lower your risk score.</p>
      </div>

      {/* Verification Status */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className={`w-11 h-11 rounded-sm flex items-center justify-center ${profile?.email_verified ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
            {profile?.email_verified ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-amber-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white">Email</div>
            <div className={`text-xs ${profile?.email_verified ? 'text-emerald-400' : 'text-amber-400'}`}>
              {profile?.email_verified ? 'Verified' : 'Unverified'}
            </div>
          </div>
          {!profile?.email_verified && (
            <button onClick={handleVerifyEmail} className="btn-ghost text-xs !px-2.5 !py-1.5">
              Verify
            </button>
          )}
        </div>

        <div className="card flex items-center gap-4">
          <div className={`w-11 h-11 rounded-sm flex items-center justify-center ${profile?.phone_verified ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
            {profile?.phone_verified ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <PhoneIcon className="w-5 h-5 text-amber-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white">Phone</div>
            <div className={`text-xs ${profile?.phone_verified ? 'text-emerald-400' : 'text-amber-400'}`}>
              {profile?.phone_verified ? 'Verified' : profile?.phone ? 'Unverified' : 'Not set up'}
            </div>
          </div>
          {!profile?.phone_verified && (
            <button onClick={() => setShowPhoneVerify(true)} className="btn-ghost text-xs !px-2.5 !py-1.5">
              Set up
            </button>
          )}
        </div>

        <div className="card flex items-center gap-4">
          <div className={`w-11 h-11 rounded-sm flex items-center justify-center ${profile?.two_factor_enabled ? 'bg-emerald-500/10' : 'bg-slate-500/10'}`}>
            {profile?.two_factor_enabled ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Key className="w-5 h-5 text-slate-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white">2FA</div>
            <div className={`text-xs ${profile?.two_factor_enabled ? 'text-emerald-400' : 'text-slate-500'}`}>
              {profile?.two_factor_enabled ? 'Enabled' : 'Not enabled'}
            </div>
          </div>
          {!profile?.two_factor_enabled && (
            <button onClick={() => setShow2faSetup(true)} className="btn-ghost text-xs !px-2.5 !py-1.5">
              Enable
            </button>
          )}
        </div>
      </div>

      {/* Phone Verify Modal */}
      <AnimatePresence>
        {showPhoneVerify && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6"
            onClick={() => setShowPhoneVerify(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="card w-full max-w-sm"
            >
              <h2 className="text-lg font-semibold text-white mb-1">Verify your phone</h2>
              <p className="text-xs text-slate-500 mb-5">
                {phoneStep === 'input'
                  ? 'Enter your phone number to receive a verification code.'
                  : `Enter the 6-digit code sent to ${phoneNumber}.`
                }
              </p>

              {phoneStep === 'input' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Phone number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="input-field"
                  />
                  <div className="flex justify-end gap-3 mt-5">
                    <button onClick={() => setShowPhoneVerify(false)} className="btn-ghost text-sm">Cancel</button>
                    <button onClick={handleSendPhoneOtp} disabled={!phoneNumber.trim()} className="btn-primary text-sm !px-5 !py-2.5 disabled:opacity-40">
                      Send code
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Verification code</label>
                  <div className="flex gap-2 justify-center">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <input
                        key={i}
                        type="text"
                        maxLength={1}
                        className="otp-input"
                        value={otpCode[i] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const newCode = otpCode.split('');
                          newCode[i] = val;
                          setOtpCode(newCode.join(''));
                          if (val && e.target.nextElementSibling) {
                            (e.target.nextElementSibling as HTMLInputElement).focus();
                          }
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-end gap-3 mt-5">
                    <button onClick={() => setPhoneStep('input')} className="btn-ghost text-sm">Back</button>
                    <button onClick={handleVerifyPhone} disabled={otpCode.length < 6} className="btn-primary text-sm !px-5 !py-2.5 disabled:opacity-40">
                      Verify
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2FA Setup Modal */}
      <AnimatePresence>
        {show2faSetup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6"
            onClick={() => setShow2faSetup(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="card w-full max-w-sm"
            >
              <h2 className="text-lg font-semibold text-white mb-1">Set up two-factor authentication</h2>
              <p className="text-xs text-slate-500 mb-5">
                Scan the QR code with your authenticator app, then enter the code.
              </p>

              <div className="flex justify-center mb-5">
                <div className="w-40 h-40 rounded-xl bg-white flex items-center justify-center">
                  <QrCode className="w-32 h-32 text-slate-900" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Verification code</label>
                <div className="flex gap-2 justify-center">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <input
                      key={i}
                      type="text"
                      maxLength={1}
                      className="otp-input"
                      value={twoFaCode[i] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const newCode = twoFaCode.split('');
                        newCode[i] = val;
                        setTwoFaCode(newCode.join(''));
                        if (val && e.target.nextElementSibling) {
                          (e.target.nextElementSibling as HTMLInputElement).focus();
                        }
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-5">
                <button onClick={() => setShow2faSetup(false)} className="btn-ghost text-sm">Cancel</button>
                <button onClick={handleEnable2fa} disabled={twoFaCode.length < 6} className="btn-primary text-sm !px-5 !py-2.5 disabled:opacity-40">
                  Enable 2FA
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Sessions */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Monitor className="w-4 h-4 text-emerald-400" /> Active Sessions
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="card text-center py-10">
            <Monitor className="w-10 h-10 text-slate-800 mx-auto mb-2" />
            <p className="text-sm text-slate-600">No active sessions recorded</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => {
              const DeviceIcon = getDeviceIcon(session.device_type);
              return (
                <div key={session.id} className="card flex items-center gap-4 !py-3">
                  <div className="w-9 h-9 rounded-sm bg-emerald-500/10 flex items-center justify-center">
                    <DeviceIcon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{session.device_name || 'Unknown device'}</div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-600 mt-0.5">
                      <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {session.ip_address || 'Unknown'}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(session.last_active).toLocaleString()}</span>
                    </div>
                  </div>
                  <button className="p-1.5 text-slate-700 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all">
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Security Log */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" /> Security Log
        </h2>
        {logs.length === 0 ? (
          <div className="card text-center py-10">
            <Shield className="w-10 h-10 text-slate-800 mx-auto mb-2" />
            <p className="text-sm text-slate-600">No security events recorded</p>
          </div>
        ) : (
          <div className="card !p-0 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1A1A1C]">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-600 uppercase">Time</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-600 uppercase">Event</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-600 uppercase">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const lower = log.action.toLowerCase();
                  const badgeClass = lower.includes('login') || lower.includes('success') || lower.includes('created')
                    ? 'badge-success' : lower.includes('fail') || lower.includes('block') ? 'badge-error' : 'badge-info';
                  return (
                    <tr key={log.id} className="border-b border-[#1A1A1C] hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3 text-xs text-slate-600">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="px-5 py-3"><span className={badgeClass}>{log.action.replace(/_/g, ' ')}</span></td>
                      <td className="px-5 py-3 text-xs text-slate-600 font-mono">{log.ip_address || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
