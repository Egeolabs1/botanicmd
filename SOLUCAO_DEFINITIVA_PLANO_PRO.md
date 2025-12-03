# 🔧 Solução Definitiva: Plano Pro Revertendo para Free

## 🎯 O Problema

Você está experienciando um problema recorrente onde sua conta Pro continua revertendo para Free mesmo após ter pago e corrigido várias vezes.

## 🔍 Por Que Isso Acontece

O sistema funciona assim:

1. **Banco de dados é a fonte da verdade**: Sempre que você faz login, o sistema busca seu plano da tabela `subscriptions` no Supabase
2. **Status deve ser 'active' ou 'trialing'**: Se o status for qualquer outra coisa (como 'incomplete', 'canceled', etc), o sistema trata como FREE
3. **Sincronização Stripe → Supabase**: O webhook do Stripe deve manter o banco atualizado, mas se falhar, você perde o acesso Pro

## 📋 Passo a Passo para Resolver DEFINITIVAMENTE

### **1. Execute o Diagnóstico Completo**

```bash
npm run diagnostico -- seu@email.com
```

Este script vai mostrar:
- ✅ Se você tem uma conta no Supabase
- ✅ Se tem uma assinatura no banco de dados
- ✅ Qual o status da assinatura (active, incomplete, canceled, etc)
- ✅ Se está sincronizado com o Stripe
- ✅ Inconsistências entre Stripe e banco de dados

### **2. Analise o Resultado**

O diagnóstico vai mostrar **exatamente** onde está o problema:

#### **Cenário A: "Nenhuma assinatura encontrada no banco"**

**Causa**: O webhook do Stripe não processou seu pagamento

**Solução**:
1. Verifique os logs do webhook no [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Procure pelo evento `checkout.session.completed` do seu pagamento
3. Se o webhook falhou (status diferente de 200), clique em "Resend" para reprocessar
4. Aguarde 10 segundos e execute o diagnóstico novamente

---

#### **Cenário B: "Status da assinatura é 'incomplete'"**

**Causa**: O webhook criou a assinatura mas ficou com status incorreto (MAIS COMUM)

**Solução Rápida**:
```bash
npm run fix:subscription-status -- seu@email.com
```

Este script vai:
- Buscar sua assinatura no banco
- Buscar no Stripe o status real
- Atualizar o banco com o status correto
- Corrigir automaticamente

**Solução Manual** (se o script não funcionar):
1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **SQL Editor**
3. Execute:

```sql
-- 1. Encontrar seu user_id
SELECT id, email FROM auth.users WHERE email = 'seu@email.com';

-- 2. Ver sua assinatura atual
SELECT * FROM subscriptions WHERE user_id = 'SEU_USER_ID_AQUI';

-- 3. Atualizar para active
UPDATE subscriptions
SET status = 'active', updated_at = NOW()
WHERE user_id = 'SEU_USER_ID_AQUI';
```

4. Faça logout e login novamente no app

---

#### **Cenário C: "Status no banco diferente do Stripe"**

**Causa**: Dessincronia entre Stripe e Supabase (webhook não atualizou)

**Solução**:
1. O diagnóstico vai mostrar qual é o status correto no Stripe
2. Execute o fix para sincronizar:

```bash
npm run fix:subscription-status -- seu@email.com
```

---

#### **Cenário D: "Assinatura cancelada no Stripe"**

**Causa**: A assinatura foi realmente cancelada

**Solução**:
1. Verifique no [Stripe Dashboard](https://dashboard.stripe.com) se foi cancelada por engano
2. Se foi por engano, reative a assinatura no Stripe
3. Aguarde o webhook processar OU execute manualmente:

```bash
npm run fix:subscription-status -- seu@email.com
```

---

### **3. Verifique a Correção**

Após aplicar a solução:

```bash
# Execute o diagnóstico novamente
npm run diagnostico -- seu@email.com
```

Você deve ver:
```
✅ Tudo parece estar correto!
   A assinatura está ativa e o usuário deve ter acesso PRO
```

### **4. Teste no App**

1. Faça **logout** do app
2. Faça **login** novamente
3. Seu plano deve mostrar **PRO** agora
4. Você deve ter acesso ilimitado

## 🔒 Evitando que Aconteça Novamente

### **Verificação Automática (Recomendado)**

Crie um monitoramento para detectar quando isso acontecer:

```bash
# Execute semanalmente para verificar todos os usuários Pro
npm run verify:pro-users
```

### **Configurar Alertas no Stripe**

1. Acesse [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**
2. Clique no seu webhook
3. Configure notificações por email para eventos com falha
4. Assim você saberá imediatamente se o webhook falhar

### **Verificar Logs Regularmente**

Periodicamente, verifique os logs do webhook:
- Eventos `checkout.session.completed` devem ter status 200
- Eventos `customer.subscription.updated` devem ter status 200
- Se algum falhar, reprocesse manualmente

## 🆘 Solução de Emergência

Se NADA funcionar e você precisar de acesso imediato:

```sql
-- Execute no SQL Editor do Supabase
-- APENAS EM EMERGÊNCIA

-- 1. Encontrar seu user_id
SELECT id, email FROM auth.users WHERE email = 'seu@email.com';

-- 2. Inserir ou atualizar assinatura manualmente
INSERT INTO subscriptions (
  user_id,
  stripe_price_id,
  plan_type,
  currency,
  status
) VALUES (
  'SEU_USER_ID_AQUI',
  'price_1234567890', -- Use um price_id válido do Stripe
  'monthly',
  'BRL',
  'active'
)
ON CONFLICT (user_id)
DO UPDATE SET
  status = 'active',
  updated_at = NOW();
```

**⚠️ IMPORTANTE**: Isso é apenas temporário! Você ainda precisa descobrir por que o webhook não está funcionando.

## 🐛 Causas Raízes Comuns

### **1. Webhook Secret Errado**

Verifique no Supabase que o secret está correto:

```bash
# Listar secrets configurados
supabase secrets list

# Se o STRIPE_WEBHOOK_SECRET estiver errado, atualize
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_seu_secret_aqui
```

### **2. Webhook Desabilitado no Stripe**

1. Acesse [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Verifique se o webhook está **Enabled**
3. Se estiver desabilitado, habilite novamente

### **3. URL do Webhook Incorreta**

O webhook deve apontar para:
```
https://[seu-projeto].supabase.co/functions/v1/stripe-webhook
```

Não deve ser:
- ❌ `.vercel.app/api/stripe-webhook`
- ❌ Qualquer outra URL

### **4. Edge Function Não Deployada**

Verifique se a edge function está deployada:

```bash
supabase functions list
```

Se `stripe-webhook` não aparecer, deploy:

```bash
supabase functions deploy stripe-webhook
```

## 📊 Monitoramento Contínuo

Para ter certeza que está tudo funcionando:

```bash
# Toda semana, execute:
npm run verify:pro-users

# Se detectar problemas, corrija:
npm run fix:pro-users
```

## 📝 Checklist Final

Depois de resolver, confirme:

- [ ] Diagnóstico mostra "✅ Tudo parece estar correto!"
- [ ] Status no banco é "active" ou "trialing"
- [ ] Status no Stripe é "active" ou "trialing"
- [ ] Status no banco === Status no Stripe
- [ ] Fiz logout e login no app
- [ ] App mostra plano "PRO"
- [ ] Consigo usar recursos ilimitados
- [ ] Webhook do Stripe está habilitado
- [ ] Webhook tem status 200 nos últimos eventos
- [ ] Configurei alertas de webhook no Stripe

## 🎓 Entendendo o Fluxo

Para nunca mais ter esse problema, entenda como funciona:

```
Pagamento no Stripe
    ↓
Stripe envia evento para webhook
    ↓
Webhook cria/atualiza registro na tabela subscriptions
    ↓
Usuário faz login no app
    ↓
App busca plano da tabela subscriptions
    ↓
Se status = 'active' ou 'trialing' → PRO
Se status = qualquer outra coisa → FREE
```

**O problema acontece quando**:
- Webhook falha (não cria o registro)
- Webhook cria mas com status errado
- Webhook atualiza mas com status incorreto
- Dessincronia entre Stripe e banco

**A solução é**:
- Garantir que o webhook sempre funcione (status 200)
- Monitorar logs regularmente
- Manter banco sincronizado com Stripe
- Usar o script de diagnóstico quando algo der errado

## 🚀 Executando Agora

**Passo 1**: Execute o diagnóstico
```bash
npm run diagnostico -- seu@email.com
```

**Passo 2**: Siga a solução recomendada no resultado

**Passo 3**: Verifique novamente
```bash
npm run diagnostico -- seu@email.com
```

**Passo 4**: Faça logout e login no app

---

**Isso deve resolver DEFINITIVAMENTE o problema!** 🎉

Se mesmo após seguir todos os passos o problema persistir, capture a saída completa do diagnóstico e envie para análise.




