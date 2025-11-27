# 🔧 Corrigir Erro 400: constructEventAsync no Webhook

O erro mudou de **401 para 400** - isso significa que a autenticação está funcionando! ✅

Agora o problema é que o código está usando `constructEvent()` (síncrono) mas no Deno/Supabase precisa ser **assíncrono**.

---

## ✅ Correção Aplicada

O código da função `stripe-webhook` foi atualizado para usar `constructEventAsync()`:

**ANTES (erro):**
```typescript
event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
```

**DEPOIS (correto):**
```typescript
event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
```

---

## 🚀 Próximo Passo: Redeployar

Agora você precisa fazer o **redeploy** da função para aplicar a correção:

### **Via CLI:**

```powershell
npx supabase functions deploy stripe-webhook
```

### **Via Dashboard:**

1. Acesse: https://app.supabase.com/project/khvurdptdkkzkzwhasnd
2. Vá em **Edge Functions** → **stripe-webhook**
3. Faça o deploy manual ou aguarde o deploy automático via Git

---

## 🧪 Testar Novamente

Depois do redeploy:

1. **No Stripe Dashboard:**
   - Webhooks → seu webhook
   - Clique em **"Send test webhook"**
   - Selecione: `checkout.session.completed`
   - Clique em **Send test webhook**

2. **Verifique o resultado:**
   - Deve aparecer **200 OK** ✅
   - Não deve mais aparecer 400 ou 401!

---

## 📋 Checklist

- [x] Arquivo `config.toml` criado com `verify_jwt = false`
- [x] Código atualizado para usar `constructEventAsync()`
- [ ] Função `stripe-webhook` redeployada
- [ ] Evento de teste enviado e retornou 200

---

## 💡 O Que Mudou?

1. **401 → 400:** Autenticação funcionando! ✅
2. **400 → 200:** Agora só precisa do redeploy para aplicar a correção

**Após o redeploy, os webhooks devem funcionar perfeitamente! 🎉**

