# 🔧 Como Instalar Supabase CLI no Windows

O Supabase CLI **não pode ser instalado via npm** no Windows. Use uma das opções abaixo:

## 📦 Opção 1: Via Scoop (Recomendado para Windows)

### 1. Instalar Scoop (se ainda não tiver)

Abra o PowerShell como **Administrador** e execute:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
```

### 2. Adicionar o repositório do Supabase

```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
```

### 3. Instalar Supabase CLI

```powershell
scoop install supabase
```

### 4. Verificar instalação

```powershell
supabase --version
```

---

## 📥 Opção 2: Download Direto (Mais Simples)

### 1. Baixar o binário

1. Acesse: https://github.com/supabase/cli/releases
2. Baixe o arquivo `supabase_windows_amd64.zip` (ou `supabase_windows_arm64.zip` se usar ARM)
3. Extraia o arquivo `supabase.exe`

### 2. Adicionar ao PATH

#### Método A: Manualmente

1. Coloque o `supabase.exe` em uma pasta (ex: `C:\Tools\supabase\`)
2. Adicione essa pasta ao PATH do Windows:
   - Pressione `Win + R`
   - Digite `sysdm.cpl` e pressione Enter
   - Vá em **Avançado** → **Variáveis de Ambiente**
   - Em **Variáveis do sistema**, encontre `Path`
   - Clique em **Editar** → **Novo**
   - Adicione: `C:\Tools\supabase\`
   - Clique em **OK** em todas as janelas

#### Método B: Via PowerShell (Rápido)

```powershell
# Criar pasta para ferramentas
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\Tools"

# Mover supabase.exe para lá (após baixar e extrair)
# Move-Item -Path "C:\caminho\do\supabase.exe" -Destination "$env:USERPROFILE\Tools\"

# Adicionar ao PATH do usuário
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
$newPath = "$env:USERPROFILE\Tools"
if ($currentPath -notlike "*$newPath*") {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$newPath", "User")
}

# Recarregar PATH na sessão atual
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

### 3. Verificar instalação

Abra um **novo** PowerShell e execute:

```powershell
supabase --version
```

---

## 🎯 Opção 3: Via npx (Sem Instalar Globalmente)

Se você não quiser instalar o CLI globalmente, pode usar via `npx`:

```powershell
# Em vez de "supabase", use "npx supabase"
npx supabase --version
npx supabase login
npx supabase link --project-ref seu-project-ref
```

**Nota**: Isso pode ser mais lento, mas funciona sem instalar nada.

---

## ✅ Verificar Instalação

Depois de instalar por qualquer método, teste:

```powershell
supabase --version
```

Deve mostrar algo como: `supabase version 1.x.x`

---

## 🔐 Próximos Passos

Depois de instalar o CLI:

### 1. Fazer Login

```powershell
supabase login
```

Isso vai abrir o navegador para autenticação.

### 2. Linkar Projeto

```powershell
supabase link --project-ref seu-project-ref
```

Encontre o `project-ref` em:
- URL do projeto: `https://app.supabase.com/project/seu-project-ref`
- Ou no Dashboard → Settings → General → Reference ID

### 3. Configurar Secrets

```powershell
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### 4. Deploy das Edge Functions

```powershell
supabase functions deploy create-checkout
supabase functions deploy stripe-webhook
supabase functions deploy create-portal
```

---

## 🐛 Troubleshooting

### "supabase: comando não encontrado"

**Solução**: O executável não está no PATH. Use a Opção 3 (npx) ou adicione manualmente ao PATH.

### "Erro de permissão"

**Solução**: Execute o PowerShell como Administrador.

### "SSL Certificate Error"

**Solução**: Atualize o Windows ou configure proxy corporativo.

---

## 💡 Dica

Se você estiver apenas testando ou não quiser instalar nada, use:

```powershell
npx supabase [comando]
```

Funciona sem instalação, apenas baixa temporariamente quando necessário.

---

## 📚 Links Úteis

- [Supabase CLI GitHub](https://github.com/supabase/cli)
- [Documentação Oficial](https://supabase.com/docs/guides/cli)
- [Scoop Package Manager](https://scoop.sh/)

