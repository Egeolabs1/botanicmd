/**
 * Serviço de Assinaturas
 * 
 * Gerencia a sincronização de assinaturas do Stripe com o banco de dados
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { PlanType } from '../types';

export interface SubscriptionData {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string;
  plan_type: 'monthly' | 'annual' | 'lifetime';
  currency: 'BRL' | 'USD';
  status: 'incomplete' | 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';
  cancel_at_period_end: boolean;
  current_period_start: string | null;
  current_period_end: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Busca a assinatura do usuário atual
 */
export async function getUserSubscription(): Promise<SubscriptionData | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Erro ao buscar assinatura:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Erro ao buscar assinatura:', error);
    return null;
  }
}

/**
 * Verifica se o usuário tem uma assinatura ativa
 */
export async function hasActiveSubscription(): Promise<boolean> {
  const subscription = await getUserSubscription();
  return subscription?.status === 'active' || subscription?.status === 'trialing' || false;
}

/**
 * Sincroniza o plano do usuário com a assinatura no banco
 */
export async function syncUserPlan(): Promise<PlanType> {
  const subscription = await getUserSubscription();
  
  if (!subscription || subscription.status !== 'active') {
    return 'free';
  }

  // Mapeia plan_type para o tipo de plano do sistema
  // Para o sistema, tanto monthly quanto annual são 'pro'
  return 'pro';
}

/**
 * Cria uma sessão do Customer Portal do Stripe
 */
export async function createPortalSession(returnUrl: string): Promise<string | null> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase não configurado. Não é possível criar sessão do portal.');
    return null;
  }

  try {
    const { data, error } = await supabase.functions.invoke('create-portal', {
      body: { returnUrl },
    });

    if (error) {
      console.error('Erro ao criar sessão do portal:', error);
      return null;
    }

    return data?.url || null;
  } catch (error: any) {
    console.error('Erro ao criar sessão do portal:', error);
    return null;
  }
}

/**
 * Verifica o status de uma sessão de checkout
 */
export async function verifyCheckoutSession(sessionId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !sessionId) {
    return false;
  }

  try {
    // Aguarda um pouco para garantir que o webhook processou
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verifica se a assinatura foi criada/atualizada
    const subscription = await getUserSubscription();
    
    if (subscription && (subscription.status === 'active' || subscription.status === 'trialing')) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Erro ao verificar sessão de checkout:', error);
    return false;
  }
}

