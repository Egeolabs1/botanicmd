import { supabase, isSupabaseConfigured } from './supabase';
import { compressImage, base64ToBlob } from './imageService';

const BUCKET_NAME = 'plant-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Upload de imagem para Supabase Storage
 * @param imageData String base64 ou File com a imagem
 * @param userId ID do usuário para criar pasta organizada
 * @param plantId ID da planta (opcional, usado no nome do arquivo)
 * @returns URL pública da imagem ou null em caso de erro
 */
export const uploadImageToStorage = async (
  imageData: string | File,
  userId: string,
  plantId?: string
): Promise<string | null> => {
  if (!isSupabaseConfigured) {
    console.warn('Supabase não configurado. Upload de imagem não disponível.');
    return null;
  }

  try {
    let file: File;
    let fileName: string;

    // Converte base64 para File se necessário
    if (typeof imageData === 'string') {
      // Assume que é base64 (data URI ou base64 puro)
      const base64 = imageData.includes(',') ? imageData.split(',')[1] : imageData;
      const mimeType = imageData.includes('data:') 
        ? imageData.split(';')[0].split(':')[1] 
        : 'image/jpeg';
      
      const blob = base64ToBlob(base64, mimeType);
      fileName = plantId 
        ? `${userId}/${plantId}-${Date.now()}.jpg`
        : `${userId}/${Date.now()}.jpg`;
      file = new File([blob], fileName, { type: mimeType });
    } else {
      file = imageData;
      fileName = plantId 
        ? `${userId}/${plantId}-${Date.now()}.${file.name.split('.').pop() || 'jpg'}`
        : `${userId}/${Date.now()}-${file.name}`;
    }

    // Valida tamanho do arquivo
    if (file.size > MAX_FILE_SIZE) {
      console.warn(`Arquivo muito grande (${file.size} bytes). Comprimindo...`);
      file = await compressImage(file);
    }

    // Compressão adicional se ainda for grande
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('Arquivo muito grande mesmo após compressão. Tente uma imagem menor.');
    }

    // Faz upload para Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false, // Não sobrescreve arquivos existentes
      });

    if (error) {
      // Se o bucket não existir, tenta criar e fazer upload novamente
      if (error.message.includes('bucket') || error.message.includes('not found')) {
        console.warn('Bucket não encontrado. Tentando criar bucket...');
        // Nota: Criar bucket requer permissões de admin. Isso deve ser feito manualmente no Supabase Dashboard
        throw new Error('Bucket de armazenamento não configurado. Configure o bucket "plant-images" no Supabase Dashboard.');
      }
      throw error;
    }

    // Obtém URL pública da imagem
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return publicUrl;

  } catch (error: any) {
    console.error('Erro ao fazer upload da imagem:', error);
    throw new Error(`Falha ao fazer upload da imagem: ${error.message}`);
  }
};

/**
 * Remove uma imagem do Supabase Storage
 * @param imageUrl URL da imagem a ser removida
 */
export const deleteImageFromStorage = async (imageUrl: string): Promise<void> => {
  if (!isSupabaseConfigured) {
    console.warn('Supabase não configurado. Remoção de imagem não disponível.');
    return;
  }

  try {
    // Extrai o path do arquivo da URL
    // Exemplo: https://[project].supabase.co/storage/v1/object/public/plant-images/user123/plant456.jpg
    const urlParts = imageUrl.split('/');
    const bucketIndex = urlParts.indexOf(BUCKET_NAME);
    
    if (bucketIndex === -1) {
      throw new Error('URL de imagem inválida');
    }

    const filePath = urlParts.slice(bucketIndex + 1).join('/');

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      throw error;
    }

  } catch (error: any) {
    console.error('Erro ao remover imagem:', error);
    // Não lança erro para não quebrar o fluxo principal
  }
};

/**
 * Verifica se o bucket de armazenamento está configurado
 */
export const checkStorageBucket = async (): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;

  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error('Erro ao listar buckets:', error);
      return false;
    }
    return data.some(bucket => bucket.name === BUCKET_NAME);
  } catch (error) {
    console.error('Erro ao verificar bucket:', error);
    return false;
  }
};

