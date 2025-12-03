// Supabase Edge Function: cleanup-invalid-subscriptions
// Executa automaticamente para limpar assinaturas inválidas

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2024-11-20.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verificar autenticação (apenas service role pode executar)
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    // Aceitar service role key (vem da API route do Vercel)
    // Ou CLEANUP_SECRET como fallback para chamadas diretas
    if (token !== supabaseServiceKey) {
      const cleanupSecret = Deno.env.get("CLEANUP_SECRET");
      if (!cleanupSecret || token !== cleanupSecret) {
        return new Response(
          JSON.stringify({ error: "Unauthorized - Invalid token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("🔍 Iniciando limpeza de assinaturas inválidas...");

    // 1. Buscar todas as assinaturas "active" ou "trialing"
    const { data: subscriptions, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .in("status", ["active", "trialing"]);

    if (subError) {
      console.error("❌ Erro ao buscar assinaturas:", subError);
      return new Response(
        JSON.stringify({ error: subError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("✅ Nenhuma assinatura ativa encontrada");
      return new Response(
        JSON.stringify({ message: "Nenhuma assinatura para verificar", fixed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📊 Encontradas ${subscriptions.length} assinaturas ativas`);

    const fixed = [];
    const errors = [];

    // 2. Verificar cada assinatura
    for (const subscription of subscriptions) {
      const stripeSubId = subscription.stripe_subscription_id;
      const planType = subscription.plan_type;

      // Caso 1: Assinatura recorrente sem stripe_subscription_id
      if (!stripeSubId && planType !== 'lifetime') {
        console.log(`❌ Assinatura ${subscription.id}: recorrente sem stripe_subscription_id, marcando como canceled`);
        const { error } = await supabase
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("id", subscription.id);
        
        if (error) {
          errors.push({ subscription_id: subscription.id, error: error.message });
        } else {
          fixed.push({ subscription_id: subscription.id, action: "marked_canceled_no_stripe_id" });
        }
        continue;
      }

      // Caso 2: Assinatura com stripe_subscription_id que não existe no Stripe
      if (stripeSubId) {
        try {
          const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
          const isActiveInStripe = stripeSub.status === 'active' || stripeSub.status === 'trialing';
          const isActiveInDB = subscription.status === 'active' || subscription.status === 'trialing';

          if (isActiveInDB && !isActiveInStripe) {
            console.log(`❌ Assinatura ${subscription.id}: ativa no banco mas não no Stripe (${stripeSub.status})`);
            const newStatus = stripeSub.status === 'canceled' ? 'canceled' : 
                             stripeSub.status === 'past_due' ? 'past_due' :
                             stripeSub.status === 'unpaid' ? 'unpaid' : 'canceled';
            
            const { error } = await supabase
              .from("subscriptions")
              .update({ status: newStatus })
              .eq("id", subscription.id);
            
            if (error) {
              errors.push({ subscription_id: subscription.id, error: error.message });
            } else {
              fixed.push({ subscription_id: subscription.id, action: `updated_to_${newStatus}` });
            }
          }
        } catch (stripeError: any) {
          if (stripeError.code === 'resource_missing') {
            console.log(`❌ Assinatura ${subscription.id}: não existe no Stripe, marcando como canceled`);
            const { error } = await supabase
              .from("subscriptions")
              .update({ status: "canceled" })
              .eq("id", subscription.id);
            
            if (error) {
              errors.push({ subscription_id: subscription.id, error: error.message });
            } else {
              fixed.push({ subscription_id: subscription.id, action: "marked_canceled_not_found" });
            }
          } else {
            console.error(`⚠️ Erro ao verificar assinatura ${subscription.id} no Stripe:`, stripeError.message);
            errors.push({ subscription_id: subscription.id, error: stripeError.message });
          }
        }
      }
    }

    console.log(`✅ Limpeza concluída: ${fixed.length} corrigidas, ${errors.length} erros`);

    return new Response(
      JSON.stringify({
        message: "Limpeza concluída",
        total: subscriptions.length,
        fixed: fixed.length,
        errors: errors.length,
        details: { fixed, errors }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Erro ao processar limpeza:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

