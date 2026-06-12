import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Plus, Copy, Eye, EyeOff, Trash2, Clock, AlertCircle, CheckCircle2, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import { supabase } from '../../lib/supabase';
import type { ApiKey } from '../../lib/types';

function generateApiKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'dp_';
  for (let i = 0; i < 48; i++) key += chars[Math.floor(Math.random() * chars.length)];
  return key;
}

export default function ApiKeys() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchKeys = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id)
      .is('revoked_at', null)
      .order('created_at', { ascending: false });
    if (data) setKeys(data as ApiKey[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const handleCreate = async () => {
    if (!user || !newKeyName.trim()) return;
    setError('');
    const rawKey = generateApiKey();
    const prefix = rawKey.slice(0, 7);
    const keyHash = btoa(rawKey);

    const { error: insertError } = await supabase.from('api_keys').insert({
      user_id: user.id,
      name: newKeyName.trim(),
      key_hash: keyHash,
      key_prefix: prefix,
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setNewKeyValue(rawKey);
    setNewKeyName('');
    addToast('success', 'API key created successfully');
    await fetchKeys();
  };

  const handleRevoke = async (id: string, name: string) => {
    await supabase.from('api_keys').update({ revoked_at: new Date().toISOString() }).eq('id', id);
    addToast('success', `Key "${name}" revoked`);
    await fetchKeys();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    addToast('info', 'Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Key className="w-6 h-6 text-emerald-400" /> API Keys
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Manage your API keys for programmatic access.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm !px-4 !py-2.5 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create key
        </button>
      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/15 rounded-xl">
        <Shield className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-400/80 leading-relaxed">
          Never share your API keys in publicly accessible areas such as GitHub, client-side code, or public forums. Keys are shown only once at creation.
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* New key reveal */}
      <AnimatePresence>
        {newKeyValue && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="card border-emerald-500/25 !bg-emerald-500/[0.03]">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-emerald-400 font-medium">API key created successfully</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Copy this key now — you won't be able to see it again.
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <code className="flex-1 px-3 py-2 bg-slate-900/80 rounded-lg text-sm font-mono text-slate-300 overflow-x-auto border border-slate-800/50">
                      {newKeyValue}
                    </code>
                    <button
                      onClick={() => handleCopy(newKeyValue)}
                      className="p-2.5 glass rounded-lg hover:bg-white/10 transition-colors"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    </button>
                  </div>
                  <button
                    onClick={() => setNewKeyValue(null)}
                    className="mt-3 text-xs text-slate-600 hover:text-slate-400 transition-colors"
                  >
                    Done — I've saved my key
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && !newKeyValue && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="card w-full max-w-md"
            >
              <h2 className="text-lg font-semibold text-white mb-1">Create new API key</h2>
              <p className="text-xs text-slate-500 mb-5">Give your key a descriptive name to help you identify it later.</p>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Key name</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Production API, Staging key"
                  className="input-field"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowCreate(false)} className="btn-ghost text-sm">
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newKeyName.trim()}
                  className="btn-primary text-sm !px-5 !py-2.5 disabled:opacity-40"
                >
                  Create key
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Key list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : keys.length === 0 ? (
        <div className="card text-center py-16">
          <Key className="w-12 h-12 text-slate-800 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-1">No API keys yet</h3>
          <p className="text-sm text-slate-600 mb-6">Create your first key to start using the API.</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm !px-5 !py-2.5">
            Create your first key
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map((key) => (
            <motion.div
              key={key.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card flex items-center gap-4 !py-4"
            >
              <div className="w-10 h-10 rounded-sm bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <Key className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">{key.name}</div>
                <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                  <code className="font-mono">
                    {revealedKey === key.id ? key.key_hash : `${key.key_prefix}${'•'.repeat(24)}`}
                  </code>
                  <button
                    onClick={() => setRevealedKey(revealedKey === key.id ? null : key.id)}
                    className="text-slate-600 hover:text-slate-400 transition-colors"
                  >
                    {revealedKey === key.id ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => handleCopy(`${key.key_prefix}...`)}
                    className="text-slate-600 hover:text-slate-400 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-700">
                  <Clock className="w-3 h-3" />
                  Created {new Date(key.created_at).toLocaleDateString()}
                </div>
                {key.last_used && (
                  <span className="hidden md:inline text-[10px] text-slate-700">
                    Last used {new Date(key.last_used).toLocaleDateString()}
                  </span>
                )}
                <button
                  onClick={() => handleRevoke(key.id, key.name)}
                  className="p-2 text-slate-700 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all duration-200"
                  title="Revoke key"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
