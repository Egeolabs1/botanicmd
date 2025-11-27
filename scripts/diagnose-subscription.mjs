/**
 * Script de Diagnóstico de Assinaturas
 * 
 * Verifica se a tabela subscriptions existe, se há dados,
 * e se as políticas RLS estão configuradas corretamente
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { loadEnv } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');

const SUPABASE_URL = env.VITE_SUPABASE_URL || env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_KEY || env.REACT_APP_SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente SUPABASE_URL ou SUPABASE_KEY não configuradas.');
  console.error('   Verifique se .env.local existe e contém essas variáveis.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function diagnose() {
  console.log('🔍 Iniciando diagnóstico de assinaturas...\n');

  // 1. Verificar autenticação
  console.log('1️⃣ Verificando autenticação...');
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    console.error('   ❌ Erro ao obter usuário:', userError.message);
    console.log('\n   💡 Dica: Faça login no app primeiro para ter um usuário autenticado.');
    return;
  }
  
  if (!user) {
    console.warn('   ⚠️ Nenhum usuário autenticado');
    console.log('\n   💡 Dica: Faça login no app primeiro.');
    return;
  }
  
  console.log('   ✅ Usuário autenticado:', user.email);
  console.log('   📋 User ID:', user.id);
  console.log('');

  // 2. Verificar se consegue acessar a tabela
  console.log('2️⃣ Verificando acesso à tabela subscriptions...');
  const { data: subscriptions, error: queryError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id);

  if (queryError) {
    console.error('   ❌ Erro ao consultar tabela:', queryError);
    console.error('   Código:', queryError.code);
    console.error('   Status:', queryError.statusCode);
    console.error('   Mensagem:', queryError.message);
    console.error('   Detalhes:', queryError.details);
    console.error('   Hint:', queryError.hint);
    
    if (queryError.code === 'PGRST301' || queryError.statusCode === 406) {
      console.log('\n   💡 Possíveis causas:');
      console.log('      - Tabela subscriptions não existe');
      console.log('      - RLS está bloqueando o acesso');
      console.log('      - Política RLS não permite SELECT para este usuário');
      console.log('\n   🔧 Solução: Execute a migration:');
      console.log('      supabase/migrations/20250101000000_create_subscriptions_table.sql');
    }
    return;
  }

  console.log('   ✅ Tabela acessível');
  console.log('   📊 Assinaturas encontradas:', subscriptions?.length || 0);
  console.log('');

  // 3. Listar assinaturas
  if (subscriptions && subscriptions.length > 0) {
    console.log('3️⃣ Assinaturas encontradas:');
    subscriptions.forEach((sub, index) => {
      console.log(`\n   📋 Assinatura ${index + 1}:`);
      console.log('      ID:', sub.id);
      console.log('      Status:', sub.status);
      console.log('      Plan Type:', sub.plan_type);
      console.log('      Stripe Subscription ID:', sub.stripe_subscription_id || 'N/A');
      console.log('      User ID:', sub.user_id);
      console.log('      Created At:', sub.created_at);
      console.log('      Updated At:', sub.updated_at);
      
      if (sub.status === 'active' || sub.status === 'trialing') {
        console.log('      ✅ Status válido para plano PRO');
      } else {
        console.log('      ⚠️ Status NÃO válido para plano PRO');
        console.log('         Status válidos: active, trialing');
      }
    });
  } else {
    console.log('3️⃣ Nenhuma assinatura encontrada');
    console.log('\n   💡 Possíveis causas:');
    console.log('      - Usuário não tem assinatura no banco');
    console.log('      - Webhook do Stripe não processou o pagamento');
    console.log('      - Assinatura foi criada mas não sincronizada');
    console.log('\n   🔧 Verifique:');
    console.log('      - Se o pagamento foi processado no Stripe');
    console.log('      - Se o webhook está configurado corretamente');
    console.log('      - Se o webhook processou o evento subscription.created ou customer.subscription.updated');
  }

  // 4. Verificar todas as assinaturas (sem filtro de user_id) - pode falhar por RLS
  console.log('\n4️⃣ Verificando políticas RLS...');
  const { data: allSubs, error: allError } = await supabase
    .from('subscriptions')
    .select('id, user_id, status')
    .limit(5);

  if (allError) {
    if (allError.code === '42501' || allError.message?.includes('permission denied')) {
      console.log('   ✅ RLS está funcionando (bloqueou acesso a outras assinaturas)');
    } else {
      console.log('   ⚠️ Erro ao verificar RLS:', allError.message);
    }
  } else {
    console.log('   ⚠️ RLS pode não estar configurado (conseguiu acessar outras assinaturas)');
    console.log('   📊 Total de assinaturas no sistema:', allSubs?.length || 0);
  }

  console.log('\n✅ Diagnóstico concluído!');
}

diagnose().catch(error => {
  console.error('❌ Erro durante diagnóstico:', error);
  process.exit(1);
});

