# 📅 Migração: Adicionar Campo `date_modified` ao Blog

Este guia explica como adicionar o campo `date_modified` à tabela `blog_posts` no Supabase.

## 🎯 Objetivo

Adicionar o campo `date_modified` para rastrear quando cada post foi modificado pela última vez, melhorando o SEO e permitindo que os mecanismos de busca saibam quando o conteúdo foi atualizado.

## 📋 Passo a Passo

### 1. Executar Script SQL no Supabase

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral)
4. Clique em **New Query**
5. Copie e cole o conteúdo do arquivo `scripts/add-date-modified-to-blog-posts.sql`
6. Clique em **Run** (ou pressione `Ctrl+Enter`)

**O que o script faz:**
- ✅ Adiciona a coluna `date_modified` se não existir
- ✅ Inicializa `date_modified` com `created_at` para posts existentes
- ✅ Cria um trigger que atualiza `date_modified` automaticamente quando um post é modificado

### 2. Executar Script de Migração de Dados

Após executar o SQL, rode o script Node.js para garantir que todos os posts tenham `date_modified`:

```bash
npm run migrate:blog-date-modified
```

**O que o script faz:**
- ✅ Verifica se a coluna existe
- ✅ Atualiza posts que não têm `date_modified` definido
- ✅ Usa `created_at` como base se `date_modified` for NULL

### 3. Verificar Resultado

Após executar ambos os scripts, você pode verificar no Supabase:

1. Vá em **Table Editor**
2. Selecione a tabela `blog_posts`
3. Verifique se a coluna `date_modified` existe e tem valores

## 🔍 Verificação Manual

Você pode verificar se tudo funcionou corretamente executando esta query no SQL Editor:

```sql
SELECT 
  id, 
  title, 
  created_at, 
  date_modified,
  CASE 
    WHEN date_modified IS NULL THEN '❌ Faltando'
    WHEN date_modified = created_at THEN '✅ Inicializado'
    ELSE '✅ Modificado'
  END as status
FROM blog_posts
ORDER BY id;
```

## ⚠️ Troubleshooting

### Erro: "column date_modified does not exist"

**Solução:** Execute primeiro o script SQL (`scripts/add-date-modified-to-blog-posts.sql`) antes de rodar a migração.

### Erro: "permission denied for table blog_posts"

**Solução:** Verifique as políticas RLS (Row Level Security) da tabela. Você pode precisar ajustar temporariamente as políticas para permitir updates.

### Erro: Variáveis de ambiente não encontradas

**Solução:** Certifique-se de que o arquivo `.env.local` existe e contém:
```
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_KEY=sua_key_aqui
```

## 📝 Notas Importantes

1. **Trigger Automático:** O trigger criado pelo script SQL atualiza `date_modified` automaticamente sempre que um post é modificado. Não é necessário atualizar manualmente.

2. **Formato:** O campo `date_modified` é do tipo `TIMESTAMP WITH TIME ZONE` e armazena a data/hora em UTC.

3. **SEO:** O campo `dateModified` é usado no structured data (JSON-LD) para melhorar a indexação nos mecanismos de busca.

4. **Backward Compatibility:** O código foi atualizado para funcionar mesmo se `date_modified` não existir (usa `date` como fallback).

## ✅ Checklist

- [ ] Script SQL executado no Supabase
- [ ] Script de migração executado (`npm run migrate:blog-date-modified`)
- [ ] Verificação manual realizada
- [ ] Todos os posts têm `date_modified` definido
- [ ] Trigger funcionando (teste modificando um post)

## 🚀 Próximos Passos

Após a migração, o campo `dateModified` será:
- ✅ Incluído automaticamente ao buscar posts
- ✅ Atualizado automaticamente quando um post é modificado
- ✅ Usado no structured data para SEO
- ✅ Incluído no sitemap quando disponível

---

**Desenvolvido com ♥ por Egeolabs**

