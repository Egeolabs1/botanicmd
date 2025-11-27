/**
 * Script para Atualizar Status de Assinatura para 'active'
 * 
 * Use este script para corrigir assinaturas que estão com status 'incomplete'
 * mas o pagamento foi realmente processado
 */

import { createClient } from '@supabase/supabase-js';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');

const SUPABASE_URL = env.VITE_SUPABASE_URL || env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_KEY || env.REACT_APP_SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente SUPABASE_URL ou SUPABASE_KEY não configuradas.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
  const { data: { user }, error: userError } = await supabase.auth.admin.getUserByEmail(userEmail);
  
  if (userError || !user) {
    console.error('❌ Erro ao buscar usuário:', userError?.message || 'Usuário não encontrado');
    console.log('\n💡 Dica: Certifique-se de que o email está correto e o usuário existe.');
    process.exit(1);
  }

  console.log('✅ Usuário encontrado:', user.id);
  console.log('');

  // 2. Buscar assinatura
  console.log('🔍 Buscando assinatura...');
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
    console.error('❌ Nenhuma assinatura encontrada para este usuário.');
    process.exit(1);
  }

  console.log('📋 Assinatura encontrada:');
  console.log('   ID:', subscription.id);
  console.log('   Status atual:', subscription.status);
  console.log('   Plan Type:', subscription.plan_type);
  console.log('   Stripe Subscription ID:', subscription.stripe_subscription_id || 'N/A');
  console.log('');

  // 3. Verificar se precisa atualizar
  if (subscription.status === 'active' || subscription.status === 'trialing') {
    console.log('✅ Assinatura já está ativa! Status:', subscription.status);
    console.log('   Nenhuma atualização necessária.');
    return;
  }

  // 4. Confirmar atualização
  console.log('⚠️  ATENÇÃO: Esta operação irá atualizar o status de');
  console.log(`   "${subscription.status}" para "active"`);
  console.log('');
  console.log('   Deseja continuar? (S/N)');
  
  // Em produção, você pode usar readline ou simplesmente atualizar
  // Para automação, vamos atualizar diretamente
  console.log('   Atualizando automaticamente...');
  console.log('');

  // 5. Atualizar status
  const { data: updated, error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      updated_at: new Date().toISOString()
    })
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
  console.log('   Updated At:', updated[0].updated_at);
  console.log('');
  console.log('🎉 Pronto! O usuário agora deve ser reconhecido como PRO.');
  console.log('');
  console.log('💡 Dica: O usuário pode precisar fazer logout e login novamente');
  console.log('   para que as mudanças sejam refletidas no app.');
}

updateSubscriptionStatus().catch(error => {
  console.error('❌ Erro durante atualização:', error);
  process.exit(1);
});

