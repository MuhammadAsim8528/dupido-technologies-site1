import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, LayoutDashboard, Key, CreditCard, Shield, Settings,
  MessageSquare, LogOut, Menu, X, Search, BookOpen, Command, Upload, Bookmark, Package
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/dashboard/chat', icon: MessageSquare, label: 'AI Chat' },
  { to: '/dashboard/library', icon: Bookmark, label: 'Library' },
  { to: '/dashboard/releases', icon: Package, label: 'Releases' },
  { to: '/dashboard/upload', icon: Upload, label: 'Upload Project' },
  { to: '/dashboard/api-keys', icon: Key, label: 'API Keys' },
  { to: '/dashboard/billing', icon: CreditCard, label: 'Billing' },
  { to: '/dashboard/security', icon: Shield, label: 'Security' },
  { to: '/dashboard/docs', icon: BookOpen, label: 'API Docs' },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

const searchItems = navItems.map((n) => ({ label: n.label, to: n.to }));

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const filtered = searchItems.filter((s) =>
    s.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[90] flex items-start justify-center pt-[20vh]" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg glass-strong rounded-2xl shadow-2xl overflow-hidden border-white/10"
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
          <Search className="w-5 h-5 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, actions..."
            className="flex-1 bg-transparent text-white text-sm placeholder-slate-600 focus:outline-none"
            autoFocus
          />
          <kbd className="px-2 py-0.5 text-[10px] text-slate-600 bg-slate-800 rounded border border-slate-700">ESC</kbd>
        </div>
        <div className="max-h-64 overflow-auto p-2">
          {filtered.map((item) => (
            <button
              key={item.to}
              onClick={() => { navigate(item.to); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-300 hover:bg-white/5 transition-colors text-left"
            >
              <span className="text-slate-600">{item.label}</span>
              <span className="ml-auto text-xs text-slate-700">Go to</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-600">No results found</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { user, profile, subscription, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Keyboard shortcut: Cmd/Ctrl + K for palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setPaletteOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const usagePercent = subscription
    ? Math.min((subscription.usage_used / subscription.usage_limit) * 100, 100)
    : 0;

  return (
    <div className="min-h-screen bg-black flex">
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 border-r border-[#1A1A1C] bg-[#0C0C0D]">
        <div className="p-5">
          <NavLink to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-emerald-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">Dupido</span>
          </NavLink>
        </div>

        {/* Search trigger */}
        <div className="px-3 mb-2">
          <button
            onClick={() => setPaletteOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-sm text-slate-600 bg-[#0C0C0D] border border-[#1A1A1C] hover:bg-[#1A1A1C]/50 hover:border-[#2A2A2C] transition-all text-sm"
          >
            <Search className="w-4 h-4" />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="flex items-center gap-0.5 text-[10px] text-slate-700">
              <Command className="w-3 h-3" />K
            </kbd>
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}
            >
              <item.icon className="w-[18px] h-[18px]" />
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Usage bar */}
        <div className="px-3 pb-3">
          <div className="card !p-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-500">Usage this period</span>
              <span className="text-emerald-400 font-semibold">{subscription?.usage_used ?? 0}/{subscription?.usage_limit ?? 100}</span>
            </div>
            <div className="h-1.5 bg-[#1A1A1C] rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* User */}
        <div className="p-3 border-t border-[#1A1A1C]">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-semibold">
              {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{profile?.full_name || 'User'}</div>
              <div className="text-[11px] text-slate-600 truncate">{user?.email}</div>
            </div>
            <button onClick={handleSignOut} className="text-slate-700 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-500/10">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Sidebar - Mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed inset-y-0 left-0 w-60 bg-[#0C0C0D] border-r border-[#1A1A1C] z-50 lg:hidden"
            >
              <div className="p-5 flex items-center justify-between">
                <NavLink to="/" className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-sm bg-emerald-600 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-bold text-white">Dupido</span>
                </NavLink>
                <button onClick={() => setSidebarOpen(false)} className="text-slate-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="px-3 space-y-0.5">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}
                  >
                    <item.icon className="w-[18px] h-[18px]" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar - Mobile */}
        <header className="lg:hidden h-14 bg-[#0C0C0D] border-b border-[#1A1A1C] flex items-center px-4 gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-sm bg-emerald-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white text-sm">Dupido</span>
          </div>
          <button onClick={() => setPaletteOpen(true)} className="ml-auto text-slate-500 hover:text-white">
            <Search className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-semibold">
            {profile?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
