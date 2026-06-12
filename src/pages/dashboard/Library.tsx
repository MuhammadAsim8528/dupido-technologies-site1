import { useState, useCallback } from 'react';
import { Bookmark, Code2, Sparkles, Copy, CheckCircle2, Trash2, Plus, Search, FileText, Workflow } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';

interface LibraryItem {
  id: string;
  type: 'prompt' | 'snippet' | 'workflow';
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
}

const sampleItems: LibraryItem[] = [
  { id: '1', type: 'prompt', title: 'Code Review Assistant', content: 'Review the following code for bugs, security issues, and performance problems. Provide specific suggestions with line references.', tags: ['coding', 'review'], createdAt: '2026-06-01' },
  { id: '2', type: 'prompt', title: 'API Design Helper', content: 'Design a RESTful API for the following use case. Include endpoints, request/response schemas, auth requirements, and rate limiting strategy.', tags: ['api', 'design'], createdAt: '2026-05-28' },
  { id: '3', type: 'snippet', title: 'Python FastAPI Starter', content: 'from fastapi import FastAPI, HTTPException\nfrom pydantic import BaseModel\n\napp = FastAPI()\n\nclass Item(BaseModel):\n    name: str\n    description: str | None = None\n\n@app.get("/items/{item_id}")\nasync def read_item(item_id: int):\n    return {"item_id": item_id}', tags: ['python', 'api'], createdAt: '2026-05-25' },
  { id: '4', type: 'snippet', title: 'React Hook: useDebounce', content: 'import { useState, useEffect } from "react";\n\nexport function useDebounce<T>(value: T, delay: number): T {\n  const [debounced, setDebounced] = useState(value);\n  useEffect(() => {\n    const timer = setTimeout(() => setDebounced(value), delay);\n    return () => clearTimeout(timer);\n  }, [value, delay]);\n  return debounced;\n}', tags: ['react', 'hooks'], createdAt: '2026-05-20' },
  { id: '5', type: 'workflow', title: 'Deploy Pipeline', content: '1. Run test suite (npm test)\n2. Build production bundle (npm run build)\n3. Run Lighthouse audit\n4. Deploy to staging\n5. Run smoke tests\n6. Promote to production', tags: ['devops', 'automation'], createdAt: '2026-05-15' },
];

const typeIcons = { prompt: Sparkles, snippet: Code2, workflow: Workflow };
const typeColors = { prompt: 'badge-info', snippet: 'badge-success', workflow: 'badge-warning' };

export default function Library() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [items, setItems] = useState<LibraryItem[]>(sampleItems);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'prompt' | 'snippet' | 'workflow'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [newItem, setNewItem] = useState({ type: 'prompt' as LibraryItem['type'], title: '', content: '', tags: '' });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = items.filter(item => {
    if (filter !== 'all' && item.type !== filter) return false;
    if (search && !item.title.toLowerCase().includes(search.toLowerCase()) && !item.content.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    addToast('info', 'Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreate = () => {
    if (!newItem.title.trim() || !newItem.content.trim()) return;
    const item: LibraryItem = {
      id: crypto.randomUUID(),
      type: newItem.type,
      title: newItem.title.trim(),
      content: newItem.content.trim(),
      tags: newItem.tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
    };
    setItems(prev => [item, ...prev]);
    setNewItem({ type: 'prompt', title: '', content: '', tags: '' });
    setShowCreate(false);
    addToast('success', 'Item saved to library');
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-emerald-400" /> Library
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Saved prompts, code snippets, and reusable workflows.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm !px-4 !py-2.5 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add item
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search library..." className="input-field !pl-11" />
        </div>
        <div className="flex items-center gap-1">
          {(['all', 'prompt', 'snippet', 'workflow'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${filter === f ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
            </button>
          ))}
        </div>
      </div>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6" onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="card w-full max-w-lg">
              <h2 className="text-lg font-semibold text-white mb-4">Add to Library</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {(['prompt', 'snippet', 'workflow'] as const).map(t => (
                    <button key={t} onClick={() => setNewItem(prev => ({ ...prev, type: t }))} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${newItem.type === t ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' : 'text-slate-500 hover:text-slate-300 glass'}`}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
                <input type="text" value={newItem.title} onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))} placeholder="Title" className="input-field" />
                <textarea value={newItem.content} onChange={(e) => setNewItem(prev => ({ ...prev, content: e.target.value }))} placeholder="Content (prompt text, code, or workflow steps)" rows={5} className="input-field resize-none font-mono text-xs" />
                <input type="text" value={newItem.tags} onChange={(e) => setNewItem(prev => ({ ...prev, tags: e.target.value }))} placeholder="Tags (comma separated)" className="input-field" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowCreate(false)} className="btn-ghost text-sm">Cancel</button>
                <button onClick={handleCreate} disabled={!newItem.title.trim() || !newItem.content.trim()} className="btn-primary text-sm !px-5 !py-2.5 disabled:opacity-40">Save</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Items */}
      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Bookmark className="w-12 h-12 text-slate-800 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-1">No items found</h3>
          <p className="text-sm text-slate-600">Save prompts, snippets, and workflows for reuse.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, i) => {
            const TypeIcon = typeIcons[item.type];
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.04 }} className="card flex items-start gap-4 !py-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TypeIcon className="w-4.5 h-4.5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                    <span className={typeColors[item.type]}>{item.type}</span>
                  </div>
                  <pre className="text-xs text-slate-500 font-mono leading-relaxed whitespace-pre-wrap max-h-24 overflow-auto bg-slate-900/50 rounded-lg p-3 mb-2">{item.content}</pre>
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.tags.map(tag => (
                      <span key={tag} className="badge-neutral text-[10px]">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => handleCopy(item.id, item.content)} className="p-2 text-slate-600 hover:text-emerald-400 rounded-lg hover:bg-white/5 transition-colors">
                    {copiedId === item.id ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setItems(prev => prev.filter(it => it.id !== item.id))} className="p-2 text-slate-600 hover:text-red-400 rounded-lg hover:bg-red-500/5 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
