# 🔧 Troubleshooting: Plano Não Mudou Após Pagamento

Se você fez um pagamento mas o plano não mudou para "Pro", siga este guia para diagnosticar e resolver.

---

## 🔍 Verificações Rápidas

### **1. Verificar se o Pagamento Foi Processado**

1. Acesse: https://dashboard.stripe.com/payments
2. Verifique se o pagamento aparece na lista
3. Status deve ser: **"Succeeded"** ✅

**Se o pagamento não aparecer:**
- O pagamento pode não ter sido concluído
- Verifique se você completou todo o processo

---

### **2. Verificar se o Webhook Processou**

1. No Stripe Dashboard, vá em **Developers** → **Webhooks**
2. Clique no seu webhook
3. Procure pelo evento `checkout.session.completed`
4. Status deve ser: **200** ✅

**Se o webhook falhou:**
- Verifique os logs do webhook
- Pode ser que o webhook não esteja configurado corretamente
- Verifique se `STRIPE_WEBHOOK_SECRET` está configurado

---

### **3. Verificar no Banco de Dados Supabase**

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Database** → **Tables** → `subscriptions`
4. Verifique se há um registro com:
   - Seu `user_id` correto
   - `status: "active"`
   - `plan_type` correto

**Se não houver registro:**
- O webhook não processou o pagamento
- Verifique os logs do webhook

**Se o registro existir mas `status` não for "active":**
- Pode ser que o webhook não atualizou corretamente
- Verifique os logs do webhook

---

### **4. Verificar os Logs do Webhook**

No Stripe Dashboard → Webhooks → clique no seu webhook → veja os logs:

**Procure por:**
- ✅ `checkout.session.completed` - Evento recebido
- ✅ Status `200` - Processado com sucesso
- ❌ Erros - Se houver, identifique o problema

---

### **5. Verificar no App**

1. Abra o console do navegador (F12)
2. Recarregue a página após o pagamento
3. Procure por:
   - ✅ `✅ Pagamento confirmado! Seu plano foi atualizado.`
   - ❌ Erros relacionados a assinatura

---

## 🔧 Soluções

### **Solução 1: Forçar Atualização do Plano**

Se o pagamento foi processado mas o plano não mudou:

1. **Feche e reabra o app**
2. **Faça logout e login novamente**
3. Isso forçará a sincronização do plano

---

### **Solução 2: Verificar Tabela no Supabase**

1. No Supabase Dashboard, vá em **SQL Editor**
2. Execute esta query:

```sql
SELECT * FROM subscriptions 
WHERE user_id = 'SEU_USER_ID_AQUI'
ORDER BY created_at DESC;
```

**Substitua `SEU_USER_ID_AQUI` pelo seu user_id** (você pode encontrá-lo no console do navegador após fazer login)

**Se a query não retornar nada:**
- O webhook não criou o registro
- Verifique se a tabela `subscriptions` existe

**Se retornar um registro:**
- Verifique se `status` é `"active"`
- Se não for, pode ser que o webhook não atualizou corretamente

---

### **Solução 3: Verificar se o Webhook Está Configurado**

1. No Stripe Dashboard → **Developers** → **Webhooks**
2. Verifique se há um webhook apontando para:
   ```
   https://[seu-projeto].supabase.co/functions/v1/stripe-webhook
   ```
3. Verifique se os eventos estão selecionados:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `payment_intent.succeeded`

**Se o webhook não existir:**
- Crie um novo webhook
- Copie o `STRIPE_WEBHOOK_SECRET` e configure no Supabase

---

### **Solução 4: Reprocessar o Webhook Manualmente**

Se o webhook falhou, você pode reprocessar:

1. No Stripe Dashboard → **Webhooks** → selecione o webhook
2. Encontre o evento `checkout.session.completed` que falhou
3. Clique em **"Send again"** ou **"Replay"**

---

### **Solução 5: Verificar RLS (Row Level Security)**

1. No Supabase Dashboard → **Database** → **Tables** → `subscriptions`
2. Clique na aba **"Policies"**
3. Verifique se há políticas que permitem:
   - ✅ Usuários lerem suas próprias assinaturas
   - ✅ Service role ler/escrever todas as assinaturas

**Se as políticas não estiverem corretas:**
- O webhook pode não conseguir criar/atualizar registros
- Verifique a migration SQL da tabela `subscriptions`

---

### **Solução 6: Limpar Cache e Recarregar**

Às vezes o problema é cache:

1. **Limpe o cache do navegador:**
   - Chrome/Edge: Ctrl + Shift + Delete
   - Firefox: Ctrl + Shift + Delete
2. **Limpe o localStorage:**
   - Abra o console (F12)
   - Execute: `localStorage.clear()`
3. **Faça logout e login novamente**
4. **Recarregue a página**

---

### **Solução 7: Verificar se a Tabela Existe**

1. No Supabase Dashboard → **Database** → **Tables**
2. Verifique se a tabela `subscriptions` existe

**Se não existir:**
- Execute a migration SQL:
  - Arquivo: `supabase/migrations/20250101000000_create_subscriptions_table.sql`
  - Ou execute via SQL Editor no Supabase Dashboard

---

## 🔍 Diagnóstico Passo a Passo

Siga estes passos na ordem:

### **Passo 1: Verificar Pagamento**
- [ ] Pagamento aparece no Stripe Dashboard?
- [ ] Status é "Succeeded"?

### **Passo 2: Verificar Webhook**
- [ ] Webhook existe e está ativo?
- [ ] Evento `checkout.session.completed` foi recebido?
- [ ] Status do webhook é 200?

### **Passo 3: Verificar Banco de Dados**
- [ ] Tabela `subscriptions` existe?
- [ ] Registro foi criado com seu `user_id`?
- [ ] `status` é "active"?

### **Passo 4: Verificar no App**
- [ ] Console mostra mensagens de sucesso?
- [ ] Recarregar a página resolve?
- [ ] Logout e login resolve?

---

## 💡 Solução Rápida (Se Nada Funcionar)

Se nada funcionar, você pode **atualizar manualmente** o plano:

1. No Supabase Dashboard → **SQL Editor**
2. Execute:

```sql
-- Substitua 'SEU_USER_ID' pelo seu user_id real
UPDATE subscriptions 
SET status = 'active',
    plan_type = 'monthly', -- ou 'annual' ou 'lifetime'
    updated_at = NOW()
WHERE user_id = 'SEU_USER_ID';
```

3. Faça logout e login novamente no app

---

## 📞 Próximos Passos

Se após seguir todos esses passos o plano ainda não mudou:

1. **Compartilhe os logs do webhook** do Stripe
2. **Compartilhe o resultado da query** no Supabase
3. **Compartilhe os erros do console** do navegador

Isso ajudará a identificar o problema específico.

---

## ✅ Checklist Final

- [ ] Pagamento processado com sucesso no Stripe
- [ ] Webhook recebeu e processou o evento
- [ ] Registro criado na tabela `subscriptions`
- [ ] `status` está como "active"
- [ ] App sincronizou o plano corretamente

Se todos os itens estão ✅, o plano deve estar funcionando!

