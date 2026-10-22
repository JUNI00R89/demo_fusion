# Bitácora de errores y correcciones — E03 Semana 3

> Registro **real** de los problemas que aparecieron durante la construcción y ejecución del
> laboratorio, de lo que se hizo para resolverlos y de cómo se comprueba que quedaron resueltos.
> No es una lista teórica: cada entrada corresponde a un fallo o a una decisión que cambió
> algo del entregable.
>
> **Convención de estados:** `RESUELTO` = corregido y verificado con una prueba;
> `DECIDIDO` = no era un fallo sino una decisión de diseño que quedó documentada;
> `PENDIENTE` = sigue abierto.

---

## BE-01 — El usuario de práctica no se creaba y la autenticación fallaba

| | |
| --- | --- |
| **Estado** | RESUELTO |
| **Dónde** | `scripts/00_preparar_lab_mongodb.ps1` |
| **Síntoma** | La instancia arrancaba con `--auth`, pero cualquier conexión con `--username aprendiz_nosql` respondía `MongoServerError: Authentication failed`, aunque el script anunciara la creación del usuario. |
| **Causa raíz** | Windows PowerShell 5.1 escribe **BOM (EF BB BF)** al frente de un archivo con `Set-Content -Encoding UTF8`. `mongosh` no acepta el BOM en un archivo `.js` y aborta con `SyntaxError`, **antes** de ejecutar nada. Como el script solo comprobaba el texto de salida, el fallo quedaba silencioso y parecía un problema de contraseña. |
| **Diagnóstico** | Se reprodujo el error a mano: `mongosh --file archivo_con_bom.js` → `SyntaxError: Unexpected token '<BOM>'` (el BOM se ve como un carácter invisible antes del `const`). |
| **Solución** | Escribir siempre los `.js` temporales con `Write-Utf8NoBom`, es decir `[System.IO.File]::WriteAllText($ruta, $contenido, (New-Object System.Text.UTF8Encoding($false)))`. |
| **Verificación** | El script imprime `USUARIO_OK=1` y `USUARIO_DB=emprendimiento_sena_lab` y aborta con un mensaje explícito si no lo consigue. La verificación final exige `ping=1` **y** que no aparezca `Authentication failed`. |
| **Lección** | "El usuario no existe" y "la contraseña es incorrecta" producen el mismo mensaje. Cuando una autenticación falla, hay que verificar **que el usuario exista** (`db.getUser(...)`) antes de cambiar la contraseña. |

---

## BE-02 — La instancia del puerto 27017 no era accesible

| | |
| --- | --- |
| **Estado** | DECIDIDO |
| **Dónde** | Entorno del laboratorio |
| **Síntoma** | El servidor que ya estaba corriendo en `127.0.0.1:27017` tiene `authorization: enabled` y su cuenta administrativa no es conocida. No se pudo abrir una sesión ni crear la cuenta de práctica. |
| **Riesgo** | Forzar el acceso o tocar ese servidor habría destruido los datos de E01/E02 que el instructor necesita conservar. |
| **Decisión** | Levantar una **instancia aislada** en el puerto `27018`, con su propio `dbPath` (`.lab/mongodb/data`), `--bind_ip 127.0.0.1`, `--auth` y su propia base de autenticación. Esto es exactamente lo que pide la guía de la Semana 1 en §5.6: *"cada equipo de trabajo debe tener una instancia aislada o una base/cuenta equivalente"*. |
| **Verificación** | El proceso del laboratorio corre con `--dbpath …E03_NoSQL_Semana3/.lab/mongodb/data --port 27018 … --auth`. El `dbPath` es distinto del del servidor 27017, de modo que **no se puede** tocar el otro por accidente. |
| **Consecuencia para el aprendiz** | Todos los comandos de este laboratorio usan el puerto **27018**. Si el aprendiz usa `27017` sin la cuenta correcta, verá `Authentication failed`. |

---

## BE-03 — PowerShell bloqueaba el lanzador `mongosh`

| | |
| --- | --- |
| **Estado** | RESUELTO |
| **Síntoma** | `mongosh` (sin extensión) fallaba con *"No se puede cargar el archivo … porque la ejecución de scripts está deshabilitada en este sistema"*. |
| **Causa** | Al instalar `mongosh` con npm en Windows se generan tres lanzadores: `mongosh` (bash), `mongosh.ps1` (PowerShell) y `mongosh.cmd` (cmd). PowerShell elige el `.ps1`, que está bloqueado por la política de ejecución. |
| **Solución** | Invocar explícitamente `C:\Users\Sena\AppData\Roaming\npm\mongosh.cmd`. En el script PowerShell del laboratorio, `Get-Mongosh` busca primero `mongosh.cmd` y descarta el `.ps1`. |
| **Verificación** | `& "$env:APPDATA\npm\mongosh.cmd" "mongodb://…" --username … --password … --authenticationDatabase … --quiet scripts/04_verificar_base.js` |
| **Nota adicional** | `npm` también tiene el mismo problema: hay que escribir `npm.cmd install -g mongosh`, no `npm install -g mongosh`. |

---

## BE-04 — `insertMany()` no devuelve un arreglo de identificadores

| | |
| --- | --- |
| **Estado** | RESUELTO |
| **Dónde** | `scripts/01_cargar_semilla.js` |
| **Síntoma** | `resInsert.insertedIds.length` devolvía `undefined`, y la confirmación de la carga mostraba `"insertados=undefined documentos"`. |
| **Causa** | En `mongosh`, `insertMany()` devuelve `{ acknowledged, insertedIds }` donde `insertedIds` es un **objeto** (mapa `_id → _id`), no un arreglo. |
| **Solución** | `const insertados = Object.keys(resInsert.insertedIds || {}).length;` |
| **Verificación** | La carga informa `10 documentos insertados`, `15 documentos insertados` y `30 documentos insertados`, y la sección 6 revalida los conteos contra los archivos de semilla. |

---

## BE-05 — Texto corrupto en el archivo de iniciativas

| | |
| --- | --- |
| **Estado** | RESUELTO |
| **Dónde** | `data/iniciativas.ejson` |
| **Síntoma** | Al revisar el EJSON, las notas del `historial_estados` y las observaciones de los `diagnosticos` aparecían con caracteres corruptos (secuencias sin sentido en lugar de español). |
| **Causa** | El archivo se había generado en una pasada anterior con texto mal codificado. |
| **Solución** | Se reescribieron todas las cadenas de `nota` y `observacion` en español limpio, manteniendo el resto del documento intacto. |
| **Verificación** | Barrido automático de todo el árbol del entregable en busca de caracteres de reemplazo (`U+FFFD`) y de secuencias no imprimibles: **0 coincidencias**. Además `01_cargar_semilla.js` valida el EJSON antes de escribir y aborta si algo no cuadra. |

---

## BE-06 — `findOneAndUpdate` devuelve el documento, no `{ value: … }`

| | |
| --- | --- |
| **Estado** | RESUELTO |
| **Dónde** | `scripts/02_demo_crud.js` |
| **Síntoma** | Al ejecutar el `findOneAndUpdate` con `{ returnDocument: 'after' }`, el valor devuelto era `undefined` y la lectura de control mostraba `campo demo: null`. |
| **Causa** | Los drivers antiguos de MongoDB devolvían `{ value: <documento>, ok: 1 }`. `mongosh` 2.x devuelve **el documento directamente**. El código estaba escrito para la forma antigua. |
| **Solución** | Aceptar las dos formas: `const doc = (devuelto && devuelto.value !== undefined) ? devuelto.value : devuelto;` |
| **Verificación** | La lectura #3 del CRUD muestra `demo.estado = "actualizado_atomico"` y `demo.version = 2`, es decir, el documento devuelto trae el cambio aplicado. |
| **Lección** | La API de JavaScript puede cambiar entre versiones sin avisar. Un buen script de laboratorio debe ser tolerante a las dos formas cuando el resultado se usa para verificar. |

---

## BE-07 — `JSON.parse` no entiende las fechas del EJSON

| | |
| --- | --- |
| **Estado** | RESUELTO |
| **Dónde** | Utilidad de inventario externa (temporal) y cualquier herramienta que lea `data/*.ejson` fuera de `mongosh` |
| **Síntoma** | Al leer las semillas con `JSON.parse`, `fecha_creacion` llegaba como el objeto `{"$date": "2026-01-20T13:00:00.000Z"}` y cualquier llamada a `.toISOString()` fallaba con `TypeError: d.fecha_creacion.toISOString is not a function`. |
| **Causa** | El EJSON (Extended JSON) es JSON con extensiones; `JSON.parse` no sabe deserializar `$date`. |
| **Solución** | En `mongosh` se usa `EJSON.parse(...)`, que **sí** devuelve un `Date` de BSON. Fuera de `mongosh` hay que convertir a mano (`{"$date": "…"}` → `new Date(…)`). |
| **Verificación** | `01_cargar_semilla.js` lee con `EJSON.parse`, comprueba con `instanceof Date` que las fechas llegaron como Date y aborta si alguna llegó como cadena. El control **V-17** vuelve a leer los tres archivos con `EJSON.parse` y confirma que los identificadores en disco coinciden con los de la base. |
| **Lección** | En un laboratorio de NoSQL, "la fecha es una cadena" y "la fecha es un Date" son **modelos de datos distintos**, no dos formas de escribir lo mismo. |

---

## BE-08 — Dos asesorías del mismo asesor en la misma franja

| | |
| --- | --- |
| **Estado** | RESUELTO |
| **Dónde** | `data/asesorias.ejson` |
| **Síntoma** | El control **V-20** (*"no programar dos asesorías para el mismo asesor en la misma franja"*) detectó un choque: `ASE-030` estaba programada el **2026-10-05**, el mismo día en que el mismo asesor (`ADV-07`, Sara Montoya) realizó `ASE-007`. |
| **Causa** | Al generar la semilla no se tuvo en cuenta la regla de franja al elegir la fecha de `ASE-030`. |
| **Solución** | Se movió `ASE-030.fecha_programada` del **2026-10-05** al **2026-10-08**. La fecha de una asesoría cancelada no altera la narrativa del caso (la asesoría se canceló por reasignación de agenda del asesor). |
| **Verificación** | V-20 vuelve a ejecutarse y reporta **0 choques** con 9 asesores (`ADV-01` … `ADV-09`). El control recorre las fechas de programación **y** de realización de cada asesoría, porque una franja puede definirse por cualquiera de las dos. |
| **Franja adoptada** | **Día UTC completo.** Es una franja de laboratorio, deliberadamente simple: en producción la franja sería la hora de inicio + duración, y la garantía de concurrencia sería un mecanismo (no una regla). La guía de E01 pide exactamente esa distinción. |

---

## BE-09 — El conteo de septiembre daba 13 y no 14

| | |
| --- | --- |
| **Estado** | RESUELTO |
| **Dónde** | `scripts/03_consultas_aprendiz.js` y `scripts/04_verificar_base.js` (bloque 10) |
| **Síntoma** | Al recontar el reto de transferencia **a mano**, con el filtro `{ estado: "realizada", fecha_realizacion: { $gte: ISODate("2026-09-01"), $lte: ISODate("2026-09-30") } }`, el resultado fue de **13** asesorías y no de 14. El script, en cambio, informaba 14 y "COINCIDE". |
| **Causa** | `ISODate('2026-09-30')` es `2026-09-30T00:00:00.000Z`, es decir, **medianoche**. `ASE-020` se realizó el 2026-09-30 a las 14:00 y quedaba fuera del rango. El script usa el rango completo `$lte: 2026-09-30T23:59:59.999Z`. |
| **Solución** | Se mantuvo el rango completo en los scripts y se documentó la trampa en `docs/matriz_consultas_C01_C10.md` y en `docs/sustentacion.md`. |
| **Verificación** | Se ejecutaron las dos variantes contra la base real: con `$lte: ISODate('2026-09-30')` → **13**; con `$lte: new Date('2026-09-30T23:59:59.999Z')` → **14**. El segundo es el que usa el entregable. |
| **Lección** | "Rango de fechas" significa intervalo **cerrado** en los dos extremos y con hora, no solo el día. Es un error silencioso: el número que sale es "razonable" y no da error de sintaxis. |

---

## BE-10 — La consulta "ingenua" del reto C09 devolvía el doble

| | |
| --- | --- |
| **Estado** | RESUELTO |
| **Dónde** | `scripts/03_consultas_aprendiz.js` (bloque C09) |
| **Síntoma** | El filtro `{ 'diagnosticos.tipo': 'mercado', 'diagnosticos.puntaje': { $gte: 80 } }` devolvía **12** iniciativas, cuando la respuesta correcta son **6**. |
| **Causa** | La notación con punto evalúa **cada condición por separado** sobre el arreglo de subdocumentos. Basta con que *algún* elemento sea de tipo `mercado` y *algún* elemento (distinto) tenga puntaje ≥ 80. `INI-001`, por ejemplo, tiene un diagnóstico de mercado con 72 y uno operativo con 85: cumple el filtro ingenuo sin que ningún diagnóstico de mercado llegue a 80. |
| **Solución** | Se usa `$elemMatch`, que exige que **todas** las condiciones se cumplan **en el mismo** elemento del arreglo. |
| **Verificación** | Ejecutadas las dos variantes contra la base real: `$elemMatch` → **6** (`INI-002`, `INI-003`, `INI-006`, `INI-009`, `INI-013`, `INI-015`); notación ingenua → **12**, con 6 falsos positivos (`INI-001`, `INI-004`, `INI-008`, `INI-010`, `INI-011`, `INI-012`). |
| **Valor didáctico** | Es la razón de ser de C09 en la matriz: **no basta con que la consulta devuelva filas**. Hay que preguntar qué significa cada fila. |

---

## BE-11 — `null` y "campo ausente" estaban confundidos en la semilla

| | |
| --- | --- |
| **Estado** | RESUELTO |
| **Dónde** | `data/*.ejson` |
| **Síntoma** | La primera versión de la semilla usaba `null` de forma uniforme para "sin dato", y en `s03_asesorias` había `fecha_realizacion: null` incluso en las asesorías **canceladas**. |
| **Problema** | (a) `null` y "campo ausente" son estados **distintos** en MongoDB y producen conteos diferentes; (b) el modelo necesita que la ausencia de `fecha_realizacion` signifique "no se realizó", y eso vale para `cancelada`, pero en `programada`/`reprogramada` el campo debe **existir** y valer `null` (la asesoría está agendada, no inconclusa). |
| **Solución** | Se fijó la regla (y se automatizó en el control **V-10**):<br>• `realizada` → `fecha_realizacion` es **Date**<br>• `programada` / `reprogramada` → `fecha_realizacion` **existe** y es **null**<br>• `cancelada` → `fecha_realizacion` **no existe** |
| **Verificación** | V-10 recorre las 30 asesorías y no encuentra ninguna infracción. Los cubos de `canal_preferido` (5/3/2), `mentor` (6/5/4) y `canal_contacto` (22/5/3) también se comprueban en **V-13**. |
| **Lección** | `{ campo: null }` en MongoDB devuelve **los `null` y los ausentes**. Para separarlos hay que usar `{ campo: { $type: "null" } }` y `{ campo: { $exists: false } }` (consultas C07 y C08). |

---

## BE-12 — La guarda de escritura no cubría todos los casos

| | |
| --- | --- |
| **Estado** | RESUELTO |
| **Dónde** | `scripts/02_demo_crud.js` |
| **Síntoma** | La primera versión de `escrituraPermitida()` solo comprobaba que el `_id` empezara por `TMP-E03-`. Un documento temporal con prefijo correcto pero **dentro** de una colección de la semilla hubiera pasado el filtro sin más. |
| **Solución** | La guarda ahora tiene **dos** condiciones: (1) prefijo `TMP-E03-`; (2) el `_id` **no** puede casar con el patrón de la semilla de esa colección (`^EMP-\d{3}$`, `^INI-\d{3}$`, `^ASE-\d{3}$`). Si alguna falla, **lanza** una excepción y la operación no llega al servidor. |
| **Verificación** | La sección 2 de la demostración intenta escribir sobre `INI-001` y la excepción se produce: `Operacion bloqueada: "INI-001" pertenece a la semilla y no se puede modificar.` A continuación el script comprueba que `INI-001` conserva `sector=economia_circular`, `etapa=puesta_en_marcha` y sus 4 entradas de historial. |

---

## Resumen

| Código | Tema | Tipo | Estado |
| --- | --- | --- | --- |
| BE-01 | BOM UTF-8 en PowerShell 5.1 | Entorno | RESUELTO |
| BE-02 | Puerto 27017 inaccesible | Entorno | DECIDIDO (instancia aislada en 27018) |
| BE-03 | Lanzador `mongosh.ps1` bloqueado | Entorno | RESUELTO |
| BE-04 | `insertMany().insertedIds` es un objeto | API | RESUELTO |
| BE-05 | Texto corrupto en `iniciativas.ejson` | Datos | RESUELTO |
| BE-06 | `findOneAndUpdate` sin envoltorio `value` | API | RESUELTO |
| BE-07 | `JSON.parse` no deserializa `$date` | EJSON | RESUELTO |
| BE-08 | Choque de franja del asesor `ADV-07` | Regla del caso | RESUELTO |
| BE-09 | Límite superior del rango de fechas | Lógica de consulta | RESUELTO |
| BE-10 | Notación con punto en arreglos | Lógica de consulta | RESUELTO |
| BE-11 | `null` vs. campo ausente | Modelo de datos | RESUELTO |
| BE-12 | Guarda de escritura incompleta | Seguridad | RESUELTO |

**Pendientes conocidos:** ninguno en el momento de la entrega. La única limitación declarada es de
contexto, no técnica: **no existe en este equipo el kit de la Semana 2 (E02)**, por lo que la
semilla `S03_UE_V1` se construyó a partir de la especificación explícita de la guía de la Semana 1
(counts 10/15/30 y reglas del caso). Está documentado en `docs/revision_cruzada.md`, sección 3.
