
/**
 * Busca imagem de planta na Wikipedia
 */
export const fetchPlantImage = async (query: string): Promise<string | null> => {
  try {
    // 1. Buscar a página correta na Wikipedia
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.query?.search?.length) return null;

    const title = searchData.query.search[0].title;

    // 2. Pegar a imagem da página encontrada
    const imageUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=1024&origin=*`;
    const imageRes = await fetch(imageUrl);
    const imageData = await imageRes.json();

    const pages = imageData.query?.pages;
    if (!pages) return null;

    const pageId = Object.keys(pages)[0];
    const source = pages[pageId]?.thumbnail?.source;

    return source || null;
  } catch (error) {
    console.error("Erro ao buscar imagem na Wiki:", error);
    return null;
  }
};

/**
 * Comprime uma imagem para reduzir o tamanho do arquivo
 * @param file Arquivo de imagem original
 * @param maxWidth Largura máxima (padrão: 1920px)
 * @param maxHeight Altura máxima (padrão: 1920px)
 * @param quality Qualidade JPEG (0-1, padrão: 0.8)
 * @returns File comprimido ou original se já for pequeno
 */
export const compressImage = async (
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.8
): Promise<File> => {
  // Se o arquivo já for pequeno (< 500KB), retorna sem compressão
  if (file.size < 500 * 1024) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calcula novas dimensões mantendo proporção
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        // Cria canvas para redimensionar
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível criar contexto do canvas'));
          return;
        }

        // Redesenha imagem no canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Converte para blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Falha ao comprimir imagem'));
              return;
            }

            // Cria novo arquivo com o blob comprimido
            const compressedFile = new File([blob], file.name, {
              type: file.type || 'image/jpeg',
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          file.type || 'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  });
};

/**
 * Converte um File para base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove o prefixo data:image/...;base64,
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Converte uma string base64 para Blob
 */
export const base64ToBlob = (base64: string, mimeType: string = 'image/jpeg'): Blob => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};
