-- ============================================
-- Corrigir RLS da tabela blog_posts para permitir UPDATE
-- ============================================
-- 
-- INSTRUÇÕES:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Execute este script
-- ============================================

-- Verificar se RLS está habilitado
-- Se blog_posts for pública (sem RLS), não precisa de políticas
-- Se tiver RLS, precisamos adicionar políticas

-- Opção 1: Desabilitar RLS (se blog_posts deve ser pública)
-- ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;

-- Opção 2: Adicionar políticas RLS (se blog_posts deve ter RLS)
-- Permitir leitura pública
DROP POLICY IF EXISTS "Public can read blog posts" ON blog_posts;
CREATE POLICY "Public can read blog posts"
ON blog_posts FOR SELECT
TO public
USING (true);

-- Permitir UPDATE para usuários autenticados (ou público se necessário)
-- Escolha uma das opções abaixo:

-- Opção A: Permitir UPDATE público (para migração)
DROP POLICY IF EXISTS "Public can update blog posts" ON blog_posts;
CREATE POLICY "Public can update blog posts"
ON blog_posts FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Opção B: Permitir UPDATE apenas para autenticados (mais seguro)
-- DROP POLICY IF EXISTS "Authenticated can update blog posts" ON blog_posts;
-- CREATE POLICY "Authenticated can update blog posts"
-- ON blog_posts FOR UPDATE
-- TO authenticated
-- USING (true)
-- WITH CHECK (true);

-- ============================================
-- NOTA: Se você escolher a Opção A (público),
-- considere remover a política após a migração
-- e usar a Opção B para produção.
-- ============================================

