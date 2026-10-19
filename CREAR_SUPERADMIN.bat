@echo off
setlocal
cd /d "%~dp0"
set "PYTHONHOME="
set "PYTHONPATH="

call PREPARAR_BACKEND.bat
if errorlevel 1 (
  echo No se pudo preparar Python. No se creo ninguna cuenta.
  pause
  exit /b 1
)

".venv\Scripts\python.exe" scripts\create_superadmin.py
if errorlevel 1 (
  echo.
  echo No se pudo crear el SUPERADMIN. Revisa el mensaje anterior.
  pause
  exit /b 1
)
echo.
echo Proceso terminado.
pause
endlocal
