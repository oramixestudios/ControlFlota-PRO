@echo off
title Entorno Control Flota
color 0A

echo ==================================================
echo      INICIANDO ENTORNO CONTROL FLOTA MODO DEV     
echo ==================================================
echo.

:: 1. Iniciar Servidor Local de la Aplicacion en puerto 8888
echo [1/3] Iniciando Servidor Web de la App...
start "Servidor Local App (8888)" cmd /c "cd /d "%~dp0" && python -m http.server 8888"

:: 2. Iniciar n8n 
echo [2/3] Iniciando n8n (Motor de Automatizacion)...
start "n8n (5678)" cmd /k "n8n start"

:: Dar unos segundos para asegurar que n8n despierte antes de conectar ngrok y el navegador
timeout /t 10 /nobreak >nul

:: 3. Iniciar Ngrok para el tunel de webhooks
echo [3/4] Iniciando Tunel Ngrok...
start "Ngrok Tunnel" cmd /k "ngrok http 5678"

:: 4. Abrir las ventanas en el navegador predeterminado
echo [4/4] Abriendo Control Flota y n8n en tu navegador...
start http://localhost:8888
start http://localhost:5678

echo ==================================================
echo ¡TODO CARGADO!
echo.
echo * App de Control Flota: http://localhost:8888
echo * Panel de n8n:         http://localhost:5678
echo.
echo Puedes cerrar esta ventana cuando quieras, los servicios
echo quedaran ejecutandose en sus ventanas negras individuales.
echo ==================================================
pause
