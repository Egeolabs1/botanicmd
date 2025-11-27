# 📝 Como Migrar o Blog para Supabase

Este guia explica como configurar o blog para usar o Supabase ao invés do localStorage, garantindo que os posts não sejam perdidos quando o app for atualizado.

## ✅ O que foi implementado

1. ✅ Migration SQL criada (`supabase/migrations/20250127000000_create_blog_posts_table.sql`)
2. ✅ `blogService.ts` atualizado para usar Supabase com fallback para localStorage
3. ✅ Componentes atualizados para usar métodos assíncronos
4. ✅ Políticas RLS configuradas (público para leitura, autenticado para escrita)

## 🚀 Passos para Ativar

### 1. Criar a Tabela no Supabase

Execute a migration SQL no Supabase Dashboard:

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Clique em **New Query**
5. Copie o conteúdo do arquivo `supabase/migrations/20250127000000_create_blog_posts_table.sql`
6. Cole e execute

**OU** usando CLI:

```bash
npx supabase db push
```

### 2. Verificar se a Tabela foi Criada

No Supabase Dashboard:
- Vá em **Database** → **Tables**
- Verifique se a tabela `blog_posts` existe com as seguintes colunas:
  - `id` (SERIAL PRIMARY KEY)
  - `title` (TEXT)
  - `excerpt` (TEXT)
  - `content` (TEXT)
  - `category` (TEXT)
  - `author` (TEXT)
  - `image_url` (TEXT)
  - `date` (TEXT)
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)
  - `created_by` (UUID, opcional)

### 3. Verificar Políticas RLS

No Supabase Dashboard:
- Vá em **Database** → **Tables** → `blog_posts`
- Clique em **Policies**
- Verifique se existem as políticas:
  - ✅ "Anyone can read blog posts" (SELECT)
  - ✅ "Authenticated users can create blog posts" (INSERT)
  - ✅ "Authenticated users can update blog posts" (UPDATE)
  - ✅ "Authenticated users can delete blog posts" (DELETE)

## 🔄 Migração Automática

O sistema faz migração automática na primeira vez:

1. **Quando a tabela está vazia**: Os posts seed são automaticamente inseridos
2. **Fallback inteligente**: Se o Supabase falhar, usa localStorage automaticamente
3. **Compatibilidade total**: Funciona mesmo sem Supabase configurado

## ⚠️ Importante

### Se o Supabase NÃO estiver configurado:
- O blog continuará usando `localStorage`
- Posts serão salvos localmente no navegador
- Dados podem ser perdidos se o localStorage for limpo

### Se o Supabase ESTIVER configurado:
- O blog usará o banco de dados do Supabase
- Posts serão salvos permanentemente
- Dados persistem mesmo após atualizações do app
- Posts são compartilhados entre todos os usuários

## 🧪 Como Testar

1. **Criar um novo post**:
   - Acesse o Admin Dashboard
   - Vá em "Blog Content"
   - Clique em "New Post" ou "Generate with AI"
   - Salve o post

2. **Verificar no Supabase**:
   - Vá em **Database** → **Tables** → `blog_posts`
   - Clique em **View Data**
   - Você deve ver o novo post lá

3. **Recarregar a página**:
   - O post deve aparecer após recarregar
   - Se estiver usando Supabase, o post persiste mesmo após limpar o localStorage

## 🔍 Troubleshooting

### Posts não aparecem após migração

**Causa**: A tabela pode estar vazia e a migração automática falhou.

**Solução**:
1. Verifique os logs do console do navegador
2. Se necessário, insira os posts seed manualmente:
   - Vá em **Database** → **Tables** → `blog_posts`
   - Clique em **Insert row**
   - Adicione os dados de um post seed

### Erro: "Tabela blog_posts não existe"

**Causa**: A migration SQL não foi executada.

**Solução**:
1. Execute a migration SQL no Supabase Dashboard
2. Ou execute: `npx supabase db push`

### Erro: "permission denied for table blog_posts"

**Causa**: Políticas RLS não foram criadas corretamente.

**Solução**:
1. Verifique se as políticas RLS existem (veja passo 3 acima)
2. Se não existirem, execute novamente a migration SQL

### Posts continuam sendo salvos no localStorage

**Causa**: O Supabase pode não estar configurado corretamente.

**Solução**:
1. Verifique se `VITE_SUPABASE_URL` e `VITE_SUPABASE_KEY` estão configuradas
2. Verifique no console do navegador se há mensagens de erro
3. O sistema automaticamente usa localStorage como fallback se o Supabase falhar

## 📊 Estrutura da Tabela

```sql
CREATE TABLE blog_posts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  author TEXT NOT NULL,
  image_url TEXT,
  date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
```

## 🎯 Próximos Passos (Opcional)

Se quiser melhorar ainda mais:

1. **Adicionar verificação de admin**: Modificar as políticas RLS para permitir criar/editar/deletar apenas para usuários com role de admin
2. **Adicionar rastreamento de visualizações**: Criar uma tabela separada para rastrear visualizações de posts
3. **Adicionar tags**: Criar uma tabela de tags e relacionar com posts
4. **Upload de imagens**: Usar Supabase Storage para armazenar imagens dos posts

---

**✅ Após executar a migration, os posts do blog serão salvos permanentemente no Supabase e não serão mais perdidos quando o app for atualizado!**

