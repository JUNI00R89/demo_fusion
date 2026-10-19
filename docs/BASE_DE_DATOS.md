# Base de datos, ventas y trazabilidad

## Arquitectura

El frontend React/TypeScript realiza solicitudes JSON a la API FastAPI. El backend valida identidad, permisos, empresa y configuración; después opera sobre SQLite con claves foráneas y transacciones.

```text
React / TypeScript → HTTP JSON → FastAPI → SQLite
```

La ruta predeterminada de SQLite es `backend/data/manager_stock.db`, configurable con `MANAGER_STOCK_DB`. El frontend usa `VITE_API_URL` y por defecto consulta `http://127.0.0.1:8000/api`.

## Tablas centrales

| Tabla | Propósito |
|---|---|
| `businesses` | Empresa, tipo de negocio, moneda, tasa de impuesto, configuración y estado de acceso. |
| `auth_users` | Cuentas, hash de contraseña, rol, empresa y estado. |
| `auth_sessions` | Hash de tokens de sesión y vencimiento; no guarda el token plano. |
| `platform_audit` | Actividad global ejecutada por SUPERADMIN. |
| `products` | Catálogo, SKU único por empresa, precio, costo, existencias, unidad de medida y estado. |
| `product_categories` | Categorías sugeridas y personalizadas asociadas a un negocio; los nombres se normalizan para evitar duplicados. |
| `suppliers`, `supplier_products` | Proveedores y relación con productos. |
| `sales` | Encabezado, empresa, usuario, clave idempotente, subtotal, descuentos, impuesto, total, estado y caja. |
| `sale_items` | Una fila por artículo vendido, con nombre, SKU, precio y costo congelados al vender. |
| `sale_payments` | Desglose de los métodos de pago y sus importes. |
| `inventory_movements` | Entradas, salidas, ajustes y reversos con stock anterior/posterior. |
| `cash_sessions` | Turnos de caja, usuario que abre, importes de apertura/cierre y diferencias. |
| `orders`, `order_items` | Pedidos/comandas; no equivalen a ventas cobradas. |
| `hotel_rooms`, `hotel_reservations` | Habitaciones y reservas del hotel, con verificación de pertenencia al negocio y solapamiento de fechas. |
| `service_catalog`, `service_professionals`, `service_appointments` | Catálogo de servicios, profesionales y citas, aislados por empresa y con validación de horario. |
| `business_type_transitions` | Cambios de tipo de negocio y fecha UTC de expiración de los datos específicos del módulo anterior. |
| `audit_log` | Actividad relevante registrada para el negocio. |

Las tablas históricas `recipes` y `recipe_items` permanecen en el esquema para compatibilidad con bases antiguas. La experiencia de **Negocio de comidas** no las usa: la API deshabilita el endpoint de recetas, no acepta productos de tipo ingrediente para ese flujo y las ventas no descuentan ingredientes.

## Por qué los registros podían parecer truncados o desaparecer

El proyecto tenía dos riesgos distintos:

1. **Paginación incompleta.** Un endpoint con límite fijo puede devolver solo la primera página. Ahora la API admite `limit` y `offset`; el frontend solicita páginas de 500 elementos hasta que llega una página más corta.
2. **Fuentes de datos diferentes.** Si una operación se guardó en el `localStorage` del navegador, no aparecerá automáticamente en SQLite. No significa que SQLite haya cortado la venta: son almacenamientos diferentes. El proyecto preserva las ventas locales no encontradas en el servidor en `manager_stock_offline_backup_v1`, pero no las mezcla automáticamente ni vuelve a ejecutar su efecto de inventario.
3. **Fallos de conexión durante una sesión.** Una operación que falla por red es ambigua: el servidor podría haberla confirmado antes de perderse la respuesta. La sesión autenticada no debe cambiar a guardado local silencioso. En las ventas se consulta la clave idempotente y, si no se puede confirmar el estado, se informa el error para revisar el historial antes de reintentar.

Antes de limpiar datos del navegador, cerrar una sesión o sustituir el archivo SQLite, haz copias de seguridad del archivo de base de datos y de cualquier respaldo local que necesites recuperar.

## Transacción de una venta

El proceso se inicia con `BEGIN IMMEDIATE` y sigue este orden lógico:

1. Busca la clave idempotente en la empresa actual. Si la misma solicitud ya quedó registrada, devuelve la venta existente.
2. Verifica el turno de caja cuando aplica. Un cajero solo puede vender con su propia sesión de caja abierta.
3. Lee la moneda y la tasa de impuesto de la configuración persistida del negocio. No utiliza el impuesto arbitrario enviado por el navegador.
4. Valida que los productos estén activos, pertenezcan al negocio y tengan existencia suficiente. Agrupa cantidades repetidas del mismo producto.
5. Calcula precios, descuentos, impuesto y total a partir del catálogo del servidor.
6. Registra el encabezado, los artículos, las instantáneas históricas y los pagos.
7. Descuenta el stock, registra movimientos de inventario y escribe la auditoría.
8. Confirma la transacción. Si hay un error de validación, no debe quedar una venta parcial.

La clave `idempotencyKey` es única por negocio. El frontend la reutiliza al recuperar una solicitud tras un corte de conexión para evitar ventas duplicadas.

## Anulaciones y cambios de inventario

- Una venta anulada mantiene su fila en `sales` con estado `cancelled`.
- El backend revierte el efecto de inventario con movimientos trazables; no borra la venta original.
- Los artículos conservan el nombre, SKU, precio y costo que tenían al momento de la venta.
- Los reportes de ventas completadas deben excluir ventas anuladas.
- Las operaciones de ajuste de producto generan movimientos cuando cambian las existencias.

## Categorías de productos

El backend sirve las categorías sugeridas a partir del tipo de negocio y añade las categorías personalizadas guardadas en `product_categories`. Todas las consultas y operaciones de categorías están limitadas al negocio de la sesión. Los nombres se normalizan para rechazar duplicados causados por mayúsculas o espacios. Los campos de unidades discretas validan números enteros también en el servidor; unidades de peso o volumen pueden admitir fracciones.

## Cambio del tipo de negocio y transición de 15 días

La configuración del tipo y los módulos se persiste en `businesses.settings_json`; el tipo normalizado se almacena en la columna `business_type` (`restaurant` se representa internamente como `food`). Cambiar de tipo crea una fila en `business_type_transitions` con la fecha UTC de expiración a 15 días. Durante esa ventana, el propietario puede consultar el aviso o restaurar el tipo anterior. Un worker del backend procesa las transiciones vencidas tras el arranque y periódicamente, sin depender del navegador. Se eliminan únicamente las tablas del módulo antiguo con `business_id` explícito; se conservan los usuarios, ventas, productos y otros datos comunes. La ejecución se registra en auditoría y puede repetirse sin procesar la misma transición dos veces.

## Datos específicos por módulo

`hotel_rooms` y `hotel_reservations` guardan la operación central del hotel; las reservas validan la empresa propietaria, fechas y posibles solapamientos. `service_catalog`, `service_professionals` y `service_appointments` guardan los servicios, profesionales y citas. El backend filtra los registros por el identificador de negocio de la sesión y verifica que los servicios, profesionales y habitaciones relacionados pertenezcan al mismo negocio. La página de housekeeping y algunas operaciones de almacén pueden requerir integración adicional antes de producción.

## Datos de demostración

Para crear datos ficticios de forma explícita en desarrollo, usa `python scripts/seed_demo_data.py --allow-demo-data`. El script rechaza entornos marcados como producción, es idempotente y no elimina registros existentes. Puedes apuntarlo a una base temporal con `--db /ruta/temporal.db`. Las credenciales iniciales se documentan en `docs/USUARIOS_DE_PRUEBA.md`; si las cuentas ya existían, el script conserva sus contraseñas actuales.

## Seguridad y producción

Los endpoints del negocio consultan con el identificador de empresa derivado de la sesión, no desde un `businessId` libre del cliente. La autorización del backend es obligatoria: esconder el menú no es una medida de seguridad suficiente. El SUPERADMIN se crea mediante `scripts/create_superadmin.py` y no puede asignarse desde el registro público.

SQLite es adecuada para ejecutar el prototipo en un solo equipo. Para operación remota con varios usuarios, concurrencia o varias instancias, migra y prueba el sistema con PostgreSQL, HTTPS, una gestión de secretos dedicada, limitación de intentos, copias externas y procedimientos de recuperación. La revisión de permisos y la prueba en producción deben ser independientes antes de utilizar información comercial real.
