@echo off
chcp 65001 >nul
title Generador de Cuaderno de Obra
echo ============================================
echo   GENERADOR DE REPORTE WORD - CUADERNO OBRA
echo ============================================
echo.

cd /d "%~dp0"

REM ── Si el JSON no esta aqui, buscarlo en Descargas ────────────
if not exist "actividades_exportadas.json" (
    set DESCARGAS=%USERPROFILE%\Downloads\actividades_exportadas.json
    if exist "%USERPROFILE%\Downloads\actividades_exportadas.json" (
        echo Encontrado en Descargas, copiando...
        copy "%USERPROFILE%\Downloads\actividades_exportadas.json" "actividades_exportadas.json" >nul
        echo Listo.
        echo.
    ) else (
        echo ERROR: No se encontro actividades_exportadas.json
        echo Primero usa el boton "Reporte Word" en la app para exportar los datos.
        echo El archivo se descargara en tu carpeta Descargas.
        pause
        exit /b 1
    )
)

REM ── Pedir datos si no se pasaron como argumentos ──────────────
set DESDE=%1
set HASTA=%2
set RESIDENTE=%~3
set INSPECTOR=%~4

if "%DESDE%"=="" (
    set /p DESDE="Fecha DESDE [YYYY-MM-DD, ej: 2026-02-17]: "
)
if "%HASTA%"=="" (
    set /p HASTA="Fecha HASTA  [YYYY-MM-DD, ej: 2026-02-24]: "
)
if "%RESIDENTE%"=="" (
    set /p RESIDENTE="Nombre del Residente de Obra: "
)
if "%INSPECTOR%"=="" (
    set /p INSPECTOR="Nombre del Inspector/Supervisor: "
)

echo.
echo Generando reporte del %DESDE% al %HASTA%...
echo.

python generar_reporte.py "%DESDE%" "%HASTA%" "%RESIDENTE%" "%INSPECTOR%"

if %ERRORLEVEL%==0 (
    echo.
    echo Abriendo el archivo Word generado...
    start "" "Cuaderno_Obra_%DESDE%_al_%HASTA%.docx"
) else (
    echo.
    echo Ocurrio un error. Revisa que Python y python-docx esten instalados.
    echo Ejecuta: pip install python-docx
)

echo.
pause
