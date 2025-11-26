# 📝 Como Criar a Tabela `subscriptions` no Supabase

A Edge Function `create-checkout` precisa da tabela `subscriptions` para funcionar. Siga os passos abaixo:

## Opção 1: Via Supabase Dashboard (Mais Fácil)

1. **Acesse o SQL Editor do Supabase**:
   - Dashboard: https://app.supabase.com/project/khvurdptdkkzkzwhasnd
   - Clique em **"SQL Editor"** no menu lateral

2. **Crie uma Nova Query**:
   - Clique em **"New query"**

3. **Cole o SQL abaixo** e clique em **"Run"**:

```sql
-- Criar tabela de assinaturas
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- IDs do Stripe
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT NOT NULL,
  
  -- Informações do plano
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'annual', 'lifetime')),
  currency TEXT NOT NULL CHECK (currency IN ('BRL', 'USD')),
  
  -- Status da assinatura
  status TEXT NOT NULL DEFAULT 'incomplete',
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  
  -- Datas
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Habilitar RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Users can read own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON subscriptions;

-- Usuários podem ler apenas suas próprias assinaturas
CREATE POLICY "Users can read own subscription"
ON subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Service role pode gerenciar todas (para Edge Functions)
CREATE POLICY "Service role can manage all subscriptions"
ON subscriptions FOR ALL
USING (true)
WITH CHECK (true);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

4. **Verificar**:
   - Se tudo correu bem, você verá "Success. No rows returned"
   - Vá em **"Table Editor"** no menu lateral
   - Você deve ver a tabela **"subscriptions"**

## Opção 2: Via Supabase CLI

```bash
cd "E:\Vibecode apps\botanicmd"
npx supabase db push
```

---

## ✅ Pronto!

Após criar a tabela, teste o checkout novamente no app. O erro 500 deve estar resolvido!

Se ainda houver erros, você pode verificar os logs no Dashboard:
https://app.supabase.com/project/khvurdptdkkzkzwhasnd/logs/edge-functions

