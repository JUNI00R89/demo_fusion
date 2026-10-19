# MANAGER STOCK — Implementación y validación

Fecha de revisión: 2026-10-16

## Cambios incluidos

### Servicios y agenda

- Se añadió la ruta `/services` con catálogo de servicios, registro de profesionales y formulario para crear citas.
- La ruta `/services/appointments` queda como agenda de citas existentes: no contiene el botón para crear una cita.
- La agenda permite consultar el detalle, cambiar el estado, editar servicio/profesional/cliente/fecha/hora/observaciones y eliminar una cita con confirmación integrada.
- El backend valida la pertenencia al negocio, la disponibilidad del servicio/profesional y los solapamientos al crear o editar.
- Se añadieron endpoints `PUT /api/services/appointments/{id}` y `DELETE /api/services/appointments/{id}` con validación de permisos y auditoría.

### Conservación de módulos

- El vencimiento de las transiciones de tipo de negocio cambió de 24 horas a 15 días.
- El plazo se persiste en `business_type_transitions.expires_at`; el trabajador de backend procesa las transiciones vencidas al iniciar y periódicamente.
- La prueba de integración verifica que el plazo inicial esté alrededor de 15 días y que la limpieza vencida no borre usuarios comunes.

### Administración de usuarios

- SUPERADMIN dispone de un formulario en el panel global para crear cuentas `superadmin`, `owner`, `business_admin` y `cashier`.
- Las cuentas de negocio deben asociarse a un negocio existente; SUPERADMIN no puede tener un negocio asignado.
- Las contraseñas se almacenan con el mecanismo de hash PBKDF2 ya usado por la aplicación.
- La operación queda registrada en la auditoría global.

### Suscripciones

- Se añadieron planes centralizados en el backend: Gratis, Emprendedor, Negocio y Empresarial.
- La selección de un plan de pago registra `pending_payment`; no simula un cobro ni activa por sí sola el plan.
- Los límites del plan activo se validan en el backend para altas de productos y usuarios.
- SUPERADMIN puede consultar solicitudes y confirmar manualmente una solicitud después de verificar externamente el pago, registrando una referencia de pago. Esta acción no equivale a una integración automática con un proveedor.
- Las suscripciones de pago activadas manualmente vencen en 30 días; al consultar la suscripción tras el vencimiento, el backend pasa el negocio al plan Gratis y marca el estado como vencido.
- No se implementaron cobros recurrentes, webhooks ni renovaciones automáticas. Debe integrarse y probarse un proveedor de pagos antes de producción.

### Web pública y distribución

- Se añadió un carrusel accesible con controles manuales en la página pública.
- La página de planes obtiene sus precios y límites desde el endpoint público `/api/subscription/plans`.
- Se añadió `/descargas` con el estado real de disponibilidad por plataforma. No se publican enlaces a instaladores inexistentes.
- No hay paquetes de instalación firmados para Windows, Android, iOS o Linux en esta entrega. La página de descargas lo comunica explícitamente.
- El login existente ya contaba con una composición visual y fondos animados; se conserva.

### Permisos

- Se añadieron permisos de interfaz para consultar servicios y gestionar servicios/citas, además de los permisos de hotel que ya admitía el backend.
- Los endpoints nuevos de edición y eliminación de citas comprueban permisos y pertenencia al negocio en el backend.

## Pruebas ejecutadas

### Aprobadas

- `python -m py_compile backend/main.py scripts/*.py`.
- `python backend/tests/test_sales_api.py`: terminó con `OK`.
- La prueba de integración ahora cubre el plazo de 15 días, consulta de planes, solicitud de cambio a plan pago sin simular pago, gestión global de usuarios, confirmación manual de una suscripción con referencia, y edición/eliminación de citas.
- Transpilación sintáctica TypeScript/TSX con TypeScript global: 97 archivos revisados, 0 errores sintácticos.

### No ejecutadas / limitaciones

- No se completó `npm install --no-audit --no-fund`: agotó el tiempo de ejecución en este entorno. No fue posible ejecutar `npm run build` ni el chequeo completo de tipos.
- La transpilación sintáctica no sustituye el chequeo de tipos ni una compilación Vite.
- No se probó la interfaz en un navegador real ni en dispositivos móviles.
- No se ejecutaron los archivos BAT en un equipo Windows real; la instalación de Python y los paquetes debe verificarse allí.
- No se generaron ni firmaron instaladores para ningún sistema operativo.
- No se integró un proveedor de pagos real. La confirmación de pago desde SUPERADMIN debe utilizarse únicamente después de verificar el pago externamente.

## Instalación local sugerida en Windows

1. Descomprimir el ZIP en una carpeta de trabajo.
2. Abrir la carpeta `MANAGER-STOCK` en Visual Studio Code.
3. Ejecutar `PREPARAR_BACKEND.bat` para crear/reparar `.venv` e instalar las dependencias Python.
4. En una terminal, ejecutar `npm install`.
5. En una terminal, ejecutar `npm run dev` para iniciar Vite.
6. En otra terminal, ejecutar `INICIAR_MANAGER_STOCK.bat` o iniciar el backend con `.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000`.
7. Para datos de demostración, revisar las advertencias de `docs/USUARIOS_DE_PRUEBA.md` y ejecutar `CREAR_DATOS_DE_PRUEBA.bat` solo sobre una base de desarrollo. El inicializador no debe ejecutarse contra una base real.

## Riesgos y trabajo pendiente

- Ejecutar instalación y build de frontend en Windows, corregir los errores que surjan y volver a ejecutar las pruebas.
- Probar visualmente todas las rutas en móvil/tablet/escritorio y ajustar detalles de accesibilidad.
- Añadir pruebas de integración UI para el flujo de citas y el panel de suscripciones.
- Integrar un proveedor de pagos con webhooks autenticados, confirmación idempotente y pruebas en sandbox.
- Completar paquetes firmados y procesos de publicación para Android, Windows, iOS y Linux.
- Revisar y documentar las políticas de permisos para cada módulo de negocio en un entorno de aceptación completo.
