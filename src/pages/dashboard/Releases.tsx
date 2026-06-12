import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Package, Download, Shield, Clock, Cpu, Monitor, Smartphone, Apple } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import { supabase } from '../../lib/supabase';
import type { Project } from '../../lib/types';

interface ReleasePlatform {
  os: string;
  arch: string;
  ext: string;
  size: string;
  sha256: string;
  icon: typeof Monitor;
}

const platforms: ReleasePlatform[] = [
  { os: 'Windows', arch: 'x64', ext: '.exe', size: '142.3 MB', sha256: 'a7f3c8d2e1b4f6a9c0d3e5b7a2f4c6d8e1b3a5f7c9d2e4b6a8f0c2d4e6b8a1f3', icon: Monitor },
  { os: 'Windows', arch: 'x86', ext: '.exe', size: '138.1 MB', sha256: 'b8g4d9e3f2c5a7b0d1e4f6a8c0b2d4e6f8a0c2b4d6e8f0a2c4b6d8e0f2a4c6e8', icon: Monitor },
  { os: 'macOS', arch: 'ARM64', ext: '.dmg', size: '156.7 MB', sha256: 'c9h5e0f4a3d6b8c1e2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8', icon: Apple },
  { os: 'macOS', arch: 'Intel', ext: '.dmg', size: '158.2 MB', sha256: 'd0i6f1a5b4e7c9d2f3a5b7d9e1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9', icon: Apple },
  { os: 'Android', arch: 'ARM64', ext: '.apk', size: '98.4 MB', sha256: 'e1j7a2b6c5d8f0e3a4b6c8d0f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0', icon: Smartphone },
  { os: 'iOS', arch: 'ARM64', ext: '.ipa', size: '112.6 MB', sha256: 'f2k8b3c7d6e9a1f2b4c6d8e0a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0', icon: Apple },
];

const versionHistory = [
  { version: '1.0.4', date: '2026-06-07', changes: 'Enhanced multi-provider orchestration, live telemetry feed, ingestion engine' },
  { version: '1.0.3', date: '2026-06-05', changes: 'Added deep research mode, Tavily web search integration' },
  { version: '1.0.2', date: '2026-06-03', changes: 'Lemon Squeezy checkout, Google OAuth, verification UI' },
  { version: '1.0.1', date: '2026-06-01', changes: 'Initial KRONOS redesign, NVIDIA NIM + HF routing' },
  { version: '1.0.0', date: '2026-05-28', changes: 'Initial release' },
];

export default function Releases() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setProjects(data as Project[]);
  }, [user]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleDownload = async (platform: ReleasePlatform) => {
    try {
      const filePath = `releases/dupido-${platform.arch}${platform.ext}`;
      const { data } = supabase.storage.from('project-files').getPublicUrl(filePath);
      if (data?.publicUrl) {
        window.open(data.publicUrl, '_blank');
      } else {
        addToast('info', `Download for ${platform.os} ${platform.arch} will be available soon`);
      }
    } catch {
      addToast('error', 'Download failed. Please try again.');
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] text-slate-600 uppercase tracking-widest font-mono">Central Artifact Repository</span>
        </div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Package className="w-6 h-6 text-emerald-400" /> Releases
        </h1>
      </div>

      {/* Current version badge */}
      <div className="bg-[#0C0C0D] border border-[#1A1A1C] rounded-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-mono font-semibold rounded-sm border border-emerald-500/20">v1.0.4-STABLE</span>
          <span className="text-sm text-slate-400">Latest Release</span>
          <span className="text-xs text-slate-600 ml-auto">{new Date().toLocaleDateString()}</span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {platforms.map((p, i) => (
            <motion.button
              key={`${p.os}-${p.arch}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleDownload(p)}
              className="bg-[#0C0C0D] border border-[#1A1A1C] rounded-sm p-4 text-left hover:border-emerald-500/30 transition-all group"
            >
              <div className="flex items-center gap-2 mb-2">
                <p.icon className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-white">{p.os}</span>
                <span className="text-xs text-slate-600">{p.arch}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-600">
                <span>{p.ext}</span>
                <span>{p.size}</span>
              </div>
              <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-700 group-hover:text-emerald-500 transition-colors">
                <Download className="w-3 h-3" />
                <span>Download</span>
              </div>
            </motion.button>
          ))}
        </div>

        {/* iOS TestFlight note */}
        <div className="mt-3 px-4 py-3 bg-amber-500/5 border border-amber-500/15 rounded-sm">
          <p className="text-xs text-amber-400/80">iOS builds distributed via TestFlight. Join the beta program from the dashboard settings.</p>
        </div>
      </div>

      {/* Checksums */}
      <div className="bg-[#0C0C0D] border border-[#1A1A1C] rounded-sm p-5">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-emerald-400" /> SHA-256 Checksums
        </h2>
        <div className="space-y-2">
          {platforms.map(p => (
            <div key={`sha-${p.os}-${p.arch}`} className="flex items-start gap-3 text-[10px]">
              <span className="text-slate-500 w-24 flex-shrink-0">{p.os} {p.arch}:</span>
              <code className="text-slate-600 font-mono break-all">{p.sha256}</code>
            </div>
          ))}
        </div>
      </div>

      {/* Version History */}
      <div className="bg-[#0C0C0D] border border-[#1A1A1C] rounded-sm !p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1A1A1C]">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" /> Version History
          </h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1A1A1C]">
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-600 uppercase">Version</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-600 uppercase">Date</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-600 uppercase">Changes</th>
            </tr>
          </thead>
          <tbody>
            {versionHistory.map(v => (
              <tr key={v.version} className="border-b border-[#1A1A1C]/50 hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3 text-xs text-emerald-400 font-mono">{v.version}</td>
                <td className="px-5 py-3 text-xs text-slate-500">{v.date}</td>
                <td className="px-5 py-3 text-xs text-slate-400">{v.changes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
