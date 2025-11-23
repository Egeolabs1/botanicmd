/**
 * Serviço de Autenticação Admin
 * 
 * Este serviço verifica se um usuário tem permissões de administrador.
 * 
 * IMPORTANTE: Em produção, esta verificação deve ser feita no backend
 * para garantir segurança real. Esta é uma verificação básica para
 * proteger o frontend.
 */

import { User } from '../types';

// Lista de emails de administradores (em produção, deve vir do backend/Supabase)
// Você pode configurar via variável de ambiente também
const ADMIN_EMAILS = [
  'admin@botanicmd.com',
  'admin@egeolabs.com',
  // Adicione mais emails de admin aqui
  ...(import.meta.env.VITE_ADMIN_EMAILS 
    ? import.meta.env.VITE_ADMIN_EMAILS.split(',').map((e: string) => e.trim())
    : []),
];

// IDs de usuários admin (para casos especiais)
const ADMIN_USER_IDS = [
  'user_admin',
  // Adicione mais IDs aqui se necessário
];

/**
 * Verifica se um usuário tem permissões de administrador
 * @param user Usuário a ser verificado
 * @returns true se o usuário for admin, false caso contrário
 */
export const isAdmin = (user: User | null): boolean => {
  if (!user) {
    return false;
  }

  // Verifica por email
  if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return true;
  }

  // Verifica por ID
  if (user.id && ADMIN_USER_IDS.includes(user.id)) {
    return true;
  }

  return false;
};

/**
 * Verifica se o email fornecido é de um administrador
 * @param email Email a ser verificado
 * @returns true se o email for de admin
 */
export const isAdminEmail = (email: string): boolean => {
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

/**
 * Obtém a lista de emails de administradores (sem expor completamente)
 * Útil para exibir no painel admin
 */
export const getAdminEmails = (): string[] => {
  return [...ADMIN_EMAILS];
};

