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
  refreshUserPlan: () => Promise<void>;
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
      console.log('🔄 Mapeando usuário:', sbUser.email);
      
      // SEMPRE busca do banco de dados primeiro (fonte da verdade)
      // localStorage é usado apenas como cache/fallback se o banco falhar
      let userPlan: PlanType = 'free';
      let usageCount = 0;
      let maxUsage = 3;
      
      // Tenta buscar do localStorage como fallback inicial (para performance)
      const storedData = localStorage.getItem(`botanicmd_data_${sbUser.id}`);
      if (storedData) {
        try {
          const cachedData = JSON.parse(storedData);
          usageCount = cachedData.usageCount || 0;
          // Não usa plan do cache, sempre busca do banco
        } catch (e) {
          console.warn('Erro ao parsear dados do usuário do cache:', e);
        }
      }

      // SEMPRE busca o plano do banco de dados (fonte da verdade)
      if (isSupabaseConfigured) {
        try {
          const syncPromise = import('../services/subscriptionService').then(m => m.syncUserPlan()).catch(err => {
            console.warn('⚠️ Erro ao sincronizar plano do banco:', err.message || err);
            return null as PlanType | null;
          });
          
          // Timeout de 5 segundos para não travar o app
          const timeoutPromise = new Promise<PlanType | null>((resolve) => 
            setTimeout(() => {
              console.warn('⚠️ Timeout ao sincronizar plano do banco');
              resolve(null);
            }, 5000)
          );
          
          const planFromSubscription = await Promise.race([syncPromise, timeoutPromise]);
          
          if (planFromSubscription !== null) {
            // Banco retornou um plano válido - usa ele (fonte da verdade)
            userPlan = planFromSubscription;
            maxUsage = userPlan === 'pro' ? -1 : 3;
            console.log('✅ Plano sincronizado do banco de dados:', userPlan);
          } else {
            // Banco falhou ou timeout - usa localStorage como fallback
            if (storedData) {
              try {
                const cachedData = JSON.parse(storedData);
                userPlan = cachedData.plan || 'free';
                maxUsage = userPlan === 'pro' ? -1 : 3;
                console.warn('⚠️ Usando plano do cache (banco não disponível):', userPlan);
              } catch (e) {
                console.warn('⚠️ Erro ao ler cache, usando free como padrão');
                userPlan = 'free';
              }
            } else {
              // Sem cache e banco falhou - usa free como padrão seguro
              console.warn('⚠️ Banco não disponível e sem cache, usando free como padrão');
              userPlan = 'free';
            }
          }
        } catch (error: any) {
          console.warn('⚠️ Erro ao sincronizar plano do banco:', error?.message || error);
          // Fallback para localStorage se disponível
          if (storedData) {
            try {
              const cachedData = JSON.parse(storedData);
              userPlan = cachedData.plan || 'free';
              maxUsage = userPlan === 'pro' ? -1 : 3;
              console.warn('⚠️ Usando plano do cache devido a erro:', userPlan);
            } catch (e) {
              userPlan = 'free';
            }
          }
        }
      } else {
        // Supabase não configurado - usa localStorage como única fonte
        if (storedData) {
          try {
            const cachedData = JSON.parse(storedData);
            userPlan = cachedData.plan || 'free';
            usageCount = cachedData.usageCount || 0;
            maxUsage = userPlan === 'pro' ? -1 : 3;
            console.log('ℹ️ Supabase não configurado, usando dados do cache');
          } catch (e) {
            userPlan = 'free';
          }
        }
      }

      const appUser: User = {
        id: sbUser.id,
        name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Jardineiro',
        email: sbUser.email || '',
        plan: userPlan,
        usageCount: usageCount,
        maxUsage: maxUsage
      };

      console.log('✅ Usuário mapeado, definindo estado:', appUser.email, 'Plano:', appUser.plan);
      setUser(appUser);
      setIsLoading(false);
      
      // Atualiza localStorage com os dados do banco (cache para próxima vez)
      const dataToSave = {
        plan: appUser.plan,
        usageCount: appUser.usageCount,
        maxUsage: appUser.maxUsage
      };
      localStorage.setItem(`botanicmd_data_${sbUser.id}`, JSON.stringify(dataToSave));
      
      console.log('✅ Estado atualizado - isAuthenticated deve ser true agora');
    } catch (error) {
      console.error('❌ Erro ao mapear usuário:', error);
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
    let timeoutId: NodeJS.Timeout | null = null;
    let sessionDetected = false;

    // PRIMEIRO: Configura o listener ANTES de tudo
    // No Edge, getSession() trava - então confiamos 100% no onAuthStateChange
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state changed:', event, session?.user?.email || 'no user');

      // Se detectou uma sessão, marca e limpa o timeout
      if (session?.user && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        sessionDetected = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      }

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

    // SEGUNDO: Timeout de segurança - se após 5 segundos não houve sessão, marca como não autenticado
    timeoutId = setTimeout(() => {
      if (mounted && !sessionDetected) {
        console.log('Timeout: nenhuma sessão detectada após 5s, marcando como não autenticado');
        setUser(null);
        setIsLoading(false);
      }
      timeoutId = null;
    }, 5000);

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
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

    // Garante que sempre usa botanicmd.com, não vercel.app
    const origin = window.location.hostname === 'botanicmd.com' 
      ? 'https://botanicmd.com'
      : window.location.origin;
    
    const redirectTo = `${origin}/auth/callback`;
    
    console.log('🔐 Iniciando login social:', provider, 'redirectTo:', redirectTo);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    if (error) {
      console.error('❌ Erro no login social:', error);
      throw error;
    }
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

  const refreshUserPlan = async () => {
    if (!user || !isSupabaseConfigured) return;

    console.log('🔄 Recarregando plano do usuário do banco de dados...');
    
    try {
      const { syncUserPlan } = await import('../services/subscriptionService');
      const newPlan = await syncUserPlan();
      
      if (newPlan && newPlan !== user.plan) {
        console.log(`✅ Plano atualizado de ${user.plan} para ${newPlan}`);
        
        const updatedUser: User = {
          ...user,
          plan: newPlan,
          maxUsage: newPlan === 'pro' ? -1 : 3,
        };
        
        setUser(updatedUser);
        
        // Atualizar localStorage
        const dataToSave = {
          plan: updatedUser.plan,
          usageCount: updatedUser.usageCount,
          maxUsage: updatedUser.maxUsage
        };
        localStorage.setItem(`botanicmd_data_${user.id}`, JSON.stringify(dataToSave));
      } else {
        console.log('ℹ️ Plano já está atualizado:', newPlan);
      }
    } catch (error: any) {
      console.error('❌ Erro ao recarregar plano:', error);
    }
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
        refreshUserPlan,
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
