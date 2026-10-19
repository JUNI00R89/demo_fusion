# Solucionar errores al crear datos de prueba

## Por qué puede aparecer `No module named 'fastapi'`

El inicializador necesita importar el backend de MANAGER STOCK. Si se ejecuta con el Python global de Windows (`py -3`) y FastAPI está instalado únicamente en el entorno virtual del proyecto, aparece `ModuleNotFoundError: No module named 'fastapi'`.

La versión actualizada evita ese problema: `CREAR_DATOS_DE_PRUEBA.bat` llama a `PREPARAR_BACKEND.bat`, que revisa el entorno `.venv`, instala las dependencias indicadas en `backend/requirements.txt` si hacen falta y ejecuta el script usando `.venv\Scripts\python.exe`.

## Pasos recomendados

1. Cierra las ventanas de backend de MANAGER STOCK si están ejecutando otra instalación mientras preparas los datos.
2. Desde el Explorador de Windows, ejecuta `PREPARAR_BACKEND.bat` o ejecuta `CREAR_DATOS_DE_PRUEBA.bat` directamente. El segundo también prepara el entorno.
3. La primera vez se necesita conexión a Internet para descargar dependencias.
4. Cuando termine, consulta `docs/USUARIOS_DE_PRUEBA.md`.

## Si sigue apareciendo `Could not find platform independent libraries <prefix>`

El mensaje puede indicar una instalación de Python mal configurada o variables de entorno que apuntan a otra instalación. Los scripts ahora limpian `PYTHONHOME` y `PYTHONPATH`, pero si el aviso continúa:

1. Abre CMD y ejecuta `py -0p` para listar las instalaciones detectadas.
2. Comprueba que tienes Python 3.11 o posterior instalado desde la distribución oficial para Windows.
3. Cierra las terminales que ejecutan el proyecto.
4. Si `.venv` fue creado con una instalación rota, puedes eliminar únicamente la carpeta `.venv` del proyecto y volver a ejecutar `PREPARAR_BACKEND.bat`. La carpeta `.venv` solo contiene dependencias del entorno virtual; **no elimines `backend/data` ni ningún archivo de base de datos**.
5. Si `py -0p` no muestra una instalación válida, repara o reinstala Python y habilita Python Launcher.

Si la instalación de dependencias falla por conexión, vuelve a ejecutar el instalador cuando haya conexión. No continúes con el seed si las dependencias no se instalaron correctamente.

## Seguridad de los datos demo

Usa `CREAR_DATOS_DE_PRUEBA.bat` únicamente en una base de desarrollo. El script añade registros ficticios de manera idempotente y no borra los registros existentes, pero aun así conviene respaldar la base antes de ejecutarlo si contiene información que deseas conservar.
