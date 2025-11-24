# 💳 Configuração Completa do Stripe

Este guia mostra como configurar o Stripe para processar pagamentos no BotanicMD.

## 📋 O que foi implementado

### ✅ Backend (Supabase Edge Functions)

1. **`create-checkout`** - Cria sessão de checkout do Stripe
2. **`stripe-webhook`** - Processa eventos do Stripe (pagamentos, assinaturas, etc.)
3. **`create-portal`** - Cria sessão do Customer Portal para gerenciar assinaturas

### ✅ Frontend

1. **`paymentService.ts`** - Serviço para iniciar checkout
2. **`subscriptionService.ts`** - Serviço para gerenciar assinaturas
3. **`PricingModal.tsx`** - Modal de escolha de planos
4. **`UserProfile.tsx`** - Integração com portal do cliente

### ✅ Banco de Dados

1. **Tabela `subscriptions`** - Armazena informações de assinaturas

## 🚀 Passo a Passo de Configuração

### 1. Criar Conta no Stripe

1. Acesse [https://stripe.com](https://stripe.com)
2. Crie uma conta (ou faça login)
3. Complete a verificação da conta

### 2. Obter Chaves API

1. No Dashboard do Stripe, vá em **Developers** → **API keys**
2. Copie as seguintes chaves:
   - **Publishable key** (começa com `pk_test_...` ou `pk_live_...`)
   - **Secret key** (começa com `sk_test_...` ou `sk_live_...`)
   - Clique em **Reveal test key** para ver a chave secreta

⚠️ **Importante**: Use chaves de **teste** (`test`) durante desenvolvimento e **live** (`live`) em produção.

### 3. Criar Produto e Preços no Stripe

1. No Dashboard do Stripe, vá em **Products** → **Add product**
2. Crie um produto chamado **"BotanicMD Pro"**
3. Adicione os seguintes preços:

#### Preços em BRL (Real Brasileiro)

- **Mensal**: R$ 19,90/mês (Recurring, Monthly)
  - Copie o **Price ID** (começa com `price_...`)
- **Anual**: R$ 99,90/ano (Recurring, Yearly)
  - Copie o **Price ID**
- **Vitalício**: R$ 289,90 (One-time payment)
  - Copie o **Price ID**

#### Preços em USD (Dólar Americano)

- **Mensal**: $5.99/mês (Recurring, Monthly)
  - Copie o **Price ID**
- **Anual**: $29.99/ano (Recurring, Yearly)
  - Copie o **Price ID**
- **Vitalício**: $79.99 (One-time payment)
  - Copie o **Price ID**

### 4. Atualizar Price IDs no Código

Edite o arquivo `services/paymentService.ts` e atualize os Price IDs:

```typescript
const STRIPE_PRICES = {
  BRL: {
    monthly: 'price_XXXXXXXXXXXXXX', // Cole o ID do plano mensal BRL
    annual: 'price_XXXXXXXXXXXXXX',  // Cole o ID do plano anual BRL
    lifetime: 'price_XXXXXXXXXXXXXX' // Cole o ID do plano vitalício BRL
  },
  USD: {
    monthly: 'price_XXXXXXXXXXXXXX', // Cole o ID do plano mensal USD
    annual: 'price_XXXXXXXXXXXXXX',  // Cole o ID do plano anual USD
    lifetime: 'price_XXXXXXXXXXXXXX' // Cole o ID do plano vitalício USD
  }
};
```

### 5. Configurar Variáveis de Ambiente

#### No `.env.local` (Desenvolvimento)

Adicione as seguintes variáveis:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXX

# Supabase (já deve estar configurado)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### No Vercel (Produção)

1. Acesse o projeto no [Vercel Dashboard](https://vercel.com/dashboard)
2. Vá em **Settings** → **Environment Variables**
3. Adicione todas as variáveis acima
4. ⚠️ Use chaves **live** do Stripe em produção!

### 6. Configurar Edge Functions no Supabase

#### 6.1. Instalar Supabase CLI (se ainda não tiver)

```bash
npm install -g supabase
```

#### 6.2. Fazer Login no Supabase

```bash
supabase login
```

#### 6.3. Linkar Projeto

```bash
supabase link --project-ref seu-project-ref
```

Você encontra o `project-ref` na URL do seu projeto Supabase: `https://app.supabase.com/project/seu-project-ref`

#### 6.4. Configurar Secrets das Edge Functions

```bash
# Stripe Secret Key
supabase secrets set STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXXX

# Stripe Webhook Secret (veja como obter na seção 7)
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXX

# Supabase URL (já deve estar configurada)
supabase secrets set SUPABASE_URL=https://xxxxx.supabase.co

# Supabase Service Role Key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 6.5. Deploy das Edge Functions

```bash
# Deploy de todas as funções
supabase functions deploy create-checkout
supabase functions deploy stripe-webhook
supabase functions deploy create-portal
```

### 7. Configurar Webhook do Stripe

#### 7.1. Obter URL do Webhook

A URL do webhook será:
```
https://seu-project-ref.supabase.co/functions/v1/stripe-webhook
```

Substitua `seu-project-ref` pelo ID do seu projeto Supabase.

#### 7.2. Criar Webhook no Stripe

1. No Dashboard do Stripe, vá em **Developers** → **Webhooks**
2. Clique em **Add endpoint**
3. Cole a URL do webhook acima
4. Selecione os seguintes eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.succeeded`
5. Clique em **Add endpoint**
6. **Copie o "Signing secret"** (começa com `whsec_...`)
   - Este é o `STRIPE_WEBHOOK_SECRET` que você precisa configurar

#### 7.3. Testar Webhook Localmente (Opcional)

Para testar webhooks localmente durante desenvolvimento:

```bash
# Instalar Stripe CLI
# macOS
brew install stripe/stripe-cli/stripe

# Linux/Windows: veja instruções em https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks para seu ambiente local
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
```

Isso vai mostrar um `whsec_...` que você pode usar no `.env.local`.

### 8. Criar Tabela de Assinaturas no Banco

Execute o script SQL no Supabase:

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Abra o arquivo `supabase/migrations/20250101000000_create_subscriptions_table.sql`
4. Copie e cole o conteúdo
5. Clique em **Run**

Ou execute via CLI:

```bash
supabase db push
```

### 9. Configurar Customer Portal no Stripe

O Customer Portal permite que usuários gerenciem suas assinaturas.

1. No Dashboard do Stripe, vá em **Settings** → **Billing** → **Customer portal**
2. Configure as opções:
   - ✅ Permitir cancelamento de assinatura
   - ✅ Permitir atualização de método de pagamento
   - ✅ Permitir download de faturas
3. Salve as configurações

## 🧪 Testar

### Modo de Teste do Stripe

Use cartões de teste:

- **Sucesso**: `4242 4242 4242 4242`
- **Requer autenticação**: `4000 0025 0000 3155`
- **Falha**: `4000 0000 0000 9995`

Data de expiração: qualquer data futura (ex: `12/25`)  
CVC: qualquer 3 dígitos (ex: `123`)

### Fluxo de Teste

1. Faça login no app
2. Vá em **Perfil** → **Assinatura**
3. Escolha um plano
4. Use um cartão de teste do Stripe
5. Verifique se:
   - O checkout é redirecionado corretamente
   - Após pagamento, o usuário volta para o app
   - O plano é atualizado para "PRO"
   - O webhook processa o evento
   - A assinatura aparece no banco de dados

## 📝 Verificação

### Checklist

- [ ] Chaves API do Stripe configuradas (teste e live)
- [ ] Produto e preços criados no Stripe
- [ ] Price IDs atualizados no código
- [ ] Variáveis de ambiente configuradas (.env.local e Vercel)
- [ ] Edge Functions deployadas no Supabase
- [ ] Secrets das Edge Functions configuradas
- [ ] Webhook criado no Stripe
- [ ] Webhook secret configurado
- [ ] Tabela `subscriptions` criada no banco
- [ ] Customer Portal configurado no Stripe
- [ ] Testado com cartões de teste

## 🔍 Troubleshooting

### Erro: "Edge Function não encontrada"

- Verifique se as Edge Functions foram deployadas: `supabase functions list`
- Verifique se o nome está correto: `create-checkout`, `stripe-webhook`, `create-portal`

### Erro: "Webhook signature verification failed"

- Verifique se o `STRIPE_WEBHOOK_SECRET` está correto
- Certifique-se de usar o secret correto (test vs live)

### Pagamento não atualiza plano

- Verifique os logs do webhook no Stripe Dashboard
- Verifique os logs das Edge Functions no Supabase
- Verifique se a tabela `subscriptions` foi criada
- Verifique se o webhook está processando os eventos corretamente

### Erro: "Customer not found"

- Certifique-se de que o usuário está autenticado antes de iniciar checkout
- Verifique se o customer_id está sendo criado corretamente

## 📚 Recursos

- [Documentação do Stripe](https://stripe.com/docs)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Customer Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

💡 **Dica**: Durante desenvolvimento, use sempre as chaves de **teste** do Stripe. Apenas em produção use as chaves **live**.

