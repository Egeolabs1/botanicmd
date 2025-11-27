# 🔧 Corrigir Erro 401 no Webhook do Stripe

Se você está vendo **401 ERR** em todos os eventos do webhook, isso significa que o Stripe não consegue autenticar na Edge Function. Vamos corrigir isso!

---

## 🔍 O Problema

**Erro 401 = Não Autorizado**

Isso acontece quando:
- O webhook secret não está configurado corretamente
- A URL do webhook está incorreta
- A Edge Function não está aceitando requisições do Stripe

---

## ✅ Solução: Verificar e Corrigir

### **Passo 1: Verificar se o STRIPE_WEBHOOK_SECRET Está Configurado**

1. **No Supabase Dashboard:**
   - Acesse: https://supabase.com/dashboard
   - Selecione seu projeto
   - Vá em **Edge Functions** → **Settings** → **Secrets**
   - Procure por `STRIPE_WEBHOOK_SECRET`

2. **Se NÃO existir:**
   - Adicione o secret `STRIPE_WEBHOOK_SECRET`
   - Valor: O webhook secret do Stripe (começa com `whsec_...`)

3. **Como obter o Webhook Secret:**
   - Veja o guia: `COMO_OBTER_STRIPE_WEBHOOK_SECRET.md`
   - Ou siga o Passo 2 abaixo

---

### **Passo 2: Obter o Webhook Secret do Stripe**

1. **No Stripe Dashboard:**
   - Acesse: https://dashboard.stripe.com/webhooks
   - Clique no seu webhook (ou crie um novo)
   - Clique em **"Reveal"** ou **"Click to reveal"** no campo **"Signing secret"**
   - Copie o valor (começa com `whsec_...`)

2. **Adicionar no Supabase:**
   - No Supabase Dashboard → Edge Functions → Settings → Secrets
   - Clique em **"Add new secret"**
   - Nome: `STRIPE_WEBHOOK_SECRET`
   - Valor: Cole o `whsec_...` copiado do Stripe
   - Clique em **"Save"**

---

### **Passo 3: Verificar a URL do Webhook**

A URL do webhook deve ser:

```
https://[seu-project-ref].supabase.co/functions/v1/stripe-webhook
```

**Onde `[seu-project-ref]` é o ID do seu projeto Supabase.**

1. **Encontrar seu Project Ref:**
   - No Supabase Dashboard → Settings → General
   - Procure por **"Reference ID"** ou **"Project URL"**
   - Exemplo: `khvurdptdkkzkzwhasnd`

2. **No Stripe Dashboard:**
   - Vá em **Webhooks**
   - Clique no seu webhook
   - Verifique se a URL está correta:
     ```
     https://khvurdptdkkzkzwhasnd.supabase.co/functions/v1/stripe-webhook
     ```
   - **IMPORTANTE:** Não deve ter `/` no final!

---

### **Passo 4: Verificar se a Edge Function Está Deployada**

1. **Verificar no Supabase Dashboard:**
   - Edge Functions → Veja se `stripe-webhook` está na lista
   - Status deve estar ativo

2. **Se não estiver deployada:**
   - Execute no terminal:
     ```bash
     npx supabase functions deploy stripe-webhook
     ```

---

### **Passo 5: Verificar os Eventos Selecionados**

No Stripe Dashboard → Webhooks → seu webhook → **"Send test webhook"** ou verifique os eventos:

Certifique-se de que estes eventos estão selecionados:
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `payment_intent.succeeded`
- ✅ `invoice.payment_succeeded` (opcional)
- ✅ `invoice.payment_failed` (opcional)

---

### **Passo 6: Reprocessar os Eventos Falhos**

Depois de configurar tudo corretamente:

1. **No Stripe Dashboard:**
   - Vá em **Webhooks** → clique no seu webhook
   - Encontre os eventos com status **401 ERR**
   - Clique em cada um e depois em **"Replay"** ou **"Send again"**

2. **Ou envie um evento de teste:**
   - No webhook, clique em **"Send test webhook"**
   - Selecione o evento: `checkout.session.completed`
   - Clique em **"Send test webhook"**
   - Verifique se agora retorna **200** em vez de **401**

---

## 🔍 Verificar Logs

Após fazer as correções, verifique os logs:

1. **No Stripe Dashboard:**
   - Webhooks → seu webhook → veja os eventos mais recentes
   - Status deve ser **200** agora

2. **No Supabase Dashboard:**
   - Edge Functions → `stripe-webhook` → Logs
   - Deve ver logs de processamento (não erros 401)

3. **Via CLI:**
   ```bash
   npx supabase functions logs stripe-webhook
   ```

---

## 📋 Checklist de Verificação

Marque cada item:

- [ ] `STRIPE_WEBHOOK_SECRET` está configurado no Supabase
- [ ] O valor do secret começa com `whsec_...`
- [ ] A URL do webhook está correta (sem `/` no final)
- [ ] A Edge Function `stripe-webhook` está deployada
- [ ] Os eventos corretos estão selecionados
- [ ] Enviou um evento de teste e recebeu status 200

---

## 🚨 Se Ainda Não Funcionar

### **Verificar se a Edge Function Aceita Requisições Públicas**

A Edge Function `stripe-webhook` **não deve** exigir autenticação, pois o Stripe envia requisições sem token.

Verifique o código em `supabase/functions/stripe-webhook/index.ts`:

```typescript
serve(async (req) => {
  // NÃO deve verificar Authorization header aqui
  // Apenas verifica stripe-signature
  
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response(JSON.stringify({ error: "No signature" }), { status: 401 });
  }
  // ...
});
```

---

## 💡 Dica Importante

**O erro 401 geralmente é causado por:**
1. ❌ Webhook secret não configurado
2. ❌ Webhook secret incorreto
3. ❌ URL do webhook incorreta

**Após corrigir, os próximos eventos devem funcionar!** Os eventos antigos com 401 não serão reprocessados automaticamente, mas você pode reprocessá-los manualmente no Stripe Dashboard.

---

**Depois de corrigir, teste novamente fazendo um pagamento e verifique se o webhook agora retorna 200! ✅**

