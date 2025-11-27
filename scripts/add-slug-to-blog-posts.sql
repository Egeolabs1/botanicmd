-- ============================================
-- Adicionar coluna 'slug' à tabela blog_posts
-- ============================================
-- 
-- INSTRUÇÕES:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Crie uma nova query
-- 4. Copie e cole este script completo
-- 5. Execute o script
-- ============================================

-- Adiciona a coluna slug se não existir
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Cria índice único para garantir slugs únicos (opcional, mas recomendado)
CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug) WHERE slug IS NOT NULL;

-- Cria índice para melhorar performance de buscas por slug
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug_lookup ON blog_posts(slug);

-- ============================================
-- ATENÇÃO: Após executar este script, você
-- precisará executar a migração de dados:
-- 
-- npm run migrate:blog-slugs
-- ============================================

