
import { createClient } from '@supabase/supabase-js';

// ⚠️ IMPORTANTE: Configure as variáveis de ambiente no arquivo .env.local
// VITE_SUPABASE_URL e VITE_SUPABASE_KEY são obrigatórias para usar Supabase
// O Vite usa import.meta.env para variáveis de ambiente
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || import.meta.env.REACT_APP_SUPABASE_KEY;

// Verifica se as credenciais estão configuradas
export const isSupabaseConfigured = 
  !!SUPABASE_URL && 
  !!SUPABASE_KEY &&
  SUPABASE_URL.trim() !== '' &&
  SUPABASE_KEY.trim() !== '';

// Cria cliente Supabase apenas se as credenciais estiverem configuradas
// Caso contrário, o app funcionará em modo demo/offline
export const supabase = isSupabaseConfigured 
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        // Configura persistência da sessão
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'botanicmd-auth-token',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // Configurações adicionais para melhor persistência
        flowType: 'pkce'
      }
    })
  : (() => {
      console.warn('Supabase não configurado. Modo demo ativado.');
      // Retorna um cliente mock para evitar erros
      return createClient('https://placeholder.supabase.co', 'placeholder-key', {
        auth: {
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          persistSession: false
        }
      });
    })();

// Debug: Verifica se a sessão está sendo persistida
if (typeof window !== 'undefined' && isSupabaseConfigured) {
  // Verifica se há uma sessão salva
  const savedSession = localStorage.getItem('botanicmd-auth-token');
  if (savedSession) {
    console.log('✅ Sessão encontrada no localStorage');
  } else {
    console.log('ℹ️ Nenhuma sessão encontrada no localStorage');
  }
}