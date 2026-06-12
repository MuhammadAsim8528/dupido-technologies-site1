import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';

export default function Verification() {
  const { user, profile, verifyEmail, sendPhoneOtp, verifyPhoneOtp } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'email' | 'phone'>('email');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [phoneStep, setPhoneStep] = useState<'input' | 'verify'>('input');
  const [countdown, setCountdown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerifyEmail = async () => {
    try {
      await verifyEmail();
      addToast('success', 'Email verified successfully');
    } catch {
      addToast('error', 'Failed to verify email');
    }
  };

  const handleSendPhoneOtp = async () => {
    if (!phone.trim()) return;
    try {
      await sendPhoneOtp(phone);
      setPhoneStep('verify');
      setCountdown(60);
      addToast('success', 'Verification code sent');
    } catch {
      addToast('error', 'Failed to send code');
    }
  };

  const handleVerifyPhone = async () => {
    if (otpCode.length < 6) return;
    try {
      await verifyPhoneOtp(otpCode);
      addToast('success', 'Phone verified');
      setPhoneStep('input');
      setOtpCode('');
    } catch {
      addToast('error', 'Invalid or expired code');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-400 transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="w-7 h-7 text-emerald-400" />
          <h1 className="text-2xl font-bold text-white">Verification</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#0C0C0D] border border-[#1A1A1C] rounded-sm p-1">
          {(['email', 'phone'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 rounded-sm text-sm font-medium transition-colors ${activeTab === tab ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              {tab === 'email' ? <span className="flex items-center justify-center gap-1.5"><Mail className="w-4 h-4" /> Email</span> : <span className="flex items-center justify-center gap-1.5"><Phone className="w-4 h-4" /> Phone</span>}
            </button>
          ))}
        </div>

        {activeTab === 'email' ? (
          <div className="bg-[#0C0C0D] border border-[#1A1A1C] rounded-sm p-6">
            <h2 className="text-lg font-semibold text-white mb-2">Email Verification</h2>
            <p className="text-sm text-slate-400 mb-4">
              {profile?.email_verified
                ? 'Your email has been verified.'
                : 'A confirmation was sent to your email address.'}
            </p>
            {profile?.email_verified ? (
              <div className="flex items-center gap-2 text-emerald-400 text-sm">
                <ShieldCheck className="w-5 h-5" /> Verified
              </div>
            ) : (
              <button onClick={handleVerifyEmail} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-sm text-sm font-medium transition-colors">
                Verify email
              </button>
            )}
          </div>
        ) : (
          <div className="bg-[#0C0C0D] border border-[#1A1A1C] rounded-sm p-6">
            <h2 className="text-lg font-semibold text-white mb-2">Phone Verification</h2>
            {profile?.phone_verified ? (
              <div className="flex items-center gap-2 text-emerald-400 text-sm">
                <ShieldCheck className="w-5 h-5" /> Phone verified
              </div>
            ) : phoneStep === 'input' ? (
              <div>
                <p className="text-sm text-slate-400 mb-4">Enter your phone number to receive a 6-digit code.</p>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000"
                  className="w-full bg-[#0C0C0D] border border-[#1A1A1C] rounded-sm px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 mb-4" />
                <button onClick={handleSendPhoneOtp} disabled={!phone.trim()} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-sm text-sm font-medium transition-colors disabled:opacity-40">
                  Send code
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-slate-400 mb-4">Enter the 6-digit code sent to {phone}.</p>
                <div className="flex gap-2 justify-center mb-4">
                  {[0, 1, 2, 3, 4, 5].map(i => (
                    <input key={i} ref={el => { otpRefs.current[i] = el; }} type="text" maxLength={1}
                      className="otp-input"
                      value={otpCode[i] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const newCode = otpCode.split('');
                        newCode[i] = val;
                        setOtpCode(newCode.join(''));
                        if (val && i < 5) otpRefs.current[i + 1]?.focus();
                      }} />
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">{countdown > 0 ? `Resend in ${countdown}s` : ''}</span>
                  <div className="flex gap-2">
                    <button onClick={() => { setPhoneStep('input'); setOtpCode(''); }} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Back</button>
                    <button onClick={handleVerifyPhone} disabled={otpCode.length < 6} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-sm text-sm font-medium transition-colors disabled:opacity-40">
                      Verify
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
