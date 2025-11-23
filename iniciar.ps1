# BotanicMD - Script de Inicialização
# PowerShell Script para iniciar o servidor de desenvolvimento

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BotanicMD - Iniciando Servidor" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verifica se Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERRO] Node.js não encontrado!" -ForegroundColor Red
    Write-Host "Por favor, instale o Node.js em: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Verifica se npm está instalado
try {
    $npmVersion = npm --version
    Write-Host "[OK] npm encontrado: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERRO] npm não encontrado!" -ForegroundColor Red
    Write-Host ""
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host ""

# Verifica se node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "[1/2] Instalando dependências..." -ForegroundColor Yellow
    Write-Host ""
    
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "[ERRO] Falha ao instalar dependências!" -ForegroundColor Red
        Read-Host "Pressione Enter para sair"
        exit 1
    }
    
    Write-Host ""
    Write-Host "[OK] Dependências instaladas com sucesso!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[OK] Dependências já instaladas." -ForegroundColor Green
    Write-Host ""
}

Write-Host "[2/2] Iniciando servidores de desenvolvimento..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Servidores:" -ForegroundColor Cyan
Write-Host "  - Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "  - API:      http://localhost:3001" -ForegroundColor Green
Write-Host ""
Write-Host "Pressione Ctrl+C para parar os servidores." -ForegroundColor Gray
Write-Host ""

# Aguarda 3 segundos antes de abrir o navegador
Start-Sleep -Seconds 3

# Tenta abrir o navegador automaticamente
try {
    Start-Process "http://localhost:3000"
} catch {
    Write-Host "[INFO] Não foi possível abrir o navegador automaticamente." -ForegroundColor Yellow
    Write-Host "Abra manualmente: http://localhost:3000" -ForegroundColor Cyan
}

Write-Host ""

# Verifica se concurrently está instalado
$concurrentlyInstalled = Test-Path "node_modules\concurrently"
if (-not $concurrentlyInstalled) {
    Write-Host "[INFO] Instalando concurrently para rodar servidores em paralelo..." -ForegroundColor Yellow
    npm install concurrently --save-dev --silent
}

# Inicia ambos os servidores
npm run dev:all


