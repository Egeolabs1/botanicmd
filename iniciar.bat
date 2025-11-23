@echo off
echo ========================================
echo   BotanicMD - Iniciando Servidor
echo ========================================
echo.

REM Verifica se node_modules existe
if not exist "node_modules" (
    echo [1/2] Instalando dependencias...
    call npm install
    if errorlevel 1 (
        echo.
        echo ERRO: Falha ao instalar dependencias!
        echo Verifique se o Node.js esta instalado.
        echo Download: https://nodejs.org/
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependencias instaladas com sucesso!
    echo.
) else (
    echo [OK] Dependencias ja instaladas.
    echo.
)

echo [2/2] Iniciando servidores de desenvolvimento...
echo.
echo Servidores:
echo   - Frontend: http://localhost:3000
echo   - API:      http://localhost:3001
echo.
echo Pressione Ctrl+C para parar os servidores.
echo.

REM Aguarda 3 segundos
timeout /t 3 /nobreak >nul 2>&1

REM Tenta abrir o navegador
start http://localhost:3000

REM Verifica se concurrently esta instalado
if not exist "node_modules\concurrently" (
    echo [INFO] Instalando concurrently...
    call npm install concurrently --save-dev --silent
)

REM Inicia ambos os servidores
call npm run dev:all

pause

