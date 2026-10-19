# Resultados de validación — MANAGER STOCK

Fecha de revisión: 16 de octubre de 2026.

## Comprobaciones ejecutadas

- `python backend/tests/test_sales_api.py`: aprobado. Incluye autenticación, permisos, categorías personalizadas, validación de unidades enteras, transiciones con limpieza a 15 días, aislamiento de datos por empresa, hotel, citas de servicios, temas, suspensión/chat, ventas, idempotencia, reversos, caja y auditoría.
- `python -m py_compile backend/main.py backend/tests/test_sales_api.py scripts/seed_demo_data.py scripts/create_superadmin.py`: aprobado.
- Parser global de TypeScript: 97 archivos TS/TSX revisados; 0 errores sintácticos detectados.
- `scripts/seed_demo_data.py --allow-demo-data --db /tmp/manager-stock-seed-final-3.db`: ejecutado dos veces sobre la misma base temporal. Los totales continuaron siendo 5 negocios, 11 usuarios (incluye SUPERADMIN de demo), 5 productos, 5 proveedores, 5 ventas, 2 habitaciones, 1 reserva, 2 servicios, 2 profesionales y 1 cita. No se duplicaron registros al repetir el script.
- Comprobación de código: el hotel no muestra el módulo de citas de servicios; las citas están reservadas al tipo de negocio `services` y los endpoints validan tenant y características habilitadas.

## Comprobaciones pendientes

- No se ejecutó `npm run build` en este entorno porque `node_modules` no está instalado y el intento previo de obtener dependencias desde npm agotó el tiempo de espera. El parseo sintáctico no es equivalente a una compilación completa ni a una comprobación de tipos.
- No se realizó una prueba visual en navegador tras los últimos cambios. Ejecuta `npm install`, `npm run build` y prueba los formularios, la agenda de servicios y la disponibilidad de hotel localmente.
- Los módulos de housekeeping y algunas funciones especializadas de bodega conservan áreas de prototipo; no deben considerarse listos para producción sin una revisión adicional.

## Datos de demostración

Los registros demo no se empaquetan como una base de datos lista que pueda sobrescribir información local. Ejecuta `CREAR_DATOS_DE_PRUEBA.bat` o `python scripts/seed_demo_data.py --allow-demo-data` en una base de desarrollo para crearlos. El script no borra datos existentes y se bloquea en entornos marcados como producción. Revisa `USUARIOS_DE_PRUEBA.md` para las credenciales iniciales; las contraseñas indicadas solo aplican cuando el seed crea una cuenta por primera vez.


## Actualización del 2026-10-16

- `python -m py_compile backend/main.py scripts/*.py`: aprobado.
- `python backend/tests/test_sales_api.py`: aprobado después de ampliar cobertura para transiciones de 15 días, citas editables/eliminables, límites de suscripción, solicitudes de pago y creación de usuarios por SUPERADMIN.
- Transpilación sintáctica TS/TSX: 97 archivos, 0 errores sintácticos.
- `npm install` agotó el tiempo de ejecución en el entorno de generación; no se pudo completar `npm run build` ni el chequeo completo de tipos. Ejecutar ambos en Windows antes de usar o desplegar.
- No se han generado instaladores para Windows, Android, iOS ni Linux. La página `/descargas` muestra su disponibilidad real.
