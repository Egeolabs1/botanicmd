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
    // Verificar autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar usuário autenticado
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Obter dados do corpo da requisição
    const { priceId, planType, currency, successUrl, cancelUrl } = await req.json();

    if (!priceId || !planType) {
      return new Response(
        JSON.stringify({ error: "priceId e planType são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar ou criar cliente Stripe
    let stripeCustomerId: string;

    // Verificar se o usuário já tem um customer_id no Stripe
    const { data: existingSubscription, error: subError } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle(); // Usa maybeSingle() para não falhar se não existir

    if (existingSubscription?.stripe_customer_id) {
      stripeCustomerId = existingSubscription.stripe_customer_id;
      console.log(`Customer existente encontrado: ${stripeCustomerId}`);
    } else {
      console.log("Criando novo customer no Stripe...");
      // Criar novo cliente no Stripe
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      stripeCustomerId = customer.id;
      console.log(`Novo customer criado: ${stripeCustomerId}`);

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
          console.error("Erro ao atualizar customer no banco:", updateError);
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
          console.error("Erro ao inserir customer no banco:", insertError);
          // Continua mesmo assim - o webhook pode criar/atualizar depois
        }
      }
    }

    // Criar sessão de checkout
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

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Erro ao criar checkout:", error);
    console.error("Stack trace:", error.stack);
    
    // Retorna mensagem de erro mais detalhada
    const errorMessage = error.message || "Erro interno do servidor";
    const errorDetails = process.env.DENO_ENV === "production" 
      ? errorMessage 
      : `${errorMessage} (${error.stack || "sem stack trace"})`;
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

