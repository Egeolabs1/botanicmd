// Supabase Edge Function: create-checkout
// Cria uma sessão de checkout do Stripe para o usuário autenticado

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2024-11-20.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    console.log("🚀 create-checkout: Iniciando requisição...");
    
    // Verificar autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("❌ create-checkout: Authorization header ausente");
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar variáveis de ambiente
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!supabaseUrl) {
      console.error("❌ create-checkout: SUPABASE_URL não configurado");
      return new Response(
        JSON.stringify({ error: "Configuração do servidor incompleta: SUPABASE_URL" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!supabaseKey) {
      console.error("❌ create-checkout: SUPABASE_SERVICE_ROLE_KEY não configurado");
      return new Response(
        JSON.stringify({ error: "Configuração do servidor incompleta: SUPABASE_SERVICE_ROLE_KEY" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!stripeSecretKey) {
      console.error("❌ create-checkout: STRIPE_SECRET_KEY não configurado");
      return new Response(
        JSON.stringify({ error: "Configuração do servidor incompleta: STRIPE_SECRET_KEY" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar cliente Supabase
    console.log("✅ create-checkout: Criando cliente Supabase...");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar usuário autenticado
    const token = authHeader.replace("Bearer ", "");
    console.log("🔍 create-checkout: Verificando autenticação do usuário...");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError) {
      console.error("❌ create-checkout: Erro ao verificar autenticação:", authError.message);
      return new Response(
        JSON.stringify({ error: "Erro de autenticação", details: authError.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!user) {
      console.error("❌ create-checkout: Usuário não encontrado");
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ create-checkout: Usuário autenticado: ${user.email} (${user.id})`);

    // Obter dados do corpo da requisição
    console.log("📥 create-checkout: Lendo corpo da requisição...");
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("✅ create-checkout: Corpo recebido:", JSON.stringify(requestBody));
    } catch (jsonError) {
      console.error("❌ create-checkout: Erro ao parsear JSON:", jsonError);
      return new Response(
        JSON.stringify({ error: "Erro ao processar requisição", details: "JSON inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { priceId, planType, currency, successUrl, cancelUrl } = requestBody;

    if (!priceId || !planType) {
      console.error("❌ create-checkout: Dados obrigatórios ausentes:", { priceId: !!priceId, planType: !!planType });
      return new Response(
        JSON.stringify({ error: "priceId e planType são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📋 create-checkout: Parâmetros recebidos - priceId: ${priceId}, planType: ${planType}, currency: ${currency || 'BRL'}`);

    // Buscar ou criar cliente Stripe
    let stripeCustomerId: string;

    // Verificar se o usuário já tem um customer_id no Stripe
    console.log("🔍 create-checkout: Verificando se usuário já tem customer no Stripe...");
    const { data: existingSubscription, error: subError } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle(); // Usa maybeSingle() para não falhar se não existir

    if (subError && subError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error("⚠️ create-checkout: Erro ao buscar subscription (continuando):", subError.message);
    }

    if (existingSubscription?.stripe_customer_id) {
      stripeCustomerId = existingSubscription.stripe_customer_id;
      console.log(`✅ create-checkout: Customer existente encontrado: ${stripeCustomerId}`);
    } else {
      console.log("🆕 create-checkout: Criando novo customer no Stripe...");
      let customer;
      try {
        // Criar novo cliente no Stripe
        customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            supabase_user_id: user.id,
          },
        });
        stripeCustomerId = customer.id;
        console.log(`✅ create-checkout: Novo customer criado: ${stripeCustomerId}`);
      } catch (stripeError: any) {
        console.error("❌ create-checkout: Erro ao criar customer no Stripe:", stripeError.message);
        return new Response(
          JSON.stringify({ 
            error: "Erro ao criar cliente no Stripe",
            details: stripeError.message 
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Salvar customer_id no banco (opcional, pode ser feito no webhook também)
      // Nota: O stripe_price_id será atualizado quando o checkout for concluído
      // Tenta atualizar primeiro, se não existir, insere novo
      const { data: existing, error: checkError } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        // Atualiza registro existente
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            stripe_customer_id: customer.id,
            stripe_price_id: priceId,
            plan_type: planType,
            currency: currency || "BRL",
            status: "incomplete",
          })
          .eq("user_id", user.id);
        
        if (updateError) {
          console.error("⚠️ create-checkout: Erro ao atualizar customer no banco (continuando):", updateError.message);
        } else {
          console.log("✅ create-checkout: Customer salvo no banco (update)");
        }
      } else {
        // Insere novo registro
        const { error: insertError } = await supabase
          .from("subscriptions")
          .insert({
            user_id: user.id,
            stripe_customer_id: customer.id,
            stripe_price_id: priceId,
            plan_type: planType,
            currency: currency || "BRL",
            status: "incomplete",
          });
        
        if (insertError) {
          console.error("⚠️ create-checkout: Erro ao inserir customer no banco (continuando):", insertError.message);
          // Continua mesmo assim - o webhook pode criar/atualizar depois
        } else {
          console.log("✅ create-checkout: Customer salvo no banco (insert)");
        }
      }
    }

    // Criar sessão de checkout
    console.log("💳 create-checkout: Criando sessão de checkout no Stripe...");
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      mode: planType === "lifetime" ? "payment" : "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${req.headers.get("origin")}/app?session_id={CHECKOUT_SESSION_ID}&status=success`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/app?status=cancelled`,
      metadata: {
        user_id: user.id,
        plan_type: planType,
        currency: currency || "BRL",
      },
      allow_promotion_codes: true,
    };

    try {
      const session = await stripe.checkout.sessions.create(sessionParams);
      console.log(`✅ create-checkout: Sessão criada com sucesso: ${session.id}`);
      
      return new Response(
        JSON.stringify({ url: session.url, sessionId: session.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (stripeError: any) {
      console.error("❌ create-checkout: Erro ao criar sessão de checkout:", stripeError.message);
      console.error("❌ create-checkout: Detalhes do erro:", JSON.stringify(stripeError, null, 2));
      
      return new Response(
        JSON.stringify({ 
          error: "Erro ao criar sessão de checkout",
          details: stripeError.message,
          type: stripeError.type || "unknown"
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("❌ create-checkout: Erro não capturado:", error);
    console.error("❌ create-checkout: Stack trace:", error.stack);
    console.error("❌ create-checkout: Tipo do erro:", typeof error);
    console.error("❌ create-checkout: Mensagem:", error.message);
    
    // Retorna mensagem de erro mais detalhada
    const errorMessage = error.message || "Erro interno do servidor";
    const errorDetails = error.stack || "Sem detalhes disponíveis";
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails,
        type: error.type || error.name || "unknown"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

