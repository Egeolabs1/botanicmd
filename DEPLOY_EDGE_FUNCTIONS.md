# 🚀 Como Fazer Deploy das Edge Functions

## Pré-requisitos

1. **Supabase CLI instalado** (ou usar `npx`)
2. **Acesso ao seu projeto Supabase**

## Passo 1: Login no Supabase CLI

Abra o terminal/PowerShell e execute:

```bash
npx supabase login
```

Isso vai abrir o navegador para você fazer login. Após o login, volte ao terminal.

## Passo 2: Vincular o Projeto

Execute o comando abaixo, substituindo `khvurdptdkkzkzwhasnd` pelo seu Project Reference ID:

```bash
npx supabase link --project-ref khvurdptdkkzkzwhasnd
```

Quando solicitado, escolha:
- **Database Password**: Digite a senha do seu banco de dados (a mesma que você usa no Dashboard)
- **Git Branch**: Pressione Enter para usar o padrão

## Passo 3: Configurar Secrets (se ainda não fez)

As Edge Functions precisam das seguintes variáveis de ambiente:

```bash
# Stripe Secret Key (substitua pela sua chave real)
npx supabase secrets set STRIPE_SECRET_KEY=sk_live_SUA_CHAVE_STRIPE_AQUI

# Stripe Webhook Secret (substitua pelo seu secret real)
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_SEU_WEBHOOK_SECRET_AQUI

# Supabase Service Role Key (obtenha do Dashboard)
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=SUA_SERVICE_ROLE_KEY_AQUI

# Supabase URL (já deve estar configurada, mas para garantir)
npx supabase secrets set SUPABASE_URL=https://khvurdptdkkzkzwhasnd.supabase.co
```

**⚠️ IMPORTANTE**: Substitua `SUA_SERVICE_ROLE_KEY_AQUI` pela sua Service Role Key real do Dashboard do Supabase.

## Passo 4: Deploy das Edge Functions

Agora você pode fazer o deploy de todas as funções de uma vez:

```bash
npx supabase functions deploy
```

Ou fazer deploy de funções específicas:

```bash
# Deploy apenas da função create-checkout (a que está com erro de CORS)
npx supabase functions deploy create-checkout

# Deploy da função create-portal
npx supabase functions deploy create-portal

# Deploy da função stripe-webhook
npx supabase functions deploy stripe-webhook

# Deploy da função admin-get-users
npx supabase functions deploy admin-get-users
```

## Passo 5: Verificar o Deploy

Após o deploy, você pode verificar se as funções estão ativas:

1. Acesse o Dashboard do Supabase: https://app.supabase.com/project/khvurdptdkkzkzwhasnd
2. Vá em **Edge Functions**
3. Verifique se todas as funções aparecem como "Active"

## Passo 6: Testar

Após o deploy, teste o checkout novamente no app. O erro de CORS deve estar resolvido!

---

## 🔧 Solução de Problemas

### Erro: "Cannot use automatic login flow"
- Execute `npx supabase login` em um terminal interativo (não via script)

### Erro: "Project not found"
- Verifique se o Project Reference ID está correto
- Certifique-se de que você tem acesso ao projeto no Dashboard

### Erro: "Secret not found"
- Verifique se você configurou todos os secrets necessários
- Use `npx supabase secrets list` para ver os secrets configurados

### Erro de CORS ainda persiste
- Aguarde alguns minutos após o deploy (pode levar tempo para propagar)
- Limpe o cache do navegador
- Verifique se a função foi deployada corretamente no Dashboard

---

## 📝 Comandos Úteis

```bash
# Ver status do projeto
npx supabase status

# Ver logs das Edge Functions
npx supabase functions logs create-checkout

# Listar secrets configurados
npx supabase secrets list

# Ver informações do projeto linkado
npx supabase projects list
```

---

**Pronto!** Após seguir estes passos, suas Edge Functions estarão deployadas e funcionando! 🎉

