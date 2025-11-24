# 📘 MANUAL COMPLETO DE CONFIGURAÇÃO - BotanicMD

Este é o **manual consolidado e completo** com todos os passos necessários para configurar o BotanicMD com Supabase e Stripe.

---

## 📋 ÍNDICE

1. [Configuração do Supabase](#1-configuração-do-supabase)
2. [Configuração do Stripe](#2-configuração-do-stripe)
3. [Edge Functions](#3-edge-functions)
4. [Variáveis de Ambiente](#4-variáveis-de-ambiente)
5. [Testes](#5-testes)
6. [Checklist Final](#6-checklist-final)

---

## 1. CONFIGURAÇÃO DO SUPABASE

### 1.1. Informações do Projeto

**URL do Projeto:**
```
https://khvurdptdkkzkzwhasnd.supabase.co
```

**Project Reference ID:**
```
khvurdptdkkzkzwhasnd
```

**Dashboard:**
```
https://app.supabase.com/project/khvurdptdkkzkzwhasnd
```

### 1.2. Obter as Chaves do Supabase

1. Acesse: https://app.supabase.com/project/khvurdptdkkzkzwhasnd
2. Vá em **Settings** → **API**
3. Copie as seguintes informações:

#### VITE_SUPABASE_URL
```
https://khvurdptdkkzkzwhasnd.supabase.co
```

#### VITE_SUPABASE_KEY (anon public key)
```
Cole aqui sua anon public key do Supabase
```
> ⚠️ **IMPORTANTE:** Use apenas a "anon public" key, NÃO a service_role key aqui!

#### SUPABASE_SERVICE_ROLE_KEY
```
Cole aqui sua service_role key do Supabase
```
> ⚠️ **SEGREDO:** Esta chave é secreta e só deve ser usada no backend (Edge Functions)

### 1.3. Configurar Banco de Dados

Execute no **SQL Editor** do Supabase:

1. Acesse: Dashboard → **SQL Editor**
2. Copie e cole o conteúdo de: `supabase/migrations/20250101000000_create_subscriptions_table.sql`
3. Clique em **Run**

---

## 2. CONFIGURAÇÃO DO STRIPE

### 2.1. Dashboard do Stripe

**URL:** https://dashboard.stripe.com/

### 2.2. Obter Chaves API

1. No Dashboard do Stripe, vá em **Developers** → **API keys**
2. Copie:

#### STRIPE_SECRET_KEY (Test Mode)
```
sk_test_cole_sua_chave_stripe_aqui
```
> Use `sk_test_...` para desenvolvimento e `sk_live_...` para produção
> Obtenha em: Stripe Dashboard → Developers → API keys

### 2.3. Criar Produto e Preços

1. No Dashboard do Stripe: **Products** → **Add product**
2. Nome: **"BotanicMD Pro"**

#### Preços em BRL:

**Mensal (R$ 19,90/mês):**
- Price ID: `price_1SVjjkQxkNQpny1LIElriKgq`

**Anual (R$ 99,90/ano):**
- Price ID: `price_1SVjksQxkNQpny1LP0OjkvIQ`

**Vitalício (R$ 289,90):**
- Price ID: `price_1SVjmTQxkNQpny1LrK08bJCm`

#### Preços em USD:

**Mensal ($5.99/mês):**
- Price ID: `price_1SVjpzQxkNQpny1LJ7VEUF26`

**Anual ($29.99/ano):**
- Price ID: `price_1SVjpzQxkNQpny1L1qsQ6QNy`

**Vitalício ($79.99):**
- Price ID: `price_1SVjpzQxkNQpny1LoiRKgepC`

### 2.4. Configurar Webhook

1. **Criar Webhook:**
   - Dashboard → **Developers** → **Webhooks** → **Add endpoint**

2. **URL do Endpoint:**
   ```
   https://khvurdptdkkzkzwhasnd.supabase.co/functions/v1/stripe-webhook
   ```

3. **Eventos Selecionados:**
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`

4. **Webhook Secret Obtido:**
   ```
   whsec_cole_sua_chave_webhook_aqui
   ```
   > ⚠️ **COPIE** esta chave - você precisará configurá-la no Supabase (veja seção 3.4)

### 2.5. Configurar Customer Portal

1. Dashboard → **Settings** → **Billing** → **Customer portal**
2. Habilitar:
   - ✅ Cancelamento de assinatura
   - ✅ Atualização de método de pagamento
   - ✅ Download de faturas

---

## 3. EDGE FUNCTIONS

### 3.1. URL Base das Edge Functions

```
https://khvurdptdkkzkzwhasnd.supabase.co/functions/v1/
```

### 3.2. Funções Necessárias

#### ✅ `create-checkout`
- **URL:** `https://khvurdptdkkzkzwhasnd.supabase.co/functions/v1/create-checkout`
- **Arquivo:** `supabase/functions/create-checkout/index.ts`

#### ✅ `stripe-webhook`
- **URL:** `https://khvurdptdkkzkzwhasnd.supabase.co/functions/v1/stripe-webhook`
- **Arquivo:** `supabase/functions/stripe-webhook/index.ts`

#### ✅ `create-portal`
- **URL:** `https://khvurdptdkkzkzwhasnd.supabase.co/functions/v1/create-portal`
- **Arquivo:** `supabase/functions/create-portal/index.ts`

#### ✅ `admin-get-users`
- **URL:** `https://khvurdptdkkzkzwhasnd.supabase.co/functions/v1/admin-get-users`
- **Arquivo:** `supabase/functions/admin-get-users/index.ts`

### 3.3. Deploy via Dashboard (Mais Fácil)

1. Acesse: https://app.supabase.com/project/khvurdptdkkzkzwhasnd/edge-functions

2. Para cada função:
   - Clique em **Create a new function** → **Via Editor**
   - Nome: `nome-da-funcao`
   - Cole o código do arquivo correspondente
   - Clique em **Deploy**

### 3.4. Configurar Secrets no Supabase

Dashboard → **Settings** → **Edge Functions** → **Secrets**

Adicione:

```
STRIPE_SECRET_KEY = cole_sua_chave_stripe_aqui
```
> Obtenha em: Stripe Dashboard → Developers → API keys

```
STRIPE_WEBHOOK_SECRET = cole_sua_chave_webhook_aqui
```
> Obtenha ao criar o webhook no Stripe (veja seção 2.4)

```
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 4. VARIÁVEIS DE AMBIENTE

### 4.1. No Supabase (Edge Functions Secrets)

Acesse: Dashboard → **Settings** → **Edge Functions** → **Secrets**

| Nome | Valor |
|------|-------|
| `STRIPE_SECRET_KEY` | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_Ji9KK4t0JKcoZpVgpMQl6z2NNb5MG9EG` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` |

### 4.2. No .env.local (Desenvolvimento)

Crie/edite o arquivo `.env.local` na raiz do projeto:

```env
# ============================================
# SUPABASE
# ============================================
VITE_SUPABASE_URL=https://khvurdptdkkzkzwhasnd.supabase.co
VITE_SUPABASE_KEY=cole_sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=cole_sua_service_role_key_aqui

# ============================================
# STRIPE
# ============================================
STRIPE_SECRET_KEY=sk_test_cole_sua_chave_stripe_aqui
STRIPE_WEBHOOK_SECRET=whsec_Ji9KK4t0JKcoZpVgpMQl6z2NNb5MG9EG

# ============================================
# GEMINI (Opcional - para funcionalidades de IA)
# ============================================
GEMINI_API_KEY=cole_sua_chave_gemini_aqui
```

### 4.3. No Vercel (Produção)

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto **botanicmd**
3. Vá em **Settings** → **Environment Variables**
4. Adicione todas as variáveis do `.env.local`

> ⚠️ **Nota:** No Vercel, use `VITE_` prefix para variáveis que devem ser expostas ao cliente.

---

## 5. TESTES

### 5.1. Testar Webhook

1. No Stripe Dashboard, vá no webhook criado
2. Clique em **"Send test webhook"**
3. Selecione: `checkout.session.completed`
4. Clique em **Send test webhook**

### 5.2. Verificar Logs

1. **Supabase:**
   - Dashboard → **Edge Functions** → `stripe-webhook` → **Logs**

2. **Stripe:**
   - Dashboard → **Developers** → **Webhooks** → Seu webhook → **Recent events**

### 5.3. Testar Pagamento

**Cartões de Teste:**
- **Sucesso:** `4242 4242 4242 4242`
- **Requer autenticação:** `4000 0025 0000 3155`
- **Falha:** `4000 0000 0000 9995`

**Informações:**
- Data: qualquer data futura (ex: `12/25`)
- CVC: qualquer 3 dígitos (ex: `123`)

---

## 6. CHECKLIST FINAL

### ✅ Supabase

- [ ] Projeto criado e configurado
- [ ] `VITE_SUPABASE_URL` copiado
- [ ] `VITE_SUPABASE_KEY` (anon key) copiado
- [ ] `SUPABASE_SERVICE_ROLE_KEY` copiado
- [ ] Tabela `subscriptions` criada
- [ ] Edge Functions deployadas:
  - [ ] `create-checkout`
  - [ ] `stripe-webhook`
  - [ ] `create-portal`
  - [ ] `admin-get-users`
- [ ] Secrets configurados no Supabase

### ✅ Stripe

- [ ] Conta criada e verificada
- [ ] `STRIPE_SECRET_KEY` copiado
- [ ] Produto "BotanicMD Pro" criado
- [ ] Preços criados (BRL e USD)
- [ ] Price IDs atualizados em `paymentService.ts`
- [ ] Webhook criado
- [ ] URL do webhook configurada
- [ ] Eventos selecionados (6 eventos)
- [ ] `STRIPE_WEBHOOK_SECRET` obtido: `whsec_Ji9KK4t0JKcoZpVgpMQl6z2NNb5MG9EG` ✅
- [ ] Customer Portal configurado

### ✅ Configuração

- [ ] `.env.local` criado e preenchido
- [ ] Secrets adicionados no Supabase Dashboard
- [ ] Variáveis de ambiente configuradas no Vercel (se aplicável)

### ✅ Testes

- [ ] Webhook testado no Stripe
- [ ] Logs verificados no Supabase
- [ ] Pagamento de teste realizado
- [ ] Assinatura criada no banco de dados

---

## 📚 DOCUMENTAÇÃO ADICIONAL

Para mais detalhes sobre cada etapa:

- **Supabase Completo:** `CONFIGURAR_SUPABASE_COMPLETO.md`
- **Stripe Setup:** `STRIPE_SETUP.md`
- **Edge Functions:** `CONFIGURAR_EDGE_FUNCTIONS_VIA_DASHBOARD.md`
- **Webhook Secret:** `COMO_OBTER_STRIPE_WEBHOOK_SECRET.md`
- **Adicionar Secret:** `ADICIONAR_WEBHOOK_SECRET_SUPABASE.md`

---

## 🆘 TROUBLESHOOTING

### Problema: Webhook não recebe eventos

**Solução:**
1. Verifique se o webhook está habilitado no Stripe
2. Verifique se a URL está correta
3. Verifique os logs no Supabase

### Problema: Edge Function retorna erro

**Solução:**
1. Verifique se todos os secrets estão configurados
2. Verifique os logs da função no Supabase Dashboard
3. Verifique se a função foi deployada corretamente

### Problema: Pagamento não atualiza o plano do usuário

**Solução:**
1. Verifique se o webhook está recebendo eventos
2. Verifique se a tabela `subscriptions` foi criada
3. Verifique os logs da Edge Function `stripe-webhook`

---

## 📞 SUPORTE

Se precisar de ajuda:
- Consulte os guias específicos mencionados acima
- Verifique os logs no Supabase Dashboard
- Verifique os eventos no Stripe Dashboard

---

**Última atualização:** Janeiro 2025
**Versão:** 1.0

