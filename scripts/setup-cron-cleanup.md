# 🔄 Configurar Limpeza Automática de Assinaturas Inválidas

Este guia explica como configurar a limpeza automática de assinaturas inválidas usando Vercel Cron Jobs.

## 📋 O Problema

Às vezes, assinaturas podem ser criadas incorretamente no banco de dados:
- Assinaturas recorrentes sem `stripe_subscription_id`
- Assinaturas ativas no banco mas canceladas no Stripe
- Assinaturas que não existem mais no Stripe

## ✅ A Solução

Criamos uma Edge Function que verifica e corrige automaticamente essas assinaturas.

## 🚀 Configuração

### 1. Deploy da Edge Function

A Edge Function `cleanup-invalid-subscriptions` já está criada em:
```
supabase/functions/cleanup-invalid-subscriptions/index.ts
```

### 2. Configurar Variáveis de Ambiente

No Supabase Dashboard, vá em **Edge Functions** → **cleanup-invalid-subscriptions** → **Settings** e adicione:

- `CLEANUP_SECRET`: Uma senha secreta para proteger o endpoint (ex: `seu-token-secreto-aqui`)

### 3. Configurar Cron Job no Vercel

Crie um arquivo `vercel.json` na raiz do projeto (ou atualize o existente):

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-subscriptions",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Isso executará diariamente às 2h da manhã.

### 4. Criar API Route no Vercel

Crie o arquivo `api/cron/cleanup-subscriptions.ts`:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Verificar se é uma requisição do cron job
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.CLEANUP_SECRET;
  
  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Chamar a Edge Function do Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const cleanupSecret = process.env.CLEANUP_SECRET;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/cleanup-invalid-subscriptions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao executar limpeza');
    }

    return res.status(200).json({
      success: true,
      message: 'Limpeza executada com sucesso',
      data,
    });
  } catch (error: any) {
    console.error('Erro ao executar limpeza:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor',
    });
  }
}
```

### 5. Configurar Variáveis no Vercel

No Vercel Dashboard, vá em **Settings** → **Environment Variables** e adicione:

- `CLEANUP_SECRET`: A mesma senha secreta usada na Edge Function
- `SUPABASE_SERVICE_ROLE_KEY`: A service role key do Supabase (já deve existir)
- `VITE_SUPABASE_URL`: A URL do Supabase (já deve existir)

## 🔄 Alternativa: Usar Supabase Cron Jobs (Recomendado)

Se você preferir usar o próprio Supabase para agendar, pode usar pg_cron:

### 1. Habilitar pg_cron no Supabase

No SQL Editor do Supabase, execute:

```sql
-- Verificar se pg_cron está habilitado
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Se não estiver, habilitar (requer permissões de superuser)
-- Isso geralmente já está habilitado no Supabase
```

### 2. Criar Função SQL para Limpeza

```sql
-- Criar função que chama a Edge Function
CREATE OR REPLACE FUNCTION cleanup_invalid_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response jsonb;
BEGIN
  -- Chamar a Edge Function via HTTP
  SELECT content INTO response
  FROM http((
    'POST',
    current_setting('app.settings.supabase_url') || '/functions/v1/cleanup-invalid-subscriptions',
    ARRAY[
      http_header('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
      http_header('Content-Type', 'application/json')
    ],
    'application/json',
    '{}'
  )::http_request);
  
  RAISE NOTICE 'Limpeza executada: %', response;
END;
$$;
```

### 3. Agendar com pg_cron

```sql
-- Agendar para executar diariamente às 2h da manhã
SELECT cron.schedule(
  'cleanup-invalid-subscriptions',
  '0 2 * * *', -- Diariamente às 2h
  $$SELECT cleanup_invalid_subscriptions()$$
);
```

## 🧪 Testar Manualmente

Para testar a limpeza manualmente:

```bash
curl -X POST https://seu-projeto.supabase.co/functions/v1/cleanup-invalid-subscriptions \
  -H "Authorization: Bearer SEU_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Ou usando o script Node.js:

```bash
npm run verify:pro-users
```

## 📊 Monitoramento

A Edge Function retorna um JSON com:
- `total`: Total de assinaturas verificadas
- `fixed`: Quantas foram corrigidas
- `errors`: Quantos erros ocorreram
- `details`: Detalhes das correções e erros

## ⚠️ Importante

- A limpeza é executada automaticamente, mas você ainda pode executar `npm run verify:pro-users` para verificar manualmente
- A Edge Function requer autenticação (Bearer token)
- Configure o `CLEANUP_SECRET` com uma senha forte
- A limpeza não afeta assinaturas válidas






