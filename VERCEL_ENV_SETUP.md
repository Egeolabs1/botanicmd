# Configuração de Variáveis de Ambiente no Vercel

Para que o app funcione corretamente em produção no Vercel, você precisa configurar as variáveis de ambiente.

## Passo a Passo

1. Acesse seu projeto no [Vercel Dashboard](https://vercel.com/dashboard)
2. Vá em **Settings** → **Environment Variables**
3. Adicione as seguintes variáveis:

### Variáveis Obrigatórias

```bash
VITE_GEMINI_API_KEY=sua_chave_gemini_aqui
```

Para obter a chave:
- Acesse [Google AI Studio](https://ai.google.dev/)
- Crie ou acesse seu projeto
- Copie a API Key
- Cole no Vercel com o nome `VITE_GEMINI_API_KEY`

### Variáveis Opcionais (Supabase)

```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_KEY=sua_chave_supabase_aqui
```

**Nota:** Sem essas variáveis, o app funcionará em modo demo/offline usando localStorage.

## Como Adicionar no Vercel

1. No painel do Vercel, clique em seu projeto
2. Vá em **Settings** → **Environment Variables**
3. Clique em **Add New**
4. Para cada variável:
   - **Key**: Nome da variável (ex: `VITE_GEMINI_API_KEY`)
   - **Value**: Valor da variável (sua chave)
   - **Environment**: Selecione todas as opções (Production, Preview, Development)
5. Clique em **Save**
6. **IMPORTANTE:** Após adicionar as variáveis, faça um novo deploy:
   - Vá em **Deployments**
   - Clique nos três pontos do último deployment
   - Selecione **Redeploy**
   - Ou faça um novo push para o GitHub

## Verificação

Após configurar e fazer redeploy, verifique no console do navegador se os erros desapareceram:
- ✅ Não deve aparecer: "GEMINI_API_KEY não configurada"
- ✅ Não deve aparecer: "Supabase não configurado" (se configurou)
- ✅ O app deve funcionar normalmente

## Segurança

⚠️ **NUNCA** commite suas chaves no Git!
- O arquivo `.env.local` está no `.gitignore`
- Use sempre as variáveis de ambiente do Vercel para produção
