# 🚨 Solução Imediata: Erro 401 "Missing authorization header"

O erro mostra claramente que o Supabase está exigindo autenticação. Vamos corrigir AGORA!

---

## ✅ Solução em 3 Passos

### **Passo 1: Obter a ANON KEY do Supabase**

1. **Acesse:**
   - https://app.supabase.com/project/khvurdptdkkzkzwhasnd/settings/api
   - Ou: https://supabase.com/dashboard → seu projeto → Settings → API

2. **Copie a "anon public" key:**
   - Procure por **"anon public"** (não a "service_role"!)
   - Copie o valor completo (começa com `eyJhbGci...`)
   - Exemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtodXZ1cmRwdGRra3prendoYXNuZCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzE...`

---

### **Passo 2: Atualizar a URL do Webhook no Stripe**

1. **Acesse o Stripe Dashboard:**
   - https://dashboard.stripe.com/webhooks

2. **Edite o webhook:**
   - Clique no webhook que está dando erro 401
   - Clique no ícone de lápis ✏️ ao lado da URL

3. **Cole a URL completa com apikey:**
   ```
   https://khvurdptdkkzkzwhasnd.supabase.co/functions/v1/stripe-webhook?apikey=SUA_ANON_KEY_AQUI
   ```
   
   **Onde `SUA_ANON_KEY_AQUI` é a chave que você copiou no Passo 1.**
   
   **Exemplo completo:**
   ```
   https://khvurdptdkkzkzwhasnd.supabase.co/functions/v1/stripe-webhook?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtodXZ1cmRwdGRra3prendoYXNuZCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzE...
   ```

4. **Clique em "Save" ou "Salvar"**

---

### **Passo 3: Testar**

1. **No Stripe Dashboard:**
   - Clique em **"Send test webhook"**
   - Selecione: `checkout.session.completed`
   - Clique em **Send test webhook**

2. **Verifique o resultado:**
   - Deve aparecer **200 OK** ✅ (não mais 401!)
   - Os logs no Supabase devem mostrar processamento

---

## 🔍 Verificar se Funcionou

1. **No Stripe Dashboard:**
   - Webhooks → seu webhook → veja os eventos
   - O teste deve mostrar status **200** (não 401)

2. **No Supabase Dashboard:**
   - Edge Functions → stripe-webhook → Logs
   - Deve ver logs de processamento

---

## ⚠️ Importante

- ✅ A **anon key é pública** e pode ser usada na URL
- ✅ Isso é seguro porque a verificação real é feita pelo `stripe-signature`
- ✅ Não use a "service_role" key - apenas a "anon public"!

---

## 🎯 Depois de Corrigir

1. **Reprocesse os eventos antigos:**
   - No Stripe, encontre os eventos com 401 ERR
   - Clique em cada um → **"Replay"**

2. **Teste um novo pagamento:**
   - Faça um pagamento de teste
   - O webhook deve processar com sucesso
   - O plano deve ser atualizado automaticamente

---

**Isso deve resolver o problema imediatamente! 🚀**

