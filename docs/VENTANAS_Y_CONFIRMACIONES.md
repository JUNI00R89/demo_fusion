# Ventanas, formularios y confirmaciones

## Convención visual

MANAGER STOCK usa modales centrados basados en los componentes Radix existentes para preguntas, formularios breves y confirmaciones críticas. Se eliminan las llamadas nativas del navegador `window.confirm()` y `window.prompt()`, ya que su presentación no puede coordinarse con el diseño de la aplicación.

Los avisos no bloqueantes de éxito o error continúan usando Sonner, ahora en la esquina inferior derecha para evitar cubrir encabezados o formularios.

## Cambios incluidos

- **Suspensión de negocio (SUPERADMIN):** modal centrado con motivo obligatorio, descripción opcional, validación, cancelar y confirmar. El negocio no se suspende si se cancela o falta motivo.
- **Reactivación de negocio:** confirmación centrada antes de modificar el estado.
- **Estado de usuario:** confirmación centrada antes de suspender o reactivar una cuenta.
- **Tipo de negocio:** confirmación centrada antes de reiniciar el asistente de configuración.
- **Productos:** confirmación centrada al retirar un producto del catálogo.
- **Proveedores:** confirmación centrada al retirar un proveedor.
- **Ventas:** confirmación centrada antes de anular una venta y reponer existencias.
- **Recetas:** confirmación centrada antes de eliminar una receta.

El componente compartido `src/app/components/ConfirmActionDialog.tsx` mantiene el comportamiento y el estilo consistentes. En operaciones críticas, los botones se deshabilitan mientras la solicitud está en curso; si la operación falla, el modal permanece abierto para conservar el contexto.

## Accesibilidad y responsive

Los diálogos usan el componente `Dialog` ya basado en Radix, con portal, superposición centrada, gestión del foco y cierre accesible. El contenido tiene altura máxima adaptada al viewport y desplazamiento interno en pantallas pequeñas.

## Comprobación

Se verificó estáticamente que no queden llamadas ejecutables a `window.confirm`, `window.prompt` o `window.alert` en `src`. El análisis sintáctico TS/TSX se debe volver a ejecutar tras futuras modificaciones. El build completo requiere instalar las dependencias del proyecto.
