-- ============================================
-- BotanicMD - Script de Configuração do Storage
-- ============================================
-- 
-- NOTA: Este script deve ser executado APÓS criar o bucket manualmente
-- O bucket precisa ser criado via Dashboard do Supabase primeiro
-- 
-- INSTRUÇÕES:
-- 1. Crie o bucket "plant-images" via Dashboard (Storage → New bucket)
-- 2. Marque como "Public bucket"
-- 3. Depois execute este script no SQL Editor
-- ============================================

-- ============================================
-- POLÍTICAS DE STORAGE
-- ============================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;

-- Política: Permitir leitura pública do bucket plant-images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'plant-images');

-- Política: Permitir upload apenas para usuários autenticados
-- Os arquivos são organizados por user_id (primeira pasta no path)
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'plant-images' 
  AND auth.role() = 'authenticated'
);

-- Política: Permitir atualização apenas pelo dono do arquivo
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'plant-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
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

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Para verificar as políticas criadas, execute:
-- SELECT * FROM storage.policies WHERE name LIKE '%plant-images%' OR bucket_id = 'plant-images';


