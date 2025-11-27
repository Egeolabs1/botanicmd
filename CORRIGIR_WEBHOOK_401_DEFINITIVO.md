# 🔧 Solução Definitiva: Erro 401 no Webhook

O erro **401 ERR** acontece porque o Supabase bloqueia requisições sem autenticação. Webhooks do Stripe precisam passar o `apikey` na URL.

---

## 🎯 Solução: Adicionar apikey na URL do Webhook

### **Passo 1: Obter a ANON KEY do Supabase**

1. **Acesse o Supabase Dashboard:**
   - https://app.supabase.com/project/khvurdptdkkzkzwhasnd
   - Ou: https://supabase.com/dashboard

2. **Vá em Settings → API:**
   - Menu lateral → **Settings** (⚙️)
   - Clique em **API**

3. **Copie a "anon public" key:**
   - Procure por **"anon public"** key
   - Copie o valor (começa com `eyJhbGci...`)
   - ⚠️ **NÃO copie a "service_role" key!**

---

### **Passo 2: Atualizar a URL do Webhook no Stripe**

1. **Acesse o Stripe Dashboard:**
   - https://dashboard.stripe.com/webhooks

2. **Encontre ou crie o webhook:**
   - Se já existe, clique nele
   - Se não existe, clique em **"+ Add endpoint"**

3. **Configure a URL com o apikey:**
   
   **URL ANTIGA (sem apikey):**
   ```
   https://khvurdptdkkzkzwhasnd.supabase.co/functions/v1/stripe-webhook
   ```
   
   **URL NOVA (com apikey):**
   ```
   https://khvurdptdkkzkzwhasnd.supabase.co/functions/v1/stripe-webhook?apikey=SUA_ANON_KEY_AQUI
   ```
   
   **Onde `SUA_ANON_KEY_AQUI` é a chave anon que você copiou no Passo 1.**

   **Exemplo:**
   ```
   https://khvurdptdkkzkzwhasnd.supabase.co/functions/v1/stripe-webhook?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Salvar:**
   - Clique em **Save** ou **Salvar**

---

### **Passo 3: Verificar STRIPE_WEBHOOK_SECRET**

Certifique-se de que o secret está configurado:

1. **Supabase Dashboard** → **Edge Functions** → **Settings** → **Secrets**
2. Verifique se existe `STRIPE_WEBHOOK_SECRET`
3. Valor deve ser: `whsec_Ji9KK4t0JKcoZpVgpMQl6z2NNb5MG9EG` (ou o seu)

**Se não existir:**
- Adicione conforme `COMO_OBTER_STRIPE_WEBHOOK_SECRET.md`

---

### **Passo 4: Reprocessar os Eventos**

Depois de atualizar a URL:

1. **No Stripe Dashboard:**
   - Webhooks → seu webhook
   - Encontre os eventos com **401 ERR**
   - Clique em cada um → **"Replay"** ou **"Send again"**

2. **Ou envie um teste:**
   - Clique em **"Send test webhook"**
   - Selecione: `checkout.session.completed`
   - Clique em **Send test webhook**
   - Agora deve retornar **200** ✅

---

## ✅ Checklist

- [ ] ANON KEY copiada do Supabase Dashboard
- [ ] URL do webhook atualizada com `?apikey=...`
- [ ] `STRIPE_WEBHOOK_SECRET` configurado no Supabase
- [ ] Webhook salvo no Stripe
- [ ] Evento de teste enviado e retornou 200

---

## 🔍 Verificar se Funcionou

1. **Envie um evento de teste** no Stripe
2. **Verifique os logs:**
   - Supabase Dashboard → Edge Functions → stripe-webhook → Logs
   - Deve ver logs de processamento (não erro 401)
3. **Verifique no Stripe:**
   - Webhooks → seu webhook → eventos
   - Status deve ser **200** (não mais 401)

---

## 💡 Por Que Funciona?

O Supabase Edge Functions **sempre** exigem autenticação. Ao adicionar `?apikey=...` na URL, estamos fornecendo a autenticação necessária para que o Supabase aceite a requisição do Stripe.

A anon key é **pública por design** e pode ser usada desta forma. A segurança real vem da verificação do `stripe-signature` dentro da função.

---

**Após fazer isso, os webhooks devem funcionar! 🎉**

