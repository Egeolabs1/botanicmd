# 🔍 Troubleshooting: Plano Pro Não Está Sendo Identificado

## 📋 Checklist de Verificação

### 1. Verificar se há assinatura no banco de dados

Execute no SQL Editor do Supabase:

```sql
-- Substitua 'SEU_USER_ID' pelo ID do usuário (encontre no auth.users)
SELECT 
  id,
  user_id,
  status,
  plan_type,
  stripe_subscription_id,
  created_at,
  updated_at
FROM subscriptions
WHERE user_id = 'SEU_USER_ID';
```

**Resultado esperado:**
- Deve retornar 1 linha com `status = 'active'` ou `status = 'trialing'`
- Se não retornar nada, o usuário não tem assinatura no banco

### 2. Verificar políticas RLS

Execute no SQL Editor do Supabase:

```sql
-- Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'subscriptions';

-- Verificar políticas existentes
SELECT * FROM pg_policies WHERE tablename = 'subscriptions';
```

**Resultado esperado:**
- `rowsecurity = true` (RLS habilitado)
- Deve existir a política "Users can read own subscription"

### 3. Verificar logs no console do navegador

Abra o DevTools (F12) e verifique os logs:

1. **Ao fazer login, você deve ver:**
   ```
   🔄 Mapeando usuário: seu@email.com
   🔄 [mapUser] Iniciando busca do plano do banco de dados...
   📦 [mapUser] subscriptionService carregado, chamando syncUserPlan...
   🔍 Buscando assinatura para usuário: [user_id] [email]
   ```

2. **Se encontrar assinatura:**
   ```
   ✅ Assinatura encontrada: { id: ..., status: 'active', ... }
   📋 [syncUserPlan] Assinatura encontrada: { ... }
   ✅ [syncUserPlan] Plano sincronizado: PRO
   ✅ [mapUser] Plano sincronizado do banco de dados: pro
   ```

3. **Se NÃO encontrar assinatura:**
   ```
   ℹ️ Nenhuma assinatura encontrada para o usuário
   ⚠️ [syncUserPlan] Nenhuma assinatura encontrada, retornando plano gratuito
   ⚠️ Usando plano do cache (banco não disponível): free
   ```

4. **Se houver erro de RLS:**
   ```
   ❌ Erro ao buscar assinatura: { code: 'PGRST301', ... }
   ❌ Tabela subscriptions pode não existir ou RLS bloqueando acesso
   ```

### 4. Verificar se o webhook processou o pagamento

1. Acesse o [Stripe Dashboard](https://dashboard.stripe.com)
2. Vá em **Webhooks** → Selecione seu webhook
3. Verifique os eventos recentes:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `checkout.session.completed`

4. Se o evento falhou, verifique os logs do webhook

### 5. Executar script de diagnóstico

```bash
npm run diagnose:subscription
```

**Nota:** Este script precisa que você esteja logado no app primeiro.

## 🔧 Soluções Comuns

### Problema 1: Assinatura não existe no banco

**Causa:** Webhook não processou o pagamento ou falhou

**Solução:**
1. Verifique os logs do webhook no Stripe
2. Se necessário, reenvie o evento manualmente no Stripe Dashboard
3. Ou execute manualmente no SQL Editor:

```sql
-- CRIAR ASSINATURA MANUALMENTE (apenas para testes)
-- Substitua os valores pelos corretos
INSERT INTO subscriptions (
  user_id,
  stripe_customer_id,
  stripe_subscription_id,
  stripe_price_id,
  plan_type,
  currency,
  status
) VALUES (
  'SEU_USER_ID',
  'cus_xxxxx',
  'sub_xxxxx',
  'price_xxxxx',
  'monthly',
  'BRL',
  'active'
);
```

### Problema 2: Status da assinatura não é 'active' ou 'trialing'

**Causa:** Assinatura existe mas está com status inválido (ex: 'incomplete', 'canceled')

**Solução:**
```sql
-- Atualizar status manualmente (apenas para testes)
UPDATE subscriptions
SET status = 'active'
WHERE user_id = 'SEU_USER_ID';
```

### Problema 3: RLS bloqueando acesso

**Causa:** Política RLS não permite SELECT

**Solução:**
Execute o script `scripts/fix-subscriptions-rls.sql` no SQL Editor do Supabase

### Problema 4: Timeout ao buscar do banco

**Causa:** Conexão lenta ou banco indisponível

**Solução:**
- Verifique a conexão com o Supabase
- Verifique se as variáveis de ambiente estão corretas
- O código usa localStorage como fallback após 5 segundos

## 📊 Verificar Status Atual

Para verificar o status atual do usuário no app:

1. Abra o console do navegador (F12)
2. Execute:
```javascript
// Verificar usuário atual
const authData = localStorage.getItem('botanicmd_data_' + 'SEU_USER_ID');
console.log('Dados do cache:', JSON.parse(authData));

// Verificar se está autenticado
// (o código do app já mostra isso nos logs)
```

## 🆘 Ainda não funciona?

1. **Capture todos os logs do console** ao fazer login
2. **Verifique se a tabela subscriptions existe:**
   ```sql
   SELECT * FROM subscriptions LIMIT 1;
   ```
3. **Verifique se há dados:**
   ```sql
   SELECT COUNT(*) FROM subscriptions;
   ```
4. **Verifique o user_id correto:**
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'seu@email.com';
   ```

## 📝 Logs Esperados (Sucesso)

Quando tudo está funcionando, você deve ver no console:

```
🔄 Mapeando usuário: usuario@email.com
🔄 [mapUser] Iniciando busca do plano do banco de dados...
📦 [mapUser] subscriptionService carregado, chamando syncUserPlan...
🔄 [syncUserPlan] Iniciando sincronização do plano do usuário...
🔍 Buscando assinatura para usuário: abc123... usuario@email.com
✅ Assinatura encontrada: { id: '...', status: 'active', plan_type: 'monthly', ... }
📋 [syncUserPlan] Assinatura encontrada: { ... }
✅ [syncUserPlan] Plano sincronizado: PRO (status: active)
📊 [mapUser] Resultado da sincronização: pro
✅ [mapUser] Plano sincronizado do banco de dados: pro maxUsage: -1
✅ Usuário mapeado, definindo estado: usuario@email.com Plano: pro
```

