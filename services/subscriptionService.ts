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
    if (!user) {
      console.warn('⚠️ getUserSubscription: Usuário não autenticado');
      return null;
    }

    // Usa .maybeSingle() para evitar erro 406 quando não há registro
    // .maybeSingle() retorna null se não houver linha, sem gerar erro
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      // 406 geralmente significa problema de RLS ou tabela não existe
      if (error.code === 'PGRST301' || error.statusCode === 406) {
        console.warn('⚠️ Tabela subscriptions pode não existir ou RLS bloqueando acesso. Erro:', error.message);
        return null;
      }
      console.error('❌ Erro ao buscar assinatura:', error);
      return null;
    }

    return data || null;
  } catch (error: any) {
    // Captura erros de rede ou outros erros não relacionados ao Supabase
    if (error?.message?.includes('Failed to fetch') || error?.code === 'PGRST301') {
      console.warn('⚠️ Erro de conexão ou tabela não encontrada. Assinatura não será sincronizada.');
      return null;
    }
    console.error('❌ Erro ao buscar assinatura:', error);
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
  console.log('🔄 Sincronizando plano do usuário...');
  
  const subscription = await getUserSubscription();
  
  if (!subscription) {
    console.log('⚠️ Nenhuma assinatura encontrada, retornando plano gratuito');
    return 'free';
  }
  
  console.log('📋 Assinatura encontrada:', {
    status: subscription.status,
    plan_type: subscription.plan_type,
    user_id: subscription.user_id
  });
  
  if (subscription.status !== 'active' && subscription.status !== 'trialing') {
    console.log('⚠️ Assinatura não está ativa, status:', subscription.status);
    return 'free';
  }

  // Mapeia plan_type para o tipo de plano do sistema
  // Para o sistema, tanto monthly quanto annual são 'pro'
  console.log('✅ Plano sincronizado: PRO');
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
    console.warn('⚠️ verifyCheckoutSession: Supabase não configurado ou sessionId ausente');
    return false;
  }

  try {
    console.log('🔍 Verificando sessão de checkout:', sessionId);
    
    // Aguarda um pouco para garantir que o webhook processou (aumentado para 5 segundos)
    console.log('⏳ Aguardando 5 segundos para o webhook processar...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Verifica se a assinatura foi criada/atualizada
    const subscription = await getUserSubscription();
    
    console.log('📋 Status da assinatura:', subscription ? {
      status: subscription.status,
      plan_type: subscription.plan_type,
      user_id: subscription.user_id
    } : 'Nenhuma assinatura encontrada');
    
    if (subscription && (subscription.status === 'active' || subscription.status === 'trialing')) {
      console.log('✅ Assinatura ativa encontrada!');
      return true;
    }

    console.warn('⚠️ Assinatura não encontrada ou não está ativa');
    return false;
  } catch (error) {
    console.error('❌ Erro ao verificar sessão de checkout:', error);
    return false;
  }
}

