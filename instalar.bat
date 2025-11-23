@echo off
echo ========================================
echo   BotanicMD - Instalacao de Dependencias
echo ========================================
echo.

REM Verifica se Node.js está instalado
where node >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado!
    echo.
    echo Por favor, instale o Node.js em:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js encontrado
node --version
echo.

REM Verifica se npm está instalado
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERRO] npm nao encontrado!
    echo.
    pause
    exit /b 1
)

echo [OK] npm encontrado
npm --version
echo.

echo Instalando dependencias...
echo Isso pode levar alguns minutos...
echo.

call npm install

if errorlevel 1 (
    echo.
    echo [ERRO] Falha ao instalar dependencias!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   [OK] Instalacao concluida!
echo ========================================
echo.
echo Para iniciar o servidor, execute:
echo   iniciar.bat
echo.
pause


