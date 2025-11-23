# ✅ Checklist de Configuração do Supabase

Use este checklist para verificar se o Supabase está totalmente configurado no seu projeto.

## 📋 Configuração Básica

### 1. ✅ Variáveis de Ambiente Configuradas

#### No Vercel (Produção):
- [ ] `VITE_SUPABASE_URL` - URL do projeto Supabase (ex: `https://xxxxx.supabase.co`)
- [ ] `VITE_SUPABASE_KEY` - Chave pública (anon key) do Supabase

#### No `.env.local` (Desenvolvimento):
- [ ] `VITE_SUPABASE_URL` configurada
- [ ] `VITE_SUPABASE_KEY` configurada

**Como obter:**
1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_KEY`

---

## 🗄️ Banco de Dados

### 2. ✅ Tabela `plants` Criada

Execute no SQL Editor do Supabase:

```sql
-- Criar tabela plants
CREATE TABLE IF NOT EXISTS plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  common_name TEXT NOT NULL,
  plant_data JSONB NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_plants_user_id ON plants(user_id);
CREATE INDEX IF NOT EXISTS idx_plants_created_at ON plants(created_at DESC);
```

**Verificação:**
- [ ] Tabela `plants` existe no Database
- [ ] Coluna `id` (UUID, Primary Key)
- [ ] Coluna `user_id` (UUID, Foreign Key para auth.users)
- [ ] Coluna `common_name` (TEXT)
- [ ] Coluna `plant_data` (JSONB)
- [ ] Coluna `image_url` (TEXT)
- [ ] Coluna `created_at` (TIMESTAMP)

---

### 3. ✅ Row Level Security (RLS) Habilitado

```sql
-- Habilitar RLS na tabela plants
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
```

**Verificação:**
- [ ] RLS está habilitado na tabela `plants`

---

### 4. ✅ Políticas RLS Configuradas

Execute todas as políticas no SQL Editor:

```sql
-- Política: Usuários podem ler apenas suas próprias plantas
CREATE POLICY "Users can read own plants"
ON plants FOR SELECT
USING (auth.uid() = user_id);

-- Política: Usuários autenticados podem inserir suas próprias plantas
CREATE POLICY "Users can insert own plants"
ON plants FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar apenas suas próprias plantas
CREATE POLICY "Users can update own plants"
ON plants FOR UPDATE
USING (auth.uid() = user_id);

-- Política: Usuários podem deletar apenas suas próprias plantas
CREATE POLICY "Users can delete own plants"
ON plants FOR DELETE
USING (auth.uid() = user_id);
```

**Verificação:**
- [ ] Política "Users can read own plants" criada
- [ ] Política "Users can insert own plants" criada
- [ ] Política "Users can update own plants" criada
- [ ] Política "Users can delete own plants" criada

**Como verificar:**
1. Vá em **Database** → **Tables** → `plants`
2. Clique na aba **Policies**
3. Deve mostrar 4 políticas

---

## 🗂️ Storage (Armazenamento de Imagens)

### 5. ✅ Bucket `plant-images` Criado

1. Acesse **Storage** no Supabase Dashboard
2. Clique em **New bucket**
3. Configure:
   - **Name**: `plant-images`
   - **Public bucket**: ✅ **Marcado** (público)
   - Clique em **Create bucket**

**Verificação:**
- [ ] Bucket `plant-images` existe
- [ ] Bucket está marcado como **público**

---

### 6. ✅ Políticas de Storage Configuradas

Execute no SQL Editor:

```sql
-- Permitir leitura pública do bucket (já que está marcado como público)
-- Isso geralmente é automático, mas podemos garantir:

-- Política: Permitir leitura pública
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'plant-images');

-- Política: Permitir upload apenas para usuários autenticados
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'plant-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política: Permitir deleção apenas pelo dono do arquivo
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'plant-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Verificação:**
- [ ] Políticas de Storage criadas para o bucket `plant-images`
- [ ] Leitura pública funciona
- [ ] Upload funciona para usuários autenticados
- [ ] Deleção funciona apenas para o dono

**Como verificar:**
1. Vá em **Storage** → `plant-images`
2. Clique na aba **Policies**
3. Deve mostrar políticas de acesso

---

## 🔐 Autenticação

### 7. ✅ Autenticação por Email Habilitada

**Configuração automática** - Email auth já vem habilitado por padrão.

**Verificação:**
- [ ] Email auth está habilitado (verificar em **Authentication** → **Providers**)

---

### 8. ✅ Google OAuth Configurado (Opcional mas Recomendado)

**Importante:** Login com Google requer configuração adicional.

Veja o guia completo em: [SUPABASE_OAUTH_SETUP.md](./SUPABASE_OAUTH_SETUP.md)

**Resumo rápido:**
1. Configurar Google OAuth no Google Cloud Console
2. Habilitar Google provider no Supabase
3. Adicionar Redirect URLs no Supabase

**Verificação:**
- [ ] Google OAuth configurado no Google Cloud Console
- [ ] Google provider habilitado no Supabase
- [ ] Redirect URLs configuradas corretamente

---

## 🔗 URLs de Redirecionamento

### 9. ✅ Redirect URLs Configuradas

No Supabase Dashboard, vá em **Authentication** → **URL Configuration**:

**Site URL:**
- `https://botanicmd.vercel.app` (ou seu domínio)

**Redirect URLs:**
- `https://botanicmd.vercel.app/auth/callback`
- `https://botanicmd.vercel.app/app`
- `http://localhost:3000/auth/callback` (para desenvolvimento)
- `http://localhost:3000/app` (para desenvolvimento)

**Verificação:**
- [ ] Site URL configurada
- [ ] Redirect URLs configuradas para produção e desenvolvimento

---

## 🧪 Teste de Funcionamento

### 10. ✅ Testes Funcionais

Após configurar tudo, teste:

#### Teste de Autenticação:
- [ ] Login com email funciona
- [ ] Cadastro com email funciona
- [ ] Login com Google funciona (se configurado)

#### Teste de Armazenamento:
- [ ] Salvar planta funciona
- [ ] Plantas salvas aparecem no "Meu Jardim"
- [ ] Imagens fazem upload para Supabase Storage
- [ ] Deletar planta funciona

#### Teste de Segurança:
- [ ] Usuário A não vê plantas do usuário B
- [ ] Apenas o dono pode deletar suas plantas
- [ ] Imagens são acessíveis apenas pelo dono

---

## 📝 Resumo

**Configuração Mínima Necessária:**
1. ✅ Variáveis de ambiente (`VITE_SUPABASE_URL` e `VITE_SUPABASE_KEY`)
2. ✅ Tabela `plants` criada
3. ✅ RLS habilitado e políticas configuradas
4. ✅ Bucket `plant-images` criado (público)
5. ✅ Políticas de Storage configuradas

**Configuração Opcional (mas recomendada):**
6. ✅ Google OAuth configurado
7. ✅ Redirect URLs configuradas

---

## 🐛 Problemas Comuns

### Erro: "Supabase não configurado"
- ✅ Verifique se `VITE_SUPABASE_URL` e `VITE_SUPABASE_KEY` estão configuradas
- ✅ Reinicie o servidor após adicionar variáveis de ambiente

### Erro: "relation 'plants' does not exist"
- ✅ Execute o SQL para criar a tabela `plants`
- ✅ Verifique se está conectado ao projeto correto no Supabase

### Erro: "new row violates row-level security policy"
- ✅ Verifique se as políticas RLS estão criadas corretamente
- ✅ Verifique se o usuário está autenticado

### Imagens não fazem upload
- ✅ Verifique se o bucket `plant-images` existe
- ✅ Verifique se o bucket está público
- ✅ Verifique as políticas de Storage

---

## ✅ Status Final

Marque aqui quando tudo estiver configurado:

- [ ] Todas as variáveis de ambiente configuradas
- [ ] Tabela `plants` criada
- [ ] RLS habilitado e políticas criadas
- [ ] Bucket `plant-images` criado
- [ ] Políticas de Storage configuradas
- [ ] Testes funcionais passaram
- [ ] **🎉 Supabase totalmente configurado!**

---

**Data de Criação:** ${new Date().toLocaleDateString('pt-BR')}


