# 📋 Como Verificar os Logs da Edge Function create-checkout

Quando você recebe um erro 500 na Edge Function `create-checkout`, os logs detalhados ajudarão a identificar o problema.

## 🔍 Métodos para Verificar os Logs

### **Método 1: Via Supabase Dashboard (Mais Fácil)**

1. **Acesse o Dashboard:**
   - Vá para: https://supabase.com/dashboard
   - Faça login na sua conta

2. **Selecione seu projeto:**
   - Clique no projeto `botanicmd` (ou o nome do seu projeto)

3. **Navegue até Edge Functions:**
   - No menu lateral esquerdo, clique em **"Edge Functions"**
   - Você verá uma lista de funções: `create-checkout`, `stripe-webhook`, `create-portal`

4. **Abra os logs:**
   - Clique na função **`create-checkout`**
   - Clique na aba **"Logs"** no topo da página
   - Você verá uma lista de execuções recentes

5. **Encontre o erro:**
   - Os logs mais recentes aparecem no topo
   - Procure por logs com emojis ❌ (erro) ou 🚀 (início)
   - Clique em um log para ver os detalhes completos

### **Método 2: Via CLI (Terminal)**

1. **Abra o terminal** no diretório do projeto

2. **Execute o comando:**
   ```bash
   npx supabase functions logs create-checkout
   ```

3. **Para ver apenas erros:**
   ```bash
   npx supabase functions logs create-checkout --level error
   ```

4. **Para ver logs em tempo real:**
   ```bash
   npx supabase functions logs create-checkout --follow
   ```

---

## 🎯 O Que Procurar nos Logs

Os logs agora incluem emojis para facilitar a identificação:

- 🚀 = Iniciando requisição
- ✅ = Sucesso em uma operação
- ❌ = Erro ocorreu
- ⚠️ = Aviso (não crítico, mas importante)
- 🔍 = Verificando algo
- 📥 = Lendo dados
- 💳 = Criando checkout no Stripe

### **Erros Comuns e O Que Significam:**

#### 1. **"STRIPE_SECRET_KEY não configurado"**
**Causa:** A chave secreta do Stripe não está configurada no Supabase  
**Solução:** Configure o secret `STRIPE_SECRET_KEY` no Supabase Dashboard

#### 2. **"SUPABASE_SERVICE_ROLE_KEY não configurado"**
**Causa:** A service role key não está configurada  
**Solução:** Configure o secret `SUPABASE_SERVICE_ROLE_KEY` no Supabase Dashboard

#### 3. **"No such price: 'price_...'"**
**Causa:** O Price ID não existe no Stripe ou está incorreto  
**Solução:** Verifique se os Price IDs no `services/paymentService.ts` estão corretos

#### 4. **"Erro ao criar customer no Stripe"**
**Causa:** Problema ao criar cliente no Stripe (API key inválida, etc.)  
**Solução:** Verifique se a `STRIPE_SECRET_KEY` está correta e se tem permissões

#### 5. **"Erro ao criar sessão de checkout"**
**Causa:** Problema ao criar sessão de checkout no Stripe  
**Solução:** Verifique os detalhes do erro nos logs (geralmente é Price ID inválido)

---

## 📝 Exemplo de Logs

Aqui está um exemplo do que você verá nos logs:

```
🚀 create-checkout: Iniciando requisição...
✅ create-checkout: Criando cliente Supabase...
🔍 create-checkout: Verificando autenticação do usuário...
✅ create-checkout: Usuário autenticado: usuario@email.com (uuid-123)
📥 create-checkout: Lendo corpo da requisição...
✅ create-checkout: Corpo recebido: {"priceId":"price_...","planType":"monthly"}
📋 create-checkout: Parâmetros recebidos - priceId: price_..., planType: monthly, currency: BRL
🔍 create-checkout: Verificando se usuário já tem customer no Stripe...
🆕 create-checkout: Criando novo customer no Stripe...
✅ create-checkout: Novo customer criado: cus_...
💳 create-checkout: Criando sessão de checkout no Stripe...
✅ create-checkout: Sessão criada com sucesso: cs_...
```

Se houver um erro:

```
🚀 create-checkout: Iniciando requisição...
✅ create-checkout: Criando cliente Supabase...
❌ create-checkout: STRIPE_SECRET_KEY não configurado
```

---

## 🔧 Depois de Identificar o Erro

1. **Anote a mensagem de erro** completa dos logs
2. **Siga as instruções** de solução acima
3. **Se necessário, configure os secrets** no Supabase Dashboard:
   - Vá em **Edge Functions** → **Settings** → **Secrets**
   - Adicione ou atualize os secrets necessários

---

## 💡 Dica

**Sempre verifique os logs mais recentes primeiro!** Eles aparecem no topo da lista e contêm as informações mais atualizadas sobre o que está acontecendo.

