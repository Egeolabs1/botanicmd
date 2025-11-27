-- ============================================
-- Script para Corrigir Status de Assinatura
-- ============================================
-- 
-- Use este script para atualizar manualmente o status
-- de uma assinatura de 'incomplete' para 'active'
-- ============================================

-- ATENÇÃO: Substitua 'SEU_USER_ID' pelo ID real do usuário
-- Você pode encontrar o user_id executando:
-- SELECT id, email FROM auth.users WHERE email = 'seu@email.com';

-- Opção 1: Atualizar por user_id
UPDATE subscriptions
SET 
  status = 'active',
  updated_at = NOW()
WHERE 
  user_id = 'SEU_USER_ID'  -- ⚠️ SUBSTITUA PELO ID REAL
  AND status = 'incomplete';

-- Opção 2: Atualizar todas as assinaturas incomplete (use com cuidado!)
-- UPDATE subscriptions
-- SET 
--   status = 'active',
--   updated_at = NOW()
-- WHERE status = 'incomplete';

-- Verificar resultado
SELECT 
  id,
  user_id,
  status,
  plan_type,
  stripe_subscription_id,
  created_at,
  updated_at
FROM subscriptions
WHERE user_id = 'SEU_USER_ID';  -- ⚠️ SUBSTITUA PELO ID REAL

