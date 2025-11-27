// Supabase Edge Function: stripe-webhook
// Processa eventos do webhook do Stripe

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2024-11-20.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature || !webhookSecret) {
      console.error("Webhook secret não configurado");
      return new Response(
        JSON.stringify({ error: "Webhook secret não configurado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar assinatura do webhook
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error("Erro ao verificar assinatura do webhook:", err.message);
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Processar eventos
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabase, session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(supabase, subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabase, subscription);
        break;
      }

      case "payment_intent.succeeded": {
        // Para pagamentos únicos (lifetime)
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSucceeded(supabase, paymentIntent);
        break;
      }

      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Erro ao processar webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleCheckoutCompleted(
  supabase: any,
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.user_id;
  if (!userId) {
    console.error("userId não encontrado nos metadata da sessão");
    return;
  }

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string | null;
  const planType = session.metadata?.plan_type || "monthly";
  const currency = session.metadata?.currency || "BRL";

  // Buscar informações do preço/subscription
  let priceId: string | undefined;
  let status = "active";
  let periodStart: Date | undefined;
  let periodEnd: Date | undefined;

  if (subscriptionId) {
    // É uma assinatura recorrente
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    priceId = subscription.items.data[0]?.price.id;
    status = subscription.status;
    periodStart = new Date(subscription.current_period_start * 1000);
    periodEnd = new Date(subscription.current_period_end * 1000);
  } else {
    // É um pagamento único (lifetime)
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    priceId = lineItems.data[0]?.price?.id;
    status = "active";
    periodEnd = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000); // 100 anos para lifetime
  }

  if (!priceId) {
    console.error("Price ID não encontrado");
    return;
  }

  // Atualizar ou criar assinatura no banco
  await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      stripe_price_id: priceId,
      plan_type: planType,
      currency: currency,
      status: status,
      current_period_start: periodStart?.toISOString(),
      current_period_end: periodEnd?.toISOString(),
      cancel_at_period_end: false,
    },
    {
      onConflict: "user_id",
    }
  );

  // Atualizar plano do usuário no localStorage (será sincronizado via AuthContext)
  // Também podemos atualizar uma tabela de perfil se existir
  console.log(`Checkout completado para usuário ${userId}, plano: ${planType}`);
}

async function handleSubscriptionUpdated(
  supabase: any,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;

  // Buscar assinatura no banco pelo customer_id
  const { data: existingSub, error: subError } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (subError) {
    console.error(`Erro ao buscar assinatura para customer ${customerId}:`, subError);
    return;
  }

  if (!existingSub) {
    console.error(`Assinatura não encontrada para customer ${customerId}`);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const planType = subscription.metadata?.plan_type || 
    (priceId?.includes("month") ? "monthly" : priceId?.includes("year") ? "annual" : "monthly");

  await supabase
    .from("subscriptions")
    .update({
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      plan_type: planType,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
    })
    .eq("user_id", existingSub.user_id);

  console.log(`Assinatura atualizada: ${subscription.id}, status: ${subscription.status}`);
}

async function handleSubscriptionDeleted(
  supabase: any,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;

  await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
      cancel_at_period_end: false,
    })
    .eq("stripe_customer_id", customerId);

  console.log(`Assinatura cancelada: ${subscription.id}`);
}

async function handlePaymentSucceeded(
  supabase: any,
  paymentIntent: Stripe.PaymentIntent
) {
  // Para pagamentos únicos (lifetime)
  const customerId = paymentIntent.customer as string;
  
  if (!customerId) {
    return;
  }

  const { data: existingSub, error: subError } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (subError) {
    console.error(`Erro ao buscar assinatura para customer ${customerId}:`, subError);
    return;
  }

  if (existingSub) {
    await supabase
      .from("subscriptions")
      .update({
        status: "active",
        plan_type: "lifetime",
        current_period_end: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq("user_id", existingSub.user_id);

    console.log(`Pagamento único processado para usuário ${existingSub.user_id}`);
  }
}

