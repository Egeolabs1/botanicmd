# Script para criar arquivo .env.local
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Criando arquivo .env.local" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verifica se .env.local já existe
if (Test-Path ".env.local") {
    Write-Host "[AVISO] O arquivo .env.local já existe!" -ForegroundColor Yellow
    Write-Host ""
    $overwrite = Read-Host "Deseja sobrescrever? (S/N)"
    if ($overwrite -ne "S" -and $overwrite -ne "s") {
        Write-Host "Operação cancelada." -ForegroundColor Gray
        exit 0
    }
}

# Verifica se o arquivo de exemplo existe
if (-not (Test-Path "env.local.example")) {
    Write-Host "[ERRO] Arquivo env.local.example não encontrado!" -ForegroundColor Red
    Write-Host ""
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Copia o arquivo de exemplo
Copy-Item "env.local.example" ".env.local" -Force
Write-Host "[OK] Arquivo .env.local criado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANTE: Edite o arquivo .env.local e adicione sua chave da API Gemini" -ForegroundColor Yellow
Write-Host ""
Write-Host "Para obter sua chave:" -ForegroundColor Cyan
Write-Host "  https://makersuite.google.com/app/apikey" -ForegroundColor Cyan
Write-Host ""

$open = Read-Host "Deseja abrir o arquivo para edição? (S/N)"
if ($open -eq "S" -or $open -eq "s") {
    notepad .env.local
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Pronto! Agora você pode:" -ForegroundColor Green
Write-Host "  1. Editar .env.local com sua chave" -ForegroundColor White
Write-Host "  2. Executar iniciar.bat ou .\iniciar.ps1" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "Pressione Enter para continuar"

