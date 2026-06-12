import { useState } from 'react';
import { Settings as SettingsIcon, User, Mail, Phone, Camera, Save, CheckCircle2, Bell, Moon, Sun, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import type { NotificationPrefs } from '../../lib/types';

export default function Settings() {
  const { user, profile, updateProfile } = useAuth();
  const { addToast } = useToast();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(
    profile?.notification_preferences ?? { email: true, usage_alerts: true, security_alerts: true, marketing: false }
  );
  const [darkMode, setDarkMode] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      await updateProfile({
        full_name: fullName,
        phone,
        notification_preferences: notifPrefs,
      });
      addToast('success', 'Settings saved');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const toggleNotif = (key: keyof NotificationPrefs) => {
    setNotifPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-emerald-400" /> Settings
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Manage your account and preferences.</p>
      </div>

      {/* Profile */}
      <div className="card">
        <h2 className="section-label flex items-center gap-2 mb-6"><User className="w-4 h-4" /> Profile</h2>

        <div className="flex items-center gap-5 mb-8">
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-500/10">
              {fullName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <div className="text-lg font-semibold text-white">{fullName || 'Set your name'}</div>
            <div className="text-sm text-slate-600">{user?.email}</div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={profile?.email_verified ? 'badge-success' : 'badge-warning'}>
                {profile?.email_verified ? 'Email verified' : 'Email unverified'}
              </span>
              {profile?.two_factor_enabled && <span className="badge-success">2FA enabled</span>}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Full name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="input-field !pl-11"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="input-field !pl-11 opacity-50 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-slate-700 mt-1.5">Email cannot be changed. Contact support if needed.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="input-field !pl-11"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 mt-6 pt-5 border-t border-[#1A1A1C]">
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm !px-5 !py-2.5 flex items-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> Save changes</>}
          </button>
        </div>
      </div>

      {/* Appearance */}
      <div className="card">
        <h2 className="section-label flex items-center gap-2 mb-4"><Moon className="w-4 h-4" /> Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-white">Dark mode</div>
            <div className="text-xs text-slate-500">Toggle between light and dark themes</div>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${darkMode ? 'bg-emerald-600' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${darkMode ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
            <Sun className={`absolute left-1.5 top-1 w-4 h-4 transition-opacity ${darkMode ? 'opacity-0' : 'opacity-100 text-amber-400'}`} />
            <Moon className={`absolute right-1.5 top-1 w-4 h-4 transition-opacity ${darkMode ? 'opacity-100 text-slate-900' : 'opacity-0'}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="card">
        <h2 className="section-label flex items-center gap-2 mb-4"><Bell className="w-4 h-4" /> Notifications</h2>
        <div className="space-y-3">
          {[
            { key: 'email' as const, label: 'Email notifications', desc: 'Receive updates about your account' },
            { key: 'usage_alerts' as const, label: 'Usage alerts', desc: 'Get notified when you approach your limits' },
            { key: 'security_alerts' as const, label: 'Security alerts', desc: 'Login attempts and suspicious activity' },
            { key: 'marketing' as const, label: 'Marketing emails', desc: 'Product updates and feature announcements' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm text-slate-300">{item.label}</div>
                <div className="text-xs text-slate-600">{item.desc}</div>
              </div>
              <button
                onClick={() => toggleNotif(item.key)}
                className={`relative w-10 h-6 rounded-full transition-colors duration-300 ${notifPrefs[item.key] ? 'bg-emerald-600' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${notifPrefs[item.key] ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-[#1A1A1C]">
          <button onClick={handleSave} className="btn-secondary text-sm !px-4 !py-2">Save preferences</button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card border-red-500/15">
        <h2 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> Danger Zone
        </h2>
        <p className="text-xs text-slate-600 mb-4">These actions are irreversible. Please proceed with caution.</p>
        {showDeleteConfirm ? (
          <div className="space-y-3">
            <p className="text-xs text-red-400">Are you sure? This will permanently delete your account and all data.</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-ghost text-xs !px-3 !py-1.5">Cancel</button>
              <button className="btn-danger text-xs !px-3 !py-1.5">Delete my account</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-danger text-xs !px-4 !py-2.5"
          >
            Delete account
          </button>
        )}
      </div>
    </div>
  );
}
