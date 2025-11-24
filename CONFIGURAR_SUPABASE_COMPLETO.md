# 🚀 Guia Completo: Configurar Supabase do Zero

Este guia te levará passo a passo para configurar **TUDO** no Supabase para o BotanicMD funcionar completamente.

---

## 📋 Pré-requisitos

- Conta no [Supabase](https://supabase.com) (gratuita)
- Projeto criado no Supabase
- Acesso ao Dashboard do projeto

---

## ⚙️ ETAPA 0: Configurar Autenticação (IMPORTANTE)

### 0.1 Configurar Confirmação de Email (Opcional)

Por padrão, o Supabase pode exigir confirmação de email. Para testes rápidos, você pode desabilitar:

1. No Dashboard do Supabase, vá em **Authentication** → **Providers** → **Email**
2. Desabilite **"Confirm email"** se quiser login imediato após cadastro
3. Ou mantenha habilitado para maior segurança (usuário precisa confirmar email)

**Nota:** Se a confirmação estiver habilitada, o usuário só terá sessão após clicar no link de confirmação no email.

## ✅ ETAPA 1: Obter Credenciais do Supabase

### 1.1 Acessar o Dashboard

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Faça login na sua conta
3. Selecione seu projeto (ou crie um novo)

### 1.2 Copiar Credenciais

1. No menu lateral, clique em **Settings** (⚙️)
2. Clique em **API**
3. Você verá duas informações importantes:

   **Project URL:**
   ```
   https://xxxxx.supabase.co
   ```
   👉 **Copie isso** - será o valor de `VITE_SUPABASE_URL`

   **anon public key:**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   👉 **Copie isso** - será o valor de `VITE_SUPABASE_KEY`

   **🔒 IMPORTANTE: Segurança das Chaves**
   
   ⚠️ **NÃO copie a "service_role key"** - esta é secreta e nunca deve ser exposta!
   
   ✅ **Use APENAS a "anon public key"** - esta chave é **PÚBLICA POR DESIGN** e **SEGURA para expor no cliente**.
   
   **Por quê é seguro?**
   - A "anon key" tem **permissões limitadas**
   - A segurança real vem do **RLS (Row Level Security)** no banco de dados
   - Mesmo que alguém veja a chave no código, **não pode acessar dados de outros usuários** devido ao RLS
   - É assim que o Supabase foi projetado para funcionar
   
   **Comparação:**
   - `VITE_SUPABASE_KEY` (anon key) = ✅ **Pode expor** (pública por design)
   - `GEMINI_API_KEY` = ❌ **NUNCA expor** (já protegida via Edge Function)
   - Service Role Key = ❌ **NUNCA expor** (não usar no frontend)

---

## ✅ ETAPA 2: Configurar Variáveis de Ambiente

### 2.1 No Vercel (Produção)

1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecione o projeto **botanicmd**
3. Vá em **Settings** → **Environment Variables**
4. Adicione as seguintes variáveis:

   **Variável 1:**
   - **Key**: `VITE_SUPABASE_URL`
   - **Value**: Cole o **Project URL** que você copiou
   - **Environment**: Marque todas (☑️ Production, ☑️ Preview, ☑️ Development)
   - Clique em **Add**

   **Variável 2:**
   - **Key**: `VITE_SUPABASE_KEY`
   - **Value**: Cole a **anon public key** (NÃO a service_role key!)
   - **Environment**: Marque todas (☑️ Production, ☑️ Preview, ☑️ Development)
   - Clique em **Add**

   **🔒 Por que usar prefixo `VITE_`?**
   
   As chaves do Supabase **podem** usar `VITE_` porque:
   - ✅ A "anon key" é **pública por design** e **feita para ser exposta no cliente**
   - ✅ A segurança vem do **RLS (Row Level Security)**, não da ocultação da chave
   - ✅ Mesmo que alguém veja a chave no código-fonte, não pode acessar dados de outros usuários
   - ✅ É a forma recomendada pelo Supabase para apps cliente-servidor
   
   **Diferente da Gemini API Key:**
   - `GEMINI_API_KEY` (sem `VITE_`) = Fica segura no servidor via Edge Function
   - `VITE_SUPABASE_KEY` (com `VITE_`) = Pode ser pública porque é limitada pelo RLS

5. Clique em **Save** (se houver)
6. **Faça um Redeploy** para aplicar as variáveis:
   - Vá em **Deployments**
   - Clique nos **⋯** (três pontos) do último deployment
   - Selecione **Redeploy**

### 2.2 No `.env.local` (Desenvolvimento Local)

1. No projeto local, abra ou crie o arquivo `.env.local` na raiz
2. Adicione as linhas:

```env
VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
VITE_SUPABASE_KEY=sua_chave_anon_public_aqui
```

3. Substitua pelos valores reais que você copiou
4. Salve o arquivo
5. Reinicie o servidor de desenvolvimento (`npm run dev`)

---

## ✅ ETAPA 3: Criar Tabela e Políticas RLS

### 3.1 Executar Script SQL

1. No Supabase Dashboard, vá em **SQL Editor** (no menu lateral)
2. Clique em **New query**
3. Abra o arquivo `supabase-setup.sql` deste projeto
4. **Copie TODO o conteúdo** do arquivo
5. Cole no SQL Editor do Supabase
6. Clique em **Run** (ou pressione Ctrl+Enter)
7. Você deve ver: ✅ "Success. No rows returned"

### 3.2 Verificar se Funcionou

1. No menu lateral, vá em **Database** → **Tables**
2. Você deve ver a tabela **plants** na lista
3. Clique em **plants** para ver os detalhes
4. Na aba **Policies**, você deve ver **4 políticas** criadas

---

## ✅ ETAPA 4: Criar Bucket de Storage

### 4.1 Criar o Bucket

1. No Supabase Dashboard, vá em **Storage** (no menu lateral)
2. Clique em **New bucket**
3. Configure:
   - **Name**: `plant-images` (EXATAMENTE este nome, sem espaços)
   - **Public bucket**: ☑️ **MARQUE ESTA OPÇÃO** (muito importante!)
   - Deixe **File size limit** e **Allowed MIME types** vazios (sem restrições)
4. Clique em **Create bucket**

### 4.2 Verificar Bucket

1. Você deve ver o bucket `plant-images` na lista
2. Clique nele para abrir
3. Verifique que está marcado como **Public**

---

## ✅ ETAPA 5: Configurar Políticas de Storage

### 5.1 Executar Script SQL de Storage

1. No Supabase Dashboard, vá em **SQL Editor**
2. Clique em **New query**
3. Abra o arquivo `supabase-storage-setup.sql` deste projeto
4. **Copie TODO o conteúdo** do arquivo
5. Cole no SQL Editor do Supabase
6. Clique em **Run**
7. Você deve ver: ✅ "Success. No rows returned"

### 5.2 Verificar Políticas

1. Vá em **Storage** → `plant-images`
2. Clique na aba **Policies**
3. Você deve ver **3-4 políticas** criadas

---

## ✅ ETAPA 6: Configurar URLs de Redirecionamento (Opcional mas Recomendado)

### 6.1 No Supabase Dashboard

1. Vá em **Authentication** → **URL Configuration**
2. Configure:

   **Site URL:**
   ```
   https://botanicmd.vercel.app
   ```
   (ou o domínio do seu projeto)

   **Redirect URLs:**
   ```
   https://botanicmd.vercel.app/auth/callback
   https://botanicmd.vercel.app/app
   http://localhost:3000/auth/callback
   http://localhost:3000/app
   ```

3. Clique em **Save**

---

## ✅ ETAPA 7: Configurar Google OAuth (Opcional)

Se você quiser permitir login com Google:

1. Siga o guia completo em: [SUPABASE_OAUTH_SETUP.md](./SUPABASE_OAUTH_SETUP.md)
2. Ou configure manualmente:
   - Supabase Dashboard → **Authentication** → **Providers**
   - Habilite o provider **Google**
   - Configure as credenciais do Google Cloud Console

**Nota:** Login com email funciona sem esta etapa!

---

## 🧪 ETAPA 8: Testar a Configuração

### 8.1 Verificar Variáveis de Ambiente

1. Acesse seu site no Vercel
2. Abra o **Console do Navegador** (F12)
3. Procure por mensagens:
   - ❌ Se aparecer: "Supabase não configurado" → variáveis não configuradas
   - ✅ Se NÃO aparecer esta mensagem → variáveis estão OK!

### 8.2 Testar Autenticação

1. No site, clique em "Começar Agora"
2. Tente fazer login ou cadastro com email
3. Deve funcionar sem erros

### 8.3 Testar Armazenamento

1. Faça login no app
2. Identifique uma planta (envie foto ou busque por nome)
3. Clique em "Salvar no Jardim"
4. Vá em "Meu Jardim" no menu
5. A planta deve aparecer salva

### 8.4 Testar Upload de Imagens

1. Salve uma planta com foto
2. Vá em **Storage** → `plant-images` no Supabase Dashboard
3. Você deve ver uma pasta com o ID do usuário
4. Dentro dela, deve ter a imagem da planta

---

## ✅ Checklist Final

Marque cada item após completar:

### Variáveis de Ambiente
- [ ] `VITE_SUPABASE_URL` configurada no Vercel
- [ ] `VITE_SUPABASE_KEY` configurada no Vercel
- [ ] Variáveis também no `.env.local` (para desenvolvimento)
- [ ] Redeploy feito no Vercel

### Banco de Dados
- [ ] Tabela `plants` criada
- [ ] Índices criados
- [ ] RLS habilitado na tabela
- [ ] 4 políticas RLS criadas

### Storage
- [ ] Bucket `plant-images` criado
- [ ] Bucket marcado como público
- [ ] Políticas de Storage configuradas

### Autenticação
- [ ] Redirect URLs configuradas
- [ ] (Opcional) Google OAuth configurado

### Testes
- [ ] Login funciona
- [ ] Cadastro funciona
- [ ] Salvar planta funciona
- [ ] Imagens fazem upload
- [ ] Ver plantas salvas funciona

---

## 🎉 Pronto!

Se todos os itens acima estão marcados, o Supabase está **100% configurado**!

---

## 🔒 Dúvidas sobre Segurança?

**Pergunta comum:** "Não é perigoso expor a chave do Supabase com `VITE_`?"

**Resposta:** Não! A "anon key" do Supabase é **pública por design** e **feita para ser exposta no cliente**. A segurança vem do **RLS (Row Level Security)** no banco de dados, não da ocultação da chave.

Veja o guia completo em: [SEGURANCA_CHAVES_API.md](./SEGURANCA_CHAVES_API.md)

---

## 🐛 Problemas Comuns

### "Supabase não configurado" ainda aparece

**Solução:**
1. Verifique se as variáveis estão com os nomes corretos (exatamente `VITE_SUPABASE_URL` e `VITE_SUPABASE_KEY`)
2. Verifique se fez redeploy no Vercel
3. Limpe o cache do navegador e recarregue

### Erro ao salvar planta: "relation 'plants' does not exist"

**Solução:**
1. Execute o script `supabase-setup.sql` novamente
2. Verifique se está no projeto correto do Supabase

### Erro ao fazer upload: "bucket not found"

**Solução:**
1. Verifique se o bucket `plant-images` existe no Storage
2. Verifique se o nome está exatamente `plant-images` (sem espaços)

### Usuário A vê plantas do usuário B

**Solução:**
1. Verifique se as políticas RLS estão criadas
2. Execute o script `supabase-setup.sql` novamente
3. Verifique se RLS está habilitado na tabela

---

**Dúvidas?** Consulte também:
- [SUPABASE_CHECKLIST.md](./SUPABASE_CHECKLIST.md) - Checklist detalhado
- [SUPABASE_OAUTH_SETUP.md](./SUPABASE_OAUTH_SETUP.md) - Guia de OAuth

---

**Desenvolvido por Egeolabs 2025**

