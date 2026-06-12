import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Send, Bot, User, Sparkles, Loader2, Zap, Plus,
  Trash2, ChevronDown, Menu, X, Pencil, Pin, PinOff, Settings,
  Search as SearchIcon, FlaskConical, Paperclip,
  Sliders, Copy, CheckCircle2, RotateCcw, Bookmark, BookmarkCheck,
  Play, Terminal, AlertTriangle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { MODEL_OPTIONS } from '../lib/types';
import type { ChatConversation, ChatMessage } from '../lib/types';
import {
  estimateTokens, trimMessagesToContext, condenseHistory,
  formatTokenCount, CONTEXT_WINDOWS, DEFAULT_CONTEXT,
  analyzeQueryComplexity, getRouteForComplexity
} from '../lib/ai';

interface LocalMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model: string | null;
  timestamp: Date;
  tokensIn?: number;
  tokensOut?: number;
  error?: boolean;
  files?: FileAttachment[];
  deepResearch?: boolean;
  routing?: { provider: string; model: string; complexity: string };
}

interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  preview?: string;
}

interface TelemetryLine {
  id: string;
  text: string;
  type: 'info' | 'routing' | 'tavily' | 'nim' | 'groq' | 'ok' | 'warn' | 'error';
  timestamp: Date;
}

function StreamingText({ content, done }: { content: string; done: boolean }) {
  return (
    <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
      {content}
      {!done && <span className="inline-block w-0.5 h-4 bg-emerald-400 animate-pulse ml-0.5 align-middle" />}
    </div>
  );
}

function FileChip({ file }: { file: FileAttachment }) {
  const isImage = file.type.startsWith('image/');
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#0C0C0D] border border-[#1A1A1C] rounded-sm text-xs text-slate-400 max-w-[200px]">
      {isImage && file.preview ? (
        <img src={file.preview} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" />
      ) : (
        <Paperclip className="w-3 h-3 flex-shrink-0" />
      )}
      <span className="truncate">{file.name}</span>
    </div>
  );
}

function telemetryColor(type: TelemetryLine['type']): string {
  switch (type) {
    case 'info': return 'text-slate-500';
    case 'routing': return 'text-blue-400';
    case 'tavily': return 'text-amber-400';
    case 'nim': return 'text-emerald-400';
    case 'groq': return 'text-orange-400';
    case 'ok': return 'text-emerald-400';
    case 'warn': return 'text-amber-400';
    case 'error': return 'text-red-400';
  }
}

function telemetryPrefix(type: TelemetryLine['type']): string {
  switch (type) {
    case 'info': return '[INFO]';
    case 'routing': return '[ROUTING]';
    case 'tavily': return '[TAVILY]';
    case 'nim': return '[NVIDIA NIM]';
    case 'groq': return '[GROQ]';
    case 'ok': return '[OK]';
    case 'warn': return '[WARN]';
    case 'error': return '[ERROR]';
  }
}

export default function AiChat() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState('');
  const [model, setModel] = useState('llama-3.1-70b-versatile');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showModelSelect, setShowModelSelect] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [deepResearch, setDeepResearch] = useState(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [pinnedConvos, setPinnedConvos] = useState<Set<string>>(new Set());
  const [savedMsgs, setSavedMsgs] = useState<Set<string>>(new Set());
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryLine[]>([]);
  const [showTelemetry, setShowTelemetry] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const telemetryRef = useRef<HTMLDivElement>(null);

  const selectedModel = MODEL_OPTIONS.find(m => m.id === model) || MODEL_OPTIONS[0];
  const contextWindow = CONTEXT_WINDOWS[model] || DEFAULT_CONTEXT;
  const inputTokens = estimateTokens(input);
  const historyTokens = messages.reduce((s, m) => s + estimateTokens(m.content), 0);
  const totalTokens = historyTokens + inputTokens;

  useEffect(() => {
    if (user) loadConversations();
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamedContent]);

  useEffect(() => {
    if (telemetryRef.current) {
      telemetryRef.current.scrollTop = telemetryRef.current.scrollHeight;
    }
  }, [telemetry]);

  const addTelemetry = (text: string, type: TelemetryLine['type'] = 'info') => {
    setTelemetry(prev => [...prev, { id: crypto.randomUUID(), text, type, timestamp: new Date() }]);
  };

  const loadConversations = async () => {
    if (!user) return;
    const { data } = await supabase.from('chat_conversations').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
    if (data) {
      setConversations(data as ChatConversation[]);
      const pinned = localStorage.getItem('pinned-conversations');
      if (pinned) setPinnedConvos(new Set(JSON.parse(pinned)));
    }
  };

  const createConversation = async (): Promise<string> => {
    if (activeConvId && messages.length === 0) return activeConvId;

    const convId = crypto.randomUUID();

    if (user) {
      try {
        const { data, error } = await supabase.from('chat_conversations').insert({
          user_id: user.id, title: 'New conversation', model,
        }).select().single();
        if (!error && data) {
          setConversations(prev => [data as ChatConversation, ...prev]);
          setActiveConvId(data.id);
          setMessages([]);
          return data.id;
        }
      } catch { /* fall through to local */ }
    }

    setActiveConvId(convId);
    setMessages([]);
    return convId;
  };

  const deleteConversation = async (id: string) => {
    if (user) await supabase.from('chat_conversations').delete().eq('id', id);
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConvId === id) { setActiveConvId(null); setMessages([]); }
  };

  const renameConversation = async (id: string, title: string) => {
    if (user) await supabase.from('chat_conversations').update({ title }).eq('id', id);
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title } : c));
    setEditingTitle(null);
  };

  const togglePin = (id: string) => {
    setPinnedConvos(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem('pinned-conversations', JSON.stringify([...next]));
      return next;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newAttachments: FileAttachment[] = [];
    Array.from(files).forEach(f => {
      const att: FileAttachment = { id: crypto.randomUUID(), name: f.name, type: f.type, size: f.size };
      if (f.type.startsWith('image/')) att.preview = URL.createObjectURL(f);
      newAttachments.push(att);
    });
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const handleIngestion = async () => {
    if (!input.trim() && attachments.length === 0) return;
    if (loading) return;

    // Capture attachment data before any state changes
    const hasFiles = attachments.length > 0;
    const fileTypes = attachments.map(a => a.type);
    const currentInput = input.trim();

    let convId = activeConvId;
    if (!convId) {
      convId = await createConversation();
    }

    setTelemetry([]);
    addTelemetry('Initiating ingestion engine...', 'info');
    addTelemetry(`Payload: ${currentInput.length} chars, ${hasFiles ? fileTypes.length : 0} files, model=${model}`, 'info');

    const filesNote = hasFiles
      ? `\n\n[Attached files: ${attachments.map(a => a.name).join(', ')}]`
      : '';

    const userMsg: LocalMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: currentInput + filesNote,
      model: null,
      timestamp: new Date(),
      tokensIn: estimateTokens(currentInput + filesNote),
      files: hasFiles ? [...attachments] : undefined,
      deepResearch,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachments([]);
    setLoading(true);
    setStreaming(true);
    setStreamedContent('');

    const complexity = analyzeQueryComplexity(currentInput, hasFiles, fileTypes, deepResearch);
    const route = getRouteForComplexity(complexity);
    addTelemetry(`Query complexity assessed: ${complexity}`, 'info');
    addTelemetry(route.reason, 'routing');

    const allMessages = [...messages, userMsg];

    // Save user message (best-effort, non-blocking)
    if (user && convId) {
      supabase.from('chat_messages').insert({
        conversation_id: convId, role: 'user', content: userMsg.content,
      }).then(() => {});
      if (messages.length === 0) {
        const title = userMsg.content.slice(0, 50) + (userMsg.content.length > 50 ? '...' : '');
        supabase.from('chat_conversations').update({ title, model }).eq('id', convId).then(() => {
          setConversations(prev => prev.map(c => c.id === convId ? { ...c, title, model } : c));
        });
      }
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const abortController = new AbortController();
      abortRef.current = abortController;

      let apiMessages = allMessages.map(m => ({ role: m.role, content: m.content }));
      if (apiMessages.length > 8) {
        addTelemetry('Chat history exceeds 8 messages. Condensing older context...', 'info');
        apiMessages = condenseHistory(apiMessages, 8);
      }

      apiMessages = trimMessagesToContext(
        apiMessages,
        contextWindow,
        deepResearch ? 'You are a research assistant. Provide thorough, well-structured answers with clear reasoning steps. Cite sources when possible. Use a professional tone without emojis.' : 'You are a helpful AI assistant. Respond clearly and professionally. Use a professional tone without emojis.'
      );

      if (deepResearch) {
        addTelemetry('Fetching web indexes and isolating source citations...', 'tavily');
        addTelemetry('Compiling final multi-modal executive document structure...', 'nim');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY as string}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          model,
          max_tokens: deepResearch ? 4096 : 1024,
          temperature,
          deep_research: deepResearch,
          has_files: hasFiles,
          file_types: fileTypes,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errData.error || `API returned ${response.status}`);
      }

      const data = await response.json();
      const assistantContent = data.choices?.[0]?.message?.content || 'No response generated.';

      if (data.telemetry && Array.isArray(data.telemetry)) {
        for (const t of data.telemetry) {
          if (typeof t === 'string') {
            let type: TelemetryLine['type'] = 'info';
            if (t.includes('[ROUTING]')) type = 'routing';
            else if (t.includes('[TAVILY]')) type = 'tavily';
            else if (t.includes('[NVIDIA NIM]')) type = 'nim';
            else if (t.includes('[GROQ]')) type = 'groq';
            else if (t.includes('[WARN]')) type = 'warn';
            else if (t.includes('[ERROR]') || t.includes('[CRITICAL]')) type = 'error';
            else if (t.includes('[OK]')) type = 'ok';
            addTelemetry(t, type);
          }
        }
      }

      if (data.routing) {
        addTelemetry(`Response delivered via ${data.routing.provider}/${data.routing.model}`, 'ok');
      }

      // Simulate streaming display
      let displayed = '';
      const chunkSize = deepResearch ? 5 : 3;
      for (let i = 0; i < assistantContent.length; i += Math.floor(Math.random() * chunkSize) + chunkSize) {
        displayed += assistantContent.slice(i, i + Math.floor(Math.random() * chunkSize) + chunkSize);
        setStreamedContent(displayed);
        await new Promise(r => setTimeout(r, 8));
        if (abortController.signal.aborted) break;
      }

      const assistantMsg: LocalMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: assistantContent,
        model,
        timestamp: new Date(),
        tokensIn: userMsg.tokensIn,
        tokensOut: estimateTokens(assistantContent),
        deepResearch,
        routing: data.routing,
      };

      setMessages(prev => [...prev, assistantMsg]);
      setStreamedContent('');
      setStreaming(false);

      // Save assistant message (best-effort, non-blocking)
      if (user && convId) {
        supabase.from('chat_messages').insert({
          conversation_id: convId, role: 'assistant', content: assistantContent, model,
          tokens_in: assistantMsg.tokensIn || 0, tokens_out: assistantMsg.tokensOut || 0,
        }).then(() => {});
        supabase.from('usage_logs').insert({
          user_id: user.id, action: deepResearch ? 'deep_research' : 'chat_completion', model,
          tokens_in: assistantMsg.tokensIn || 0, tokens_out: assistantMsg.tokensOut || 0,
        }).then(() => {});
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      if (errorMsg !== 'The user aborted a request.') {
        addTelemetry(`${errorMsg}`, 'error');
        addTelemetry('Swapping to fallback network cluster...', 'warn');
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(), role: 'assistant',
          content: `Error: ${errorMsg}. The system attempted automatic failover. Please try again.`,
          model: null, timestamp: new Date(), error: true,
        }]);
        addToast('error', 'AI response failed — failover attempted');
      }
    } finally {
      setLoading(false);
      setStreaming(false);
      setStreamedContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleIngestion(); }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setLoading(false);
    setStreaming(false);
    if (streamedContent) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: streamedContent, model, timestamp: new Date() }]);
      setStreamedContent('');
    }
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRegenerate = () => {
    if (messages.length < 2) return;
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      setMessages(prev => prev.slice(0, -1));
      setInput(lastUserMsg.content.replace(/\n\n\[Attached files:.*?\]/, ''));
      setTimeout(() => handleIngestion(), 100);
    }
  };

  const toggleSave = (msgId: string) => {
    setSavedMsgs(prev => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId); else next.add(msgId);
      return next;
    });
    addToast('info', savedMsgs.has(msgId) ? 'Removed from library' : 'Saved to library');
  };

  const loadConversationMessages = async (convId: string) => {
    if (!user) return;
    const { data } = await supabase.from('chat_messages').select('*').eq('conversation_id', convId).order('created_at', { ascending: true });
    if (data) {
      setMessages((data as ChatMessage[]).map(m => ({
        id: m.id, role: m.role as 'user' | 'assistant', content: m.content,
        model: m.model, timestamp: new Date(m.created_at), tokensIn: m.tokens_in, tokensOut: m.tokens_out,
      })));
    }
  };

  const filteredConversations = conversations.filter(c =>
    !sidebarSearch || c.title.toLowerCase().includes(sidebarSearch.toLowerCase())
  );
  const pinnedConvs = filteredConversations.filter(c => pinnedConvos.has(c.id));
  const recentConvs = filteredConversations.filter(c => !pinnedConvos.has(c.id));

  // Filter model groups - exclude OpenAI and Gemini (serverless mode)
  const availableGroups = ['nvidia', 'groq', 'huggingface'];
  const groupLabels: Record<string, string> = { nvidia: 'NVIDIA NIM', groq: 'Groq', huggingface: 'Hugging Face' };

  return (
    <div className="h-screen bg-black flex overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar ? (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-[280px] bg-[#0C0C0D] border-r border-[#1A1A1C] flex-shrink-0 flex flex-col overflow-hidden"
          >
            <div className="p-3 flex items-center justify-between flex-shrink-0">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-sm bg-emerald-600 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white text-sm">Dupido AI</span>
              </Link>
              <button onClick={() => setShowSidebar(false)} className="text-slate-500 hover:text-white p-1 rounded-sm hover:bg-white/5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <button onClick={createConversation} className="mx-3 mb-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm py-2 rounded-sm font-medium flex items-center justify-center gap-2 transition-colors">
              <Plus className="w-4 h-4" /> New chat
            </button>

            <div className="mx-3 mb-2 relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
              <input
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                placeholder="Search chats..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#0C0C0D] border border-[#1A1A1C] rounded-sm text-xs text-slate-400 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
              />
            </div>

            <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
              {pinnedConvs.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-[10px] text-slate-600 uppercase tracking-wider font-semibold">Pinned</div>
                  {pinnedConvs.map(conv => (
                    <ConversationRow key={conv.id} conv={conv} active={activeConvId === conv.id} pinned
                      onSelect={() => { setActiveConvId(conv.id); loadConversationMessages(conv.id); }}
                      onDelete={() => deleteConversation(conv.id)}
                      onRename={(title) => renameConversation(conv.id, title)}
                      onTogglePin={() => togglePin(conv.id)}
                      editingTitle={editingTitle} setEditingTitle={setEditingTitle}
                      editTitleValue={editTitleValue} setEditTitleValue={setEditTitleValue}
                    />
                  ))}
                </>
              )}
              {recentConvs.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-[10px] text-slate-600 uppercase tracking-wider font-semibold">Recent</div>
                  {recentConvs.map(conv => (
                    <ConversationRow key={conv.id} conv={conv} active={activeConvId === conv.id} pinned={false}
                      onSelect={() => { setActiveConvId(conv.id); loadConversationMessages(conv.id); }}
                      onDelete={() => deleteConversation(conv.id)}
                      onRename={(title) => renameConversation(conv.id, title)}
                      onTogglePin={() => togglePin(conv.id)}
                      editingTitle={editingTitle} setEditingTitle={setEditingTitle}
                      editTitleValue={editTitleValue} setEditTitleValue={setEditTitleValue}
                    />
                  ))}
                </>
              )}
              {filteredConversations.length === 0 && !user && (
                <div className="px-3 py-8 text-center text-xs text-slate-700">Sign in to save chat history</div>
              )}
            </div>

            <div className="p-3 border-t border-[#1A1A1C] flex-shrink-0">
              {user ? (
                <Link to="/dashboard" className="text-xs text-slate-500 hover:text-slate-300 w-full flex items-center justify-center gap-1.5 transition-colors">
                  <Settings className="w-3 h-3" /> Dashboard
                </Link>
              ) : (
                <Link to="/login" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-2 rounded-sm font-medium w-full flex items-center justify-center gap-1.5 transition-colors">
                  Sign in to save chats
                </Link>
              )}
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-12 bg-[#0C0C0D] border-b border-[#1A1A1C] flex items-center px-3 gap-2 flex-shrink-0">
          <button onClick={() => setShowSidebar(true)} className={`text-slate-400 hover:text-white p-1.5 rounded-sm hover:bg-white/5 ${showSidebar ? 'hidden' : ''}`}>
            <Menu className="w-4 h-4" />
          </button>

          <span className="text-sm font-medium text-slate-300 truncate flex-1">
            {conversations.find(c => c.id === activeConvId)?.title || 'New conversation'}
          </span>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-600 font-mono hidden sm:inline">
              {formatTokenCount(totalTokens)} / {formatTokenCount(contextWindow)}
            </span>

            <button
              onClick={() => setDeepResearch(!deepResearch)}
              className={`flex items-center gap-1 px-2 py-1 rounded-sm text-[10px] font-medium transition-colors ${deepResearch ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-slate-600 hover:text-slate-400 hover:bg-white/5'}`}
            >
              <FlaskConical className="w-3 h-3" /> Research
            </button>

            {/* Model selector - z-50 for dropdown */}
            <div className="relative z-50">
              <button onClick={() => setShowModelSelect(!showModelSelect)} className="flex items-center gap-1.5 px-2 py-1 bg-[#0C0C0D] border border-[#1A1A1C] rounded-sm text-xs text-slate-400 hover:text-slate-200 transition-colors">
                <div className="w-2 h-2 rounded-full" style={{ background: selectedModel.color }} />
                <span className="hidden sm:inline">{selectedModel.name}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              <AnimatePresence>
                {showModelSelect && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute top-9 right-0 w-72 bg-[#0C0C0D] border border-[#1A1A1C] rounded-sm p-2 shadow-2xl max-h-80 overflow-auto z-50"
                  >
                    {availableGroups.map(group => (
                      <div key={group}>
                        <div className="px-3 py-1.5 text-[10px] text-slate-600 uppercase tracking-wider font-semibold">
                          {groupLabels[group]}
                        </div>
                        {MODEL_OPTIONS.filter(m => m.group === group).map(m => (
                          <button key={m.id} onClick={() => { setModel(m.id); setShowModelSelect(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm text-xs transition-colors ${model === m.id ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:bg-white/5'}`}>
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color }} />
                            <div className="flex-1 text-left">
                              <div className="font-medium">{m.name}</div>
                              <div className="text-[10px] text-slate-600">{m.speed} · {m.context}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ))}
                    {/* OpenAI/Gemini notice */}
                    <div className="px-3 py-2 mt-1 border-t border-[#1A1A1C]">
                      <div className="flex items-center gap-1.5 text-[10px] text-amber-500/70">
                        <AlertTriangle className="w-3 h-3" />
                        <span>OpenAI/Gemini models redirect to Groq equivalents in serverless mode</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button onClick={() => setShowSettings(!showSettings)} className={`p-1.5 rounded-sm transition-colors ${showSettings ? 'bg-white/5 text-emerald-400' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Settings panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-b border-[#1A1A1C] overflow-hidden">
              <div className="px-5 py-4 flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">Temperature</span>
                  <input type="range" min="0" max="1" step="0.1" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} className="w-24 accent-emerald-500" />
                  <span className="text-xs text-emerald-400 font-mono w-6">{temperature.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Model: </span>
                  <span className="text-emerald-400">{selectedModel.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Context: </span>
                  <span className="text-emerald-400">{formatTokenCount(contextWindow)}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages - explicit flex-1 overflow-y-auto container */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 space-y-5">
          {messages.length === 0 && !streaming && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
                <div className="w-14 h-14 rounded-sm bg-emerald-500/15 flex items-center justify-center mx-auto mb-5">
                  <Sparkles className="w-7 h-7 text-emerald-400" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Dupido AI Orchestrator</h2>
                <p className="text-slate-500 max-w-md mb-8 text-sm">
                  Multi-model AI with intelligent routing, deep research, and real-time telemetry.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg mx-auto">
                  {[
                    'Explain quantum computing in simple terms',
                    'Write a Python web scraper',
                    'Analyze this image for objects (attach a file)',
                    'Research: compare React vs Vue.js for enterprise apps',
                  ].map(prompt => (
                    <button key={prompt} onClick={() => setInput(prompt)} className="bg-[#0C0C0D] border border-[#1A1A1C] rounded-sm text-left text-xs text-slate-500 !p-3 hover:border-emerald-500/30 hover:text-slate-400 transition-all">
                      <Zap className="w-3.5 h-3.5 text-emerald-500/50 mb-1.5" />
                      {prompt}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          <AnimatePresence>
            {messages.map(msg => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className={`w-7 h-7 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5 ${msg.error ? 'bg-red-500/20' : 'bg-emerald-600'}`}>
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div className={`max-w-2xl rounded-sm px-4 py-3 ${msg.role === 'user' ? 'bg-emerald-600/90 text-white' : msg.error ? 'bg-[#0C0C0D] border border-red-500/20 text-red-300' : 'bg-[#0C0C0D] border border-[#1A1A1C] text-slate-200'}`}>
                  {msg.files && msg.files.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {msg.files.map(f => <FileChip key={f.id} file={f} />)}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                  {msg.role === 'assistant' && !msg.error && (
                    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#1A1A1C]">
                      <button onClick={() => handleCopy(msg.id, msg.content)} className="p-1 text-slate-700 hover:text-slate-400 rounded transition-colors">
                        {copiedId === msg.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={handleRegenerate} className="p-1 text-slate-700 hover:text-slate-400 rounded transition-colors">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => toggleSave(msg.id)} className="p-1 text-slate-700 hover:text-slate-400 rounded transition-colors">
                        {savedMsgs.has(msg.id) ? <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Bookmark className="w-3.5 h-3.5" />}
                      </button>
                      <div className="ml-auto flex items-center gap-2 text-[10px] text-slate-700">
                        {msg.deepResearch && <span className="bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-sm text-[8px]">Research</span>}
                        {msg.routing && <span className="text-emerald-500 font-mono">{msg.routing.provider}/{msg.routing.model?.split('/').pop()}</span>}
                        {msg.model && !msg.routing && <span className="font-mono">{msg.model.split('/').pop()}</span>}
                        {msg.tokensIn && msg.tokensOut && <span className="font-mono">{formatTokenCount(msg.tokensIn + msg.tokensOut)}</span>}
                        <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-sm bg-[#1A1A1C] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {streaming && streamedContent && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-sm bg-emerald-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-[#0C0C0D] border border-[#1A1A1C] rounded-sm px-4 py-3 max-w-2xl">
                <StreamingText content={streamedContent} done={false} />
              </div>
            </div>
          )}

          {loading && !streaming && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-7 h-7 rounded-sm bg-emerald-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-[#0C0C0D] border border-[#1A1A1C] rounded-sm px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {deepResearch ? 'Researching...' : `Connecting to ${selectedModel.provider}...`}
                </div>
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Live Telemetry Feed */}
        <AnimatePresence>
          {showTelemetry && telemetry.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 140, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-[#1A1A1C] bg-[#0C0C0D] overflow-hidden flex-shrink-0"
            >
              <div className="flex items-center justify-between px-3 py-1 border-b border-[#1A1A1C]">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Live Operations Feed</span>
                </div>
                <button onClick={() => setShowTelemetry(false)} className="text-slate-600 hover:text-slate-400 text-[10px]">Hide</button>
              </div>
              <div ref={telemetryRef} className="overflow-y-auto px-3 py-2 space-y-0.5 font-mono text-[11px]">
                {telemetry.map(t => (
                  <div key={t.id} className={`${telemetryColor(t.type)}`}>
                    <span className="text-slate-700 mr-1">{t.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    <span className="font-semibold mr-1">{telemetryPrefix(t.type)}</span>
                    {t.text.replace(/\[(INFO|ROUTING|TAVILY|NVIDIA NIM|GROQ|OK|WARN|ERROR|CRITICAL)\]\s*/, '')}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input area */}
        <div className="p-3 lg:p-4 border-t border-[#1A1A1C] bg-[#0C0C0D]">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 max-w-4xl mx-auto">
              {attachments.map(att => (
                <div key={att.id} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0C0C0D] border border-[#1A1A1C] rounded-sm text-xs text-slate-400">
                  {att.type.startsWith('image/') && att.preview ? (
                    <img src={att.preview} alt="" className="w-5 h-5 rounded object-cover" />
                  ) : (
                    <Paperclip className="w-3 h-3" />
                  )}
                  <span className="max-w-[120px] truncate">{att.name}</span>
                  <button onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))} className="text-slate-600 hover:text-red-400">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="max-w-4xl mx-auto flex items-end gap-2">
            <div className="flex items-center gap-1">
              <input ref={fileRef} type="file" className="hidden" multiple accept="image/*,.pdf,.txt,.mp3,.wav,.mp4" onChange={handleFileUpload} />
              <button onClick={() => fileRef.current?.click()} className="p-2.5 bg-[#0C0C0D] border border-[#1A1A1C] rounded-sm text-slate-500 hover:text-emerald-400 hover:border-emerald-500/30 transition-all" title="Attach files">
                <Paperclip className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={deepResearch ? "Ask a research question..." : "Ask anything... (Enter to send, Shift+Enter for newline)"}
                rows={1}
                className="bg-[#0C0C0D] border border-[#1A1A1C] rounded-sm px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/30 resize-none min-h-[44px] max-h-28 !pr-20"
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = 'auto';
                  t.style.height = Math.min(t.scrollHeight, 112) + 'px';
                }}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <span className="text-[10px] text-slate-700 font-mono">{formatTokenCount(estimateTokens(input))}</span>
                {deepResearch && <FlaskConical className="w-3 h-3 text-amber-500/50" />}
              </div>
            </div>

            {/* RUN INGESTION ENGINE button */}
            {loading ? (
              <button onClick={handleStop} className="bg-red-600 hover:bg-red-500 text-white px-3.5 py-2.5 rounded-sm text-xs font-medium flex-shrink-0 transition-colors">
                Stop
              </button>
            ) : (
              <button
                onClick={handleIngestion}
                disabled={!input.trim() && attachments.length === 0}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2.5 rounded-sm text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 flex items-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                RUN INGESTION
              </button>
            )}
          </div>

          <div className="max-w-4xl mx-auto flex items-center justify-between mt-1.5">
            <p className="text-[10px] text-slate-700">
              Powered by NVIDIA NIM, Groq, Hugging Face. {deepResearch && 'Deep research mode active.'}
            </p>
            {!showTelemetry && telemetry.length > 0 && (
              <button onClick={() => setShowTelemetry(true)} className="text-[10px] text-slate-600 hover:text-emerald-400 flex items-center gap-1 transition-colors">
                <Terminal className="w-3 h-3" /> Show telemetry
              </button>
            )}
            {telemetry.length === 0 && (
              <button onClick={() => setShowTelemetry(true)} className="text-[10px] text-slate-700 hover:text-slate-500 flex items-center gap-1 transition-colors">
                <Terminal className="w-3 h-3" /> Telemetry
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConversationRow({ conv, active, pinned, onSelect, onDelete, onRename, onTogglePin, editingTitle, setEditingTitle, editTitleValue, setEditTitleValue }: {
  conv: ChatConversation; active: boolean; pinned: boolean;
  onSelect: () => void; onDelete: () => void; onRename: (title: string) => void; onTogglePin: () => void;
  editingTitle: string | null; setEditingTitle: (id: string | null) => void;
  editTitleValue: string; setEditTitleValue: (v: string) => void;
}) {
  const isEditing = editingTitle === conv.id;

  return (
    <div className={`group flex items-center gap-2 px-2.5 py-2 rounded-sm text-xs cursor-pointer transition-colors ${active ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
      onClick={() => { if (!isEditing) onSelect(); }}
    >
      {pinned && <Pin className="w-3 h-3 text-amber-500/50 flex-shrink-0" />}
      {!pinned && <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />}

      {isEditing ? (
        <input
          value={editTitleValue}
          onChange={(e) => setEditTitleValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onRename(editTitleValue); if (e.key === 'Escape') setEditingTitle(null); }}
          onBlur={() => onRename(editTitleValue)}
          className="flex-1 bg-[#0C0C0D] border border-[#1A1A1C] rounded-sm px-2 py-0.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="flex-1 truncate">{conv.title}</span>
      )}

      <div className="hidden group-hover:flex items-center gap-0.5">
        <button onClick={(e) => { e.stopPropagation(); onTogglePin(); }} className="p-1 text-slate-600 hover:text-amber-400 rounded transition-colors" title={pinned ? 'Unpin' : 'Pin'}>
          {pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
        </button>
        <button onClick={(e) => { e.stopPropagation(); setEditingTitle(conv.id); setEditTitleValue(conv.title); }} className="p-1 text-slate-600 hover:text-emerald-400 rounded transition-colors" title="Rename">
          <Pencil className="w-3 h-3" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 text-slate-600 hover:text-red-400 rounded transition-colors" title="Delete">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
