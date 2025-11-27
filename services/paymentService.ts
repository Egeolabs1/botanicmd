
import { supabase, isSupabaseConfigured } from './supabase';
import { SupportedLanguage } from '../types';

export type PlanType = 'monthly' | 'annual' | 'lifetime';
export type Currency = 'BRL' | 'USD';

// ⚠️ PASSO IMPORTANTE:
// 1. Crie um Produto no Stripe (ex: "BotanicMD Pro")
// 2. Adicione preços para BRL e USD dentro desse produto.
// 3. Copie os 'API ID' de cada preço (começam com 'price_...') e cole abaixo.

const STRIPE_PRICES = {
  BRL: {
    monthly: 'price_1SXxQ5Bz9Lh5gOrNLB2lJy4v', // ID do plano mensal em R$ 19,90
    annual: 'price_1SXxQbBz9Lh5gOrNXcn4KVRD',  // ID do plano anual em R$ 99,90
    lifetime: 'price_1SXxWQBz9Lh5gOrNe8U5dfSx' // ID do plano vitalício (pagamento único) em R$ 289,90
  },
  USD: {
    monthly: 'price_1SXxXiBz9Lh5gOrNf8lpjvUC', // ID do plano mensal em $ 5.99
    annual: 'price_1SXxYFBz9Lh5gOrNsJ7nzWOC',  // ID do plano anual em $ 29.99
    lifetime: 'price_1SXxYgBz9Lh5gOrNNPyDcTRX' // ID do plano vitalício (pagamento único) em $ 79.99
  }
};

export const getCurrencyByLanguage = (lang: SupportedLanguage): Currency => {
  // Se o idioma for português, usa BRL, caso contrário assume USD (padrão internacional)
  return lang === 'pt' ? 'BRL' : 'USD';
};

/**
 * Inicia o processo de checkout do Stripe
 */
export const initiateCheckout = async (plan: PlanType, language: SupportedLanguage): Promise<void> => {
  // Verificar se Supabase está configurado
  if (!isSupabaseConfigured) {
    const errorMsg = 'Stripe não está configurado. Configure o Supabase primeiro.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Verificar se o usuário está autenticado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Você precisa estar logado para fazer uma assinatura.');
  }

  const currency = getCurrencyByLanguage(language);
  
  // Seleciona o ID correto baseado na moeda e no tipo de plano
  const priceId = STRIPE_PRICES[currency][plan];

  if (!priceId) {
    throw new Error(`Preço não encontrado para o plano ${plan} em ${currency}.`);
  }

  try {
    // Chama a Supabase Edge Function 'create-checkout'
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: {
        priceId,
        planType: plan, // 'monthly', 'annual' ou 'lifetime'
        currency,
        successUrl: `${window.location.origin}/app?session_id={CHECKOUT_SESSION_ID}&status=success`,
        cancelUrl: `${window.location.origin}/app?status=cancelled`,
      },
    });

    if (error) {
      console.error('❌ Erro retornado pela Edge Function:', error);
      
      // Tentar extrair mensagem detalhada do erro
      let errorMessage = 'Erro ao criar sessão de checkout.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.context?.msg) {
        errorMessage = error.context.msg;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Se houver detalhes no erro, adicionar à mensagem
      if (error.context?.details) {
        errorMessage += ` Detalhes: ${error.context.details}`;
      }
      
      throw new Error(errorMessage);
    }

    if (!data?.url) {
      throw new Error('O servidor de pagamento não retornou um link válido.');
    }

    // Redireciona o usuário para o Checkout do Stripe
    window.location.href = data.url;

  } catch (error: any) {
    console.error('❌ Erro ao iniciar checkout:', error);
    
    // Extrair mensagem de erro mais detalhada
    let errorMessage = 'Erro ao criar sessão de checkout.';
    
    if (error?.message) {
      errorMessage = error.message;
    } else if (error?.error) {
      errorMessage = error.error;
      if (error.details) {
        errorMessage += ` (${error.details})`;
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    console.error('❌ Mensagem de erro detalhada:', errorMessage);
    
    // Em desenvolvimento, oferece modo de simulação apenas se o erro for de conexão
    if (process.env.NODE_ENV === 'development' && errorMessage?.includes('fetch')) {
      const shouldSimulate = window.confirm(
        "Ambiente de Desenvolvimento: A Edge Function não está disponível.\n\n" +
        "Deseja SIMULAR um pagamento bem-sucedido para testar o fluxo?"
      );

      if (shouldSimulate) {
        setTimeout(() => {
          window.location.href = `${window.location.origin}/app?status=success&simulated=true`;
        }, 500);
        return;
      }
    }
    
    // Em produção ou se o usuário não quiser simular, lança o erro com mensagem detalhada
    throw new Error(errorMessage);
  }
};

/**
 * Obtém os preços configurados (útil para exibir na UI)
 */
export const getStripePrices = () => STRIPE_PRICES;
