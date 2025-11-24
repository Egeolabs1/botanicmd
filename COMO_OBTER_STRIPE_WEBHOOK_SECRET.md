# 🔑 Como Obter o STRIPE_WEBHOOK_SECRET

O `STRIPE_WEBHOOK_SECRET` é uma chave secreta gerada pelo Stripe quando você cria um **Webhook Endpoint**. Esta chave é usada para verificar que os eventos recebidos realmente vêm do Stripe.

## 📋 Passo a Passo

### 1. Acesse o Stripe Dashboard

1. Acesse: https://dashboard.stripe.com/
2. Faça login na sua conta
3. Certifique-se de estar no **modo de teste** ou **modo ao vivo** (dependendo do ambiente)

### 2. Vá em Webhooks

1. No menu lateral, clique em **Developers** (Desenvolvedores)
2. Clique em **Webhooks**
3. Você verá a lista de webhooks existentes (se houver)

### 3. Criar um Novo Webhook Endpoint

#### Se você **AINDA NÃO TEM** um webhook criado:

1. Clique no botão **+ Add endpoint** (ou **Adicionar endpoint**)
2. Preencha os campos:

   **Endpoint URL:**
   ```
   https://khvurdptdkkzkzwhasnd.supabase.co/functions/v1/stripe-webhook
   ```
   > **Nota:** Substitua `khvurdptdkkzkzwhasnd` pelo ID do seu projeto Supabase se for diferente

   **Description (Opcional):**
   ```
   BotanicMD - Webhook para assinaturas Stripe
   ```

3. Clique em **Add endpoint**

#### Se você **JÁ TEM** um webhook criado:

1. Clique no webhook existente para abrir os detalhes
2. Se a URL estiver incorreta, você pode editá-la clicando no ícone de lápis

### 4. Selecionar Eventos

Depois de criar o endpoint, você precisa selecionar quais eventos o Stripe deve enviar:

1. Na página do webhook, vá na seção **"Listen to events on your account"** ou **"Selecionar eventos"**
2. Você pode escolher:
   - **Send all events** (Enviar todos os eventos) - Mais fácil, mas envia mais dados
   - **Select events** (Selecionar eventos) - Mais específico

3. **Recomendado:** Selecione apenas estes eventos:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`

4. Clique em **Add events** ou **Salvar**

### 5. Obter a Chave Secreta (Signing Secret)

1. Na página do webhook, role até a seção **"Signing secret"** ou **"Chave de assinatura"**
2. Você verá algo como:
   ```
   whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
3. Clique no botão **Reveal** (Revelar) ou **Mostrar** para ver a chave completa
4. **COPIE** essa chave (começa com `whsec_`)

### 6. Configurar no Supabase

Agora você precisa adicionar essa chave como um **Secret** no Supabase:

#### Via Dashboard do Supabase:

1. Acesse: https://app.supabase.com/project/khvurdptdkkzkzwhasnd
2. Vá em **Settings** → **Edge Functions** → **Secrets**
3. Clique em **Add a new secret**
4. Preencha:
   - **Name:** `STRIPE_WEBHOOK_SECRET`
   - **Value:** Cole a chave que você copiou (`whsec_...`)
5. Clique em **Save**

#### Via CLI (npx):

```powershell
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_sua_chave_aqui
```

### 7. Configurar no .env.local (Desenvolvimento)

Para desenvolvimento local, adicione no arquivo `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_sua_chave_aqui
```

> **⚠️ IMPORTANTE:** 
> - **NUNCA** commite o `.env.local` no Git!
> - Esta chave é **SECRETA** e não deve ser compartilhada

## 🎯 Verificar se Está Funcionando

### 1. Testar o Webhook no Stripe

1. No Stripe Dashboard, vá no webhook que você criou
2. Role até a seção **"Recent events"** ou **"Eventos recentes"**
3. Clique em **"Send test webhook"** ou **"Enviar webhook de teste"**
4. Selecione um evento, por exemplo: `checkout.session.completed`
5. Clique em **Send test webhook**

### 2. Verificar os Logs

1. No Supabase Dashboard, vá em **Edge Functions** → **stripe-webhook**
2. Clique em **Logs**
3. Você deve ver os eventos sendo recebidos

### 3. Verificar no Terminal (Local)

Se estiver testando localmente:

```powershell
npx supabase functions serve stripe-webhook
```

Você verá os logs no terminal quando eventos chegarem.

## 🔍 Exemplo Completo de Configuração

Depois de configurado, você deve ter:

**No Supabase Secrets:**
- `STRIPE_SECRET_KEY` = `sk_live_...` ou `sk_test_...`
- `STRIPE_WEBHOOK_SECRET` = `whsec_...`
- `SUPABASE_SERVICE_ROLE_KEY` = `eyJhbGci...`

**No .env.local (local):**
```env
VITE_SUPABASE_URL=https://khvurdptdkkzkzwhasnd.supabase.co
VITE_SUPABASE_KEY=eyJhbGci...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

## ❓ Perguntas Frequentes

### O que é o "Signing Secret"?

É uma chave secreta usada para **verificar** que os eventos recebidos realmente vêm do Stripe, e não de um atacante. É essencial para segurança.

### Posso usar o mesmo webhook para teste e produção?

Não! Você precisa de **webhooks separados**:
- Um para **modo de teste** (teste)
- Um para **modo ao vivo** (produção)

Cada um terá seu próprio `STRIPE_WEBHOOK_SECRET`.

### Onde encontro o ID do meu projeto Supabase?

Na URL do seu projeto Supabase:
```
https://app.supabase.com/project/KHVURDPTDKKZKZWHASND
                                    ^^^^^^^^^^^^^^^^^^
                                    Este é o ID
```

### O webhook precisa estar ativo para funcionar?

Sim! No Stripe Dashboard, certifique-se de que o webhook está marcado como **"Enabled"** (Habilitado).

## 🆘 Problemas Comuns

### "Webhook secret não encontrado"

**Solução:** Certifique-se de que o secret foi adicionado no Supabase:
- Dashboard → Settings → Edge Functions → Secrets
- Verifique se `STRIPE_WEBHOOK_SECRET` está lá

### "Webhook signature verification failed"

**Solução:** 
- Verifique se copiou a chave completa (inclui o `whsec_`)
- Certifique-se de que está usando a chave do webhook correto (teste vs produção)

### "Nenhum evento está chegando"

**Soluções:**
1. Verifique se o webhook está habilitado no Stripe
2. Verifique se os eventos estão selecionados corretamente
3. Teste enviando um webhook manualmente no Stripe Dashboard

---

🎉 Pronto! Agora você tem o `STRIPE_WEBHOOK_SECRET` configurado!

