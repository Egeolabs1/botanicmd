# ✅ O que é OBRIGATÓRIO vs OPCIONAL no BotanicMD

## 🎯 Resumo Rápido

O app **JÁ FUNCIONA** em modo básico! Você só precisa configurar o que realmente quer usar.

## ✅ OBRIGATÓRIO (Mínimo para o app funcionar)

### 1. API Key do Gemini (Para identificação de plantas)
- **Status**: ✅ Obrigatório
- **Onde configurar**: `.env.local` ou Vercel Dashboard
- **Como obter**: https://ai.google.dev/
- **Para desenvolvimento local**:
  ```env
  VITE_GEMINI_API_KEY=sua_chave_aqui
  ```
- **Para produção (Vercel)**: 
  ```env
  GEMINI_API_KEY=sua_chave_aqui  # SEM prefixo VITE_
  ```

**Sem isso**: O app não consegue identificar plantas.

---

## 🔵 OPCIONAL (Mas recomendado para produção)

### 2. Supabase (Autenticação e armazenamento)

- **Status**: ⚪ Opcional
- **O que você perde sem isso**:
  - ❌ Não pode fazer login/cadastro real
  - ❌ Dados ficam apenas no navegador (localStorage)
  - ❌ Perde dados se limpar cache/navegador
  - ❌ Sem sincronização entre dispositivos
- **O que funciona sem isso**:
  - ✅ Modo demo funciona perfeitamente
  - ✅ Identificação de plantas funciona
  - ✅ Todas as funcionalidades básicas funcionam
  - ✅ Dados salvos localmente no navegador

**Configuração mínima** (se quiser):
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_KEY=sua_chave_anon_aqui
```

---

### 3. Stripe (Pagamentos e assinaturas)

- **Status**: ⚪ Totalmente opcional
- **O que você perde sem isso**:
  - ❌ Não pode processar pagamentos reais
  - ❌ Usuários não podem fazer upgrade para PRO pago
  - ❌ Modo de simulação em desenvolvimento
- **O que funciona sem isso**:
  - ✅ Tudo funciona normalmente
  - ✅ Usuários podem usar o plano FREE
  - ✅ Você pode criar usuários PRO manualmente no admin
  - ✅ Todas as funcionalidades básicas funcionam

**Se você NÃO configurar Stripe**:
- O botão de "Assinar" vai dar erro (ou mostrar simulação em dev)
- Usuários ficam no plano FREE (3 análises/mês)
- Você pode promover usuários manualmente via Admin Dashboard

---

## 📊 Matriz de Funcionalidades

| Funcionalidade | Precisa de Gemini? | Precisa de Supabase? | Precisa de Stripe? |
|---------------|-------------------|---------------------|-------------------|
| Identificar plantas por foto | ✅ **SIM** | ❌ Não | ❌ Não |
| Identificar plantas por nome | ✅ **SIM** | ❌ Não | ❌ Não |
| Salvar plantas (LocalStorage) | ❌ Não | ❌ Não | ❌ Não |
| Salvar plantas (Cloud) | ❌ Não | ✅ Sim | ❌ Não |
| Login/Cadastro | ❌ Não | ✅ Sim | ❌ Não |
| Login com Google | ❌ Não | ✅ Sim | ❌ Não |
| Plano FREE (3 análises/mês) | ✅ **SIM** | ❌ Não | ❌ Não |
| Plano PRO (pagamento real) | ❌ Não | ✅ Sim | ✅ **SIM** |
| Admin Dashboard | ❌ Não | ❌ Não | ❌ Não |
| Blog | ❌ Não | ❌ Não | ❌ Não |

---

## 🚀 Cenários de Uso

### Cenário 1: Apenas testar o app localmente
**Precisa configurar:**
- ✅ Gemini API Key

**Não precisa:**
- ❌ Supabase
- ❌ Stripe

### Cenário 2: App funcionando com login, mas sem pagamentos
**Precisa configurar:**
- ✅ Gemini API Key
- ✅ Supabase (básico)

**Não precisa:**
- ❌ Stripe
- ❌ Edge Functions do Supabase

**Nota**: Você pode criar usuários PRO manualmente no admin.

### Cenário 3: App completo com pagamentos
**Precisa configurar:**
- ✅ Gemini API Key
- ✅ Supabase (completo)
- ✅ Stripe (completo)
- ✅ Edge Functions do Supabase

---

## 📝 Configuração Mínima Recomendada

Para começar a usar o app rapidamente:

### 1. Crie `.env.local`:
```env
# OBRIGATÓRIO
VITE_GEMINI_API_KEY=sua_chave_gemini_aqui
```

### 2. Execute:
```bash
npm install
npm run dev
```

**Pronto!** O app já funciona em modo demo.

---

## 🔄 Configuração Progressiva

Você pode configurar aos poucos:

### Fase 1: Básico (funciona agora)
1. ✅ Configure apenas Gemini API Key
2. ✅ Teste todas as funcionalidades
3. ✅ Use em modo demo/offline

### Fase 2: Autenticação (quando quiser)
1. ⚪ Crie projeto no Supabase
2. ⚪ Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_KEY`
3. ⚪ Agora login/cadastro funcionam

### Fase 3: Pagamentos (quando necessário)
1. ⚪ Crie conta no Stripe
2. ⚪ Configure Edge Functions (se já tiver Supabase)
3. ⚪ Configure webhook
4. ⚪ Agora pagamentos funcionam

---

## ❓ Perguntas Frequentes

### "Preciso configurar tudo para o app funcionar?"
**Não!** Apenas o Gemini API Key é obrigatório.

### "O app funciona offline?"
Sim, funciona em modo demo sem Supabase e Stripe. Dados ficam no navegador.

### "Posso pular o Stripe e depois adicionar?"
Sim! Você pode adicionar Stripe quando quiser. Tudo é modular.

### "E se eu não configurar Supabase?"
O app funciona normalmente em modo demo/offline. Usuários são salvos apenas no navegador.

### "Posso testar pagamentos sem configurar tudo?"
Sim! Em desenvolvimento, o app oferece modo de simulação quando detecta que Stripe não está configurado.

---

## 🎯 Recomendação

**Para começar:**
1. ✅ Configure apenas Gemini API Key
2. ✅ Teste o app
3. ⚪ Configure Supabase quando precisar de login real
4. ⚪ Configure Stripe quando precisar de pagamentos reais

**Tudo funciona sem Supabase e Stripe!** Eles são apenas para funcionalidades avançadas.

---

## 📚 Guias Disponíveis

- **Básico**: Este arquivo
- **Supabase**: `CONFIGURAR_SUPABASE_COMPLETO.md`
- **Stripe**: `STRIPE_SETUP.md`
- **Edge Functions**: `SUPABASE_EDGE_FUNCTIONS_SETUP.md`
- **OAuth Google**: `SUPABASE_OAUTH_SETUP.md`

Configure apenas o que você precisa! 🚀

