import { PlantData } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import { uploadImageToStorage, deleteImageFromStorage } from './storageUploadService';

export interface SavedPlant {
  data: PlantData;
  image: string; // URL da imagem ou base64 (fallback)
}

class StorageService {
  private useLocalStorage: boolean = false;

  constructor() {
    // Se o Supabase não estiver configurado (chaves padrão), força LocalStorage
    if (!isSupabaseConfigured) {
       console.warn('Supabase credentials missing. Using localStorage.');
       this.useLocalStorage = true;
    }
  }

  private getLocalPlants(): SavedPlant[] {
    const stored = localStorage.getItem('verdesense_garden');
    return stored ? JSON.parse(stored) : [];
  }

  private setLocalPlants(plants: SavedPlant[]) {
    localStorage.setItem('verdesense_garden', JSON.stringify(plants));
  }

  private async getUser() {
    if (!isSupabaseConfigured) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  // --- Métodos Públicos ---

  async getPlants(): Promise<SavedPlant[]> {
    // SEMPRE tenta usar Supabase se estiver configurado, mesmo que useLocalStorage seja true
    if (this.useLocalStorage && !isSupabaseConfigured) {
      return this.getLocalPlants();
    }

    try {
      const user = await this.getUser();
      if (!user) {
        console.log('⚠️ Usuário não logado, retornando plantas do localStorage');
        return this.getLocalPlants();
      }

      console.log('📋 Buscando plantas do Supabase para usuário:', user.id);
      const { data, error } = await supabase
        .from('plants')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar plantas:', error);
        throw error;
      }

      console.log(`✅ Encontradas ${data?.length || 0} plantas no Supabase`);

      // Mapeia do formato do banco para o formato do app
      const mappedPlants = data.map((row: any) => {
        const plantData = typeof row.plant_data === 'string' ? JSON.parse(row.plant_data) : row.plant_data;
        const imageUrl = row.image_url || '';
        
        console.log('🌿 Planta:', {
          id: row.id,
          name: plantData?.commonName,
          hasImage: !!imageUrl,
          imageType: imageUrl?.startsWith('http') ? 'URL' : imageUrl?.startsWith('data:') ? 'base64' : 'vazio'
        });
        
        return {
          data: plantData,
          image: imageUrl // URL do Supabase Storage ou base64 (fallback)
        };
      });

      return mappedPlants;

    } catch (error) {
      console.error('❌ Erro ao buscar plantas do Supabase:', error);
      // Fallback local apenas se não houver usuário logado
      const user = await this.getUser();
      if (!user) {
        return this.getLocalPlants();
      }
      // Se houver usuário logado mas erro no Supabase, retorna array vazio
      // para não mostrar dados locais incorretos
      return [];
    }
  }

  async savePlant(plant: SavedPlant): Promise<SavedPlant[]> {
    // SEMPRE tenta usar Supabase se estiver configurado, mesmo que useLocalStorage seja true
    // O useLocalStorage só deve ser usado se Supabase não estiver configurado
    if (this.useLocalStorage && !isSupabaseConfigured) {
        const current = this.getLocalPlants();
        const updated = [plant, ...current.filter(p => p.data.id !== plant.data.id)];
        this.setLocalPlants(updated);
        return updated;
    }

    try {
      const user = await this.getUser();
      if (!user) {
        // Se não estiver logado, salva local
        console.log('⚠️ Usuário não logado, salvando no localStorage');
        const current = this.getLocalPlants();
        const updated = [plant, ...current.filter(p => p.data.id !== plant.data.id)];
        this.setLocalPlants(updated);
        return updated;
      }

      console.log('💾 Salvando planta no Supabase para usuário:', user.id);

      // Tenta fazer upload da imagem para Supabase Storage
      let imageUrl = plant.image;
      
      console.log('📸 Processando imagem da planta:', {
        hasImage: !!plant.image,
        isBase64: plant.image?.startsWith('data:'),
        isUrl: plant.image?.startsWith('http'),
        imageLength: plant.image?.length || 0
      });
      
      // Se a imagem for base64 (começa com data: ou não é uma URL http/https)
      if (plant.image && !plant.image.startsWith('http') && !plant.image.startsWith('/')) {
        try {
          console.log('⬆️ Fazendo upload da imagem para Supabase Storage...');
          const uploadedUrl = await uploadImageToStorage(
            plant.image,
            user.id,
            plant.data.id
          );
          
          if (uploadedUrl) {
            console.log('✅ Imagem enviada com sucesso:', uploadedUrl);
            imageUrl = uploadedUrl;
          } else {
            console.warn('⚠️ Upload de imagem falhou. Tentando salvar base64 como fallback.');
            // Tenta salvar base64 se for pequeno (< 1MB)
            if (plant.image.length < 1000000) {
              imageUrl = plant.image;
              console.log('💾 Salvando base64 como fallback (tamanho aceitável)');
            } else {
              imageUrl = '';
              console.warn('❌ Base64 muito grande, não será salvo');
            }
          }
        } catch (uploadError) {
          console.error('❌ Erro ao fazer upload da imagem:', uploadError);
          // Tenta salvar base64 se for pequeno
          if (plant.image.length < 1000000) {
            imageUrl = plant.image;
            console.log('💾 Salvando base64 como fallback após erro');
          } else {
            imageUrl = '';
            console.warn('❌ Base64 muito grande, não será salvo');
          }
        }
      } else if (plant.image) {
        console.log('✅ Imagem já é uma URL, usando diretamente:', plant.image);
      }

      const plantRecord = {
        id: plant.data.id,
        user_id: user.id,
        common_name: plant.data.commonName,
        plant_data: plant.data,
        image_url: imageUrl // URL do Supabase Storage ou base64 (fallback)
      };

      console.log('💾 Salvando registro no banco:', {
        id: plantRecord.id,
        common_name: plantRecord.common_name,
        hasImage: !!plantRecord.image_url,
        imageType: plantRecord.image_url?.startsWith('http') ? 'URL' : 'base64'
      });

      const { error } = await supabase
        .from('plants')
        .upsert(plantRecord);

      if (error) {
        console.error('❌ Erro ao salvar no Supabase:', error);
        throw error;
      }

      console.log('✅ Planta salva com sucesso no Supabase');
      const savedPlants = await this.getPlants();
      console.log('📋 Total de plantas salvas:', savedPlants.length);
      return savedPlants;

    } catch (error) {
      console.error('❌ Erro ao salvar no Supabase:', error);
      // Fallback local apenas se não houver usuário logado
      const user = await this.getUser();
      if (!user) {
        console.log('💾 Usando fallback localStorage (usuário não logado)');
        const current = this.getLocalPlants();
        const updated = [plant, ...current.filter(p => p.data.id !== plant.data.id)];
        this.setLocalPlants(updated);
        return updated;
      }
      // Se houver usuário logado mas erro no Supabase, relança o erro
      throw error;
    }
  }

  async deletePlant(id: string): Promise<SavedPlant[]> {
    if (this.useLocalStorage) {
        const current = this.getLocalPlants();
        const updated = current.filter(p => p.data.id !== id);
        this.setLocalPlants(updated);
        return updated;
    }

    try {
      const user = await this.getUser();
      if (!user) {
         const current = this.getLocalPlants();
         const updated = current.filter(p => p.data.id !== id);
         this.setLocalPlants(updated);
         return updated;
      }

      // Primeiro, busca a planta para obter a URL da imagem
      const { data: plantToDelete } = await supabase
        .from('plants')
        .select('image_url')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      // Remove a imagem do storage se existir
      if (plantToDelete?.image_url && plantToDelete.image_url.startsWith('http')) {
        await deleteImageFromStorage(plantToDelete.image_url);
      }

      // Remove a planta do banco de dados
      const { error } = await supabase
        .from('plants')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Segurança extra

      if (error) throw error;
      
      return await this.getPlants();

    } catch (error) {
      console.error('Supabase Delete Error:', error);
       const current = this.getLocalPlants();
       const updated = current.filter(p => p.data.id !== id);
       this.setLocalPlants(updated);
       return updated;
    }
  }
}

export const storage = new StorageService();