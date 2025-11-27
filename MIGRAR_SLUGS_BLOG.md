# 📝 Migração de Slugs para Posts do Blog

## ✅ O que foi implementado

Todas as melhorias de SEO foram implementadas, incluindo:

1. ✅ **URLs únicas para cada post** (`/blog/:slug`)
2. ✅ **Geração automática de slugs** para novos posts
3. ✅ **Slugs dinâmicos** para posts existentes (gerados na leitura)
4. ✅ **Script de migração** para atualizar posts no banco de dados

## 🔄 Status Atual dos Posts Existentes

### Posts no LocalStorage
- ✅ **Já funcionam automaticamente!**
- Os posts recebem slugs dinamicamente quando são carregados
- Não é necessário fazer nada

### Posts no Supabase
- ⚠️ **Precisam de migração** para salvar slugs permanentemente
- Atualmente recebem slugs dinamicamente, mas não são salvos no banco
- Execute a migração abaixo para salvar slugs permanentemente

## 🚀 Como Migrar Posts Existentes no Supabase

### Passo 1: Adicionar coluna `slug` na tabela

Execute este SQL no Supabase Dashboard (SQL Editor):

```sql
-- Adiciona a coluna slug se não existir
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Cria índice único para garantir slugs únicos
CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug) WHERE slug IS NOT NULL;

-- Cria índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug_lookup ON blog_posts(slug);
```

Ou use o arquivo: `scripts/add-slug-to-blog-posts.sql`

### Passo 1.5: Configurar RLS (Row Level Security) ⚠️ IMPORTANTE

**Se a tabela `blog_posts` tiver RLS habilitado**, você precisa adicionar políticas para permitir UPDATE:

Execute este SQL no Supabase Dashboard:

```sql
-- Permitir leitura pública
DROP POLICY IF EXISTS "Public can read blog posts" ON blog_posts;
CREATE POLICY "Public can read blog posts"
ON blog_posts FOR SELECT
TO public
USING (true);

-- Permitir UPDATE público (para migração)
DROP POLICY IF EXISTS "Public can update blog posts" ON blog_posts;
CREATE POLICY "Public can update blog posts"
ON blog_posts FOR UPDATE
TO public
USING (true)
WITH CHECK (true);
```

Ou use o arquivo: `scripts/fix-blog-posts-rls.sql`

**💡 Dica:** Se a tabela não tiver RLS habilitado, pule este passo.

### Passo 2: Configurar variáveis de ambiente

O script precisa das credenciais do Supabase. Configure de uma das formas:

**Opção A: Arquivo .env.local (Recomendado)**
1. Crie ou edite o arquivo `.env.local` na raiz do projeto
2. Adicione:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_KEY=sua_chave_anon_public
```

**Opção B: Variáveis de ambiente do sistema (PowerShell)**
```powershell
$env:VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
$env:VITE_SUPABASE_KEY="sua_chave"
npm run migrate:blog-slugs
```

**Opção C: Passar diretamente no comando**
```bash
VITE_SUPABASE_URL=... VITE_SUPABASE_KEY=... npm run migrate:blog-slugs
```

### Passo 3: Executar migração de dados

Execute o script de migração:

```bash
npm run migrate:blog-slugs
```

Este script irá:
- Buscar todos os posts sem slug
- Gerar slugs únicos para cada post
- Atualizar os posts no banco de dados

### Passo 4: Verificar

Após a migração, verifique no Supabase:
- Todos os posts devem ter a coluna `slug` preenchida
- Os slugs devem ser únicos e amigáveis

## 📋 O que acontece automaticamente

### Para novos posts:
- ✅ Slugs são gerados automaticamente ao criar
- ✅ Slugs são salvos no banco de dados
- ✅ URLs funcionam imediatamente

### Para posts existentes (sem migração):
- ✅ Slugs são gerados dinamicamente ao carregar
- ✅ URLs funcionam corretamente
- ⚠️ Slugs não são salvos no banco (só em memória)

### Para posts existentes (após migração):
- ✅ Slugs são salvos permanentemente no banco
- ✅ Melhor performance (não precisa gerar toda vez)
- ✅ URLs consistentes e indexáveis

## 🔍 Verificação

### Testar localmente:
1. Acesse `/blog` - deve listar todos os posts
2. Clique em um post - deve abrir em `/blog/[slug]`
3. Verifique a URL - deve ser amigável (ex: `/blog/the-ultimate-guide-to-indoor-plant-care-1`)

### Verificar no Supabase:
```sql
-- Ver posts com slugs
SELECT id, title, slug FROM blog_posts ORDER BY id;
```

### Verificar sitemap:
- Acesse: `https://botanicmd.com/sitemap.xml`
- Deve incluir URLs de todos os posts

## ⚠️ Importante

- **Posts no localStorage**: Funcionam automaticamente, não precisa fazer nada
- **Posts no Supabase**: Execute a migração uma vez para salvar slugs permanentemente
- **Novos posts**: Já salvam slugs automaticamente

## 🆘 Problemas Comuns

### Erro: "VITE_SUPABASE_URL e VITE_SUPABASE_KEY devem estar configurados"
- **Solução**: 
  1. Verifique se o arquivo `.env.local` existe na raiz do projeto
  2. Verifique se as variáveis estão escritas corretamente (sem espaços)
  3. Veja o exemplo em `env.local.example`
  4. Ou defina as variáveis de ambiente do sistema antes de executar

### Erro: "column slug does not exist"
- **Solução**: Execute o Passo 1 (adicionar coluna) no Supabase SQL Editor

### Erro: "relation blog_posts does not exist"
- **Solução**: A tabela blog_posts não existe. Crie-a primeiro ou verifique se está usando o banco correto

### Erro: "duplicate key value violates unique constraint"
- **Solução**: O script detecta e corrige slugs duplicados automaticamente. Se persistir, verifique o índice único no banco

### Posts não aparecem no sitemap
- **Solução**: 
  - Verifique se o endpoint `/api/sitemap` está funcionando
  - Verifique se os posts têm slugs gerados
  - Verifique se o sitemap está sendo gerado corretamente

## 📚 Arquivos Relacionados

- `utils/slug.ts` - Função para gerar slugs
- `services/blogService.ts` - Lógica de geração automática de slugs
- `scripts/migrate-blog-slugs.mjs` - Script de migração
- `scripts/add-slug-to-blog-posts.sql` - SQL para adicionar coluna

