import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, PlanType } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { adminService } from '../services/adminService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, name?: string) => Promise<void>;
  loginSocial: (provider: 'google') => Promise<void>;
  logout: () => void;
  incrementUsage: () => void;
  upgradeToPro: () => void;
  checkLimit: () => boolean;
  updateProfile: (name: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const mapUser = (sbUser: any) => {
    if (!sbUser) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    // Em Supabase, podemos salvar metadados do usuário na tabela 'profiles' ou no metadata do auth
    // Aqui, usamos localStorage para simular a persistência do plano por simplicidade
    const storedData = localStorage.getItem(`botanicmd_data_${sbUser.id}`);
    const extraData = storedData ? JSON.parse(storedData) : { plan: 'free', usageCount: 0, maxUsage: 3 };

    const appUser: User = {
      id: sbUser.id,
      name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Jardineiro',
      email: sbUser.email || '',
      plan: extraData.plan,
      usageCount: extraData.usageCount,
      maxUsage: extraData.plan === 'pro' ? -1 : 3
    };

    setUser(appUser);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      console.log('Supabase não configurado. Modo offline/demonstração ativado.');
      
      // Tenta recuperar sessão demo salva localmente
      const demoUserStr = localStorage.getItem('botanicmd_demo_user');
      if (demoUserStr) {
        const parsedUser = JSON.parse(demoUserStr);
        // Sync with admin DB to ensure we have the latest plan if admin changed it
        const syncedUser = adminService.syncUser(parsedUser);
        setUser(syncedUser);
      }
      
      setIsLoading(false);
      return;
    }

    // Verifica sessão atual do Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      mapUser(session?.user ?? null);
    }).catch(err => {
      console.error("Erro de conexão Auth:", err);
      setIsLoading(false);
    });

    // Escuta mudanças de auth (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      mapUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Salva uso localmente para persistência do plano/contagem
  useEffect(() => {
    if (user) {
      const dataToSave = {
        plan: user.plan,
        usageCount: user.usageCount,
        maxUsage: user.maxUsage
      };
      localStorage.setItem(`botanicmd_data_${user.id}`, JSON.stringify(dataToSave));
      
      // Se for usuário demo, atualiza o registro demo também
      if (!isSupabaseConfigured && user.id.startsWith('demo-')) {
        localStorage.setItem('botanicmd_demo_user', JSON.stringify(user));
        // Sync stats with Admin DB
        adminService.syncUser(user);
      }
    }
  }, [user]);

  const login = async (email: string, password: string, name?: string) => {
    if (!isSupabaseConfigured) {
      // MODO DEMO: Cria um usuário fictício imediatamente
      const userId = 'demo-user-' + email.replace(/[^a-zA-Z0-9]/g, '');
      const demoUser: User = {
        id: userId,
        name: name?.trim() || email.split('@')[0] || 'Visitante',
        email: email,
        plan: 'free',
        usageCount: 0,
        maxUsage: 3
      };
      
      // Register user in Admin DB or retrieve existing to respect Plan changes
      const syncedUser = adminService.syncUser(demoUser);
      
      setUser(syncedUser);
      localStorage.setItem('botanicmd_demo_user', JSON.stringify(syncedUser));
      return;
    }

    try {
      // Tenta fazer login primeiro (caso o usuário já exista)
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      // Se login funcionou, retorna sucesso
      if (loginData.user && !loginError) {
        // O mapUser será chamado automaticamente via onAuthStateChange
        return;
      }

      // Se o erro não for "invalid credentials", pode ser outro problema
      if (loginError && !loginError.message.includes('Invalid login credentials')) {
        throw loginError;
      }

      // Se chegou aqui, o usuário não existe, então vamos fazer cadastro
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: name?.trim() || email.split('@')[0] || 'Jardineiro',
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=/app`,
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      // Se o signup foi bem-sucedido
      if (signUpData.user) {
        // Verifica se precisa confirmar email
        if (signUpData.user.email_confirmed_at === null) {
          // Email precisa ser confirmado
          alert('Conta criada com sucesso! Verifique seu email para confirmar sua conta antes de fazer login.');
          return;
        } else {
          // Email já confirmado - usuário já pode usar
          // O mapUser será chamado automaticamente via onAuthStateChange
          return;
        }
      }

    } catch (error: any) {
      console.error('Erro na autenticação:', error);
      
      // Tratamento de erros específicos
      if (error.message?.includes('User already registered')) {
        throw new Error('Este email já está cadastrado. Faça login com sua senha.');
      } else if (error.message?.includes('Invalid login credentials')) {
        throw new Error('Email ou senha incorretos.');
      } else if (error.message?.includes('Password should be at least')) {
        throw new Error('A senha deve ter pelo menos 6 caracteres.');
      } else {
        throw new Error(error.message || 'Erro ao fazer login ou cadastro. Tente novamente.');
      }
    }
  };

  const loginSocial = async (provider: 'google') => {
    if (!isSupabaseConfigured) {
      // MODO DEMO SOCIAL
      const demoUser: User = {
        id: 'demo-social-google',
        name: 'Visitante Google',
        email: 'demo-google@gmail.com',
        plan: 'free',
        usageCount: 0,
        maxUsage: 3
      };
      
      // Register user in Admin DB or retrieve existing
      const syncedUser = adminService.syncUser(demoUser);
      
      setUser(syncedUser);
      localStorage.setItem('botanicmd_demo_user', JSON.stringify(syncedUser));
      return;
    }
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=/app`
        }
      });
      
      if (error) {
        console.error('Erro no login social:', error);
        if (error.message.includes('provider is not enabled')) {
          alert('Google OAuth não está habilitado no Supabase. Por favor, habilite o provider Google nas configurações do Supabase ou use o login com email.');
        } else {
          alert('Erro no login social: ' + error.message);
        }
      }
    } catch (err: any) {
      console.error('Erro ao iniciar login OAuth:', err);
      alert('Erro ao iniciar login com Google. Verifique as configurações do Supabase.');
    }
  };

  const logout = async () => {
    // Clear local state immediately for instant UI feedback
    setUser(null);
    // Also clear the demo user session from localStorage, if it exists
    localStorage.removeItem('botanicmd_demo_user');

    // If using Supabase, sign out from the server in the background.
    // The onAuthStateChange listener will also pick this up, but our UI is already updated.
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out from Supabase:', error);
      }
    }
  };

  const incrementUsage = () => {
    if (user) {
      const updatedUser = { ...user, usageCount: user.usageCount + 1 };
      setUser(updatedUser);
    }
  };

  const upgradeToPro = () => {
    if (user) {
      // Atualiza no context
      const updatedUser = { ...user, plan: 'pro' as PlanType, maxUsage: -1 };
      setUser(updatedUser);
      
      // Atualiza no Admin DB também
      try {
        adminService.updateUserPlan(user.id, 'pro');
      } catch (error) {
        // Log apenas em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.error('Erro ao salvar upgrade no Admin DB:', error);
        }
      }
      
      // Se for usuário demo, atualiza localStorage também
      if (!isSupabaseConfigured && user.id.startsWith('demo-')) {
        localStorage.setItem('botanicmd_demo_user', JSON.stringify(updatedUser));
      }
      
      // Salva dados do usuário
      const dataToSave = {
        plan: 'pro',
        usageCount: user.usageCount,
        maxUsage: -1
      };
      localStorage.setItem(`botanicmd_data_${user.id}`, JSON.stringify(dataToSave));
    }
  };

  const checkLimit = () => {
    if (!user) return false;
    if (user.plan === 'pro') return true;
    return user.usageCount < user.maxUsage;
  };

  const updateProfile = async (name: string) => {
    if (user) {
      const updatedUser = { ...user, name };
      setUser(updatedUser);
      
      // Sync with Admin DB to update name
      adminService.syncUser(updatedUser);

      if (!isSupabaseConfigured) {
        if (user.id.startsWith('demo-')) {
            localStorage.setItem('botanicmd_demo_user', JSON.stringify(updatedUser));
        }
      } else {
        // Atualizar Supabase
        const { error } = await supabase.auth.updateUser({
          data: { full_name: name }
        });
        if (error) console.error("Error updating profile:", error);
      }
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Funcionalidade disponível apenas com Supabase configurado.');
    }

    if (!user) {
      throw new Error('Você precisa estar logado para alterar a senha.');
    }

    if (!currentPassword || !newPassword) {
      throw new Error('Preencha todos os campos.');
    }

    if (newPassword.length < 6) {
      throw new Error('A nova senha deve ter pelo menos 6 caracteres.');
    }

    try {
      // Primeiro, verifica se a senha atual está correta fazendo login
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (verifyError) {
        throw new Error('Senha atual incorreta.');
      }

      // Se a senha atual está correta, atualiza para a nova senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw new Error(updateError.message || 'Erro ao alterar senha.');
      }

      // Sucesso - senha alterada
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      throw new Error(error.message || 'Erro ao alterar senha. Tente novamente.');
    }
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Funcionalidade disponível apenas com Supabase configurado.');
    }

    if (!email || !isValidEmail(email)) {
      throw new Error('Email inválido.');
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery&redirect=/app`,
      });

      if (error) {
        throw new Error(error.message || 'Erro ao enviar email de recuperação.');
      }

      // Sucesso - email enviado
    } catch (error: any) {
      console.error('Erro ao recuperar senha:', error);
      throw new Error(error.message || 'Erro ao enviar email de recuperação. Tente novamente.');
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Funcionalidade disponível apenas com Supabase configurado.');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error('A nova senha deve ter pelo menos 6 caracteres.');
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new Error(error.message || 'Erro ao atualizar senha.');
      }

      // Sucesso - senha atualizada
    } catch (error: any) {
      console.error('Erro ao atualizar senha:', error);
      throw new Error(error.message || 'Erro ao atualizar senha. Tente novamente.');
    }
  };

  // Helper function para validar email
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading, 
      login, 
      loginSocial, 
      logout, 
      incrementUsage, 
      upgradeToPro, 
      checkLimit, 
      updateProfile,
      changePassword,
      resetPassword,
      updatePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};