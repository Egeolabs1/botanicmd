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
    if (this.useLocalStorage) return this.getLocalPlants();

    try {
      const user = await this.getUser();
      if (!user) return this.getLocalPlants();

      const { data, error } = await supabase
        .from('plants')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Mapeia do formato do banco para o formato do app
      return data.map((row: any) => ({
        data: typeof row.plant_data === 'string' ? JSON.parse(row.plant_data) : row.plant_data,
        image: row.image_url || '' // Em um app real, image_url seria uma URL do Supabase Storage
      }));

    } catch (error) {
      console.error('Supabase Error:', error);
      return this.getLocalPlants();
    }
  }

  async savePlant(plant: SavedPlant): Promise<SavedPlant[]> {
    if (this.useLocalStorage) {
        const current = this.getLocalPlants();
        const updated = [plant, ...current.filter(p => p.data.id !== plant.data.id)];
        this.setLocalPlants(updated);
        return updated;
    }

    try {
      const user = await this.getUser();
      if (!user) {
        // Se não estiver logado, salva local
        const current = this.getLocalPlants();
        const updated = [plant, ...current.filter(p => p.data.id !== plant.data.id)];
        this.setLocalPlants(updated);
        return updated;
      }

      // Tenta fazer upload da imagem para Supabase Storage
      let imageUrl = plant.image;
      
      // Se a imagem for base64 (começa com data: ou não é uma URL http/https)
      if (plant.image && !plant.image.startsWith('http') && !plant.image.startsWith('/')) {
        try {
          const uploadedUrl = await uploadImageToStorage(
            plant.image,
            user.id,
            plant.data.id
          );
          
          if (uploadedUrl) {
            imageUrl = uploadedUrl;
          } else {
            // Se o upload falhar, não salva base64 no banco (muito grande)
            // Em vez disso, tenta novamente ou usa placeholder
            if (process.env.NODE_ENV === 'development') {
              console.warn('Upload de imagem falhou. A imagem não será salva no banco de dados.');
            }
            // Usa um placeholder ou remove a imagem
            imageUrl = ''; // Remove base64 para evitar problemas de tamanho
          }
        } catch (uploadError) {
          // Log apenas em desenvolvimento
          if (process.env.NODE_ENV === 'development') {
            console.error('Erro ao fazer upload da imagem:', uploadError);
          }
          // Não salva base64 no banco, remove a referência
          imageUrl = '';
        }
      }

      const { error } = await supabase
        .from('plants')
        .upsert({
          id: plant.data.id,
          user_id: user.id,
          common_name: plant.data.commonName,
          plant_data: plant.data,
          image_url: imageUrl // URL do Supabase Storage ou base64 (fallback)
        });

      if (error) throw error;
      
      return await this.getPlants();

    } catch (error) {
      console.error('Supabase Save Error:', error);
      // Fallback local
      const current = this.getLocalPlants();
      const updated = [plant, ...current.filter(p => p.data.id !== plant.data.id)];
      this.setLocalPlants(updated);
      return updated;
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