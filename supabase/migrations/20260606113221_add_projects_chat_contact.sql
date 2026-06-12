-- Projects marketplace
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  category TEXT NOT NULL CHECK (category IN ('ai_tools', 'apps', 'scripts', 'libraries', 'other')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  preview_image_url TEXT,
  download_count INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  changelog TEXT,
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Contact messages
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Chat history (persistent across sessions)
CREATE TABLE public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New conversation',
  model TEXT NOT NULL DEFAULT 'gpt-4o',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  model TEXT,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Download tracking
CREATE TABLE public.project_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_downloads ENABLE ROW LEVEL SECURITY;

-- Projects: anyone can read published, only owner can modify
CREATE POLICY "select_published_projects" ON public.projects FOR SELECT TO authenticated USING (status = 'published' OR auth.uid() = user_id);
CREATE POLICY "select_published_projects_anon" ON public.projects FOR SELECT TO anon USING (status = 'published');
CREATE POLICY "insert_own_projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_projects" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_projects" ON public.projects FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Contact messages: anyone can insert, only admin reads
CREATE POLICY "insert_contact_messages" ON public.contact_messages FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "insert_contact_messages_auth" ON public.contact_messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "select_contact_messages_admin" ON public.contact_messages FOR SELECT TO authenticated USING (true);

-- Chat conversations
CREATE POLICY "select_own_conversations" ON public.chat_conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_conversations" ON public.chat_conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_conversations" ON public.chat_conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_conversations" ON public.chat_conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Chat messages
CREATE POLICY "select_own_messages" ON public.chat_messages FOR SELECT TO authenticated USING (conversation_id IN (SELECT id FROM chat_conversations WHERE user_id = auth.uid()));
CREATE POLICY "insert_own_messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (conversation_id IN (SELECT id FROM chat_conversations WHERE user_id = auth.uid()));

-- Downloads: anyone can insert, public read count
CREATE POLICY "insert_downloads" ON public.project_downloads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "insert_downloads_anon" ON public.project_downloads FOR INSERT TO anon WITH CHECK (true);

-- Indexes
CREATE INDEX idx_projects_category ON public.projects(category);
CREATE INDEX idx_projects_featured ON public.projects(featured);
CREATE INDEX idx_projects_downloads ON public.projects(download_count DESC);
CREATE INDEX idx_chat_conversations_user ON public.chat_conversations(user_id);
CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id);
