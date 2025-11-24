# ⚡ Configuração de Edge Functions no Supabase

Este guia detalhado mostra como configurar e fazer deploy das Edge Functions do BotanicMD no Supabase.

## 📋 Pré-requisitos

- Conta no Supabase ([https://supabase.com](https://supabase.com))
- Projeto Supabase criado
- Node.js instalado (versão 18 ou superior)
- Git instalado

## 🚀 Instalação e Configuração

### 1. Instalar Supabase CLI

#### macOS (via Homebrew)

```bash
brew install supabase/tap/supabase
```

#### Linux

```bash
# Via npm (recomendado)
npm install -g supabase

# OU via script direto
curl -fsSL https://supabase.com/install.sh | sh
```

#### Windows

```bash
# Via npm
npm install -g supabase

# OU via Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### 2. Verificar Instalação

```bash
supabase --version
```

Deve mostrar algo como: `supabase version 1.x.x`

### 3. Fazer Login no Supabase

```bash
supabase login
```

Isso vai abrir seu navegador para autenticação. Após fazer login, você estará autenticado no CLI.

### 4. Linkar Projeto ao Supabase

#### 4.1. Encontrar o Project Reference ID

1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Settings** → **General**
4. Copie o **Reference ID** (algo como: `abcdefghijklmnop`)

Ou, na URL do seu projeto:
```
https://app.supabase.com/project/abcdefghijklmnop
                                    ^^^^^^^^^^^^^^^^
                                    Este é o project-ref
```

#### 4.2. Linkar Projeto

No diretório do seu projeto BotanicMD:

```bash
cd "E:\Vibecode apps\botanicmd"
supabase link --project-ref seu-project-ref-aqui
```

**Exemplo:**
```bash
supabase link --project-ref abcdefghijklmnop
```

Quando solicitado, digite a senha do banco de dados do seu projeto Supabase (encontre em **Settings** → **Database** → **Database password**).

### 5. Verificar Estrutura de Diretórios

Certifique-se de que a estrutura de diretórios está assim:

```
botanicmd/
├── supabase/
│   ├── functions/
│   │   ├── create-checkout/
│   │   │   └── index.ts
│   │   ├── stripe-webhook/
│   │   │   └── index.ts
│   │   └── create-portal/
│   │       └── index.ts
│   └── migrations/
│       └── 20250101000000_create_subscriptions_table.sql
```

Se os diretórios não existirem, o CLI vai criá-los automaticamente.

## 🔐 Configurar Secrets (Variáveis de Ambiente)

As Edge Functions precisam acessar as chaves secretas do Stripe e do Supabase. Configure-as assim:

### 5.1. Configurar Secrets no Supabase

```bash
# Stripe Secret Key (use a chave de teste primeiro)
supabase secrets set STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXXX

# Stripe Webhook Secret (obtenha ao criar o webhook - veja seção 7)
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXX

# Supabase URL (já deve estar disponível automaticamente, mas pode configurar explicitamente)
supabase secrets set SUPABASE_URL=https://seu-project-ref.supabase.co

# Supabase Service Role Key (CRÍTICO - encontre em Settings → API → service_role key)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Importante**: 
- ⚠️ A `SUPABASE_SERVICE_ROLE_KEY` é **secreta** e **poderosa**. Nunca compartilhe ou commite no Git!
- ⚠️ Use chaves de **teste** do Stripe durante desenvolvimento
- ⚠️ Use chaves **live** do Stripe apenas em produção

### 5.2. Verificar Secrets Configuradas

```bash
supabase secrets list
```

Isso mostra todas as secrets configuradas (sem mostrar os valores, por segurança).

### 5.3. Remover Secret (se necessário)

```bash
supabase secrets unset NOME_DA_SECRET
```

## 📦 Deploy das Edge Functions

### 6.1. Deploy Individual

Você pode fazer deploy de cada função individualmente:

```bash
# Deploy da função create-checkout
supabase functions deploy create-checkout

# Deploy da função stripe-webhook
supabase functions deploy stripe-webhook

# Deploy da função create-portal
supabase functions deploy create-portal
```

### 6.2. Deploy de Todas as Funções

```bash
supabase functions deploy
```

Isso vai fazer deploy de todas as funções na pasta `supabase/functions/`.

### 6.3. Verificar Deploy

Após o deploy, você verá URLs como:

```
https://seu-project-ref.supabase.co/functions/v1/create-checkout
https://seu-project-ref.supabase.co/functions/v1/stripe-webhook
https://seu-project-ref.supabase.co/functions/v1/create-portal
```

### 6.4. Listar Funções Deployadas

```bash
supabase functions list
```

## 🧪 Testar Edge Functions

### 7. Testar create-checkout

```bash
curl -i --location --request POST 'https://seu-project-ref.supabase.co/functions/v1/create-checkout' \
  --header 'Authorization: Bearer SUA_ANON_KEY_AQUI' \
  --header 'Content-Type: application/json' \
  --data '{
    "priceId": "price_XXXXX",
    "planType": "monthly",
    "currency": "BRL"
  }'
```

### 7.1. Testar com Autenticação Real

Para testar com um usuário autenticado, você precisa:

1. Fazer login no app e obter o token de acesso
2. Usar esse token no header `Authorization: Bearer TOKEN`

## 🔍 Ver Logs das Edge Functions

### 8. Ver Logs em Tempo Real

```bash
# Logs de todas as funções
supabase functions logs

# Logs de uma função específica
supabase functions logs create-checkout

# Logs com filtro por nível (info, warn, error)
supabase functions logs create-checkout --level error
```

### 8.1. Ver Logs no Dashboard

1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Vá em **Edge Functions**
3. Clique na função que quer ver
4. Vá na aba **Logs**

## 🐛 Troubleshooting

### Problema: "Project not linked"

**Solução:**
```bash
supabase link --project-ref seu-project-ref
```

### Problema: "Unauthorized" ou "Invalid API key"

**Solução:**
- Verifique se fez `supabase login`
- Verifique se linkou o projeto corretamente
- Verifique se a `SUPABASE_SERVICE_ROLE_KEY` está correta

### Problema: "Secret not found"

**Solução:**
```bash
# Verifique quais secrets estão configuradas
supabase secrets list

# Configure a secret que está faltando
supabase secrets set NOME_DA_SECRET=valor
```

### Problema: "Function deployment failed"

**Solução:**
1. Verifique os logs de erro
2. Verifique se há erros de sintaxe no código
3. Verifique se todas as dependências estão corretas
4. Tente fazer deploy novamente

### Problema: "Module not found" ou erros de importação

**Solução:**
- As Edge Functions do Supabase usam Deno, não Node.js
- Certifique-se de usar imports via URL (como `https://esm.sh/...`)
- Veja os exemplos nos arquivos `index.ts` já criados

## 📝 Estrutura de uma Edge Function

Uma Edge Function típica tem esta estrutura:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // Headers CORS
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Sua lógica aqui...

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

## 🔄 Atualizar Edge Functions

Quando você fizer alterações no código das Edge Functions:

```bash
# Fazer deploy novamente da função modificada
supabase functions deploy nome-da-funcao

# OU fazer deploy de todas
supabase functions deploy
```

## 🌐 URLs das Edge Functions

Após o deploy, as URLs serão:

```
https://seu-project-ref.supabase.co/functions/v1/create-checkout
https://seu-project-ref.supabase.co/functions/v1/stripe-webhook
https://seu-project-ref.supabase.co/functions/v1/create-portal
```

**Importante**: Substitua `seu-project-ref` pelo seu Project Reference ID real.

## 📚 Recursos Adicionais

- [Documentação Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction)
- [Deno Deploy Docs](https://deno.com/deploy/docs)

## ✅ Checklist de Verificação

Após seguir este guia, você deve ter:

- [ ] Supabase CLI instalado
- [ ] Login feito no CLI
- [ ] Projeto linkado
- [ ] Secrets configuradas (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY)
- [ ] Edge Functions deployadas (create-checkout, stripe-webhook, create-portal)
- [ ] Logs funcionando
- [ ] URLs das funções anotadas

---

💡 **Dica**: Mantenha as URLs das Edge Functions salvas em um lugar seguro. Você vai precisar delas para configurar o webhook do Stripe!

