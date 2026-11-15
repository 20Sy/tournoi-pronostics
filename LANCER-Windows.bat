@echo off
cd /d "%~dp0"
title Tournoi Pronostics - Serveur

where node >nul 2>nul
if errorlevel 1 goto nonode

node server.js

echo.
echo ================================================
echo Le serveur est arrete. Lisez le message ci-dessus.
echo ================================================
pause
exit /b

:nonode
echo.
echo Node.js n'est pas installe sur ce PC.
echo Telechargez la version LTS sur https://nodejs.org
echo puis relancez LANCER-Windows.bat
echo.
pause
