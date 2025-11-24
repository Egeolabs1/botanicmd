# 🔒 Guia de Segurança: Chaves de API

Este documento explica **quais chaves podem ser expostas** e **quais devem ser protegidas**.

---

## 📋 Resumo Rápido

| Chave | Prefixo | Pode Expor? | Motivo |
|-------|---------|-------------|--------|
| `VITE_SUPABASE_URL` | `VITE_` | ✅ **SIM** | É apenas uma URL pública |
| `VITE_SUPABASE_KEY` | `VITE_` | ✅ **SIM** | É a "anon key" (pública por design) |
| `GEMINI_API_KEY` | ❌ **SEM** `VITE_` | ❌ **NÃO** | Protegida via Edge Function no servidor |
| Service Role Key | ❌ **NUNCA** | ❌ **NÃO** | Chave administrativa secreta |

---

## 🔐 Chaves do Supabase

### ✅ VITE_SUPABASE_URL e VITE_SUPABASE_KEY (PODE EXPOR)

**Por que é seguro?**

1. **A "anon key" é pública por design**
   - O Supabase foi criado para funcionar com a chave exposta no cliente
   - Todos os apps Supabase expõem esta chave no frontend
   - É assim que funciona o Supabase

2. **A segurança vem do RLS (Row Level Security)**
   - Mesmo com a chave, ninguém pode acessar dados de outros usuários
   - O RLS garante que cada usuário só vê seus próprios dados
   - As políticas que configuramos no banco protegem os dados

3. **Permissões limitadas**
   - A "anon key" só tem acesso ao que as políticas RLS permitem
   - Não pode fazer operações administrativas
   - Não pode acessar dados de outros usuários

**Exemplo de uso seguro:**
```javascript
// ✅ SEGURO - expor no cliente
const supabase = createClient(
  'https://xxxxx.supabase.co',  // VITE_SUPABASE_URL (pública)
  'eyJhbGciOiJIUzI1NiIs...'     // VITE_SUPABASE_KEY (anon key pública)
);
```

### ❌ Service Role Key (NUNCA EXPOR!)

**Por que é perigoso?**

- Esta chave **ignora todas as políticas RLS**
- Com ela, alguém poderia acessar **TODOS os dados** de **TODOS os usuários**
- É equivalente a ter acesso root ao banco de dados
- **SEMPRE** deve ficar apenas no servidor

**Como identificar:**
- No Supabase Dashboard, em Settings → API
- Vem com o rótulo **"service_role"** (secret)
- **NÃO USE ESTA NO FRONTEND!**

---

## 🤖 Chave da Gemini API

### ❌ GEMINI_API_KEY (NUNCA EXPOR!)

**Por que precisa ser protegida?**

1. **Custos**
   - Cada requisição custa dinheiro
   - Se alguém pegar sua chave, pode fazer milhares de requisições
   - Você seria cobrado por isso

2. **Uso indevido**
   - Alguém poderia usar sua chave para seus próprios projetos
   - Poderia esgotar seu limite de uso/quota

**Como está protegida no BotanicMD:**

✅ **Implementação Segura:**
- A chave fica **SEM prefixo `VITE_`**
- Só está disponível no servidor (Vercel Edge Function)
- O cliente nunca vê a chave
- Todas as chamadas passam pela API route `/api/gemini`

```typescript
// ❌ NUNCA fazer isso (expor no cliente):
// const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY; // PERIGOSO!

// ✅ CORRETO (Edge Function no servidor):
// api/gemini.ts
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Seguro no servidor
```

---

## 🛡️ Como Funciona a Proteção

### Supabase (Chave Pública)

```
Cliente (Navegador)
  ↓ (VITE_SUPABASE_KEY exposta)
Supabase
  ↓ (Verifica RLS)
Banco de Dados
  ↓ (Retorna apenas dados do usuário)
Cliente
```

**Segurança:** RLS garante que cada usuário só vê seus dados

### Gemini API (Chave Protegida)

```
Cliente (Navegador)
  ↓ (Faz requisição sem chave)
/api/gemini (Edge Function)
  ↓ (Usa GEMINI_API_KEY do servidor)
Google Gemini API
  ↓ (Retorna resultado)
Edge Function
  ↓ (Retorna para o cliente)
Cliente
```

**Segurança:** Chave nunca sai do servidor

---

## ✅ Checklist de Segurança

### Variáveis de Ambiente no Vercel

- [ ] ✅ `VITE_SUPABASE_URL` - OK expor (pública)
- [ ] ✅ `VITE_SUPABASE_KEY` - OK expor (anon key pública)
- [ ] ✅ `GEMINI_API_KEY` (SEM `VITE_`) - Protegida no servidor
- [ ] ❌ `SUPABASE_SERVICE_ROLE_KEY` - NUNCA adicionar no Vercel

### No Código

- [ ] ✅ `import.meta.env.VITE_SUPABASE_*` - OK usar no cliente
- [ ] ✅ `process.env.GEMINI_API_KEY` - OK usar no servidor (Edge Function)
- [ ] ❌ Nunca usar `VITE_GEMINI_API_KEY` - Inseguro!

---

## 🔍 Como Verificar se Está Seguro

### 1. Verificar no Build

Após fazer build do projeto, verifique:

```bash
npm run build
```

Depois abra `dist/index.html` ou os arquivos JS gerados e procure por:

❌ **Se encontrar `GEMINI_API_KEY`** = INSEGURO!
✅ **Se encontrar `VITE_SUPABASE_KEY`** = OK, é esperado

### 2. Verificar no Navegador

1. Abra o DevTools (F12)
2. Vá em **Sources** ou **Network**
3. Procure pelas variáveis de ambiente

❌ **Se vir `GEMINI_API_KEY`** = INSEGURO!
✅ **Se vir `VITE_SUPABASE_KEY`** = OK, é esperado

---

## 📚 Referências

- [Supabase - Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase - API Keys Explained](https://supabase.com/docs/guides/api/api-keys)
- [Vercel - Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## 💡 Resumo Final

✅ **Seguro expor:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_KEY` (anon key)

❌ **NUNCA expor:**
- `GEMINI_API_KEY`
- Service Role Key do Supabase

**Regra de ouro:**
- Se usa `VITE_` → Será exposta no cliente (ok apenas se for pública por design)
- Se NÃO usa `VITE_` → Fica apenas no servidor (use para chaves secretas)

---

**Desenvolvido por Egeolabs 2025**



