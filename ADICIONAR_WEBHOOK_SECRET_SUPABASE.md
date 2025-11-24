# 🔑 Adicionar STRIPE_WEBHOOK_SECRET no Supabase

Você já tem o `STRIPE_WEBHOOK_SECRET`! Agora precisa configurá-lo no Supabase.

## ✅ Sua Chave
```
whsec_Ji9KK4t0JKcoZpVgpMQl6z2NNb5MG9EG
```

## 🚀 Passo a Passo

### Opção 1: Via Dashboard do Supabase (Mais Fácil) ⭐ RECOMENDADO

1. **Acesse o Supabase Dashboard:**
   - https://app.supabase.com/project/khvurdptdkkzkzwhasnd

2. **Vá em Settings → Edge Functions:**
   - Menu lateral → **Settings** (⚙️ Configurações)
   - Clique em **Edge Functions** no submenu

3. **Adicionar Secret:**
   - Role até a seção **"Secrets"**
   - Clique em **"Add a new secret"** ou **"Adicionar novo secret"**
   
4. **Preencher:**
   - **Name (Nome):** `STRIPE_WEBHOOK_SECRET`
   - **Value (Valor):** `whsec_Ji9KK4t0JKcoZpVgpMQl6z2NNb5MG9EG`
   
5. **Salvar:**
   - Clique em **Save** ou **Salvar**
   - ✅ Pronto! A chave está configurada

### Opção 2: Via CLI (npx) - Alternativa Rápida

Se preferir usar linha de comando:

```powershell
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_Ji9KK4t0JKcoZpVgpMQl6z2NNb5MG9EG
```

> **Nota:** Você precisa estar logado e com o projeto linkado. Se não estiver:
> ```powershell
> npx supabase login
> npx supabase link --project-ref khvurdptdkkzkzwhasnd
> ```

## 📝 Configurar no .env.local (Desenvolvimento Local)

Para desenvolvimento local, também adicione no `.env.local`:

1. Abra o arquivo `.env.local` na raiz do projeto
2. Adicione ou atualize a linha:

```env
STRIPE_WEBHOOK_SECRET=whsec_Ji9KK4t0JKcoZpVgpMQl6z2NNb5MG9EG
```

3. Salve o arquivo

⚠️ **IMPORTANTE:** 
- O arquivo `.env.local` está no `.gitignore` (não será commitado)
- **NUNCA** compartilhe essa chave publicamente!

## ✅ Checklist de Configuração

Agora você precisa ter configurado:

- [x] ✅ Webhook criado no Stripe
- [x] ✅ URL do endpoint configurada
- [x] ✅ Eventos selecionados (6 eventos)
- [x] ✅ `STRIPE_WEBHOOK_SECRET` copiado
- [ ] ⏳ `STRIPE_WEBHOOK_SECRET` adicionado no Supabase Secrets (próximo passo!)
- [ ] ⏳ `STRIPE_WEBHOOK_SECRET` adicionado no `.env.local` (se for desenvolver localmente)

## 🧪 Testar o Webhook

Depois de adicionar no Supabase:

1. **No Stripe Dashboard:**
   - Vá no webhook que você criou
   - Clique em **"Send test webhook"** ou **"Enviar webhook de teste"**
   - Selecione: `checkout.session.completed`
   - Clique em **Send test webhook**

2. **Verificar no Supabase:**
   - Dashboard → **Edge Functions** → **stripe-webhook**
   - Clique em **Logs**
   - Você deve ver o evento sendo processado

## 🎯 Próximos Passos

Depois de configurar o secret:

1. ✅ Webhook estará funcionando
2. ✅ Pagamentos serão processados automaticamente
3. ✅ Assinaturas serão criadas no banco de dados
4. ✅ Usuários receberão o plano Pro após pagamento

---

🎉 **Quase lá!** Agora é só adicionar o secret no Supabase e está tudo configurado!
