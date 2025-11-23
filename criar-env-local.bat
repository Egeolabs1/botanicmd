@echo off
echo ========================================
echo   Criando arquivo .env.local
echo ========================================
echo.

REM Verifica se .env.local já existe
if exist ".env.local" (
    echo [AVISO] O arquivo .env.local ja existe!
    echo.
    set /p overwrite="Deseja sobrescrever? (S/N): "
    if /i not "%overwrite%"=="S" (
        echo Operacao cancelada.
        pause
        exit /b 0
    )
)

REM Copia o arquivo de exemplo
if exist "env.local.example" (
    copy "env.local.example" ".env.local" >nul
    echo [OK] Arquivo .env.local criado com sucesso!
    echo.
    echo IMPORTANTE: Edite o arquivo .env.local e adicione sua chave da API Gemini
    echo.
    echo Para obter sua chave:
    echo   https://makersuite.google.com/app/apikey
    echo.
    set /p open="Deseja abrir o arquivo para edicao? (S/N): "
    if /i "%open%"=="S" (
        notepad .env.local
    )
) else (
    echo [ERRO] Arquivo env.local.example nao encontrado!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Pronto! Agora voce pode:
echo   1. Editar .env.local com sua chave
echo   2. Executar iniciar.bat
echo ========================================
echo.
pause

