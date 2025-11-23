# Configuração de Variáveis de Ambiente no Vercel

## 🔒 Segurança: API Keys Protegidas

Este projeto usa **Vercel API Routes** para manter as chaves de API seguras no servidor. As chaves **NÃO** são expostas no código do cliente.

## Variáveis de Ambiente Necessárias

### 1. Gemini API Key (OBRIGATÓRIA para funcionalidades de IA)

**⚠️ IMPORTANTE: Use o nome SEM prefixo `VITE_` para manter a chave segura no servidor!**

1. Acesse o [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione a variável:
   - **Key**: `GEMINI_API_KEY` (SEM prefixo VITE_)
   - **Value**: Sua chave da API Gemini (obtenha em https://ai.google.dev/)
   - **Environment**: Marque todas (Production, Preview, Development)
5. Clique em **Save**

**Por que sem `VITE_`?**
- Variáveis com prefixo `VITE_` são expostas no bundle do cliente (inseguro!)
- Variáveis sem prefixo ficam apenas no servidor (seguro!)
- A API route `/api/gemini.ts` usa `process.env.GEMINI_API_KEY` (servidor)

### 2. Supabase (Opcional - para autenticação e armazenamento)

Se você quiser usar autenticação e armazenamento em nuvem:

1. No mesmo local (Settings → Environment Variables), adicione:
   - **Key**: `VITE_SUPABASE_URL`
   - **Value**: URL do seu projeto Supabase
   - **Environment**: Todas

2. Adicione também:
   - **Key**: `VITE_SUPABASE_KEY`
   - **Value**: Chave pública (anon key) do Supabase
   - **Environment**: Todas

**Nota**: As chaves do Supabase podem usar `VITE_` porque são chaves públicas (anon key), não secretas.

## Após Configurar

1. **Faça um novo deploy** ou **Redeploy** no Vercel
2. As variáveis serão injetadas no build
3. A API route `/api/gemini` terá acesso seguro à `GEMINI_API_KEY`

## Verificação

Após o deploy, verifique se está funcionando:
- Abra o console do navegador
- Não deve aparecer mais o erro "Gemini API não configurada"
- As funcionalidades de IA devem funcionar normalmente

## Troubleshooting

### Erro: "API Gemini não configurada no servidor"
- Verifique se adicionou `GEMINI_API_KEY` (sem `VITE_`) no Vercel
- Verifique se fez redeploy após adicionar a variável
- Verifique se marcou todos os ambientes (Production, Preview, Development)

### Erro: "Failed to fetch" ao usar IA
- Verifique se a API route `/api/gemini.ts` foi deployada corretamente
- Verifique os logs do Vercel para erros na API route
