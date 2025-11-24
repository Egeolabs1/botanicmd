# 🔐 Como Configurar Suas Chaves

⚠️ **IMPORTANTE**: Chaves secretas NUNCA devem ser commitadas no Git!

Use os arquivos abaixo apenas como referência e configure manualmente nos locais corretos.

## 📁 Arquivos de Referência Criados

Todos os arquivos com suas chaves foram criados localmente, mas NÃO foram commitados no Git por segurança.

Os seguintes arquivos estão na sua máquina local (não no Git):

- `.env.local` - Variáveis de ambiente locais (se você criou)
- Arquivos temporários com suas chaves

## ✅ O Que Fazer Agora

### 1. Criar arquivo `.env.local` localmente

Na raiz do projeto, crie um arquivo chamado `.env.local` com:

```env
VITE_GEMINI_API_KEY=sua_chave_aqui
VITE_SUPABASE_URL=https://khvurdptdkkzkzwhasnd.supabase.co
VITE_SUPABASE_KEY=sua_chave_anon_aqui
```

### 2. Configurar Secrets no Supabase Dashboard

Acesse: https://app.supabase.com/project/khvurdptdkkzkzwhasnd/settings/functions

Adicione as secrets manualmente (veja as instruções em `STRIPE_SETUP.md`)

### 3. ⚠️ Atenção às Chaves do Stripe

As chaves do Stripe que você forneceu precisam ser corrigidas:

- **STRIPE_SECRET_KEY** deve começar com `sk_test_` (não `pk_test_`)
- **STRIPE_WEBHOOK_SECRET** deve começar com `whsec_` (não `sk_test_`)

Veja instruções detalhadas em `STRIPE_SETUP.md`

## 🔒 Segurança

✅ **Fazer:**
- Criar `.env.local` localmente (já está no .gitignore)
- Configurar secrets no Supabase Dashboard
- Configurar variáveis no Vercel Dashboard

❌ **NÃO fazer:**
- Commitar chaves no Git
- Compartilhar chaves em chats públicos
- Expor chaves no código-fonte

---

Todas as instruções detalhadas estão nos arquivos de documentação:
- `STRIPE_SETUP.md`
- `CONFIGURAR_EDGE_FUNCTIONS_VIA_DASHBOARD.md`
- `SUPABASE_EDGE_FUNCTIONS_SETUP.md`

