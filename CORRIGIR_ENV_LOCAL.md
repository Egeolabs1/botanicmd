# 🔧 Como Corrigir o Encoding do .env.local

Se você encontrar o erro `failed to parse environment file: .env.local (unexpected character '»' in variable name)`, siga estes passos:

## Método 1: Usando PowerShell (Automático)

Execute no terminal PowerShell:

```powershell
cd "E:\Vibecode apps\botanicmd"

# Backup do arquivo original
Copy-Item .env.local .env.local.backup

# Ler e limpar o arquivo
$lines = Get-Content .env.local -Encoding UTF8
$cleanLines = @()
foreach ($line in $lines) {
    # Remove caracteres não-ASCII e a linha "env" problemática
    $cleanLine = $line -replace '[^\x09\x0A\x0D\x20-\x7E]', ''
    $cleanLine = $cleanLine -replace '^env\s*$', ''
    
    # Mantém linhas válidas (não vazias ou comentários)
    if ($cleanLine.Trim() -ne '' -or $line -match '^#') {
        $cleanLines += $cleanLine
    }
}

# Recriar arquivo sem BOM
$cleanContent = $cleanLines -join "`r`n"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText((Resolve-Path .env.local), $cleanContent, $utf8NoBom)

Write-Host "Arquivo corrigido!"
```

## Método 2: Manual (Editor de Texto)

1. Abra o arquivo `.env.local` em um editor de texto (VS Code, Notepad++, etc.)
2. Certifique-se de que o encoding está como **UTF-8 sem BOM**
3. Verifique se há caracteres estranhos (como `»`, `` ` ``, ou outros símbolos)
4. Remova qualquer linha que contenha apenas `env` ou caracteres especiais
5. Salve o arquivo como **UTF-8** (sem BOM)

## Método 3: Recriar do Zero

1. Faça backup do arquivo atual:
   ```powershell
   Copy-Item .env.local .env.local.backup
   ```

2. Crie um novo arquivo `.env.local` baseado no `env.local.example`:
   ```powershell
   Copy-Item env.local.example .env.local
   ```

3. Abra o `.env.local` e preencha com suas chaves reais (sem adicionar markdown ou caracteres especiais)

## Verificar se Está Corrigido

Teste se o arquivo está OK:

```powershell
# Tentar fazer link (vai dar erro de senha, mas não de parsing)
npx supabase link --project-ref khvurdptdkkzkzwhasnd
```

Se não aparecer o erro `failed to parse environment file`, o arquivo está correto!

## Estrutura Correta do .env.local

O arquivo deve ter apenas variáveis de ambiente no formato:

```env
# Comentários são permitidos
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_KEY=sua_chave_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

**NÃO inclua:**
- ❌ Código markdown (```env, ```)
- ❌ Caracteres especiais (», `, etc.)
- ❌ BOM (Byte Order Mark) no início do arquivo

---

**Dica:** Se precisar fazer deploy das Edge Functions e o arquivo ainda estiver com problemas, você pode temporariamente renomeá-lo:

```powershell
Rename-Item .env.local .env.local.temp
npx supabase functions deploy create-checkout
Rename-Item .env.local.temp .env.local
```

