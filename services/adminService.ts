
import { User, PlanType } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

const USERS_STORAGE_KEY = 'botanicmd_users_db';

// Mock users for demonstration
const seedUsers: User[] = [
  {
    id: 'user_1',
    name: 'Alice Gardener',
    email: 'alice@example.com',
    plan: 'pro',
    usageCount: 45,
    maxUsage: -1
  },
  {
    id: 'user_2',
    name: 'Bob Planter',
    email: 'bob@example.com',
    plan: 'free',
    usageCount: 2,
    maxUsage: 3
  },
  {
    id: 'user_3',
    name: 'Charlie Green',
    email: 'charlie@example.com',
    plan: 'free',
    usageCount: 3,
    maxUsage: 3
  },
  {
    id: 'user_admin',
    name: 'Admin User',
    email: 'admin@botanicmd.com',
    plan: 'pro',
    usageCount: 0,
    maxUsage: -1
  }
];

class AdminService {
  /**
   * Busca usuários do Supabase (usuários reais) ou localStorage (fallback)
   */
  async getUsers(): Promise<User[]> {
    // Se Supabase não está configurado, usa localStorage
    if (!isSupabaseConfigured) {
      return this.getLocalUsers();
    }

    try {
      // Buscar todos os usuários do Supabase usando a Admin API via Edge Function
      const { data, error } = await supabase.functions.invoke('admin-get-users');
      
      if (error) {
        console.warn('Edge Function admin-get-users não disponível:', error.message);
        // Se a Edge Function não estiver disponível, retorna vazio
        // O usuário precisa fazer deploy da Edge Function primeiro
        return [];
      }

      if (data?.data && Array.isArray(data.data)) {
        console.log(`✅ ${data.data.length} usuário(s) carregado(s) do Supabase`);
        return data.data as User[];
      }

      // Se não retornou dados válidos
      console.warn('Edge Function retornou dados inválidos');
      return [];
    } catch (error: any) {
      console.error('Erro ao buscar usuários do Supabase:', error);
      // Fallback para localStorage apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.warn('Usando fallback para localStorage (modo desenvolvimento)');
        return this.getLocalUsers();
      }
      return [];
    }
  }

  /**
   * Busca usuários diretamente do Supabase (requer permissões adequadas)
   */
  private async fetchUsersFromSupabase(): Promise<User[]> {
    try {
      // Buscar usuários da tabela auth.users via RPC ou função SQL
      // Como não temos acesso direto à auth.users via cliente, vamos buscar das tabelas que temos
      
      // Buscar assinaturas (que têm user_id)
      const { data: subscriptions, error: subError } = await supabase
        .from('subscriptions')
        .select('user_id, plan_type, status');

      // Buscar plantas para contar uso por usuário
      const { data: plants, error: plantsError } = await supabase
        .from('plants')
        .select('user_id');

      // Criar map de uso
      const usageMap: Record<string, number> = {};
      if (plants) {
        plants.forEach(plant => {
          usageMap[plant.user_id] = (usageMap[plant.user_id] || 0) + 1;
        });
      }

      // Criar map de planos das assinaturas
      const planMap: Record<string, PlanType> = {};
      if (subscriptions) {
        subscriptions.forEach(sub => {
          if (sub.status === 'active' || sub.status === 'trialing') {
            planMap[sub.user_id] = 'pro';
          }
        });
      }

      // Agora buscar informações dos usuários
      // Como não podemos acessar auth.users diretamente, vamos usar uma abordagem diferente
      // Vamos buscar via função admin ou criar uma view
      // Por enquanto, retornamos apenas os usuários que temos dados
      
      const userIds = new Set<string>();
      if (subscriptions) subscriptions.forEach(s => userIds.add(s.user_id));
      if (plants) plants.forEach(p => userIds.add(p.user_id));

      // Para cada user_id, tentar buscar informações básicas
      // Mas sem acesso direto a auth.users, vamos fazer uma aproximação
      const users: User[] = [];
      
      // Buscar informações do usuário atual para testar
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // Criar lista de usuários baseada nos dados disponíveis
      for (const userId of userIds) {
        const plan = planMap[userId] || 'free';
        const usageCount = usageMap[userId] || 0;
        
        users.push({
          id: userId,
          name: 'Usuário', // Nome não disponível sem acessar auth.users
          email: '', // Email não disponível sem acessar auth.users
          plan,
          usageCount,
          maxUsage: plan === 'pro' ? -1 : 3
        });
      }

      // Se não encontrou usuários mas tem Supabase configurado, retorna vazio
      // Melhor criar uma Edge Function para isso
      if (users.length === 0) {
        console.warn('Nenhum usuário encontrado no Supabase. Considere criar uma Edge Function admin-get-users.');
        return this.getLocalUsers();
      }

      return users;
    } catch (error) {
      console.error('Erro ao buscar usuários do Supabase:', error);
      return this.getLocalUsers();
    }
  }

  /**
   * Busca usuários do localStorage (fallback)
   */
  private getLocalUsers(): User[] {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(seedUsers));
      return seedUsers;
    }
    return JSON.parse(stored);
  }

  /**
   * Versão síncrona (mantida para compatibilidade)
   * @deprecated Use getUsers() assíncrono
   */
  getUsersSync(): User[] {
    return this.getLocalUsers();
  }

  async getUser(email: string): Promise<User | undefined> {
    const users = await this.getUsers();
    return users.find(u => u.email === email);
  }

  getUserSync(email: string): User | undefined {
    const users = this.getLocalUsers();
    return users.find(u => u.email === email);
  }

  // Called when a user logs in (syncs or creates)
  syncUser(user: User): User {
    // Em modo Supabase, não precisa salvar em localStorage
    // Os dados já estão no Supabase
    if (isSupabaseConfigured) {
      return user;
    }
    
    // Modo localStorage (fallback)
    const users = this.getLocalUsers();
    const existingIndex = users.findIndex(u => u.email === user.email);

    if (existingIndex >= 0) {
      // Update last login info or stats if needed, but keep plan
      // Returns the stored user (which has the authoritative plan info)
      return users[existingIndex];
    } else {
      // New user
      users.push(user);
      this.saveUsers(users);
      return user;
    }
  }

  async updateUserPlan(userId: string, newPlan: PlanType): Promise<User> {
    // Se Supabase configurado, atualizar no banco
    if (isSupabaseConfigured) {
      try {
        // Atualizar na tabela subscriptions
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (subscription) {
          // Atualizar assinatura existente
          const newStatus = newPlan === 'pro' ? 'active' : 'canceled';
          await supabase
            .from('subscriptions')
            .update({ 
              status: newStatus,
              plan_type: newPlan === 'pro' ? (subscription.plan_type || 'monthly') : subscription.plan_type
            })
            .eq('user_id', userId);
        } else if (newPlan === 'pro') {
          // Criar nova assinatura se não existir
          await supabase
            .from('subscriptions')
            .insert({
              user_id: userId,
              plan_type: 'monthly',
              status: 'active',
              currency: 'BRL',
              stripe_price_id: 'manual',
            });
        }

        // Atualizar localStorage também para sincronização
        const storedData = localStorage.getItem(`botanicmd_data_${userId}`);
        if (storedData) {
          const data = JSON.parse(storedData);
          data.plan = newPlan;
          data.maxUsage = newPlan === 'pro' ? -1 : 3;
          localStorage.setItem(`botanicmd_data_${userId}`, JSON.stringify(data));
        }

        // Buscar usuário atualizado
        const users = await this.getUsers();
        const user = users.find(u => u.id === userId);
        if (user) {
          return { ...user, plan: newPlan, maxUsage: newPlan === 'pro' ? -1 : 3 };
        }
      } catch (error) {
        console.error('Erro ao atualizar plano no Supabase:', error);
        throw error;
      }
    }

    // Fallback para localStorage
    const users = this.getLocalUsers();
    const index = users.findIndex(u => u.id === userId);
    
    if (index === -1) throw new Error("User not found");

    const updatedUser = { 
      ...users[index], 
      plan: newPlan,
      maxUsage: newPlan === 'pro' ? -1 : 3
    };
    
    users[index] = updatedUser;
    this.saveUsers(users);
    return updatedUser;
  }

  async deleteUser(userId: string): Promise<void> {
    // Se Supabase configurado, deletar do banco também
    if (isSupabaseConfigured) {
      try {
        // Deletar assinatura
        await supabase
          .from('subscriptions')
          .delete()
          .eq('user_id', userId);

        // Deletar plantas
        await supabase
          .from('plants')
          .delete()
          .eq('user_id', userId);

        // Limpar localStorage do usuário
        localStorage.removeItem(`botanicmd_data_${userId}`);
      } catch (error) {
        console.error('Erro ao deletar usuário do Supabase:', error);
        // Continua para deletar do localStorage também
      }
    }

    // Deletar do localStorage
    const users = this.getLocalUsers();
    const filtered = users.filter(u => u.id !== userId);
    this.saveUsers(filtered);
  }

  private saveUsers(users: User[]) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }
  
  async getStats() {
    const users = await this.getUsers();
    return {
      totalUsers: users.length,
      proUsers: users.filter(u => u.plan === 'pro').length,
      freeUsers: users.filter(u => u.plan === 'free').length
    };
  }

  getStatsSync() {
    const users = this.getLocalUsers();
    return {
      totalUsers: users.length,
      proUsers: users.filter(u => u.plan === 'pro').length,
      freeUsers: users.filter(u => u.plan === 'free').length
    };
  }
}

export const adminService = new AdminService();
