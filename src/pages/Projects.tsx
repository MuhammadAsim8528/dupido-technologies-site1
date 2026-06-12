import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen, Download, Search, Filter, ArrowUpDown, Star,
  ExternalLink, ChevronDown, Package, Cpu, Code2, Terminal, Layers, Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import type { Project, ProjectCategory } from '../lib/types';
import { CATEGORY_LABELS } from '../lib/types';

const categoryIcons: Record<ProjectCategory, typeof Package> = {
  ai_tools: Cpu,
  apps: Package,
  scripts: Terminal,
  libraries: Code2,
  other: Layers,
};

const sortOptions = [
  { value: 'latest', label: 'Latest' },
  { value: 'downloads', label: 'Most Downloaded' },
  { value: 'name', label: 'Name A-Z' },
] as const;

const sampleProjects: Project[] = [
  {
    id: '1', user_id: '', title: 'NeuralVision SDK', description: 'Real-time object detection and image classification toolkit powered by transformer models. Build vision-enabled apps in minutes.', version: '2.4.1', category: 'ai_tools', file_url: '#', file_name: 'neuralvision-sdk-2.4.1.zip', file_size: 145_000_000, preview_image_url: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=600', download_count: 4823, featured: true, changelog: '## v2.4.1\n- Added real-time video stream support\n- 40% faster inference on GPU\n- New model: YOLOv8-int8', status: 'published', created_at: '2026-05-28', updated_at: '2026-06-01',
  },
  {
    id: '2', user_id: '', title: 'AutoDeploy CLI', description: 'Zero-config deployment tool for containerized applications. Push to production with a single command.', version: '1.8.0', category: 'scripts', file_url: '#', file_name: 'autodeploy-1.8.0.exe', file_size: 32_000_000, preview_image_url: 'https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg?auto=compress&cs=tinysrgb&w=600', download_count: 2156, featured: true, changelog: '## v1.8.0\n- Multi-cloud deployment support\n- Rolling updates with zero downtime', status: 'published', created_at: '2026-05-15', updated_at: '2026-05-30',
  },
  {
    id: '3', user_id: '', title: 'DataForge Analytics', description: 'Enterprise-grade analytics dashboard with real-time streaming, custom visualizations, and ML-powered insights.', version: '3.1.2', category: 'apps', file_url: '#', file_name: 'dataforge-3.1.2.zip', file_size: 210_000_000, preview_image_url: 'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=600', download_count: 1897, featured: false, changelog: '## v3.1.2\n- Custom chart builder\n- SQL query editor\n- Export to PDF/CSV', status: 'published', created_at: '2026-04-20', updated_at: '2026-05-25',
  },
  {
    id: '4', user_id: '', title: 'LLaMAWrapper', description: 'Lightweight Python wrapper for local LLaMA model inference. Optimized for M-series Macs and CUDA GPUs.', version: '0.9.5', category: 'libraries', file_url: '#', file_name: 'llamawrapper-0.9.5.zip', file_size: 8_500_000, preview_image_url: 'https://images.pexels.com/photos/8294554/pexels-photo-8294554.jpeg?auto=compress&cs=tinysrgb&w=600', download_count: 3421, featured: false, changelog: '## v0.9.5\n- MPS backend for Apple Silicon\n- Streaming token generation', status: 'published', created_at: '2026-05-10', updated_at: '2026-06-03',
  },
  {
    id: '5', user_id: '', title: 'SentimentBot Pro', description: 'NLP-powered sentiment analysis API with multi-language support. Real-time social media monitoring and brand tracking.', version: '1.2.0', category: 'ai_tools', file_url: '#', file_name: 'sentimentbot-1.2.0.zip', file_size: 67_000_000, preview_image_url: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=600', download_count: 1243, featured: false, changelog: '## v1.2.0\n- 12 new languages supported\n- Emotion detection layer', status: 'published', created_at: '2026-04-05', updated_at: '2026-05-18',
  },
  {
    id: '6', user_id: '', title: 'ShellForge', description: 'Generate production-ready shell scripts from natural language descriptions. Supports bash, zsh, and fish.', version: '2.0.0', category: 'scripts', file_url: '#', file_name: 'shellforge-2.0.0.apk', file_size: 18_000_000, preview_image_url: 'https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg?auto=compress&cs=tinysrgb&w=600', download_count: 987, featured: false, changelog: '## v2.0.0\n- Fish shell support\n- Interactive script builder', status: 'published', created_at: '2026-03-20', updated_at: '2026-05-12',
  },
];

function formatSize(bytes: number): string {
  if (bytes >= 1_000_000_000) return (bytes / 1_000_000_000).toFixed(1) + ' GB';
  if (bytes >= 1_000_000) return (bytes / 1_000_000).toFixed(0) + ' MB';
  if (bytes >= 1_000) return (bytes / 1_000).toFixed(0) + ' KB';
  return bytes + ' B';
}

export default function Projects() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [projects, setProjects] = useState<Project[]>(sampleProjects);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ProjectCategory | 'all'>('all');
  const [sort, setSort] = useState<'latest' | 'downloads' | 'name'>('latest');
  const [showSort, setShowSort] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  const filtered = projects
    .filter((p) => {
      if (category !== 'all' && p.category !== category) return false;
      if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === 'downloads') return b.download_count - a.download_count;
      if (sort === 'name') return a.title.localeCompare(b.title);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const handleDownload = async (project: Project) => {
    setDownloading(project.id);
    try {
      // Track download
      await supabase.from('project_downloads').insert({
        project_id: project.id,
        user_id: user?.id || null,
      });

      // Increment download count
      try {
        const { error: rpcError } = await supabase.rpc('increment_download_count', { project_id_input: project.id });
        if (rpcError) throw rpcError;
      } catch {
        supabase.from('projects').update({ download_count: project.download_count + 1 }).eq('id', project.id);
      }

      setProjects(prev => prev.map(p => p.id === project.id ? { ...p, download_count: p.download_count + 1 } : p));

      addToast('success', `Downloading ${project.title} v${project.version}`);

      // Trigger actual download if file URL is valid
      if (project.file_url && project.file_url !== '#') {
        window.open(project.file_url, '_blank');
      }
    } catch {
      addToast('error', 'Download failed');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Dupido</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/projects" className="btn-ghost text-sm text-emerald-400">Projects</Link>
            <Link to="/ai-chat" className="btn-ghost text-sm">AI Chat</Link>
            <Link to="/contact" className="btn-ghost text-sm">Contact</Link>
            {user ? (
              <Link to="/dashboard" className="btn-primary text-sm !px-4 !py-2">Dashboard</Link>
            ) : (
              <Link to="/login" className="btn-primary text-sm !px-4 !py-2">Sign in</Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-12 px-6 relative">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-emerald-500/[0.05] rounded-full blur-[150px]" />
        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="badge-info mb-4">Developer Hub</span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
              Project <span className="gradient-text">Marketplace</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
              Download tools, apps, and scripts — or upload your own. The developer hub for AI-powered software.
            </p>
          </motion.div>

          {/* Search + Filters */}
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects..."
                className="input-field !pl-11"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProjectCategory | 'all')}
                className="bg-slate-900/80 border border-slate-800/80 rounded-xl px-3 py-3 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                <option value="all">All Categories</option>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <div className="relative">
                <button
                  onClick={() => setShowSort(!showSort)}
                  className="flex items-center gap-2 px-3 py-3 glass rounded-xl text-sm text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  <span className="hidden sm:inline">{sortOptions.find(s => s.value === sort)?.label}</span>
                </button>
                <AnimatePresence>
                  {showSort && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute top-12 right-0 w-40 card !p-1 z-20 shadow-xl"
                    >
                      {sortOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => { setSort(opt.value); setShowSort(false); }}
                          className={`w-full px-3 py-2 rounded-lg text-xs text-left transition-colors ${sort === opt.value ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:bg-white/5'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Project Grid */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <Sparkles className="w-12 h-12 text-slate-800 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-1">No projects found</h3>
              <p className="text-sm text-slate-600">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((project, i) => {
                const CatIcon = categoryIcons[project.category];
                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                    className="card-hover group overflow-hidden"
                  >
                    {/* Preview Image */}
                    <div className="relative h-40 -mx-6 -mt-6 mb-4 overflow-hidden">
                      <img
                        src={project.preview_image_url || 'https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg?auto=compress&cs=tinysrgb&w=600'}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                      {project.featured && (
                        <div className="absolute top-3 right-3 badge-info flex items-center gap-1">
                          <Star className="w-3 h-3" /> Featured
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3">
                        <span className="badge text-[10px] bg-white/10 text-white border-white/20">
                          v{project.version}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className="badge-neutral text-[10px] flex items-center gap-1">
                        <CatIcon className="w-3 h-3" /> {CATEGORY_LABELS[project.category]}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-emerald-400 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">
                      {project.description}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <div className="flex items-center gap-3 text-[10px] text-slate-600">
                        <span className="flex items-center gap-1"><Download className="w-3 h-3" /> {project.download_count.toLocaleString()}</span>
                        <span>{formatSize(project.file_size)}</span>
                      </div>
                      <button
                        onClick={() => handleDownload(project)}
                        disabled={downloading === project.id}
                        className="btn-primary text-xs !px-3 !py-1.5 flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {downloading === project.id ? (
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <><Download className="w-3 h-3" /> Download</>
                        )}
                      </button>
                    </div>

                    {project.changelog && (
                      <details className="mt-3">
                        <summary className="text-[10px] text-slate-600 cursor-pointer hover:text-slate-400 transition-colors">
                          View changelog
                        </summary>
                        <div className="mt-2 text-[10px] text-slate-500 whitespace-pre-wrap leading-relaxed max-h-32 overflow-auto">
                          {project.changelog}
                        </div>
                      </details>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-700">
          <span>&copy; 2026 Dupido Technologies</span>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-slate-400 transition-colors">Home</Link>
            <Link to="/projects" className="hover:text-slate-400 transition-colors">Projects</Link>
            <Link to="/ai-chat" className="hover:text-slate-400 transition-colors">AI Chat</Link>
            <Link to="/contact" className="hover:text-slate-400 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
