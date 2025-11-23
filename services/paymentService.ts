
import { supabase } from './supabase';
import { SupportedLanguage } from '../types';

export type PlanType = 'monthly' | 'annual' | 'lifetime';
export type Currency = 'BRL' | 'USD';

// ⚠️ PASSO IMPORTANTE:
// 1. Crie um Produto no Stripe (ex: "BotanicMD Pro")
// 2. Adicione preços para BRL e USD dentro desse produto.
// 3. Copie os 'API ID' de cada preço (começam com 'price_...') e cole abaixo.

const STRIPE_PRICES = {
  BRL: {
    monthly: 'price_1SVjjkQxkNQpny1LIElriKgq', // Cole aqui o ID do plano mensal em R$ 19,90
    annual: 'price_1SVjksQxkNQpny1LP0OjkvIQ',  // Cole aqui o ID do plano anual em R$ 99,90
    lifetime: 'price_1SVjmTQxkNQpny1LrK08bJCm' // Cole aqui o ID do plano vitalício (pagamento único) em R$ 289,90
  },
  USD: {
    monthly: 'price_1SVjpzQxkNQpny1LJ7VEUF26', // Cole aqui o ID do plano mensal em $ 5.99
    annual: 'price_1SVjpzQxkNQpny1L1qsQ6QNy',  // Cole aqui o ID do plano anual em $ 29.99
    lifetime: 'price_1SVjpzQxkNQpny1LoiRKgepC' // Cole aqui o ID do plano vitalício (pagamento único) em $ 79.99
  }
};

export const getCurrencyByLanguage = (lang: SupportedLanguage): Currency => {
  // Se o idioma for português, usa BRL, caso contrário assume USD (padrão internacional)
  return lang === 'pt' ? 'BRL' : 'USD';
};

export const initiateCheckout = async (plan: PlanType, language: SupportedLanguage) => {
  const currency = getCurrencyByLanguage(language);
  
  // Seleciona o ID correto baseado na moeda e no tipo de plano
  const priceId = STRIPE_PRICES[currency][plan];

  try {
    // Tenta chamar a Supabase Edge Function 'create-checkout'
    // O bloco try/catch captura erros de rede (fetch failed) e erros da função
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
      // Lança erro explicitamente para ser pego pelo catch abaixo
      throw new Error(`Function Error: ${error.message}`);
    }

    if (data?.url) {
      // Redireciona o usuário para o Checkout do Stripe
      window.location.href = data.url;
    } else {
      throw new Error('O servidor de pagamento não retornou um link válido.');
    }

  } catch (error: any) {
    // Log discreto para debug
    console.warn('BotanicMD: Backend de pagamento não conectado ou erro na função.', error.message);
    
    // --- MODO DE SIMULAÇÃO (DEV) ---
    // Como o backend (Edge Function) pode não estar configurado neste ambiente de demonstração,
    // oferecemos uma simulação para que o fluxo possa ser testado.
    const shouldSimulate = window.confirm(
      "Ambiente de Demonstração: A conexão com o Stripe (Edge Function) não está configurada.\n\nDeseja SIMULAR um pagamento bem-sucedido para liberar o acesso Pro?"
    );

    if (shouldSimulate) {
      // Simula o redirecionamento de sucesso
      // Adicionamos um pequeno delay para parecer processamento
      setTimeout(() => {
         // Redireciona para /app para garantir que o AppMain processe o sucesso
         window.location.href = `${window.location.origin}/app?status=success&simulated=true`;
      }, 500);
    } else {
      console.log("Simulação de pagamento cancelada.");
    }
    // Não lançamos o erro novamente para não travar a UI do modal
  }
};
