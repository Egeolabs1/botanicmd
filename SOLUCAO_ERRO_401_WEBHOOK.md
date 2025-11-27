# 🚨 Solução: Erro 401 no Webhook do Stripe

O erro **401 ERR** significa que o Stripe não consegue autenticar na Edge Function. Isso geralmente acontece porque o Supabase está bloqueando a requisição.

---

## 🔍 Causa do Problema

O Supabase Edge Functions por padrão **exigem autenticação**. Mas webhooks do Stripe **não enviam tokens de autenticação** - eles apenas enviam o header `stripe-signature`.

---

## ✅ Soluções

### **Solução 1: Configurar Webhook como Público (RECOMENDADO)**

O webhook precisa ser acessível **sem autenticação**. Vamos adicionar um header especial:

1. **No Stripe Dashboard, ao configurar o webhook:**
   - A URL deve incluir o `apikey` do Supabase como query parameter:
   ```
   https://[project-ref].supabase.co/functions/v1/stripe-webhook?apikey=[ANON_KEY]
   ```

   Onde `[ANON_KEY]` é sua chave **anon/public** do Supabase (não a service_role)

2. **Ou configure no código da Edge Function para aceitar sem apikey:**

   Na verdade, Edge Functions do Supabase **sempre** precisam do `apikey` ou `Authorization` header, exceto se configuradas de forma especial.

### **Solução 2: Usar apikey na URL do Webhook (MAIS FÁCIL)**

1. **Obter a ANON KEY do Supabase:**
   - Supabase Dashboard → Settings → API
   - Copie a **"anon public"** key (começa com `eyJ...`)

2. **Atualizar a URL do Webhook no Stripe:**
   - Stripe Dashboard → Webhooks → seu webhook
   - Edite a URL para:
     ```
     https://khvurdptdkkzkzwhasnd.supabase.co/functions/v1/stripe-webhook?apikey=SUA_ANON_KEY_AQUI
     ```
   - Substitua `SUA_ANON_KEY_AQUI` pela sua chave anon

3. **Salve a URL atualizada**

---

## 🔧 Verificação Passo a Passo

### **Passo 1: Verificar STRIPE_WEBHOOK_SECRET**

1. Supabase Dashboard → Edge Functions → Settings → Secrets
2. Verifique se `STRIPE_WEBHOOK_SECRET` existe
3. Valor deve começar com `whsec_...`

**Se não existir:**
- Adicione o secret conforme `COMO_OBTER_STRIPE_WEBHOOK_SECRET.md`

---

### **Passo 2: Verificar URL do Webhook**

No Stripe Dashboard → Webhooks → seu webhook:

**URL correta (com apikey):**
```
https://khvurdptdkkzkzwhasnd.supabase.co/functions/v1/stripe-webhook?apikey=eyJhbGci...
```

**OU URL correta (sem apikey, se a função aceitar):**
```
https://khvurdptdkkzkzwhasnd.supabase.co/functions/v1/stripe-webhook
```

**⚠️ IMPORTANTE:** Sem `/` no final!

---

### **Passo 3: Verificar se a Edge Function Está Deployada**

Execute:
```bash
npx supabase functions deploy stripe-webhook
```

---

### **Passo 4: Reprocessar os Eventos**

Depois de corrigir:

1. Stripe Dashboard → Webhooks → seu webhook
2. Encontre os eventos com **401 ERR**
3. Clique em cada um → **"Replay"** ou **"Send again"**
4. Ou envie um teste: **"Send test webhook"**

---

## 🎯 Checklist Rápido

- [ ] `STRIPE_WEBHOOK_SECRET` está configurado no Supabase?
- [ ] URL do webhook está correta?
- [ ] Edge Function está deployada?
- [ ] URL inclui `?apikey=...` (se necessário)?
- [ ] Enviou um evento de teste e recebeu 200?

---

## 💡 Dica Importante

**O erro 401 acontece ANTES do código da função executar.** Por isso, mesmo que o código esteja correto, se o Supabase não aceitar a requisição, você verá 401.

A solução mais comum é adicionar o `apikey` na URL do webhook ou configurar a função para aceitar requisições públicas.

---

## 🔄 Após Corrigir

1. **Envie um evento de teste** no Stripe Dashboard
2. **Verifique os logs** no Supabase Dashboard
3. **Veja se agora retorna 200** em vez de 401

Se ainda não funcionar, verifique os logs detalhados da Edge Function para ver a mensagem de erro exata.

