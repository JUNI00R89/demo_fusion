# Registro de operaciones CRUD — E03 Semana 3

> **Qué se demuestra:** el ciclo completo crear → leer → actualizar → leer → eliminar sobre
> documentos reales de MongoDB, con **evidencia antes y después** de cada escritura.
> **Dónde se ejecuta:** `scripts/02_demo_crud.js`.
> **Evidencia generada:** `resultados/resultados_crud.md` (se reescribe en cada ejecución con las
> salidas reales del servidor).
>
> **Regla de oro del laboratorio:** la demostración **nunca** modifica la semilla `S03_UE_V1`.
> Todo documento de prueba se marca con `dataset_id = "S03_UE_V1_TMP"` y con un `_id` que empieza
> por `TMP-E03-`, y toda escritura pasa por una función de guarda que **lanza una excepción**
> si el `_id` no cumple esa condición.

---

## 1. Reglas de seguridad aplicadas

| Regla | Implementación | Verificable en |
| --- | --- | --- |
| No escribir sobre la semilla | `escrituraPermitida(coleccion, id)` exige prefijo `TMP-E03-` **y** que el `_id` no case con el patrón de la semilla (`^EMP-\d{3}$`, `^INI-\d{3}$`, `^ASE-\d{3}$`) | Sección 3 ("Guarda de seguridad") de `resultados_crud.md` |
| Las escrituras filtran siempre por `dataset_id` | `{ _id: idTmp, dataset_id: "S03_UE_V1_TMP" }` en `updateOne`, `findOneAndUpdate` y `deleteOne` | Sección 2 ("Detalle de las operaciones") y sección 3 |
| Limpieza de residuos de una ejecución anterior | `deleteMany({ dataset_id: "S03_UE_V1_TMP" })` antes de empezar | Sección 4 ("Bitacora de la ejecucion"), línea "se limpiaron N documento(s) temporales" |
| El estado final es idéntico al inicial | Comparación de conteos antes/después por colección | Sección 1 ("Resumen por coleccion"), columna delta = 0 |
| No quedan documentos temporales | `deleteMany` final + conteo de residuos = 0 | Secciones 3 y 4, más el control **V-04** |

La guarda se invoca **antes** de cada operación de escritura, y la operación con `_id = "INI-001"`
se intenta a propósito para demostrar que el bloqueo funciona (sección 2).

---

## 2. Secuencia de operaciones por colección

La demostración se ejecuta sobre las **tres** colecciones `s03_*`, con el mismo guion. El `_id`
temporal es único por colección y por ejecución:

```
TMP-E03-<marca de tiempo en base 36>-<colección sin prefijo s03_>
```

### 2.1 `s03_emprendedores`

| # | Operación | Método | Filtro | Efecto esperado | Lectura de control |
| ---: | --- | --- | --- | --- | --- |
| 1 | **CREATE** | `insertOne(docTmp)` | — | `acknowledged: true`, 1 documento nuevo | — |
| 2 | **READ #1** | `findOne({ _id })` | `TMP-E03-…` | Devuelve el documento completo, con `fecha_registro` como **Date** | `lectura1` |
| 3 | **UPDATE** | `updateOne` con `$set` + `$inc` | `{ _id, dataset_id }` | `matchedCount: 1`, `modifiedCount: 1`; crea `demo.estado = "actualizado"` y `demo.version: 1` | — |
| 4 | **READ #2** | `findOne({ _id })` | `TMP-E03-…` | Muestra `demo: { estado: "actualizado", actualizado_en: <Date>, version: 1 }` | `lectura2` |
| 5 | **UPDATE atómico** | `findOneAndUpdate(..., { returnDocument: "after" })` | `{ _id, dataset_id }` | Devuelve el **documento ya actualizado** con `demo.estado = "actualizado_atomico"` y `demo.version: 2` | — |
| 6 | **READ #3** | `findOne({ _id })` | `TMP-E03-…` | Confirma `demo.version: 2` | `lectura3` |
| 7 | **DELETE** | `deleteOne` | `{ _id, dataset_id }` | `deletedCount: 1` | — |
| 8 | **READ #4** | `findOne({ _id })` | `TMP-E03-…` | Devuelve `null`: el documento ya no existe | `lectura4` |
| 9 | **CONTADORES** | `countDocuments({})` | — | `antes = N`, `después = N`, **delta = 0** | — |

### 2.2 `s03_iniciativas`

Misma secuencia. El documento temporal respeta la forma de una iniciativa real, con
`historial_estados` y `diagnosticos` (arrays vacíos o con una entrada), para que la demostración
muestre que los subdocumentos también se guardan y se leen como arrays.

### 2.3 `s03_asesorias`

Misma secuencia. El documento temporal usa `estado: "programada"`, `fecha_realizacion: null` y
`costo: null`, que son los valores válidos de esa forma según el diccionario de datos.

---

## 3. Filtros exactos utilizados

```javascript
// CREATE
col.insertOne(docTmp);
// docTmp = { _id: 'TMP-E03-…', dataset_id: 'S03_UE_V1_TMP', esquema_version: '1.1',
//            creado_por_demo: <marca de tiempo>, …campos del dominio… }

// READ
col.findOne({ _id: idTmp });

// UPDATE
col.updateOne(
  { _id: idTmp, dataset_id: 'S03_UE_V1_TMP' },
  {
    $set: { 'demo.estado': 'actualizado', 'demo.actualizado_en': new Date() },
    $inc: { 'demo.version': 1 }
  }
);

// UPDATE atómico (lee y escribe en una sola operación)
col.findOneAndUpdate(
  { _id: idTmp, dataset_id: 'S03_UE_V1_TMP' },
  { $set: { 'demo.estado': 'actualizado_atomico' }, $inc: { 'demo.version': 1 } },
  { returnDocument: 'after' }
);

// DELETE
col.deleteOne({ _id: idTmp, dataset_id: 'S03_UE_V1_TMP' });
```

### 3.1 Por qué `$set` y `$inc` juntos

- `$set` **asigna** valores: aquí crea el subdocumento `demo` con un estado legible y una marca de
  tiempo.
- `$inc` **incrementa** un número: `demo.version` pasa de 1 a 2 en la segunda operación. Es la forma
  correcta de llevar un contador sin leer-modificar-escribir, y por eso evita el clásico problema de
  la condición de carrera (dos escrituras simultáneas sobre el mismo documento).

### 3.2 Por qué `findOneAndUpdate` y no `updateOne`

`updateOne` informa `matchedCount` y `modifiedCount` pero **no devuelve el documento**. El
laboratorio usa las dos:

| Método | Devuelve | Uso en el laboratorio |
| --- | --- | --- |
| `updateOne` | solo contadores | Para ver el efecto "cuántos documentos cambiaron" |
| `findOneAndUpdate` | el documento (ya actualizado, con `returnDocument: "after"`) | Para leer el resultado **en la misma operación**, que es lo que hace una aplicación real |

> **Detalle de versión:** en `mongosh` 2.x, `findOneAndUpdate` devuelve el documento directamente
> (no envuelto en `{ value: … }` como en los drivers antiguos). El script acepta **las dos
> formas** (`devuelto.value !== undefined ? devuelto.value : devuelto`) para que no se rompa si el
> aprendiz usa otra versión. Ver `docs/bitacora_errores.md`, entrada **BE-06**.

---

## 4. Prueba de que la guarda funciona

Al final de la demostración se intenta deliberadamente escribir sobre la semilla:

```javascript
escrituraPermitida('s03_iniciativas', 'INI-001');
```

**Resultado esperado (y obtenido):**

```
Operacion bloqueada: "INI-001" pertenece a la semilla y no se puede modificar.
```

El script captura la excepción, la registra como **OK** y comprueba a continuación que `INI-001`
sigue intacto:

```
INFO  INI-001 sigue intacto: sector=economia_circular, etapa=puesta_en_marcha, historial=4 entradas.
```

Esto demuestra que la protección no es una promesa del README, sino una barrera que se ejecuta
antes de cada escritura.

---

## 5. Contadores: la evidencia de que nada se alteró

El script toma el número de documentos de cada colección **antes** de empezar, lo compara al final
y calcula el delta.

| Colección | Antes | Después | Delta | Documentos de la semilla al final |
| --- | ---: | ---: | ---: | ---: |
| `s03_emprendedores` | 10 | 10 | 0 | 10 |
| `s03_iniciativas` | 15 | 15 | 0 | 15 |
| `s03_asesorias` | 30 | 30 | 0 | 30 |

Un **delta de 0** en las tres colecciones más el conteo de residuos temporales en **0** prueban que
la demostración CRUD no dejó rastros.

El control **V-04** de `scripts/04_verificar_base.js` comprueba esto de forma independiente:
busca documentos con `dataset_id = "S03_UE_V1_TMP"` **o** con `_id` que empiece por `TMP-E03-`
en las tres colecciones, y falla con `ERROR` si encuentra alguno.

---

## 6. Bitácora de la última ejecución

Salida real (resumida) de `scripts/02_demo_crud.js`:

```
--- 0. Preparacion ---
INFO  Base de trabajo: emprendimiento_sena_lab
INFO  Marca de tiempo de la ejecucion: 2026-10-21T…
INFO  Dataset de trabajo: S03_UE_V1  |  documentos temporales: S03_UE_V1_TMP
INFO  s03_emprendedores: 10 documentos antes de la demostracion.
INFO  s03_iniciativas: 15 documentos antes de la demostracion.
INFO  s03_asesorias: 30 documentos antes de la demostracion.

--- 1. CRUD en s03_emprendedores  (_id temporal TMP-E03-…) ---
  CREATE (insertOne)
    acknowledged=true  insertedId=TMP-E03-…
  READ #1 (findOne por _id)
    documento leido de la base: si
  UPDATE (updateOne con $set + $inc)
    matchedCount=1  modifiedCount=1  upsertedId=null
  READ #2 (findOne por _id, despues del update)
    campo demo: { "estado": "actualizado", "actualizado_en": { "$date": "…" }, "version": 1 }
  UPDATE atomico (findOneAndUpdate, devuelve el documento)
    demo.estado = "actualizado_atomico"   demo.version = 2
  READ #3 (findOne, verificacion del update atomico)
    campo demo: { "estado": "actualizado_atomico", "actualizado_en": { "$date": "…" }, "version": 2 }
  DELETE (deleteOne por _id + dataset_id temporal)
    acknowledged=true  deletedCount=1
  READ #4 (findOne, comprobacion del borrado)
    resultado de la lectura: null (el documento ya no existe)
  CONTADORES
    antes=10  despues=10  delta=0  (delta 0 = la coleccion quedo como estaba)
OK    s03_emprendedores: la coleccion quedo con los mismos 10 documentos.

--- 2. Guarda de seguridad: escritura sobre la semilla bloqueada ---
OK    Intento de modificar s03_iniciativas/INI-001 rechazado antes de llegar al servidor.
INFO  Motivo: Operacion bloqueada: "INI-001" pertenece a la semilla y no se puede modificar.
INFO  INI-001 sigue intacto: sector=economia_circular, etapa=puesta_en_marcha, historial=4 entradas.

--- 3. Limpieza final y verificacion de residuos ---
INFO  s03_emprendedores: 0 temporal(es) eliminado(s) en la limpieza, 0 residuo(s) al final.
INFO  s03_iniciativas: 0 temporal(es) eliminado(s) en la limpieza, 0 residuo(s) al final.
INFO  s03_asesorias: 0 temporal(es) eliminado(s) en la limpieza, 0 residuo(s) al final.
OK    Estado final identico al inicial en las tres colecciones y sin residuos temporales.

--- 4. Archivo de resultado ---
[OK]    Resultados escritos en …\resultados\resultados_crud.md
Demostracion CRUD completada sin errores.
```

La salida completa, con los documentos insertados mostrados en EJSON, queda en
`resultados/resultados_crud.md`.

---

## 7. Diferencias entre el script y lo que haría una aplicación real

| Aspecto | Laboratorio (`02_demo_crud.js`) | Aplicación real |
| --- | --- | --- |
| Errores | Se capturan y se registran en la bitácora | Se manejan con `try/catch` en la capa de servicio y se traducen a errores de negocio |
| Transacciones | Cada operación es independiente | Una asesoría con su cobro necesita **transacción** (`session`) para que no queden estados intermedios |
| Concurrencia | Se muestra `$inc` como forma segura de contador | El bloqueo optimista (`version` en el filtro) evita sobrescrituras perdidas |
| Validación | Valida el patrón del `_id` | Valida el **esquema** completo (JSON Schema) y los dominios de valores |
| Idempotencia | `01_cargar_semilla.js` es idempotente | Las escrituras de negocio necesitan **claves de idempotencia** para poder reintentarse sin duplicar |

Estas diferencias se explican en `docs/sustentacion.md` (preguntas P5, P6 y P14).
