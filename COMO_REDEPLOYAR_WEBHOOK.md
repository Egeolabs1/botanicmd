# 🚀 Como Redeployar a Função stripe-webhook

Existem duas formas de fazer o redeploy. Escolha a que preferir:

---

## ✅ Opção 1: Via CLI (Mais Rápida) ⭐ RECOMENDADO

### **Passo 1: Abrir o Terminal/PowerShell**

Abra o terminal na pasta do projeto:
```
E:\Vibecode apps\botanicmd
```

### **Passo 2: Executar o Deploy**

Execute este comando:

```powershell
npx supabase functions deploy stripe-webhook
```

### **Passo 3: Aguardar o Deploy**

O comando vai:
1. Fazer upload da função atualizada
2. Aplicar a configuração do `config.toml`
3. Mostrar uma mensagem de sucesso

**Exemplo de saída:**
```
Deploying function stripe-webhook...
Function stripe-webhook deployed successfully!
```

---

## ✅ Opção 2: Via Dashboard do Supabase

### **Passo 1: Acessar o Dashboard**

1. Acesse: https://app.supabase.com/project/khvurdptdkkzkzwhasnd
2. Faça login se necessário

### **Passo 2: Ir em Edge Functions**

1. No menu lateral, clique em **Edge Functions**
2. Você verá a lista de funções

### **Passo 3: Editar e Deployar**

1. Clique na função **stripe-webhook**
2. Clique em **"Edit"** ou **"Editar"**
3. Cole o código atualizado de `supabase/functions/stripe-webhook/index.ts`
4. Clique em **"Deploy"** ou **"Deployar"**

**⚠️ Nota:** Se você fez push para o Git, o código já está atualizado. Você só precisa fazer o deploy manual se não tiver o CLI configurado.

---

## 🧪 Verificar se o Deploy Funcionou

### **No Supabase Dashboard:**

1. Vá em **Edge Functions** → **stripe-webhook**
2. Verifique se aparece como **"Active"** (Ativa)
3. Clique em **Logs** para ver os logs mais recentes

### **Testar no Stripe:**

1. Acesse: https://dashboard.stripe.com/webhooks
2. Clique no seu webhook
3. Clique em **"Send test webhook"**
4. Selecione: `customer.subscription.updated`
5. Clique em **Send test webhook**
6. Deve retornar **200 OK** ✅

---

## 🔧 Se Não Tiver o CLI Configurado

Se o comando `npx supabase functions deploy` não funcionar, você precisa configurar primeiro:

### **1. Login no Supabase CLI:**

```powershell
npx supabase login
```

Isso vai abrir o navegador para você fazer login.

### **2. Vincular o Projeto:**

```powershell
npx supabase link --project-ref khvurdptdkkzkzwhasnd
```

Quando solicitado:
- **Database Password**: Digite a senha do seu banco de dados
- **Git Branch**: Pressione Enter para usar o padrão

### **3. Agora Pode Fazer o Deploy:**

```powershell
npx supabase functions deploy stripe-webhook
```

---

## 📋 Checklist

- [ ] Terminal aberto na pasta do projeto
- [ ] Executado: `npx supabase functions deploy stripe-webhook`
- [ ] Mensagem de sucesso apareceu
- [ ] Função aparece como "Active" no Dashboard
- [ ] Teste no Stripe retornou 200 OK

---

## 🆘 Problemas Comuns

### **Erro: "Project not found"**

**Solução:** Execute primeiro:
```powershell
npx supabase link --project-ref khvurdptdkkzkzwhasnd
```

### **Erro: "Not authenticated"**

**Solução:** Execute primeiro:
```powershell
npx supabase login
```

### **Erro: "Function not found"**

**Solução:** Verifique se o arquivo existe em:
```
supabase/functions/stripe-webhook/index.ts
```

---

## 💡 Dica

Depois do deploy, aguarde **1-2 minutos** antes de testar, para garantir que a função está totalmente atualizada.

---

**Pronto! Após o redeploy, os webhooks devem funcionar corretamente! 🎉**

