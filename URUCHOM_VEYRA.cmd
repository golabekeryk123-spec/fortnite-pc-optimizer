@echo off
setlocal EnableExtensions DisableDelayedExpansion
title Veyra - uruchamianie
cd /d "%~dp0"
if errorlevel 1 goto folder_error

echo.
echo  VEYRA - przygotowanie i uruchamianie
echo.

if not exist "%~dp0scripts\start.cjs" goto extract_first
where node.exe >nul 2>nul
if errorlevel 1 goto missing_node

node "%~dp0scripts\start.cjs"
if errorlevel 1 goto start_error
exit /b 0

:missing_node
echo Zainstaluj Node.js LTS ze strony https://nodejs.org/
echo Po instalacji ponownie kliknij URUCHOM_VEYRA.cmd.
echo.
pause
exit /b 1

:extract_first
echo Najpierw rozpakuj CALY plik ZIP.
echo Kliknij ZIP prawym przyciskiem i wybierz Wyodrebnij wszystkie.
echo Potem otworz rozpakowany folder i kliknij URUCHOM_VEYRA.cmd.
echo.
pause
exit /b 1

:folder_error
echo Nie mozna otworzyc folderu programu.
echo Rozpakuj ZIP do zwyklego lokalnego folderu, np. na Pulpicie.
pause
exit /b 1

:start_error
echo.
echo Nie udalo sie uruchomic Veyra.
echo Zrob zdjecie tego okna z komunikatem powyzej i przeslij je w rozmowie.
echo.
pause
exit /b 1
