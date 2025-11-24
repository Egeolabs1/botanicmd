-- ============================================
-- BotanicMD - Script de Configuração do Supabase
-- ============================================
-- 
-- INSTRUÇÕES:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Crie uma nova query
-- 4. Copie e cole este script completo
-- 5. Execute o script
-- ============================================

-- ============================================
-- 1. CRIAR TABELA PLANTS
-- ============================================
CREATE TABLE IF NOT EXISTS plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  common_name TEXT NOT NULL,
  plant_data JSONB NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_plants_user_id ON plants(user_id);
CREATE INDEX IF NOT EXISTS idx_plants_created_at ON plants(created_at DESC);

-- ============================================
-- 2. HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. REMOVER POLÍTICAS ANTIGAS (SE EXISTIREM)
-- ============================================
DROP POLICY IF EXISTS "Users can read own plants" ON plants;
DROP POLICY IF EXISTS "Users can insert own plants" ON plants;
DROP POLICY IF EXISTS "Users can update own plants" ON plants;
DROP POLICY IF EXISTS "Users can delete own plants" ON plants;

-- ============================================
-- 4. CRIAR POLÍTICAS RLS
-- ============================================

-- Política: Usuários podem ler apenas suas próprias plantas
CREATE POLICY "Users can read own plants"
ON plants FOR SELECT
USING (auth.uid() = user_id);

-- Política: Usuários autenticados podem inserir suas próprias plantas
CREATE POLICY "Users can insert own plants"
ON plants FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar apenas suas próprias plantas
CREATE POLICY "Users can update own plants"
ON plants FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem deletar apenas suas próprias plantas
CREATE POLICY "Users can delete own plants"
ON plants FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Execute este comando para verificar se tudo foi criado corretamente:
-- SELECT * FROM plants LIMIT 1;



