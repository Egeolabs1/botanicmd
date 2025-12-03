import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * API Route para limpeza automática de assinaturas inválidas
 * 
 * Esta rota é chamada automaticamente pelo Vercel Cron Jobs
 * para verificar e corrigir assinaturas inválidas no banco de dados.
 * 
 * Configuração no vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-subscriptions",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 */

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Verificar se é uma requisição do cron job do Vercel
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET || process.env.CLEANUP_SECRET;
  
  // Vercel Cron Jobs enviam um header Authorization
  // Se não tiver, verificar se é uma chamada interna do Vercel
  if (authHeader && cronSecret) {
    const expectedToken = `Bearer ${cronSecret}`;
    if (authHeader !== expectedToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas');
    }

    console.log('🔄 Iniciando limpeza automática de assinaturas inválidas...');

    // Chamar a Edge Function do Supabase
    const response = await fetch(
      `${supabaseUrl}/functions/v1/cleanup-invalid-subscriptions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao executar limpeza');
    }

    console.log('✅ Limpeza executada com sucesso:', data);

    return res.status(200).json({
      success: true,
      message: 'Limpeza executada com sucesso',
      timestamp: new Date().toISOString(),
      data,
    });
  } catch (error: any) {
    console.error('❌ Erro ao executar limpeza:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor',
      timestamp: new Date().toISOString(),
    });
  }
}






