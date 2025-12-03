/**
 * Script para Atualizar Status de Assinatura para 'active'
 * 
 * Use este script para corrigir assinaturas que estão com status 'incomplete'
 * mas o pagamento foi realmente processado.
 * 
 * Este script também sincroniza com o Stripe para encontrar a assinatura ativa correta.
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');

const SUPABASE_URL = env.VITE_SUPABASE_URL || env.REACT_APP_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET = env.STRIPE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas.');
  process.exit(1);
}

if (!STRIPE_SECRET) {
  console.error('❌ Erro: STRIPE_SECRET_KEY não configurada.');
  console.error('   Este script precisa da chave do Stripe para sincronizar assinaturas.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const stripe = new Stripe(STRIPE_SECRET, { apiVersion: '2023-10-16' });

// Obter email do usuário via argumento da linha de comando
const userEmail = process.argv[2];

if (!userEmail) {
  console.error('❌ Erro: Email do usuário não fornecido.');
  console.log('\n📝 Uso:');
  console.log('   node scripts/update-subscription-to-active.mjs seu@email.com');
  process.exit(1);
}

async function updateSubscriptionStatus() {
  console.log('🔍 Buscando usuário:', userEmail);

  // 1. Buscar user_id pelo email
  // Nota: listUsers() retorna paginação, então precisamos buscar todos
  let user = null;
  let page = 1;
  const pageSize = 50;
  
  while (!user) {
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers({
      page: page,
      perPage: pageSize
    });
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      process.exit(1);
    }
    
    if (!users || users.length === 0) {
      break; // Não há mais usuários
    }
    
    user = users.find(u => u.email === userEmail);
    
    if (!user && users.length < pageSize) {
      break; // Não há mais páginas
    }
    
    page++;
  }
  
  if (!user) {
    console.error('❌ Usuário não encontrado:', userEmail);
    console.log('\n💡 Dica: Certifique-se de que o email está correto e o usuário existe.');
    process.exit(1);
  }

  console.log('✅ Usuário encontrado:', user.id);
  console.log('');

  // 2. Buscar assinatura no banco
  console.log('🔍 Buscando assinatura no banco de dados...');
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (subError) {
    console.error('❌ Erro ao buscar assinatura:', subError);
    process.exit(1);
  }

  if (!subscription) {
    console.error('❌ Nenhuma assinatura encontrada no banco de dados.');
    console.log('\n💡 Tentando encontrar assinatura ativa no Stripe...');
    
    // Tentar encontrar pelo customer_id se tiver
    // Por enquanto, vamos apenas informar
    console.log('   Você precisa criar uma assinatura no banco ou verificar o webhook.');
    process.exit(1);
  }

  console.log('📋 Assinatura encontrada no banco:');
  console.log('   ID:', subscription.id);
  console.log('   Status atual:', subscription.status);
  console.log('   Plan Type:', subscription.plan_type);
  console.log('   Stripe Subscription ID:', subscription.stripe_subscription_id || 'N/A');
  console.log('   Stripe Customer ID:', subscription.stripe_customer_id || 'N/A');
  console.log('');

  // 3. Verificar se precisa atualizar
  if (subscription.status === 'active' || subscription.status === 'trialing') {
    console.log('✅ Assinatura já está ativa! Status:', subscription.status);
    console.log('   Nenhuma atualização necessária.');
    return;
  }

  // 4. Buscar assinatura ativa no Stripe
  console.log('🔍 Buscando assinatura ativa no Stripe...');
  let activeStripeSubscription = null;
  
  if (subscription.stripe_customer_id) {
    try {
      // Listar todas as assinaturas do customer
      const stripeSubs = await stripe.subscriptions.list({
        customer: subscription.stripe_customer_id,
        status: 'all',
        limit: 10
      });
      
      // Procurar por uma assinatura ativa
      activeStripeSubscription = stripeSubs.data.find(
        s => s.status === 'active' || s.status === 'trialing'
      );
      
      if (activeStripeSubscription) {
        console.log('✅ Assinatura ativa encontrada no Stripe:');
        console.log('   ID:', activeStripeSubscription.id);
        console.log('   Status:', activeStripeSubscription.status);
        console.log('   Plano:', activeStripeSubscription.items.data[0]?.price?.id || 'N/A');
        console.log('');
        
        // Se a assinatura no Stripe é diferente da do banco, atualizar
        if (activeStripeSubscription.id !== subscription.stripe_subscription_id) {
          console.log('⚠️  Assinatura no Stripe é diferente da do banco!');
          console.log('   Banco:', subscription.stripe_subscription_id);
          console.log('   Stripe:', activeStripeSubscription.id);
          console.log('   Atualizando banco com a assinatura ativa do Stripe...');
          console.log('');
        }
      } else {
        console.log('⚠️  Nenhuma assinatura ativa encontrada no Stripe.');
        console.log('   Total de assinaturas:', stripeSubs.data.length);
        stripeSubs.data.forEach((s, i) => {
          console.log(`   ${i + 1}. ${s.id} - Status: ${s.status}`);
        });
        console.log('');
      }
    } catch (stripeError) {
      console.error('❌ Erro ao buscar no Stripe:', stripeError.message);
      console.log('   Continuando com atualização manual do status...');
      console.log('');
    }
  } else {
    console.log('⚠️  Não há Stripe Customer ID na assinatura do banco.');
    console.log('   Atualizando apenas o status...');
    console.log('');
  }

  // 5. Preparar dados para atualização
  const updateData = {
    status: activeStripeSubscription ? activeStripeSubscription.status : 'active',
    updated_at: new Date().toISOString()
  };
  
  // Se encontrou assinatura ativa diferente no Stripe, atualizar também o ID
  if (activeStripeSubscription && activeStripeSubscription.id !== subscription.stripe_subscription_id) {
    updateData.stripe_subscription_id = activeStripeSubscription.id;
    updateData.stripe_price_id = activeStripeSubscription.items.data[0]?.price?.id || subscription.stripe_price_id;
    updateData.current_period_start = new Date(activeStripeSubscription.current_period_start * 1000).toISOString();
    updateData.current_period_end = new Date(activeStripeSubscription.current_period_end * 1000).toISOString();
    updateData.cancel_at_period_end = activeStripeSubscription.cancel_at_period_end;
    
    if (activeStripeSubscription.canceled_at) {
      updateData.canceled_at = new Date(activeStripeSubscription.canceled_at * 1000).toISOString();
    } else {
      updateData.canceled_at = null;
    }
  }

  console.log('⚠️  ATENÇÃO: Esta operação irá atualizar:');
  console.log(`   Status: "${subscription.status}" → "${updateData.status}"`);
  if (updateData.stripe_subscription_id) {
    console.log(`   Stripe Subscription ID: "${subscription.stripe_subscription_id}" → "${updateData.stripe_subscription_id}"`);
  }
  console.log('');
  console.log('   Atualizando...');
  console.log('');

  // 6. Atualizar no banco
  const { data: updated, error: updateError } = await supabase
    .from('subscriptions')
    .update(updateData)
    .eq('user_id', user.id)
    .select();

  if (updateError) {
    console.error('❌ Erro ao atualizar assinatura:', updateError);
    console.error('   Código:', updateError.code);
    console.error('   Mensagem:', updateError.message);
    console.error('   Detalhes:', updateError.details);
    process.exit(1);
  }

  console.log('✅ Assinatura atualizada com sucesso!');
  console.log('');
  console.log('📋 Nova assinatura:');
  console.log('   Status:', updated[0].status);
  if (updated[0].stripe_subscription_id) {
    console.log('   Stripe Subscription ID:', updated[0].stripe_subscription_id);
  }
  console.log('   Updated At:', updated[0].updated_at);
  console.log('');
  console.log('🎉 Pronto! O usuário agora deve ser reconhecido como PRO.');
  console.log('');
  console.log('💡 Dica: O usuário precisa fazer logout e login novamente');
  console.log('   para que as mudanças sejam refletidas no app.');
}

updateSubscriptionStatus().catch(error => {
  console.error('❌ Erro durante atualização:', error);
  process.exit(1);
});

