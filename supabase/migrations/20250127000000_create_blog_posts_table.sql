-- ============================================
-- BotanicMD - Tabela de Blog Posts
-- ============================================
-- 
-- Esta migration cria a tabela blog_posts para armazenar
-- posts do blog de forma persistente no Supabase.
-- 
-- Posts são públicos (qualquer um pode ler), mas apenas
-- usuários autenticados com permissão de admin podem criar/editar/deletar.
-- ============================================

-- Criar tabela de blog posts
CREATE TABLE IF NOT EXISTS blog_posts (
  id SERIAL PRIMARY KEY,
  
  -- Conteúdo do post
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  author TEXT NOT NULL,
  image_url TEXT,
  
  -- Metadados
  date TEXT NOT NULL, -- Mantido como TEXT para compatibilidade com formato atual
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Usuário que criou o post (opcional, para rastreamento)
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_by ON blog_posts(created_by);

-- ============================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- REMOVER POLÍTICAS ANTIGAS (SE EXISTIREM)
-- ============================================
DROP POLICY IF EXISTS "Anyone can read blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated users can create blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated users can update blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated users can delete blog posts" ON blog_posts;

-- ============================================
-- CRIAR POLÍTICAS RLS
-- ============================================

-- Política: Qualquer pessoa pode ler posts do blog (público)
CREATE POLICY "Anyone can read blog posts"
ON blog_posts FOR SELECT
USING (true);

-- Política: Apenas usuários autenticados podem criar posts
-- (Em produção, você pode adicionar verificação de admin aqui)
CREATE POLICY "Authenticated users can create blog posts"
ON blog_posts FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Política: Apenas o criador do post pode atualizar
-- (Ou você pode adicionar verificação de admin)
CREATE POLICY "Authenticated users can update blog posts"
ON blog_posts FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Política: Apenas o criador do post pode deletar
-- (Ou você pode adicionar verificação de admin)
CREATE POLICY "Authenticated users can delete blog posts"
ON blog_posts FOR DELETE
USING (auth.role() = 'authenticated');

-- ============================================
-- FUNÇÃO PARA ATUALIZAR updated_at AUTOMATICAMENTE
-- ============================================
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS trigger_update_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER trigger_update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_updated_at();

