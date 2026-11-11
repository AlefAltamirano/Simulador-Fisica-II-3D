@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Instala Node.js y vuelve a abrir este archivo.
  pause
  exit /b 1
)
if not exist node_modules\vite\bin\vite.js (
  echo Preparando las dependencias...
  call npm.cmd install
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
echo Abre la direccion Local que aparezca abajo. Deja esta ventana abierta.
call npm.cmd run dev
pause
