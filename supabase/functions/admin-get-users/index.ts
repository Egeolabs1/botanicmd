// Supabase Edge Function: admin-get-users
// Busca todos os usuários do Supabase para o Admin Dashboard

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar cliente Supabase com service_role para acesso admin
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar se o usuário autenticado é admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await adminClient.auth.getUser(token);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Lista de emails admin (pode ser melhorado com tabela de permissões)
    const adminEmails = [
      'admin@botanicmd.com',
      'admin@egeolabs.com',
      'ngfilho@gmail.com',
    ];

    if (!adminEmails.includes(user.email?.toLowerCase() || '')) {
      return new Response(
        JSON.stringify({ error: "Acesso negado. Apenas administradores podem acessar." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar todos os usuários usando Admin API
    const { data: { users }, error: usersError } = await adminClient.auth.admin.listUsers();

    if (usersError) {
      throw usersError;
    }

    // Buscar assinaturas para obter planos
    const { data: subscriptions } = await adminClient
      .from('subscriptions')
      .select('user_id, plan_type, status');

    // Criar mapa de planos
    const planMap: Record<string, 'free' | 'pro'> = {};
    if (subscriptions) {
      subscriptions.forEach(sub => {
        if (sub.status === 'active' || sub.status === 'trialing') {
          planMap[sub.user_id] = 'pro';
        }
      });
    }

    // Buscar contagem de plantas por usuário
    const { data: plantsData } = await adminClient
      .from('plants')
      .select('user_id');

    const usageMap: Record<string, number> = {};
    if (plantsData) {
      plantsData.forEach(plant => {
        usageMap[plant.user_id] = (usageMap[plant.user_id] || 0) + 1;
      });
    }

    // Mapear usuários para o formato do app
    const mappedUsers = users.map(sbUser => {
      const userId = sbUser.id;
      const plan = planMap[userId] || 'free';
      const usageCount = usageMap[userId] || 0;

      return {
        id: userId,
        name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Usuário',
        email: sbUser.email || '',
        plan: plan,
        usageCount: usageCount,
        maxUsage: plan === 'pro' ? -1 : 3,
      };
    });

    return new Response(
      JSON.stringify({ data: mappedUsers }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Erro ao buscar usuários:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

