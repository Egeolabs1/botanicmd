# 🤖 Scripts de Automação

## 🚀 Setup Automatizado do Supabase

### Uso Rápido

1. **Configure as credenciais no `.env.local`:**
```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

⚠️ **IMPORTANTE:** Use a **SERVICE ROLE KEY** (não a anon key)!
- Encontre em: Supabase Dashboard → Settings → API → `service_role` (secret)
- Esta chave é **SECRETA** e só deve ser usada localmente neste script!

2. **Execute o script:**
```bash
npm run setup:supabase
```

OU passe as credenciais como argumentos:
```bash
node scripts/setup-supabase.mjs <url> <service-role-key>
```

### O que o Script Faz

✅ **Automático:**
- Verifica conexão com Supabase
- Cria bucket `plant-images` no Storage
- Valida configuração

⚠️ **Manual (ainda necessário):**
- Executar SQL scripts no SQL Editor do Supabase
  - `supabase-setup.sql` - Cria tabela e políticas RLS
  - `supabase-storage-setup.sql` - Configura políticas de Storage

### Por que SQL Precisa ser Manual?

O Supabase **não permite** executar SQL arbitrário via API REST por questões de segurança. Por isso, você precisa executar os scripts SQL no **SQL Editor** do Dashboard.

O script irá:
1. Criar o bucket automaticamente ✅
2. Mostrar instruções claras para executar o SQL ⚠️
3. Verificar se tudo foi configurado corretamente ✅

### Alternativa: Supabase CLI

Se você instalar o Supabase CLI, pode automatizar mais:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Fazer login
supabase login

# Link ao projeto
supabase link --project-ref seu-project-id

# Executar migrations (se configurar)
supabase db push
```

Mas para este projeto, executar o SQL manualmente no Dashboard é mais simples e direto.



