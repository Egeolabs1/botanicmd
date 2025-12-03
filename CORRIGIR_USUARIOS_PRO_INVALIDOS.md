# 🔧 Como Corrigir Usuários com Status PRO Inválido

Este guia explica como identificar e corrigir usuários que estão marcados como "pro" no banco de dados, mas não têm uma assinatura ativa no Stripe.

## 📋 Problema

Às vezes, usuários podem aparecer como "pro" no sistema mesmo sem ter pago. Isso pode acontecer por:
- Dados inconsistentes entre Stripe e Supabase
- Assinaturas criadas manualmente ou por erro
- Webhooks não processados corretamente
- Assinaturas canceladas no Stripe mas não atualizadas no banco

## 🔍 Passo 1: Verificar Usuários PRO

Execute o script de verificação para identificar problemas:

```bash
npm run verify:pro-users
```

Este script irá:
1. ✅ Listar todas as assinaturas "active" ou "trialing" no banco
2. ✅ Verificar no Stripe se elas realmente existem e estão ativas
3. ✅ Identificar discrepâncias entre banco e Stripe
4. ✅ Gerar um relatório detalhado

### Exemplo de Saída:

```
🔍 Verificando usuários com status PRO...

1️⃣ Buscando assinaturas ativas no banco de dados...
   📊 Encontradas 5 assinaturas ativas no banco

2️⃣ Buscando informações dos usuários...
   📊 5 usuários únicos com assinaturas ativas

3️⃣ Verificando assinaturas no Stripe...

   🔍 Verificando: usuario@exemplo.com
      Subscription ID (DB): abc123
      Stripe Subscription ID: sub_xyz789
      Status (DB): active
      Status (Stripe): canceled
      ❌ PROBLEMA: Ativo no banco mas não no Stripe!

📊 RESUMO
✅ Assinaturas válidas: 4
❌ Problemas encontrados: 1
```

## 🔧 Passo 2: Corrigir Usuários PRO Inválidos

Após verificar, você pode corrigir automaticamente:

```bash
npm run fix:pro-users
```

**⚠️ ATENÇÃO:** Este script modifica dados no banco de dados!

O script irá:
1. ✅ Pedir confirmação antes de fazer alterações
2. ✅ Verificar cada assinatura no Stripe
3. ✅ Atualizar o status no banco para refletir o Stripe
4. ✅ Marcar como "canceled" assinaturas que não existem no Stripe

### Exemplo de Execução:

```bash
$ npm run fix:pro-users

🔧 Script de Correção de Usuários PRO Inválidos

⚠️ ATENÇÃO: Este script irá modificar dados no banco de dados!

Deseja continuar? (digite "SIM" para confirmar): SIM

1️⃣ Buscando assinaturas ativas no banco...
   📊 Encontradas 5 assinaturas

2️⃣ Verificando e corrigindo assinaturas...

   ❌ usuario@exemplo.com: Ativo no banco mas não no Stripe (canceled)
      ✅ Status atualizado para: canceled

📊 RESUMO DA CORREÇÃO
✅ Corrigidos: 1
❌ Erros: 0
```

## 📝 Requisitos

### Variáveis de Ambiente Necessárias

Certifique-se de ter estas variáveis no `.env.local`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
STRIPE_SECRET_KEY=sk_live_... ou sk_test_...
```

### Como Obter as Chaves

1. **SUPABASE_SERVICE_ROLE_KEY:**
   - Acesse [Supabase Dashboard](https://supabase.com/dashboard)
   - Vá em **Settings** → **API**
   - Copie a **service_role** key (⚠️ NUNCA exponha esta chave no frontend!)

2. **STRIPE_SECRET_KEY:**
   - Acesse [Stripe Dashboard](https://dashboard.stripe.com)
   - Vá em **Developers** → **API keys**
   - Copie a **Secret key** (use `sk_test_...` para testes ou `sk_live_...` para produção)

## 🛠️ Correção Manual (Alternativa)

Se preferir corrigir manualmente:

### 1. Identificar o Usuário

Execute o script de verificação para ver quais usuários têm problemas.

### 2. Verificar no Stripe Dashboard

1. Acesse [Stripe Dashboard](https://dashboard.stripe.com)
2. Vá em **Customers**
3. Procure pelo email do usuário
4. Verifique se há uma assinatura ativa

### 3. Corrigir no Supabase

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **Table Editor** → **subscriptions**
3. Encontre a assinatura do usuário
4. Atualize o campo `status` para:
   - `canceled` - se a assinatura foi cancelada no Stripe
   - `past_due` - se o pagamento está atrasado
   - `unpaid` - se o pagamento falhou
   - `active` - apenas se realmente estiver ativa no Stripe

### 4. SQL Direto (Avançado)

Você também pode executar SQL diretamente no Supabase:

```sql
-- Ver todas as assinaturas ativas
SELECT 
  s.id,
  s.user_id,
  s.stripe_subscription_id,
  s.status,
  u.email
FROM subscriptions s
LEFT JOIN auth.users u ON s.user_id = u.id
WHERE s.status IN ('active', 'trialing');

-- Marcar uma assinatura específica como cancelada
UPDATE subscriptions
SET status = 'canceled'
WHERE id = 'id-da-assinatura';
```

## 🔄 Sincronização Automática

O sistema já tem uma função de sincronização automática que:
- Verifica o status da assinatura no banco ao fazer login
- Atualiza o plano do usuário baseado no status da assinatura
- Usa o banco de dados como fonte da verdade

Se você corrigir o status no banco, o usuário verá o plano correto na próxima vez que fizer login.

## 📊 Monitoramento

Para evitar problemas futuros:

1. **Configure alertas no Stripe** para webhooks falhados
2. **Monitore logs do webhook** no Supabase Dashboard
3. **Execute o script de verificação periodicamente** (ex: semanalmente)

## ❓ Troubleshooting

### Erro: "SUPABASE_SERVICE_ROLE_KEY não configurada"

- Verifique se a variável está no `.env.local`
- Certifique-se de usar a **service_role** key, não a **anon** key

### Erro: "STRIPE_SECRET_KEY não configurada"

- Verifique se a variável está no `.env.local`
- Use `sk_test_...` para ambiente de teste ou `sk_live_...` para produção

### Erro: "Tabela subscriptions não existe"

- Execute as migrations do Supabase
- Verifique se a tabela foi criada corretamente

### Erro: "Permission denied" ao acessar subscriptions

- Verifique as políticas RLS (Row Level Security)
- Certifique-se de usar a **service_role** key que bypassa RLS

## 📚 Scripts Relacionados

- `npm run diagnose:subscription` - Diagnóstico geral de assinaturas
- `npm run fix:subscription-status` - Corrigir status de assinatura específica por email

## ✅ Checklist

- [ ] Executei `npm run verify:pro-users` e identifiquei os problemas
- [ ] Configurei todas as variáveis de ambiente necessárias
- [ ] Executei `npm run fix:pro-users` para corrigir automaticamente
- [ ] Verifiquei que os usuários agora têm o status correto
- [ ] Configurei monitoramento para evitar problemas futuros






