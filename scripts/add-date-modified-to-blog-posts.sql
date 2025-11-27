-- ============================================
-- Adicionar coluna 'date_modified' à tabela blog_posts
-- ============================================
-- 
-- INSTRUÇÕES:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Crie uma nova query
-- 4. Copie e cole este script completo
-- 5. Execute o script
-- ============================================

-- Adiciona a coluna date_modified se não existir
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS date_modified TIMESTAMP WITH TIME ZONE;

-- Inicializa date_modified com created_at para posts existentes
-- (se date_modified for NULL, significa que nunca foi modificado)
UPDATE blog_posts 
SET date_modified = created_at 
WHERE date_modified IS NULL;

-- Cria trigger para atualizar date_modified automaticamente
-- quando um post for atualizado
CREATE OR REPLACE FUNCTION update_blog_post_modified_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.date_modified = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remove trigger se já existir
DROP TRIGGER IF EXISTS trigger_update_blog_post_modified_date ON blog_posts;

-- Cria o trigger
CREATE TRIGGER trigger_update_blog_post_modified_date
BEFORE UPDATE ON blog_posts
FOR EACH ROW
EXECUTE FUNCTION update_blog_post_modified_date();

-- ============================================
-- ATENÇÃO: Após executar este script, você
-- precisará executar a migração de dados:
-- 
-- npm run migrate:blog-date-modified
-- ============================================

