#!/usr/bin/env node

/**
 * Script de Diagnóstico Completo
 * Verifica TUDO relacionado à conta Pro
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { loadEnv } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET = env.STRIPE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados no .env.local');
  process.exit(1);
}

if (!STRIPE_SECRET) {
  console.error('❌ Erro: STRIPE_SECRET_KEY não configurada no .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const stripe = new Stripe(STRIPE_SECRET, { apiVersion: '2023-10-16' });

async function diagnosticoCompleto() {
  console.log('🔍 DIAGNÓSTICO COMPLETO - CONTA PRO\n');
  console.log('=' .repeat(80));

  // Pede o email do usuário
  const email = process.argv[2];
  
  if (!email) {
    console.error('❌ Por favor, forneça o email do usuário:');
    console.error('   npm run diagnostico -- seu@email.com');
    process.exit(1);
  }

  console.log(`📧 Email: ${email}\n`);

  // 1. Buscar usuário no Supabase Auth
  console.log('1️⃣ VERIFICANDO USUÁRIO NO SUPABASE AUTH');
  console.log('-'.repeat(80));
  
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error('❌ Erro ao buscar usuários:', usersError);
    return;
  }

  const user = users.find(u => u.email === email);
  
  if (!user) {
    console.error(`❌ Usuário não encontrado: ${email}`);
    return;
  }

  console.log(`✅ Usuário encontrado:`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Criado em: ${user.created_at}`);
  console.log(`   Último login: ${user.last_sign_in_at || 'Nunca'}\n`);

  // 2. Buscar assinatura no banco de dados
  console.log('2️⃣ VERIFICANDO ASSINATURA NO BANCO DE DADOS');
  console.log('-'.repeat(80));
  
  const { data: subscriptions, error: subError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id);

  if (subError) {
    console.error('❌ Erro ao buscar assinatura:', subError);
    console.log('   Isso pode indicar que a tabela subscriptions não existe ou RLS está bloqueando\n');
  } else if (!subscriptions || subscriptions.length === 0) {
    console.log('❌ Nenhuma assinatura encontrada no banco de dados');
    console.log('   O usuário NÃO tem registro na tabela subscriptions');
    console.log('   Isso fará com que o sistema trate como FREE\n');
  } else {
    const sub = subscriptions[0];
    console.log(`✅ Assinatura encontrada:`);
    console.log(`   ID: ${sub.id}`);
    console.log(`   Status: ${sub.status} ${getStatusEmoji(sub.status)}`);
    console.log(`   Tipo de Plano: ${sub.plan_type}`);
    console.log(`   Stripe Customer ID: ${sub.stripe_customer_id || 'N/A'}`);
    console.log(`   Stripe Subscription ID: ${sub.stripe_subscription_id || 'N/A'}`);
    console.log(`   Stripe Price ID: ${sub.stripe_price_id}`);
    console.log(`   Criado em: ${sub.created_at}`);
    console.log(`   Atualizado em: ${sub.updated_at}`);
    
    if (sub.current_period_start) {
      console.log(`   Período atual: ${sub.current_period_start} até ${sub.current_period_end}`);
    }
    
    if (sub.canceled_at) {
      console.log(`   ⚠️ Cancelado em: ${sub.canceled_at}`);
    }
    
    console.log();

    // Verificar se o status está correto
    if (sub.status !== 'active' && sub.status !== 'trialing') {
      console.log(`\n❌ PROBLEMA CRÍTICO IDENTIFICADO:`);
      console.log(`   ════════════════════════════════════════════════════════════`);
      console.log(`   O sistema ENCONTROU sua assinatura no banco de dados!`);
      console.log(`   MAS o status é "${sub.status}" em vez de "active" ou "trialing"`);
      console.log(`   ════════════════════════════════════════════════════════════`);
      console.log(`\n   📋 Como o sistema funciona:`);
      console.log(`   1. Sistema busca assinatura no banco ✅ (ENCONTROU)`);
      console.log(`   2. Sistema verifica o status: "${sub.status}"`);
      console.log(`   3. Sistema verifica se é 'active' ou 'trialing': ❌ NÃO É`);
      console.log(`   4. Sistema retorna plano: FREE (porque status inválido)`);
      console.log(`\n   💡 Por isso você perde o acesso PRO!`);
      console.log(`   O sistema encontra a assinatura, mas rejeita porque o status está errado.\n`);
    }

    // 3. Verificar no Stripe (se tiver subscription ID)
    if (sub.stripe_subscription_id) {
      console.log('3️⃣ VERIFICANDO NO STRIPE');
      console.log('-'.repeat(80));
      
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
        
        console.log(`✅ Assinatura encontrada no Stripe:`);
        console.log(`   ID: ${stripeSubscription.id}`);
        console.log(`   Status: ${stripeSubscription.status} ${getStatusEmoji(stripeSubscription.status)}`);
        console.log(`   Customer: ${stripeSubscription.customer}`);
        console.log(`   Plano: ${stripeSubscription.items.data[0]?.price?.id || 'N/A'}`);
        console.log(`   Valor: ${(stripeSubscription.items.data[0]?.price?.unit_amount || 0) / 100} ${stripeSubscription.currency.toUpperCase()}`);
        console.log(`   Período atual: ${new Date(stripeSubscription.current_period_start * 1000).toISOString()}`);
        console.log(`   Até: ${new Date(stripeSubscription.current_period_end * 1000).toISOString()}`);
        console.log(`   Cancelar no fim do período: ${stripeSubscription.cancel_at_period_end ? 'Sim' : 'Não'}`);
        
        if (stripeSubscription.canceled_at) {
          console.log(`   ⚠️ Cancelado em: ${new Date(stripeSubscription.canceled_at * 1000).toISOString()}`);
        }
        
        console.log();

        // Comparar status Stripe vs Banco
        if (stripeSubscription.status !== sub.status) {
          console.log(`⚠️ INCONSISTÊNCIA DETECTADA:`);
          console.log(`   Status no banco: ${sub.status}`);
          console.log(`   Status no Stripe: ${stripeSubscription.status}`);
          console.log(`   Os status não estão sincronizados!\n`);
        }
      } catch (stripeError) {
        console.error(`❌ Erro ao buscar no Stripe:`, stripeError.message);
        console.log(`   A assinatura pode ter sido deletada no Stripe\n`);
      }
    }

    // 4. Verificar Customer no Stripe (se tiver customer ID)
    if (sub.stripe_customer_id) {
      console.log('4️⃣ VERIFICANDO CUSTOMER NO STRIPE');
      console.log('-'.repeat(80));
      
      try {
        const customer = await stripe.customers.retrieve(sub.stripe_customer_id);
        
        if (customer.deleted) {
          console.log(`❌ Customer foi deletado no Stripe`);
        } else {
          console.log(`✅ Customer encontrado:`);
          console.log(`   ID: ${customer.id}`);
          console.log(`   Email: ${customer.email}`);
          console.log(`   Nome: ${customer.name || 'N/A'}`);
          
          // Listar todas as assinaturas do customer
          const customerSubs = await stripe.subscriptions.list({
            customer: customer.id,
            limit: 10
          });
          
          console.log(`   Total de assinaturas: ${customerSubs.data.length}`);
          
          if (customerSubs.data.length > 0) {
            console.log(`   Assinaturas:`);
            customerSubs.data.forEach((s, i) => {
              console.log(`      ${i + 1}. ${s.id} - Status: ${s.status} ${getStatusEmoji(s.status)}`);
            });
          }
        }
        console.log();
      } catch (customerError) {
        console.error(`❌ Erro ao buscar customer:`, customerError.message);
        console.log();
      }
    }
  }

  // 5. Resumo e Recomendações
  console.log('5️⃣ RESUMO E RECOMENDAÇÕES');
  console.log('-'.repeat(80));
  
  if (!subscriptions || subscriptions.length === 0) {
    console.log('❌ PROBLEMA: Nenhuma assinatura no banco de dados');
    console.log('\n📋 Soluções:');
    console.log('   1. Verificar se o webhook do Stripe está processando corretamente');
    console.log('   2. Verificar os logs do webhook no Stripe Dashboard');
    console.log('   3. Reprocessar o webhook manualmente no Stripe');
    console.log('   4. Ou criar a assinatura manualmente no banco (apenas para testes)');
  } else {
    const sub = subscriptions[0];
    
    if (sub.status === 'active' || sub.status === 'trialing') {
      console.log('✅ Tudo parece estar correto!');
      console.log('   A assinatura está ativa e o usuário deve ter acesso PRO');
      console.log('\n🤔 Se o usuário ainda não tem acesso:');
      console.log('   1. Peça para fazer logout e login novamente');
      console.log('   2. Limpe o localStorage do navegador');
      console.log('   3. Verifique o console do navegador por erros');
    } else {
      console.log(`❌ PROBLEMA: Status da assinatura é "${sub.status}"`);
      console.log('\n📋 Soluções:');
      console.log(`   1. Executar: npm run fix:subscription-status -- ${email}`);
      console.log('   2. Verificar no Stripe se a assinatura está realmente ativa');
      console.log('   3. Se estiver ativa no Stripe, sincronizar com o banco');
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('Diagnóstico concluído!\n');
}

function getStatusEmoji(status) {
  const emojis = {
    'active': '✅',
    'trialing': '🆓',
    'incomplete': '⏳',
    'incomplete_expired': '❌',
    'past_due': '⚠️',
    'canceled': '❌',
    'unpaid': '❌'
  };
  return emojis[status] || '❓';
}

diagnosticoCompleto().catch(console.error);

