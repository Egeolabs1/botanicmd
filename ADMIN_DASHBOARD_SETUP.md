# 👥 Como Fazer o Admin Dashboard Mostrar Usuários Reais

O Admin Dashboard agora busca usuários **reais do Supabase** ao invés de usar apenas localStorage!

## ✅ O que foi implementado

1. **Edge Function `admin-get-users`** - Busca todos os usuários do Supabase Auth
2. **adminService atualizado** - Agora busca do Supabase quando configurado
3. **AdminDashboard atualizado** - Busca assíncrona com indicador de carregamento

## 🚀 Como Configurar

### 1. Deploy da Edge Function `admin-get-users`

A Edge Function já foi criada em `supabase/functions/admin-get-users/index.ts`.

**Via Dashboard (Mais Fácil):**

1. Acesse: https://app.supabase.com/project/khvurdptdkkzkzwhasnd
2. Vá em **Edge Functions**
3. Clique em **Create a new function** → **Via Editor**
4. **Nome**: `admin-get-users`
5. Copie e cole o conteúdo de `supabase/functions/admin-get-users/index.ts`
6. Clique em **Deploy function**

**Via CLI (npx):**

```powershell
npx supabase functions deploy admin-get-users
```

### 2. Verificar Secrets

Certifique-se de que a `SUPABASE_SERVICE_ROLE_KEY` está configurada:

1. No Dashboard: **Settings** → **Edge Functions** → **Secrets**
2. Verifique se `SUPABASE_SERVICE_ROLE_KEY` está lá
3. Se não estiver, adicione:
   ```
   Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtodnVyZHB0ZGtremt6d2hhc25kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzczNzYwMywiZXhwIjoyMDc5MzEzNjAzfQ.xUvvlNvt5DGnRleIt4DgQMZ60AYgWsjr0PZ3qc7HrO8
   ```

### 3. Testar

1. Acesse o Admin Dashboard no app
2. Vá em **Users & Plans**
3. Você deve ver os usuários cadastrados do Supabase!

## 🔐 Segurança

A Edge Function verifica se o usuário é admin antes de retornar a lista. Emails autorizados:

- `admin@botanicmd.com`
- `admin@egeolabs.com`
- `ngfilho@gmail.com`

Para adicionar mais admins, edite a Edge Function `admin-get-users/index.ts`.

## 🐛 Troubleshooting

### "Nenhum usuário encontrado"

**Soluções:**
1. Verifique se a Edge Function `admin-get-users` foi deployada
2. Verifique os logs da Edge Function no Dashboard
3. Verifique se `SUPABASE_SERVICE_ROLE_KEY` está configurada
4. Verifique se você está logado como admin

### "Edge Function não encontrada"

**Solução:**
- Faça deploy da função (instruções acima)

### Usuários não aparecem mesmo após login

**Solução:**
- Aguarde alguns segundos e atualize a página
- A Edge Function pode levar alguns segundos para processar

## 📝 Notas

- A Edge Function busca **todos** os usuários do Supabase Auth
- Combina com dados de `subscriptions` para mostrar o plano
- Conta plantas salvas para mostrar `usageCount`
- Funciona apenas para usuários autenticados como admin

---

Após fazer o deploy da Edge Function, os usuários reais aparecerão no Admin Dashboard! 🎉

