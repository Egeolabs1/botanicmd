# 🔧 Solução: RLS Bloqueando Migração de Slugs

## ❌ Problema Identificado

O script de migração está falhando porque:
- A tabela `blog_posts` tem **RLS (Row Level Security) habilitado**
- A política de UPDATE requer `auth.role() = 'authenticated'`
- O script usa a chave **anon** (pública), que não tem role 'authenticated'

## ✅ Solução Rápida

Execute este SQL no **Supabase Dashboard → SQL Editor**:

```sql
-- Permitir UPDATE público temporariamente (para migração)
DROP POLICY IF EXISTS "Public can update blog posts" ON blog_posts;
CREATE POLICY "Public can update blog posts"
ON blog_posts FOR UPDATE
TO public
USING (true)
WITH CHECK (true);
```

**Ou use o arquivo:** `scripts/fix-blog-posts-rls.sql`

## 📋 Passos Completos

### 1. Executar SQL para permitir UPDATE público

No Supabase Dashboard:
1. Vá em **SQL Editor**
2. Cole o SQL acima
3. Execute

### 2. Executar migração novamente

```bash
npm run migrate:blog-slugs
```

### 3. (Opcional) Remover política pública após migração

Se quiser manter segurança, após a migração você pode remover a política pública:

```sql
-- Remover política pública
DROP POLICY IF EXISTS "Public can update blog posts" ON blog_posts;

-- A política "Authenticated users can update blog posts" já existe
-- e continuará funcionando para usuários autenticados
```

## 🔍 Verificar se Funcionou

Execute o script de teste:

```bash
node scripts/test-blog-slugs.mjs
```

Deve mostrar:
- ✅ Posts com slug: 12
- ⚠️ Posts sem slug: 0

## 💡 Alternativa: Usar Service Role Key

Se preferir não permitir UPDATE público, você pode usar a **service_role key** no script:

1. Obtenha a service_role key no Supabase Dashboard (Settings → API)
2. Use no script (mas **NUNCA** exponha no cliente!)

---

**Após executar o SQL acima, execute novamente:**
```bash
npm run migrate:blog-slugs
```

