@echo off
setlocal
cd /d "%~dp0"
set "PYTHONHOME="
set "PYTHONPATH="

echo MANAGER STOCK - Inicializador de datos de demostracion
if /I "%MANAGER_STOCK_ENV%"=="production" (
  echo ERROR: el seed de demostracion no se puede ejecutar en produccion.
  pause
  exit /b 1
)
if /I "%APP_ENV%"=="production" (
  echo ERROR: el seed de demostracion no se puede ejecutar en produccion.
  pause
  exit /b 1
)

call PREPARAR_BACKEND.bat
if errorlevel 1 (
  echo No se pudo preparar Python. No se modifico la base de datos.
  pause
  exit /b 1
)

".venv\Scripts\python.exe" scripts\seed_demo_data.py --allow-demo-data
if errorlevel 1 (
  echo.
  echo No se pudieron crear los datos de demostracion. Revisa el mensaje anterior.
  pause
  exit /b 1
)

echo.
echo Consulta docs\USUARIOS_DE_PRUEBA.md para las credenciales iniciales.
pause
endlocal
