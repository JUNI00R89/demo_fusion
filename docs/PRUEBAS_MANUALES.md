# Guía de pruebas manuales

Realiza estas comprobaciones en un entorno de desarrollo. No uses la base de datos de un negocio real para pruebas destructivas.

## Arranque

1. Ejecuta `INICIAR_MANAGER_STOCK.bat`.
2. Comprueba `http://127.0.0.1:8000/api/health` y abre `http://127.0.0.1:8000/docs`.
3. Crea el SUPERADMIN con `CREAR_SUPERADMIN.bat` o desde la terminal usando `scripts/create_superadmin.py`.
4. Inicia sesión. Registra un propietario desde el formulario público en otra sesión/correo y configura su negocio.

## Roles y permisos

1. Entra con SUPERADMIN y confirma que solo abra el panel global, sin menú de productos o ventas de una empresa.
2. Comprueba que se muestren estadísticas globales, negocios, usuarios y auditoría administrativa.
3. Suspende un negocio de prueba e intenta usar su token. El backend debe rechazar las operaciones; luego reactívalo.
4. Entra como propietario y crea un administrador de negocio y un cajero.
5. Comprueba que el cajero no pueda gestionar usuarios, cambiar la configuración, crear productos, consultar la auditoría administrativa global o anular ventas.
6. Comprueba que el cajero pueda leer productos y ventas propias, abrir su caja y registrar una venta en su propio turno.
7. Intenta abrir directamente una ruta no permitida. Debe mostrarse acceso denegado y la API también debe rechazar la operación.


## Roles personalizados y dashboard

1. Entra como propietario y abre **Usuarios y permisos**. Crea un rol “Solo catálogo” con el permiso de consultar productos y crea una cuenta que utilice ese rol.
2. Inicia sesión con esa cuenta. Debe ver solo las secciones permitidas; no debe ver los totales de ventas si no tiene `sales.view`, ni accesos a caja, administración o configuración que no estén autorizados.
3. Intenta abrir directamente una ruta y una operación de API sin permiso. La interfaz debe mostrar acceso denegado y la API debe responder 403.
4. Comprueba que un rol con `reports.view` tenga lectura de catálogo y ventas necesaria para calcular sus reportes; no debe obtener permisos de edición por ese motivo.

## Apariencia y punto de venta

1. Abre el punto de venta. No debe aparecer `ReferenceError: Package is not defined`. Prueba búsqueda de productos, carrito y registro de venta.
2. En **Configuración → Personalización de apariencia**, cambia el color principal, fondo y modo claro/oscuro; revisa la vista previa y guarda.
3. Recarga y vuelve a iniciar sesión: el tema guardado debe persistir. Pulsa Cancelar durante una edición para restaurar el tema guardado; usa Restaurar predeterminados para volver a la paleta del tipo de negocio.
4. Cambia temporalmente el tipo de negocio desde la configuración: el tema predeterminado debe corresponder al nuevo tipo, a menos que se haya guardado una personalización. El catálogo y las ventas se deben conservar.
5. En el asistente de configuración, escribe lentamente el nombre del negocio y cambia el tipo. El campo no debe perder foco, vaciarse ni recargar la página en cada letra.

## Suspensión y chat de soporte

1. Entra como SUPERADMIN. Suspende un negocio de prueba escribiendo un motivo de al menos cuatro caracteres y una descripción opcional.
2. Como propietario del negocio suspendido, inicia sesión de nuevo. Debe aparecer una pantalla de suspensión con el motivo y la fecha. La API debe bloquear ventas, caja, inventario y cambios de usuarios.
3. Desde la pantalla de suspensión, envía un mensaje. Como SUPERADMIN, abre **Comunicaciones y suspensiones**, contesta el mensaje y actualiza el estado del caso.
4. Comprueba que el propietario reciba la respuesta después de actualizar el chat y que otro negocio no pueda consultar ese caso.
5. Resuelve el caso desde SUPERADMIN. La cuenta debe reactivarse y los datos del negocio deben conservarse.

## Negocio de comidas sin recetas

1. Configura el negocio como **Negocio de comidas**.
2. En el asistente elige una o más modalidades y tipos de comida; activa solo los módulos que realmente necesitas.
3. En **Menú / Productos**, registra por ejemplo una hamburguesa como producto individual con precio, costo, stock y stock mínimo. No registres ingredientes ni recetas.
4. Comprueba que no aparezca una pantalla de recetas y que `GET /api/recipes` responda 404 para ese negocio.
5. Si activaste pedidos, crea una comanda y cambia su estado por recibido, en preparación, listo y entregado. Una comanda todavía no es una venta cobrada ni descuenta stock.
6. Si activaste Caja / Ventas, abre un turno y vende más de un producto.
7. Revisa el historial, los pagos y los movimientos de inventario. Al cobrar deben actualizarse venta y existencias en una operación coherente.
8. Si no activaste inventario pero sí Menú, confirma que puedes editar el catálogo y que las pantallas/operaciones de inventario no se presenten como habilitadas.

## Ventas, caja e inventario

1. Registra una venta con dos productos y confirma que el detalle contenga ambas líneas.
2. Reenvía la misma petición con la misma `idempotencyKey`. Debe devolver la venta existente sin descontar stock otra vez.
3. Intenta vender una cantidad superior a la existencia. Debe fallar sin crear una venta parcial.
4. Cambia el costo del producto después de una venta y comprueba que el detalle histórico mantiene el costo original.
5. Prueba un pago dividido con sus importes completos; después prueba uno sin desglose, que debe ser rechazado.
6. Cambia temporalmente la tasa de impuesto en ajustes y manda una petición de venta con otro `taxRate`. El servidor debe aplicar la tasa que está guardada en la configuración, no la del cuerpo de la solicitud.
7. Anula una venta. Debe conservarse con estado `cancelled` y los movimientos de inventario deben revertirse.
8. Comprueba que las ventas del cajero estén ligadas al usuario y su turno.
9. Consulta páginas sucesivas del historial y confirma que aparecen todos los registros.

## Cambiar tipo de negocio

1. Configura un negocio, registra un producto y una venta de prueba.
2. Abre **Configuración → Reconfigurar tipo de negocio**.
3. Cambia el tipo, guarda y comprueba que cambie el menú sin eliminar el producto ni el historial.
4. Entra de nuevo a configuración y comprueba que Cancelar conserva el tipo y los módulos actuales.
5. Vuelve a seleccionar Negocio de comidas y comprueba que la configuración y el catálogo se lean de la API.

## Registros locales y conexión

1. Mientras haya una sesión autenticada, detén temporalmente la API y comprueba que la interfaz muestre **API desconectada**.
2. No intentes registrar ventas mientras la API esté caída. La sesión no debe pasar silenciosamente a `localStorage`.
3. Reinicia la API y confirma que el historial se vuelve a cargar del servidor.
4. Si hay registros de pruebas previos solo en el navegador, no los importes a SQLite sin respaldarlos y verificar sus efectos de inventario.


## Categorías y unidades de inventario

1. Configura una tienda y entra a **Productos → Nuevo producto**. Comprueba que las categorías iniciales sean las de comercio.
2. Cambia el negocio de prueba a comidas y verifica que aparezcan categorías de comida sin que se eliminen las personalizadas ya guardadas.
3. Usa **Crear nueva categoría**. La categoría debe guardarse y seleccionarse inmediatamente; intenta repetir el nombre con mayúsculas y espacios adicionales y confirma que el backend lo rechaza.
4. Con unidad `unidad`, las flechas de existencias y stock mínimo avanzan de uno en uno y el servidor rechaza `1.2`. Con `kg` o `litro`, se admiten fracciones si el producto usa esa unidad.
5. Confirma que ninguna categoría ni producto de un negocio aparece en otro.

## Página pública

1. Cierra sesión y entra a `http://127.0.0.1:5173/`. Debe aparecer la presentación pública de MANAGER STOCK.
2. Recorre las secciones de funcionalidades, tipos de negocio, planes y preguntas frecuentes.
3. Pulsa **Descargar MANAGER STOCK para Windows**; mientras no exista instalador, debe navegar al login real del proyecto, no iniciar una descarga falsa.

## Transición de tipo y datos de demostración

1. Antes de cambiar un negocio de hotel a servicios, registra una habitación y una reserva de prueba.
2. Confirma el cambio mediante el modal centrado. Revisa el aviso integrado en el dashboard y verifica el tipo anterior, tipo nuevo, hora del cambio y vencimiento exacto a 15 días.
3. Usa la opción de restaurar dentro del plazo; los datos del módulo anterior deben seguir disponibles.
4. En otra prueba desechable, deja vencer la transición en base de datos y ejecuta el worker/proceso de limpieza. Se deben borrar solo los registros del módulo anterior y conservar usuarios, ventas, productos, roles y auditoría. Comprueba también que la limpieza continúa tras reiniciar el backend. No cambies la fecha del sistema operativo ni pruebes eliminaciones programadas sobre datos reales.
5. En una base de datos temporal, ejecuta `python scripts/seed_demo_data.py --allow-demo-data --db /ruta/temporal.db`. Comprueba los cinco tipos de negocio de demostración y sus usuarios. Repite el seed y verifica que no se dupliquen los registros.

## Aislamiento de hotel y servicios

1. Inicia sesión como propietario de **Hotel Senderos (Demo)** y comprueba las habitaciones y reservas.
2. Inicia sesión como propietario de **Estudio Nube (Demo)** y comprueba el catálogo de servicios, profesionales y citas.
3. Intenta usar un ID perteneciente al otro negocio en la API. El backend debe rechazarlo o devolver una lista vacía, sin filtrar datos.
4. En el hotel crea dos reservas contiguas para una habitación. Registra check-in y check-out de la primera; la habitación debe seguir reservada para la siguiente.

## Comandos automatizados

Desde la raíz del proyecto:

```powershell
.\.venv\Scripts\python.exe backend\tests\test_sales_api.py
npm run build
```

El primer comando usa una base temporal de prueba. El segundo requiere que `npm install` haya terminado correctamente.
