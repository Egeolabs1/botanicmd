/**
 * Script para Verificar e Corrigir Usuários com Status PRO Incorreto
 * 
 * Este script:
 * 1. Lista todos os usuários com assinaturas "active" no banco
 * 2. Verifica no Stripe se eles realmente têm uma assinatura ativa
 * 3. Corrige os que estão incorretos
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { loadEnv } from 'vite';

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
  console.error('');
  console.error('   Exemplo de .env.local:');
  console.error('   VITE_SUPABASE_URL=https://xxxxx.supabase.co');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  console.error('   STRIPE_SECRET_KEY=sk_live_... ou sk_test_...');
  console.error('');
  if (existsSync(envPath)) {
    console.error(`   ✅ Arquivo .env.local encontrado em: ${envPath}`);
    console.error('   ⚠️ Mas as variáveis não foram carregadas. Verifique a formatação.');
  } else {
    console.error(`   ❌ Arquivo .env.local NÃO encontrado em: ${envPath}`);
    console.error('   💡 Crie o arquivo .env.local na raiz do projeto.');
  }
  process.exit(1);
}

if (!STRIPE_SECRET_KEY) {
  console.error('❌ Erro: STRIPE_SECRET_KEY não configurada.');
  console.error('   Necessário para verificar assinaturas no Stripe.');
  console.error('   Adicione STRIPE_SECRET_KEY no arquivo .env.local');
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

async function verifyProUsers() {
  console.log('🔍 Verificando usuários com status PRO...\n');

  try {
    // 1. Buscar todas as assinaturas com status "active" ou "trialing"
    console.log('1️⃣ Buscando assinaturas ativas no banco de dados...');
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*, user_id, stripe_subscription_id, status, plan_type')
      .in('status', ['active', 'trialing']);

    if (subError) {
      console.error('❌ Erro ao buscar assinaturas:', subError);
      return;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('✅ Nenhuma assinatura ativa encontrada no banco.');
      return;
    }

    console.log(`   📊 Encontradas ${subscriptions.length} assinaturas ativas no banco\n`);

    // 2. Buscar emails dos usuários
    console.log('2️⃣ Buscando informações dos usuários...');
    const userIds = [...new Set(subscriptions.map(s => s.user_id))];
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      return;
    }

    const userMap = new Map();
    users.users.forEach(u => {
      userMap.set(u.id, u);
    });

    console.log(`   📊 ${userIds.length} usuários únicos com assinaturas ativas\n`);

    // 3. Verificar cada assinatura no Stripe
    console.log('3️⃣ Verificando assinaturas no Stripe...\n');
    const issues = [];
    const valid = [];

    for (const subscription of subscriptions) {
      const user = userMap.get(subscription.user_id);
      const email = user?.email || 'N/A';
      const stripeSubId = subscription.stripe_subscription_id;

      console.log(`   🔍 Verificando: ${email}`);
      console.log(`      Subscription ID (DB): ${subscription.id}`);
      console.log(`      Stripe Subscription ID: ${stripeSubId || 'N/A'}`);
      console.log(`      Status (DB): ${subscription.status}`);

      if (!stripeSubId) {
        console.log(`      ⚠️ PROBLEMA: Sem stripe_subscription_id no banco`);
        issues.push({
          subscription,
          user,
          issue: 'missing_stripe_id',
          message: 'Assinatura no banco não tem stripe_subscription_id'
        });
        console.log('');
        continue;
      }

      try {
        // Verificar no Stripe
        const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
        
        console.log(`      Status (Stripe): ${stripeSub.status}`);
        console.log(`      Cancelado: ${stripeSub.cancel_at_period_end ? 'Sim (ao final do período)' : 'Não'}`);

        // Verificar se está realmente ativo no Stripe
        const isActiveInStripe = stripeSub.status === 'active' || stripeSub.status === 'trialing';
        const isActiveInDB = subscription.status === 'active' || subscription.status === 'trialing';

        if (isActiveInDB && !isActiveInStripe) {
          console.log(`      ❌ PROBLEMA: Ativo no banco mas não no Stripe!`);
          issues.push({
            subscription,
            user,
            stripeSub,
            issue: 'inactive_in_stripe',
            message: `Status no banco: ${subscription.status}, Status no Stripe: ${stripeSub.status}`
          });
        } else if (isActiveInStripe && isActiveInDB) {
          console.log(`      ✅ Válido: Ativo em ambos`);
          valid.push({ subscription, user, stripeSub });
        } else {
          console.log(`      ⚠️ Status diferente entre banco e Stripe`);
          issues.push({
            subscription,
            user,
            stripeSub,
            issue: 'status_mismatch',
            message: `Status no banco: ${subscription.status}, Status no Stripe: ${stripeSub.status}`
          });
        }
      } catch (stripeError) {
        if (stripeError.code === 'resource_missing') {
          console.log(`      ❌ PROBLEMA: Assinatura não existe no Stripe!`);
          issues.push({
            subscription,
            user,
            issue: 'not_found_in_stripe',
            message: 'Assinatura não encontrada no Stripe'
          });
        } else {
          console.log(`      ❌ Erro ao verificar no Stripe: ${stripeError.message}`);
          issues.push({
            subscription,
            user,
            issue: 'stripe_error',
            message: stripeError.message
          });
        }
      }

      console.log('');
    }

    // 4. Resumo
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO');
    console.log('='.repeat(60));
    console.log(`✅ Assinaturas válidas: ${valid.length}`);
    console.log(`❌ Problemas encontrados: ${issues.length}\n`);

    if (issues.length > 0) {
      console.log('🔧 PROBLEMAS ENCONTRADOS:\n');
      issues.forEach((issue, index) => {
        const email = issue.user?.email || 'N/A';
        console.log(`${index + 1}. ${email}`);
        console.log(`   Tipo: ${issue.issue}`);
        console.log(`   Mensagem: ${issue.message}`);
        console.log(`   Subscription ID (DB): ${issue.subscription.id}`);
        console.log(`   User ID: ${issue.subscription.user_id}`);
        console.log('');
      });

      // 5. Perguntar se deseja corrigir
      console.log('\n💡 Para corrigir automaticamente, execute:');
      console.log('   node scripts/fix-invalid-pro-users.mjs');
      console.log('\n   Ou corrija manualmente no Supabase Dashboard.');
    } else {
      console.log('✅ Todas as assinaturas estão corretas!');
    }

  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
    process.exit(1);
  }
}

verifyProUsers().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

