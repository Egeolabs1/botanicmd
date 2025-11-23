# 🔐 Configuração do Google OAuth no Supabase

Este guia mostra como habilitar o login com Google no Supabase.

## ⚠️ Problema Atual

Se você está recebendo o erro:
```
{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}
```

Significa que o provider Google OAuth não está habilitado no seu projeto Supabase.

## 📋 Passo a Passo

### 1. Acesse o Supabase Dashboard

1. Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Faça login na sua conta
3. Selecione o seu projeto

### 2. Configure o Google OAuth

1. **Vá para Authentication → Providers**
   - No menu lateral, clique em "Authentication"
   - Depois clique em "Providers"

2. **Habilite o Google Provider**
   - Procure por "Google" na lista de providers
   - Clique no toggle para habilitar

3. **Configure as Credenciais do Google**
   
   Você precisará criar um projeto no Google Cloud Console:
   
   a) **Acesse o Google Cloud Console**
      - Vá para [https://console.cloud.google.com](https://console.cloud.google.com)
      - Faça login com sua conta Google
   
   b) **Crie um novo projeto ou selecione um existente**
      - Clique em "Selecionar um projeto" no topo
      - Clique em "Novo projeto"
      - Dê um nome (ex: "BotanicMD OAuth")
      - Clique em "Criar"
   
   c) **Habilite a Google+ API**
      - Vá para "APIs e Serviços" → "Biblioteca"
      - Procure por "Google+ API"
      - Clique em "Ativar"
   
   d) **Configure a Tela de Consentimento OAuth**
      - Vá para "APIs e Serviços" → "Tela de Consentimento OAuth"
      - Escolha "Externo" (para desenvolvimento)
      - Preencha as informações obrigatórias:
        - Nome do app: BotanicMD
        - Email de suporte: seu email
        - Email do desenvolvedor: seu email
      - Clique em "Salvar e Continuar"
      - Adicione escopos (email, perfil) se necessário
      - Clique em "Salvar e Continuar"
   
   e) **Crie as Credenciais OAuth**
      - Vá para "APIs e Serviços" → "Credenciais"
      - Clique em "Criar credenciais" → "ID do cliente OAuth"
      - Tipo de aplicativo: "Aplicativo da Web"
      - Nome: BotanicMD
      - **URIs de redirecionamento autorizados**: Adicione:
        ```
        https://[seu-projeto-id].supabase.co/auth/v1/callback
        ```
        Substitua `[seu-projeto-id]` pelo ID do seu projeto Supabase
      - Clique em "Criar"
      - **IMPORTANTE**: Copie o "ID do cliente" e o "Segredo do cliente"

4. **Volte ao Supabase e configure as credenciais**
   - No Supabase Dashboard → Authentication → Providers → Google
   - Cole o "Client ID" (ID do cliente) no campo "Client ID"
   - Cole o "Client Secret" (Segredo do cliente) no campo "Client Secret"
   - Clique em "Save"

### 3. Configure a URL de Redirecionamento

No Supabase Dashboard:
- Vá para **Project Settings** → **API**
- Verifique a URL do seu projeto
- Adicione esta URL nas "Authorized redirect URIs" no Google Cloud Console:
  ```
  https://[seu-projeto-id].supabase.co/auth/v1/callback
  ```

### 4. Teste o Login

1. Recarregue a página do app
2. Tente fazer login com Google
3. Você deve ser redirecionado para a tela de consentimento do Google

## 🔧 URLs Comuns do Supabase

- **URL do projeto**: `https://[projeto-id].supabase.co`
- **URL de callback**: `https://[projeto-id].supabase.co/auth/v1/callback`

## ⚠️ Problemas Comuns

### Erro: "redirect_uri_mismatch"
- **Solução**: Verifique se a URL de redirecionamento no Google Cloud Console está exatamente igual à URL do Supabase
- A URL deve ser: `https://[projeto-id].supabase.co/auth/v1/callback`

### Erro: "invalid_client"
- **Solução**: Verifique se o Client ID e Client Secret estão corretos no Supabase
- Certifique-se de que não há espaços extras ao copiar/colar

### Provider não aparece na lista
- **Solução**: Certifique-se de que está no projeto correto do Supabase
- Verifique se tem permissões de administrador no projeto

## 📚 Recursos Adicionais

- [Documentação do Supabase OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google Cloud Console](https://console.cloud.google.com)
- [Configuração OAuth do Google](https://developers.google.com/identity/protocols/oauth2)

---

💡 **Dica**: Enquanto configura o Google OAuth, você pode usar o login com email (Magic Link) que funciona sem configuração adicional!

