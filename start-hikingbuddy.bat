@echo off
rem Spusti HikingBuddy jednim klikem: kdyz appka jeste nebezi, nastartuje ji
rem (v minimalizovanem okne "HikingBuddy server") a pak ji otevre v prohlizeci.
rem Zavrenim okna "HikingBuddy server" se appka vypne.

set "URL=http://localhost:5173/"
set "APP_DIR=%~dp0app"

rem Uz bezi? Rovnou otevrit prohlizec.
curl.exe -s -o nul "%URL%" && goto open

rem Prvni spusteni (nebo po smazani node_modules): doinstalovat knihovny.
if not exist "%APP_DIR%\node_modules" (
  echo Instaluji knihovny, prvni spusteni chvili trva...
  pushd "%APP_DIR%"
  call npm install
  popd
)

start "HikingBuddy server" /min cmd /k "cd /d "%APP_DIR%" && npm run dev -- --port 5173 --strictPort"

rem Pockat, az server nabehne (max. ~30 s).
for /l %%i in (1,1,30) do (
  curl.exe -s -o nul "%URL%" && goto open
  timeout /t 1 /nobreak >nul
)
echo Appka se nespustila do 30 sekund - mrkni do okna "HikingBuddy server".
pause
exit /b 1

:open
start "" "%URL%"
