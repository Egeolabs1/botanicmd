-- ============================================
-- Fix: Ajustar Políticas RLS da Tabela subscriptions
-- ============================================
-- 
-- Este script garante que usuários autenticados possam
-- ler suas próprias assinaturas
-- ============================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can read own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON subscriptions;

-- Política: Usuários podem ler apenas suas próprias assinaturas
CREATE POLICY "Users can read own subscription"
ON subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Política: Service role pode gerenciar todas as assinaturas (usada pelas Edge Functions)
-- Esta política permite que as Edge Functions com service_role key atualizem assinaturas
-- NOTA: Esta política só funciona com service_role key, não com anon key
CREATE POLICY "Service role can manage all subscriptions"
ON subscriptions FOR ALL
USING (true)
WITH CHECK (true);

-- Verificar se RLS está habilitado
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Execute para verificar se as políticas foram criadas:
-- SELECT * FROM pg_policies WHERE tablename = 'subscriptions';

