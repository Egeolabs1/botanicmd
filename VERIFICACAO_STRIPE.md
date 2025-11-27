# ✅ Verificação das Modificações do Stripe

Este documento verifica se todas as modificações do Stripe estão corretas.

## 📋 Checklist de Verificação

### 1. ✅ Price IDs Atualizados

Os Price IDs foram atualizados no `services/paymentService.ts`:

**BRL:**
- ✅ Mensal: `price_1SXxQ5Bz9Lh5gOrNLB2lJy4v`
- ✅ Anual: `price_1SXxQbBz9Lh5gOrNXcn4KVRD`
- ✅ Vitalício: `price_1SXxWQBz9Lh5gOrNe8U5dfSx`

**USD:**
- ✅ Mensal: `price_1SXxXiBz9Lh5gOrNf8lpjvUC`
- ✅ Anual: `price_1SXxYFBz9Lh5gOrNsJ7nzWOC`
- ✅ Vitalício: `price_1SXxYgBz9Lh5gOrNNPyDcTRX`

⚠️ **IMPORTANTE**: Verifique se estes Price IDs existem na sua conta Stripe em modo **LIVE**.

---

### 2. ✅ Edge Functions

#### ✅ `create-checkout`
- ✅ Autenticação verificada
- ✅ Busca ou cria customer no Stripe
- ✅ Salva customer_id no banco antes do checkout
- ✅ Usa `.maybeSingle()` para evitar erros
- ✅ CORS configurado corretamente
- ✅ Tratamento de erros adequado
- ✅ Logs detalhados

#### ✅ `create-portal`
- ✅ Autenticação verificada
- ✅ Busca customer_id do usuário
- ✅ CORS configurado corretamente
- ✅ Tratamento de erros adequado

#### ✅ `stripe-webhook`
- ✅ Verificação de assinatura do webhook
- ✅ Processa eventos: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `payment_intent.succeeded`
- ✅ Usa `onConflict: "user_id"` no upsert (compatível com constraint UNIQUE)
- ✅ Atualiza corretamente o status da assinatura
- ✅ CORS configurado corretamente

---

### 3. ✅ Tabela `subscriptions`

#### Estrutura:
- ✅ `user_id` tem constraint UNIQUE (compatível com `onConflict: "user_id"`)
- ✅ `stripe_customer_id` tem constraint UNIQUE
- ✅ `stripe_subscription_id` tem constraint UNIQUE
- ✅ `stripe_price_id` é NOT NULL
- ✅ Políticas RLS configuradas corretamente

#### Políticas RLS:
- ✅ Usuários podem ler suas próprias assinaturas
- ✅ Service role pode gerenciar todas as assinaturas (para Edge Functions)

---

### 4. ✅ Serviços

#### ✅ `paymentService.ts`
- ✅ Price IDs atualizados
- ✅ Verifica autenticação antes de criar checkout
- ✅ Tratamento de erros adequado
- ✅ Modo de simulação para desenvolvimento

#### ✅ `subscriptionService.ts`
- ✅ Usa `.maybeSingle()` para evitar erros 406
- ✅ Tratamento de erros adequado
- ✅ Métodos assíncronos corretos

---

## 🔍 Pontos de Atenção

### ⚠️ Price IDs

**Verifique se os Price IDs estão corretos:**
1. Acesse: https://dashboard.stripe.com/products
2. Certifique-se de estar em modo **LIVE** (não Test)
3. Verifique se os Price IDs acima existem e estão ativos
4. Se algum Price ID não existir, você verá o erro: `No such price: 'price_...'`

### ⚠️ Webhook Secret

**Verifique se o webhook secret está configurado:**
1. No Supabase Dashboard, vá em **Edge Functions** → **Settings** → **Secrets**
2. Verifique se `STRIPE_WEBHOOK_SECRET` está configurado
3. O valor deve ser: `whsec_...` (obtido do Stripe Dashboard)

### ⚠️ Stripe Secret Key

**Verifique se a secret key está configurada:**
1. No Supabase Dashboard, vá em **Edge Functions** → **Settings** → **Secrets**
2. Verifique se `STRIPE_SECRET_KEY` está configurado
3. O valor deve ser: `sk_live_...` (para produção) ou `sk_test_...` (para testes)

### ⚠️ Service Role Key

**Verifique se a service role key está configurada:**
1. No Supabase Dashboard, vá em **Edge Functions** → **Settings** → **Secrets**
2. Verifique se `SUPABASE_SERVICE_ROLE_KEY` está configurado
3. Esta chave permite que as Edge Functions atualizem assinaturas

---

## ✅ Verificações Finais

### Teste o Checkout:

1. **Criar uma sessão de checkout:**
   - Acesse o app
   - Faça login
   - Vá em "Fazer Upgrade" ou "Assinar Pro"
   - Selecione um plano
   - Clique em "Assinar"

2. **Verificar logs:**
   - No Supabase Dashboard, vá em **Edge Functions** → **Logs**
   - Selecione a função `create-checkout`
   - Verifique se não há erros

3. **Testar pagamento (modo teste):**
   - Use o cartão de teste: `4242 4242 4242 4242`
   - Qualquer data futura no CVV
   - Qualquer CEP válido

### Testar o Webhook:

1. **Configurar webhook no Stripe:**
   - Acesse: https://dashboard.stripe.com/webhooks
   - Adicione endpoint: `https://[seu-projeto].supabase.co/functions/v1/stripe-webhook`
   - Selecione eventos:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `payment_intent.succeeded`

2. **Verificar se webhook está funcionando:**
   - Faça um pagamento de teste
   - No Stripe Dashboard, vá em **Webhooks** → selecione seu webhook
   - Verifique se os eventos estão sendo recebidos (status 200)

3. **Verificar no Supabase:**
   - Vá em **Database** → **Tables** → `subscriptions`
   - Verifique se a assinatura foi criada/atualizada após o pagamento

---

## 🚨 Problemas Comuns

### Erro: "No such price: 'price_...'"

**Causa**: Price ID não existe na conta Stripe ou está em modo errado (test vs live).

**Solução**:
1. Verifique se você está usando chaves LIVE (`sk_live_...`) com Price IDs LIVE
2. Verifique se os Price IDs existem no Stripe Dashboard
3. Se necessário, crie novos preços e atualize os Price IDs no código

### Erro: "Webhook secret não configurado"

**Causa**: `STRIPE_WEBHOOK_SECRET` não está configurado no Supabase.

**Solução**:
1. No Stripe Dashboard, copie o webhook secret (`whsec_...`)
2. No Supabase Dashboard, adicione o secret `STRIPE_WEBHOOK_SECRET`

### Erro: "there is no unique or exclusion constraint matching the ON CONFLICT specification"

**Causa**: A tabela `subscriptions` não tem constraint UNIQUE em `user_id`.

**Solução**: Execute a migration SQL novamente para garantir que a constraint existe.

### Erro: 500 Internal Server Error no checkout

**Causa**: Pode ser vários problemas.

**Solução**:
1. Verifique os logs da Edge Function `create-checkout` no Supabase Dashboard
2. Verifique se todas as secrets estão configuradas
3. Verifique se o Price ID existe

---

## ✅ Tudo Parece Correto!

Baseado na análise:

- ✅ Price IDs foram atualizados
- ✅ Edge Functions estão bem estruturadas
- ✅ Tabela subscriptions tem as constraints corretas
- ✅ Webhook processa os eventos corretos
- ✅ Tratamento de erros adequado em todos os lugares
- ✅ CORS configurado corretamente

**Próximo passo**: Teste o checkout com um pagamento de teste para garantir que tudo está funcionando!

