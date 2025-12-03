/**
 * Script para Corrigir Usuários com Status PRO Incorreto
 * 
 * Este script corrige automaticamente usuários que estão marcados como PRO
 * mas não têm uma assinatura ativa no Stripe.
 * 
 * ATENÇÃO: Este script modifica dados no banco. Use com cuidado!
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { loadEnv } from 'vite';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente usando Vite loadEnv
const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');

// Também tentar carregar manualmente do .env.local se loadEnv não funcionar
const envPath = join(process.cwd(), '.env.local');
if (existsSync(envPath)) {
  try {
    const envFile = readFileSync(envPath, 'utf-8');
    envFile.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          // Remove aspas se houver
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          if (!env[key]) {
            env[key] = value;
          }
        }
      }
    });
  } catch (e) {
    console.warn('⚠️ Aviso: Não foi possível ler .env.local:', e.message);
  }
}

// Mesclar com process.env (variáveis do sistema têm prioridade)
Object.keys(env).forEach(key => {
  if (!process.env[key]) {
    process.env[key] = env[key];
  }
});

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || env.STRIPE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente necessárias não configuradas.');
  console.error('');
  console.error('   Necessário:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('   Verifique se .env.local existe na raiz do projeto e contém essas variáveis.');
  if (existsSync(envPath)) {
    console.error(`   ✅ Arquivo .env.local encontrado em: ${envPath}`);
  } else {
    console.error(`   ❌ Arquivo .env.local NÃO encontrado em: ${envPath}`);
  }
  process.exit(1);
}

if (!STRIPE_SECRET_KEY) {
  console.error('❌ Erro: STRIPE_SECRET_KEY não configurada.');
  console.error('   Necessário para verificar assinaturas no Stripe.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function fixInvalidProUsers() {
  console.log('🔧 Script de Correção de Usuários PRO Inválidos\n');
  console.log('⚠️ ATENÇÃO: Este script irá modificar dados no banco de dados!\n');

  // Verificar se foi passado --yes ou --force como argumento
  const skipConfirmation = process.argv.includes('--yes') || process.argv.includes('--force');
  
  if (!skipConfirmation) {
    const confirm = await question('Deseja continuar? (digite "SIM" para confirmar): ');
    if (confirm !== 'SIM') {
      console.log('❌ Operação cancelada.');
      rl.close();
      return;
    }
  } else {
    console.log('✅ Modo automático ativado (--yes), pulando confirmação...\n');
  }

  try {
    // 1. Buscar todas as assinaturas com status "active" ou "trialing"
    console.log('\n1️⃣ Buscando assinaturas ativas no banco...');
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*, user_id, stripe_subscription_id, status, plan_type')
      .in('status', ['active', 'trialing']);

    if (subError) {
      console.error('❌ Erro ao buscar assinaturas:', subError);
      rl.close();
      return;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('✅ Nenhuma assinatura ativa encontrada.');
      rl.close();
      return;
    }

    console.log(`   📊 Encontradas ${subscriptions.length} assinaturas\n`);

    // 2. Buscar emails dos usuários
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      rl.close();
      return;
    }

    const userMap = new Map();
    users.users.forEach(u => {
      userMap.set(u.id, u);
    });

    // 3. Verificar e corrigir cada assinatura
    console.log('2️⃣ Verificando e corrigindo assinaturas...\n');
    const fixed = [];
    const errors = [];

    for (const subscription of subscriptions) {
      const user = userMap.get(subscription.user_id);
      const email = user?.email || 'N/A';
      const stripeSubId = subscription.stripe_subscription_id;

      if (!stripeSubId) {
        console.log(`   ❌ ${email}: Sem stripe_subscription_id, marcando como canceled`);
        const { error } = await supabase
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('id', subscription.id);
        
        if (error) {
          console.log(`      Erro ao atualizar: ${error.message}`);
          errors.push({ subscription, error: error.message });
        } else {
          console.log(`      ✅ Corrigido`);
          fixed.push({ subscription, user, action: 'marked_canceled' });
        }
        continue;
      }

      try {
        const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
        const isActiveInStripe = stripeSub.status === 'active' || stripeSub.status === 'trialing';
        const isActiveInDB = subscription.status === 'active' || subscription.status === 'trialing';

        if (isActiveInDB && !isActiveInStripe) {
          console.log(`   ❌ ${email}: Ativo no banco mas não no Stripe (${stripeSub.status})`);
          
          // Atualizar status no banco para refletir o Stripe
          const newStatus = stripeSub.status === 'canceled' ? 'canceled' : 
                           stripeSub.status === 'past_due' ? 'past_due' :
                           stripeSub.status === 'unpaid' ? 'unpaid' : 'canceled';
          
          const { error } = await supabase
            .from('subscriptions')
            .update({ status: newStatus })
            .eq('id', subscription.id);
          
          if (error) {
            console.log(`      Erro ao atualizar: ${error.message}`);
            errors.push({ subscription, error: error.message });
          } else {
            console.log(`      ✅ Status atualizado para: ${newStatus}`);
            fixed.push({ subscription, user, action: `updated_to_${newStatus}` });
          }
        } else if (!isActiveInStripe && stripeSub.status === 'canceled') {
          console.log(`   ❌ ${email}: Assinatura cancelada no Stripe`);
          
          const { error } = await supabase
            .from('subscriptions')
            .update({ status: 'canceled' })
            .eq('id', subscription.id);
          
          if (error) {
            console.log(`      Erro ao atualizar: ${error.message}`);
            errors.push({ subscription, error: error.message });
          } else {
            console.log(`      ✅ Status atualizado para: canceled`);
            fixed.push({ subscription, user, action: 'marked_canceled' });
          }
        } else {
          console.log(`   ✅ ${email}: Status correto`);
        }
      } catch (stripeError) {
        if (stripeError.code === 'resource_missing') {
          console.log(`   ❌ ${email}: Assinatura não existe no Stripe, marcando como canceled`);
          
          const { error } = await supabase
            .from('subscriptions')
            .update({ status: 'canceled' })
            .eq('id', subscription.id);
          
          if (error) {
            console.log(`      Erro ao atualizar: ${error.message}`);
            errors.push({ subscription, error: error.message });
          } else {
            console.log(`      ✅ Corrigido`);
            fixed.push({ subscription, user, action: 'marked_canceled_not_found' });
          }
        } else {
          console.log(`   ⚠️ ${email}: Erro ao verificar no Stripe: ${stripeError.message}`);
          errors.push({ subscription, error: stripeError.message });
        }
      }
    }

    // 4. Resumo
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA CORREÇÃO');
    console.log('='.repeat(60));
    console.log(`✅ Corrigidos: ${fixed.length}`);
    console.log(`❌ Erros: ${errors.length}\n`);

    if (fixed.length > 0) {
      console.log('✅ ASSINATURAS CORRIGIDAS:\n');
      fixed.forEach((fix, index) => {
        const email = fix.user?.email || 'N/A';
        console.log(`${index + 1}. ${email}`);
        console.log(`   Ação: ${fix.action}`);
        console.log(`   Subscription ID: ${fix.subscription.id}`);
        console.log('');
      });
    }

    if (errors.length > 0) {
      console.log('❌ ERROS ENCONTRADOS:\n');
      errors.forEach((err, index) => {
        const email = err.subscription?.user_id || 'N/A';
        console.log(`${index + 1}. ${email}`);
        console.log(`   Erro: ${err.error}`);
        console.log('');
      });
    }

    console.log('\n✅ Correção concluída!');

  } catch (error) {
    console.error('❌ Erro durante correção:', error);
  } finally {
    rl.close();
  }
}

fixInvalidProUsers().catch(error => {
  console.error('❌ Erro fatal:', error);
  rl.close();
  process.exit(1);
});

