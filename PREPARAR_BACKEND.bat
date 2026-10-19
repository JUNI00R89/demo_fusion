@echo off
setlocal
cd /d "%~dp0"

rem Evita que variables globales apunten a otra instalacion de Python.
set "PYTHONHOME="
set "PYTHONPATH="

echo ============================================
echo   MANAGER STOCK - PREPARAR BACKEND PYTHON
echo ============================================

where py >nul 2>nul
if errorlevel 1 (
  echo ERROR: No se encontro el lanzador py de Windows.
  echo Instala Python 3.11 o superior desde https://www.python.org/downloads/windows/
  echo Durante la instalacion, activa Python Launcher y Add Python to PATH.
  goto :error
)

if not exist ".venv\Scripts\python.exe" (
  echo Creando el entorno virtual del proyecto...
  py -3 -m venv .venv
  if errorlevel 1 (
    echo ERROR: No se pudo crear .venv con Python.
    echo Comprueba la instalacion ejecutando: py -0p
    goto :error
  )
)

".venv\Scripts\python.exe" -c "import fastapi, uvicorn, httpx" >nul 2>nul
if not errorlevel 1 goto :ready

echo Instalando o reparando las dependencias del backend...
".venv\Scripts\python.exe" -m ensurepip --upgrade >nul 2>nul
".venv\Scripts\python.exe" -m pip install -r backend\requirements.txt
if errorlevel 1 (
  echo ERROR: No se pudieron instalar las dependencias.
  echo Comprueba la conexion a Internet y vuelve a ejecutar este archivo.
  goto :error
)

".venv\Scripts\python.exe" -c "import fastapi, uvicorn, httpx" >nul 2>nul
if errorlevel 1 (
  echo ERROR: Python sigue sin poder importar FastAPI, Uvicorn o HTTPX.
  echo Es posible que la instalacion de Python este incompleta.
  echo Ejecuta py -0p para ver las instalaciones detectadas.
  goto :error
)

:ready
echo Entorno listo. Las dependencias del backend estan disponibles.
endlocal
exit /b 0

:error
echo.
echo No se pudo preparar el backend de MANAGER STOCK.
endlocal
exit /b 1
