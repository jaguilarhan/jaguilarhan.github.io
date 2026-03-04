@echo off
title Control de Obra
chcp 65001 >nul
echo ==========================================
echo   CONTROL DE ACTIVIDADES DE OBRA
echo ==========================================
echo.
cd /d "C:\Users\Jose Alonso\IntelliJ_IDEA\work_manage_app"
echo Verificando dependencias...
pip install flask python-docx openpyxl -q
echo.
echo Iniciando servidor en http://localhost:8800
echo NO CIERRES ESTA VENTANA mientras usas la app.
echo.
python servidor.py
pause
