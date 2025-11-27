# 🔴 Como Testar no Modo LIVE do Stripe

⚠️ **ATENÇÃO:** Você está no modo **LIVE** do Stripe. Os pagamentos são **REAIS** e cobrarão dinheiro de verdade!

---

## 🛡️ Importantes Considerações de Segurança

### ⚠️ **O QUE NÃO FAZER:**
- ❌ **NÃO** use cartões de teste em modo LIVE (não funcionarão)
- ❌ **NÃO** teste com cartões reais a menos que esteja ciente dos valores
- ❌ **NÃO** deixe o modo LIVE ativo durante desenvolvimento

### ✅ **O QUE FAZER:**
- ✅ Use valores **pequenos** para testar
- ✅ Use um cartão de **crédito próprio** (você pode cancelar depois)
- ✅ Teste **apenas o necessário** para validar
- ✅ Considere criar um **plano de teste** com valor mínimo (R$ 0,01 ou $ 0,01)
- ✅ Use o **modo de teste** para a maioria dos testes

---

## 🎯 Opções para Testar em Modo LIVE

### **Opção 1: Criar Planos de Teste com Valor Mínimo (RECOMENDADO)**

Esta é a forma mais segura de testar em modo LIVE:

#### **Passo 1: Criar Preços de Teste no Stripe**

1. Acesse: https://dashboard.stripe.com/products
2. Certifique-se de estar em modo **LIVE** (não Test)
3. Crie produtos com valores mínimos:
   - **Mensal:** R$ 0,01 ou $ 0,01
   - **Anual:** R$ 0,10 ou $ 0,10
   - **Vitalício:** R$ 0,50 ou $ 0,50

4. **Copie os Price IDs** (começam com `price_1...`)

#### **Passo 2: Atualizar Price IDs no Código**

1. Abra: `services/paymentService.ts`
2. Substitua os Price IDs pelos novos Price IDs de teste:
   ```typescript
   const STRIPE_PRICES = {
     BRL: {
       monthly: 'price_1XXXXX...', // Seu novo Price ID de R$ 0,01
       annual: 'price_1XXXXX...',  // Seu novo Price ID de R$ 0,10
       lifetime: 'price_1XXXXX...' // Seu novo Price ID de R$ 0,50
     },
     USD: {
       monthly: 'price_1XXXXX...', // Seu novo Price ID de $ 0,01
       annual: 'price_1XXXXX...',  // Seu novo Price ID de $ 0,10
       lifetime: 'price_1XXXXX...' // Seu novo Price ID de $ 0,50
     }
   };
   ```

3. Faça commit e deploy

#### **Passo 3: Testar com Seu Próprio Cartão**

Agora você pode testar com seu cartão real, mas os valores serão mínimos:
- Mensal: apenas R$ 0,01
- Anual: apenas R$ 0,10
- Vitalício: apenas R$ 0,50

⚠️ **Nota:** Você pode cancelar o reembolso após o teste se desejar.

---

### **Opção 2: Usar Stripe Test Cards com Valor Real (NÃO RECOMENDADO)**

Os cartões de teste **não funcionam** em modo LIVE. Você precisa usar um cartão real.

---

### **Opção 3: Voltar para Modo de Teste (MAIS SEGURO)**

Se possível, teste primeiro no modo de teste:

1. No Stripe Dashboard, mude para **Test mode** (toggle no canto superior direito)
2. Use os cartões de teste padrão:
   - `4242 4242 4242 4242` (sempre aprovado)
   - `4000 0000 0000 0002` (sempre recusado)
3. Teste todo o fluxo sem risco
4. **Depois** mude para LIVE e teste apenas o essencial

---

## 📋 Passo a Passo para Testar em Modo LIVE

### **Preparação:**

1. ✅ Certifique-se de que os Price IDs no código estão corretos
2. ✅ Verifique se as Edge Functions estão deployadas
3. ✅ Confirme que o webhook está configurado para modo LIVE
4. ✅ Tenha seu cartão de crédito à mão

### **Teste Completo:**

1. **Acesse o app:**
   - `https://botanicmd.com/app`
   - Faça login

2. **Abra o modal de preços:**
   - Clique no perfil → "Fazer Upgrade"

3. **Selecione um plano:**
   - Escolha o plano de menor valor para testar primeiro

4. **Complete o pagamento:**
   - Use seu **cartão de crédito real**
   - Preencha os dados reais
   - Complete o pagamento

5. **Verifique o redirecionamento:**
   - Você deve voltar para `/app?status=success`
   - Plano deve mudar para "Pro"

6. **Verifique no Stripe Dashboard:**
   - Vá em: https://dashboard.stripe.com/payments
   - Veja se o pagamento aparece (modo LIVE)

7. **Verifique no Supabase:**
   - Database → Tables → subscriptions
   - Verifique se o registro foi criado

8. **Teste um reembolso (opcional):**
   - Se quiser, você pode fazer reembolso do pagamento de teste
   - No Stripe Dashboard → Payments → selecione o pagamento → Refund

---

## 🔄 Como Alternar Entre Test e Live

### **Para Testar no Modo de Teste:**

1. No Stripe Dashboard, clique no toggle no canto superior direito
2. Mude para **"Test mode"**
3. Use os cartões de teste

### **Para Testar no Modo LIVE:**

1. No Stripe Dashboard, clique no toggle
2. Mude para **"Live mode"**
3. Use cartões reais

⚠️ **IMPORTANTE:** Os Price IDs são diferentes entre Test e Live!

- **Test mode:** Price IDs começam com `price_1...` (test)
- **Live mode:** Price IDs começam com `price_1...` (live) - são diferentes!

Você precisa atualizar os Price IDs no código quando alternar entre os modos.

---

## 💡 Recomendação Final

**Para desenvolvimento e testes extensivos:**
- ✅ Use **modo de teste** (Test mode)
- ✅ Use cartões de teste (`4242 4242 4242 4242`)
- ✅ Teste tudo sem risco

**Para validação final antes do lançamento:**
- ✅ Use **modo LIVE** com valores mínimos (R$ 0,01)
- ✅ Teste apenas o fluxo essencial
- ✅ Use seu próprio cartão
- ✅ Faça reembolso após validar

**Para produção:**
- ✅ Use **modo LIVE** com valores reais
- ✅ Certifique-se de que tudo está funcionando
- ✅ Monitore os primeiros pagamentos

---

## 🚨 Checklist de Segurança para Modo LIVE

Antes de testar em modo LIVE, verifique:

- [ ] Você está ciente de que os pagamentos são reais
- [ ] Você tem um cartão válido para testar
- [ ] Os valores dos planos estão corretos
- [ ] O webhook está configurado para modo LIVE
- [ ] Você pode fazer reembolsos se necessário
- [ ] Você testou primeiro no modo de teste (recomendado)

---

## 📞 Precisa de Ajuda?

Se algo der errado em modo LIVE:
1. Verifique os logs da Edge Function
2. Verifique o Stripe Dashboard para ver o status do pagamento
3. Considere fazer um reembolso se necessário
4. Entre em contato com o suporte do Stripe se houver problemas com pagamentos

---

**Lembre-se: Em modo LIVE, todo pagamento é REAL. Teste com cuidado! 🔴**

