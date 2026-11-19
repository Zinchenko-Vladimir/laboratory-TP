@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js не найден. Установите его с https://nodejs.org и запустите файл снова.
  pause
  exit /b 1
)
echo Запуск сервера... Окно не закрывайте. Остановить: Ctrl+C
start "" cmd /c "timeout /t 2 >nul & start http://localhost:3001"
node server.js
pause
