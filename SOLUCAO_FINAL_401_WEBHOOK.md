# 🔧 Solução FINAL: Erro 401 no Webhook

Se adicionar o `apikey` na URL não funcionou, a solução é **desabilitar a verificação JWT** para a função `stripe-webhook`.

---

## 🎯 O Problema Real

O Supabase Edge Functions **sempre exigem autenticação JWT por padrão**. O erro 401 acontece **ANTES** do código da função executar, então adicionar `apikey` na URL pode não ser suficiente.

A solução é configurar a função para **não exigir JWT**, já que webhooks do Stripe usam **assinatura** (`stripe-signature`) para autenticação.

---

## ✅ Solução: Desabilitar JWT no config.toml

### **Passo 1: Criar arquivo config.toml**

1. **Crie o arquivo** `supabase/config.toml` na raiz do projeto (se não existir)

2. **Adicione o seguinte conteúdo:**

```toml
# Configuração do Supabase para Edge Functions

[functions.stripe-webhook]
# Desabilitar verificação JWT para permitir webhooks do Stripe
# Webhooks do Stripe usam assinatura (stripe-signature) para autenticação, não JWT
verify_jwt = false
```

3. **Salve o arquivo**

---

### **Passo 2: Redeployar a Função**

Depois de criar/atualizar o `config.toml`, você precisa fazer redeploy da função:

#### **Via CLI:**

```powershell
npx supabase functions deploy stripe-webhook
```

#### **Ou via Dashboard:**

O arquivo `config.toml` será usado automaticamente no próximo deploy. Se você não tiver CLI configurado, o arquivo será aplicado quando você fizer deploy via Dashboard ou Git push.

---

### **Passo 3: Verificar Configuração**

1. **Remova o `?apikey=...` da URL do webhook** (não é mais necessário!)

   A URL deve ser simplesmente:
   ```
   https://khvurdptdkkzkzwhasnd.supabase.co/functions/v1/stripe-webhook
   ```

2. **Verifique se o `STRIPE_WEBHOOK_SECRET` está configurado:**
   - Supabase Dashboard → Edge Functions → Settings → Secrets
   - Deve ter `STRIPE_WEBHOOK_SECRET` com valor `whsec_...`

---

### **Passo 4: Testar**

1. **No Stripe Dashboard:**
   - Webhooks → seu webhook
   - Clique em **"Send test webhook"**
   - Selecione: `checkout.session.completed`
   - Clique em **Send test webhook**

2. **Verifique o resultado:**
   - Deve aparecer **200 OK** ✅
   - Não deve mais aparecer 401!

---

## 📋 Checklist Completo

- [ ] Arquivo `supabase/config.toml` criado com `verify_jwt = false` para `stripe-webhook`
- [ ] Função `stripe-webhook` redeployada (via CLI ou Dashboard)
- [ ] URL do webhook no Stripe **SEM** `?apikey=...` (URL simples)
- [ ] `STRIPE_WEBHOOK_SECRET` configurado no Supabase
- [ ] Evento de teste enviado e retornou 200

---

## 🔍 Verificar se Funcionou

### **No Stripe Dashboard:**
- Webhooks → seu webhook → eventos
- Status deve ser **200** (não 401)

### **No Supabase Dashboard:**
- Edge Functions → stripe-webhook → Logs
- Deve ver logs de processamento (não erro 401)

---

## 💡 Por Que Isso Funciona?

1. **`verify_jwt = false`** diz ao Supabase para **não exigir** autenticação JWT
2. A função ainda está **segura** porque verifica o `stripe-signature`
3. Webhooks do Stripe são autenticados pela **assinatura**, não por JWT

---

## ⚠️ Importante

- ✅ A função ainda está segura (usa `stripe-signature` para verificação)
- ✅ Apenas a função `stripe-webhook` está pública (as outras ainda exigem JWT)
- ✅ Não precisa mais de `?apikey=...` na URL

---

**Após fazer isso e redeployar, os webhooks devem funcionar! 🎉**

