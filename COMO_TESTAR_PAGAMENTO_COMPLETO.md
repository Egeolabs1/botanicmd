# 🧪 Como Testar o Pagamento Completo

Este guia mostra como testar todo o fluxo de pagamento do Stripe do início ao fim.

## 📋 Pré-requisitos

1. ✅ Edge Functions deployadas
2. ✅ Secrets configuradas no Supabase (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, etc.)
3. ✅ Tabela `subscriptions` criada no Supabase
4. ✅ Webhook configurado no Stripe

---

## 🎯 Passo a Passo para Testar

### **Passo 1: Acessar o App**

1. Acesse o app em: `https://botanicmd.com/app` (ou `http://localhost:3000/app` em desenvolvimento)
2. Faça login com sua conta

### **Passo 2: Abrir o Modal de Preços**

1. Clique no ícone de perfil no canto superior direito
2. Clique em **"Fazer Upgrade"** ou **"Assinar Pro"**
3. O modal de preços deve aparecer

### **Passo 3: Selecionar um Plano**

1. Escolha um dos planos:
   - **Mensal** (R$ 19,90 ou $ 5.99)
   - **Anual** (R$ 99,90 ou $ 29.99)
   - **Vitalício** (R$ 289,90 ou $ 79.99)
2. Clique no botão **"Assinar"** ou **"Escolher Plano"**

### **Passo 4: Verificar Redirecionamento**

Você deve ser redirecionado para a página de checkout do Stripe:
- URL será algo como: `https://checkout.stripe.com/pay/cs_live_...`
- Se você ver esta página → ✅ **Funcionou!**

### **Passo 5: Preencher os Dados do Cartão de Teste**

#### **Cartões de Teste do Stripe:**

**✅ Cartão que funciona (sucesso):**
```
Número: 4242 4242 4242 4242
Data: Qualquer data futura (ex: 12/25)
CVC: Qualquer 3 dígitos (ex: 123)
CEP: Qualquer CEP válido (ex: 12345-678)
Nome: Seu nome
```

**❌ Cartão que é recusado:**
```
Número: 4000 0000 0000 0002
Data: Qualquer data futura
CVC: Qualquer 3 dígitos
CEP: Qualquer CEP válido
```
*Este cartão retornará um erro de pagamento recusado*

**💰 Cartão que requer autenticação (3D Secure):**
```
Número: 4000 0027 6000 3184
Data: Qualquer data futura
CVC: Qualquer 3 dígitos
CEP: Qualquer CEP válido
```
*Este cartão abrirá uma tela de autenticação*

### **Passo 6: Completar o Pagamento**

1. Preencha os dados com um dos cartões de teste acima
2. Clique em **"Pagar"** ou **"Subscribe"**
3. Se usar o cartão `4242 4242 4242 4242` → O pagamento será aprovado instantaneamente

### **Passo 7: Verificar Redirecionamento de Sucesso**

Após o pagamento bem-sucedido, você deve ser redirecionado para:
```
https://botanicmd.com/app?session_id=cs_live_...&status=success
```

**O que deve acontecer:**
- ✅ Você volta para a página do app
- ✅ Seu plano é atualizado para "Pro"
- ✅ As funcionalidades Pro são desbloqueadas

### **Passo 8: Verificar no Dashboard do Stripe**

1. Acesse: https://dashboard.stripe.com/test/payments
2. Você deve ver o pagamento de teste listado
3. Clique no pagamento para ver os detalhes

### **Passo 9: Verificar no Banco de Dados Supabase**

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Database** → **Tables** → **subscriptions**
4. Você deve ver um registro com:
   - Seu `user_id`
   - `stripe_customer_id` preenchido
   - `stripe_subscription_id` (se for assinatura recorrente) ou vazio (se for lifetime)
   - `plan_type`: "monthly", "annual" ou "lifetime"
   - `status`: "active"

### **Passo 10: Verificar os Logs do Webhook**

1. No Stripe Dashboard, vá em **Developers** → **Webhooks**
2. Clique no seu webhook (ou crie um se não tiver)
3. Veja os eventos processados:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created` (se for assinatura)
   - ✅ `payment_intent.succeeded` (se for pagamento único)

### **Passo 11: Verificar no App que o Plano Mudou**

1. Feche e reabra o modal de perfil
2. Você deve ver:
   - ✅ Status: **"Pro"** (não mais "Gratuito")
   - ✅ Funcionalidades desbloqueadas

---

## 🔍 Como Testar Cenários de Erro

### **Teste 1: Cartão Recusado**

1. Use o cartão: `4000 0000 0000 0002`
2. O Stripe mostrará uma mensagem de erro
3. Você será redirecionado para: `?status=cancelled`
4. ✅ O app deve tratar isso corretamente

### **Teste 2: Cancelamento**

1. Inicie o checkout
2. Clique em "Voltar" ou feche a janela
3. Você será redirecionado para: `?status=cancelled`
4. ✅ O app deve manter o plano gratuito

### **Teste 3: Verificar Erros na Edge Function**

1. Verifique os logs: `npx supabase functions logs create-checkout`
2. Deve ver logs com ✅ (sucesso) em cada etapa
3. Se houver ❌, identifique o problema

---

## 📊 Checklist de Verificação

Marque cada item conforme for testando:

### **Fluxo Principal:**
- [ ] Modal de preços abre corretamente
- [ ] Plano selecionado é reconhecido
- [ ] Redirecionamento para Stripe funciona
- [ ] Página de checkout do Stripe carrega
- [ ] Dados do cartão podem ser preenchidos
- [ ] Pagamento é processado com sucesso
- [ ] Redirecionamento de volta funciona
- [ ] Plano é atualizado para "Pro"
- [ ] Funcionalidades Pro são desbloqueadas

### **Banco de Dados:**
- [ ] Registro criado na tabela `subscriptions`
- [ ] `stripe_customer_id` está preenchido
- [ ] `plan_type` está correto
- [ ] `status` está como "active"
- [ ] `stripe_price_id` está correto

### **Webhook:**
- [ ] Evento `checkout.session.completed` foi recebido
- [ ] Webhook processou o evento com sucesso (status 200)
- [ ] Dados foram atualizados no banco via webhook

### **Cenários de Erro:**
- [ ] Cartão recusado é tratado corretamente
- [ ] Cancelamento funciona corretamente
- [ ] Mensagens de erro são exibidas adequadamente

---

## 🐛 Troubleshooting

### **Problema: Não consigo ver a página de checkout**

**Verificar:**
1. Logs da Edge Function: `npx supabase functions logs create-checkout`
2. Verificar se `STRIPE_SECRET_KEY` está configurada
3. Verificar se Price IDs estão corretos no código

### **Problema: Pagamento é feito mas plano não muda**

**Verificar:**
1. Se o webhook está configurado corretamente
2. Se `STRIPE_WEBHOOK_SECRET` está configurada
3. Se a tabela `subscriptions` existe
4. Se o webhook processou o evento `checkout.session.completed`

### **Problema: Erro 500 ao tentar fazer checkout**

**Verificar:**
1. Logs detalhados da Edge Function (com emojis)
2. Variáveis de ambiente configuradas:
   - `STRIPE_SECRET_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_URL`
3. Price IDs corretos no código

---

## 🎉 Quando Tudo Estiver Funcionando

Você saberá que tudo está funcionando quando:

1. ✅ Consegue fazer o checkout completo
2. ✅ O pagamento aparece no Stripe Dashboard
3. ✅ O registro aparece na tabela `subscriptions`
4. ✅ O plano muda para "Pro" no app
5. ✅ Funcionalidades Pro são desbloqueadas

---

## 📝 Notas Importantes

- **Use sempre cartões de teste** quando estiver em modo de teste
- **Não use cartões reais** durante os testes
- Os avisos do console no checkout do Stripe são **normais** e podem ser ignorados
- Teste tanto em **modo de assinatura** quanto em **pagamento único (lifetime)**

---

## 🔗 Links Úteis

- **Stripe Dashboard (Test):** https://dashboard.stripe.com/test
- **Stripe Test Cards:** https://stripe.com/docs/testing#cards
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Stripe Webhooks:** https://dashboard.stripe.com/webhooks

---

**Boa sorte com os testes! 🚀**

