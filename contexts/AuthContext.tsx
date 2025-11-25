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
  resendConfirmationEmail: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const mapUser = async (sbUser: any) => {
    if (!sbUser) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const storedData = localStorage.getItem(`botanicmd_data_${sbUser.id}`);
      let extraData = { plan: 'free' as PlanType, usageCount: 0, maxUsage: 3 };
      
      if (storedData) {
        try {
          extraData = JSON.parse(storedData);
        } catch (e) {
          console.warn('Erro ao parsear dados do usuário:', e);
        }
      }

      let userPlan: PlanType = extraData.plan || 'free';
      if (isSupabaseConfigured) {
        try {
          const { syncUserPlan } = await import('../services/subscriptionService');
          const planFromSubscription = await syncUserPlan();
          if (planFromSubscription) {
            userPlan = planFromSubscription;
            extraData.plan = userPlan;
            extraData.maxUsage = userPlan === 'pro' ? -1 : 3;
          }
        } catch (error) {
          console.warn('Erro ao sincronizar plano do banco:', error);
        }
      }

      const appUser: User = {
        id: sbUser.id,
        name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Jardineiro',
        email: sbUser.email || '',
        plan: userPlan,
        usageCount: extraData.usageCount || 0,
        maxUsage: userPlan === 'pro' ? -1 : 3
      };

      setUser(appUser);
      setIsLoading(false);
      
      const dataToSave = {
        plan: appUser.plan,
        usageCount: appUser.usageCount,
        maxUsage: appUser.maxUsage
      };
      localStorage.setItem(`botanicmd_data_${sbUser.id}`, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Erro ao mapear usuário:', error);
      setUser(null);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      const demoUserStr = localStorage.getItem('botanicmd_demo_user');
      if (demoUserStr) {
        const parsedUser = JSON.parse(demoUserStr);
        const syncedUser = adminService.syncUser(parsedUser);
        setUser(syncedUser);
      }
      setIsLoading(false);
      return;
    }

    let mounted = true;

    // PRIMEIRO: Configura o listener ANTES de tudo
    // No Edge, getSession() trava - então confiamos 100% no onAuthStateChange
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state changed:', event, session?.user?.email || 'no user');

      if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          await mapUser(session.user);
        } else {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      if (session?.user) {
        await mapUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoading(false);
      }
    });

    // SEGUNDO: Timeout de segurança - se após 3 segundos não houve INITIAL_SESSION, marca como não autenticado
    const timeoutId = setTimeout(() => {
      if (mounted) {
        // Verifica o estado atual usando uma função de callback
        setIsLoading((currentLoading) => {
          if (currentLoading) {
            console.log('Timeout: nenhuma sessão detectada após 3s, marcando como não autenticado');
            setUser(null);
            return false;
          }
          return currentLoading;
        });
      }
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      const dataToSave = {
        plan: user.plan,
        usageCount: user.usageCount,
        maxUsage: user.maxUsage
      };
      localStorage.setItem(`botanicmd_data_${user.id}`, JSON.stringify(dataToSave));
    }
  }, [user?.usageCount, user?.plan]);

  const isAuthenticated = !!user;

  const login = async (email: string, password: string, name?: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado');
    }

    if (name) {
      // Cadastro
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            full_name: name.trim()
          }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error('Erro ao criar usuário');

      alert('Cadastro realizado! Verifique seu email para confirmar sua conta.');
    } else {
      // Login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) throw error;
      if (data.user) {
        await mapUser(data.user);
      }
    }
  };

  const loginSocial = async (provider: 'google') => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado');
    }

    const redirectTo = `${window.location.origin}/auth/callback`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTo
      }
    });

    if (error) throw error;
  };

  const logout = () => {
    if (!isSupabaseConfigured) {
      localStorage.removeItem('botanicmd_demo_user');
      setUser(null);
      return;
    }

    supabase.auth.signOut().then(() => {
      setUser(null);
      window.location.href = '/';
    });
  };

  const incrementUsage = () => {
    if (!user) return;
    
    const newCount = (user.usageCount || 0) + 1;
    setUser({ ...user, usageCount: newCount });
    
    if (user.id) {
      const dataToSave = {
        plan: user.plan,
        usageCount: newCount,
        maxUsage: user.maxUsage
      };
      localStorage.setItem(`botanicmd_data_${user.id}`, JSON.stringify(dataToSave));
    }
  };

  const upgradeToPro = () => {
    if (!user) return;
    setUser({ ...user, plan: 'pro', maxUsage: -1 });
  };

  const checkLimit = (): boolean => {
    if (!user) return false;
    if (user.plan === 'pro') return true;
    return (user.usageCount || 0) < (user.maxUsage || 3);
  };

  const updateProfile = async (name: string) => {
    if (!isSupabaseConfigured || !user) {
      throw new Error('Não autenticado ou Supabase não configurado');
    }

    const { error } = await supabase.auth.updateUser({
      data: { full_name: name.trim() }
    });

    if (error) throw error;

    setUser({ ...user, name: name.trim() });
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado');
    }

    // Primeiro, verifica a senha atual fazendo login
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser?.email) {
      throw new Error('Usuário não encontrado');
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: currentUser.email,
      password: currentPassword,
    });

    if (signInError) {
      throw new Error('Senha atual incorreta');
    }

    // Se chegou aqui, a senha atual está correta, então atualiza
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      throw new Error(updateError.message || 'Erro ao atualizar senha');
    }
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });

    if (error) throw error;
  };

  const updatePassword = async (newPassword: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado');
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  };

  const resendConfirmationEmail = async (email: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado');
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
    });

    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
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
        updatePassword,
        resendConfirmationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
