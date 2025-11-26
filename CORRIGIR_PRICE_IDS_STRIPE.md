# 🔧 Como Corrigir os Price IDs do Stripe

O erro `No such price: 'price_1SVjjkQxkNQpny1LIElriKgq'` indica que os Price IDs configurados no código não existem na sua conta do Stripe em modo **LIVE**.

## Problema

Você está usando chaves **LIVE** do Stripe (`sk_live_...`), mas os Price IDs podem ser:
1. Price IDs de **teste** (que não funcionam em modo live)
2. Price IDs que foram **deletados**
3. Price IDs de outra conta do Stripe

## Solução

### Opção 1: Criar Novos Preços no Stripe (Recomendado)

1. **Acesse o Dashboard do Stripe**:
   - https://dashboard.stripe.com/products

2. **Crie ou Edite o Produto "BotanicMD Pro"**:
   - Se não existir, clique em "Add product"
   - Nome: "BotanicMD Pro"
   - Descrição: "Assinatura Pro do BotanicMD"

3. **Adicione os Preços**:
   - **Mensal (BRL)**: R$ 19,90 / mês
     - Recorrência: Mensal
     - Moeda: BRL
   - **Anual (BRL)**: R$ 99,90 / ano
     - Recorrência: Anual
     - Moeda: BRL
   - **Vitalício (BRL)**: R$ 289,90 (pagamento único)
     - Tipo: One-time payment
     - Moeda: BRL
   - **Mensal (USD)**: $ 5.99 / mês
     - Recorrência: Mensal
     - Moeda: USD
   - **Anual (USD)**: $ 29.99 / ano
     - Recorrência: Anual
     - Moeda: USD
   - **Vitalício (USD)**: $ 79.99 (pagamento único)
     - Tipo: One-time payment
     - Moeda: USD

4. **Copie os Price IDs**:
   - Após criar cada preço, clique nele
   - Copie o **API ID** (começa com `price_1...`)
   - **IMPORTANTE**: Use os Price IDs do modo **LIVE** (não de teste)

5. **Atualize o Código**:
   - Edite `services/paymentService.ts`
   - Substitua os Price IDs nas linhas 13-23:

```typescript
const STRIPE_PRICES = {
  BRL: {
    monthly: 'price_SEU_NOVO_ID_MENSAL_BRL',     // Substitua aqui
    annual: 'price_SEU_NOVO_ID_ANUAL_BRL',       // Substitua aqui
    lifetime: 'price_SEU_NOVO_ID_VITALICIO_BRL'  // Substitua aqui
  },
  USD: {
    monthly: 'price_SEU_NOVO_ID_MENSAL_USD',     // Substitua aqui
    annual: 'price_SEU_NOVO_ID_ANUAL_USD',       // Substitua aqui
    lifetime: 'price_SEU_NOVO_ID_VITALICIO_USD'  // Substitua aqui
  }
};
```

### Opção 2: Usar Chaves de Teste (Para Desenvolvimento)

Se você quiser testar primeiro com chaves de teste:

1. **No Stripe Dashboard**, mude para **Test mode** (toggle no topo)
2. **Crie os preços em modo teste**
3. **Use chaves de teste** (`sk_test_...`) no Supabase Secrets
4. **Atualize os Price IDs** com os IDs de teste

Depois, quando estiver pronto para produção, crie os preços em modo LIVE e atualize novamente.

---

## Como Verificar se o Price ID está Correto

1. No Stripe Dashboard, vá em **Products** → selecione o produto → clique no preço
2. Verifique o **API ID** na parte superior
3. Certifique-se de estar no modo correto (LIVE ou Test) correspondente à sua chave

---

## Importante

- **Price IDs de TESTE** começam com `price_1` mas só funcionam com chaves `sk_test_...`
- **Price IDs de LIVE** começam com `price_1` mas só funcionam com chaves `sk_live_...`
- **Não misture**: Se usar `sk_live_...`, deve usar Price IDs de LIVE

---

Depois de atualizar os Price IDs, faça commit e push, e o checkout deve funcionar! 🎉

