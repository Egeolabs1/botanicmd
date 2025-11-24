# ⚡ Configurar Edge Functions via Dashboard (Mais Fácil!)

Você pode configurar as Edge Functions **sem instalar nada** diretamente pelo Dashboard do Supabase! É mais simples que usar a CLI.

## 🎯 Método 1: Via Dashboard (Recomendado para Iniciantes)

### Passo 1: Acessar o Dashboard

1. Vá para [https://app.supabase.com](https://app.supabase.com)
2. Faça login
3. Selecione seu projeto BotanicMD

### Passo 2: Criar a Função `create-checkout`

1. No menu lateral, clique em **Edge Functions**
2. Clique em **Create a new function** ou **Deploy a new function**
3. Escolha **"Via Editor"** (criar pelo editor)

**Nome da função**: `create-checkout`

**Código**: Copie e cole o conteúdo do arquivo `supabase/functions/create-checkout/index.ts`

**⚠️ IMPORTANTE**: Antes de colar, você precisa substituir algumas coisas:

1. Procure por `Deno.env.get("STRIPE_SECRET_KEY")`
2. Substitua temporariamente por sua chave real (ou configure secrets depois)

Ou melhor: **Configure os Secrets primeiro** (veja Passo 5)

### Passo 3: Criar a Função `stripe-webhook`

1. Repita o processo acima
2. **Nome da função**: `stripe-webhook`
3. Copie o código de `supabase/functions/stripe-webhook/index.ts`

### Passo 4: Criar a Função `create-portal`

1. Repita o processo
2. **Nome da função**: `create-portal`
3. Copie o código de `supabase/functions/create-portal/index.ts`

### Passo 5: Configurar Secrets (Variáveis de Ambiente)

1. No Dashboard, vá em **Settings** → **Edge Functions** → **Secrets**
2. Adicione cada secret:

```
STRIPE_SECRET_KEY = sk_test_XXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET = whsec_XXXXXXXXXXXXXX
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Onde encontrar:**
- **STRIPE_SECRET_KEY**: Dashboard do Stripe → Developers → API keys
- **STRIPE_WEBHOOK_SECRET**: Depois de criar o webhook no Stripe (veja seção 7)
- **SUPABASE_SERVICE_ROLE_KEY**: Dashboard do Supabase → Settings → API → service_role (secret)

### Passo 6: Criar Tabela de Assinaturas

1. No Dashboard, vá em **SQL Editor**
2. Crie uma nova query
3. Copie e cole o conteúdo de `supabase/migrations/20250101000000_create_subscriptions_table.sql`
4. Execute a query

### Passo 7: Configurar Webhook no Stripe

1. No Stripe Dashboard, vá em **Developers** → **Webhooks**
2. Clique em **Add endpoint**
3. **URL do webhook**:
   ```
   https://seu-project-ref.supabase.co/functions/v1/stripe-webhook
   ```
   (Substitua `seu-project-ref` pelo ID do seu projeto)
4. Selecione eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.succeeded`
5. Clique em **Add endpoint**
6. **Copie o "Signing secret"** (whsec_...)
7. Volte ao Supabase e adicione esse secret (Passo 5)

## ✅ Pronto!

Depois disso, as Edge Functions estarão funcionando!

**URLs das funções:**
```
https://seu-project-ref.supabase.co/functions/v1/create-checkout
https://seu-project-ref.supabase.co/functions/v1/stripe-webhook
https://seu-project-ref.supabase.co/functions/v1/create-portal
```

---

## 🎯 Método 2: Via CLI (npx - Sem Instalar)

Se preferir usar comandos (mas ainda sem instalar nada):

### Usar npx supabase

```powershell
# Login
npx supabase login

# Linkar projeto
npx supabase link --project-ref seu-project-ref

# Configurar secrets
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_...
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Deploy das funções
npx supabase functions deploy create-checkout
npx supabase functions deploy stripe-webhook
npx supabase functions deploy create-portal
```

---

## 💡 Qual Método Escolher?

- **Dashboard**: ✅ Mais visual, não precisa instalar nada
- **CLI (npx)**: ✅ Mais rápido se você já conhece comandos

Ambos funcionam igualmente bem!

---

## 🐛 Problemas Comuns

### "Function not found"
- Verifique se o nome da função está correto
- Verifique se fez deploy corretamente

### "Secret not found"
- Configure os secrets no Dashboard (Settings → Edge Functions → Secrets)

### "Permission denied"
- Verifique se a `SUPABASE_SERVICE_ROLE_KEY` está correta

---

## 📚 Próximos Passos

Depois de configurar as Edge Functions, siga o guia `STRIPE_SETUP.md` para configurar produtos e preços no Stripe.

