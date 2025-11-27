# 🔧 Corrigir Erro 500: Invalid time value

O erro **500 "Invalid time value"** acontece quando tentamos converter timestamps do Stripe que podem ser `null`, `undefined` ou valores inválidos.

---

## ✅ Correção Aplicada

Adicionamos **validação** antes de converter timestamps para Date:

### **Antes (erro):**
```typescript
current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
```

### **Depois (correto):**
```typescript
const periodStart = subscription.current_period_start && typeof subscription.current_period_start === 'number'
  ? new Date(subscription.current_period_start * 1000).toISOString()
  : null;

const periodEnd = subscription.current_period_end && typeof subscription.current_period_end === 'number'
  ? new Date(subscription.current_period_end * 1000).toISOString()
  : null;
```

---

## 🚀 Próximo Passo: Redeployar

Agora você precisa fazer o **redeploy** da função:

```powershell
npx supabase functions deploy stripe-webhook
```

---

## 🧪 Testar Novamente

Depois do redeploy:

1. **No Stripe Dashboard:**
   - Webhooks → seu webhook
   - Encontre o evento que falhou (customer.subscription.updated)
   - Clique em **"Replay"** ou **"Reenviar"**

2. **Verifique o resultado:**
   - Deve aparecer **200 OK** ✅
   - Não deve mais aparecer erro 500!

---

## 📋 O Que Foi Corrigido

- ✅ Validação de `current_period_start` antes de converter
- ✅ Validação de `current_period_end` antes de converter
- ✅ Validação de `canceled_at` antes de converter
- ✅ Tratamento de valores `null` ou `undefined`

---

## 🔍 Eventos Afetados

A correção afeta:
- `customer.subscription.updated` ✅
- `customer.subscription.deleted` ✅
- `checkout.session.completed` ✅

---

**Após o redeploy, o erro 500 deve estar resolvido! 🎉**

