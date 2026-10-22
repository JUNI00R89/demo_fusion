# Actividades A1 – A6 y reto de transferencia — E03 Semana 3

> Guía de trabajo de la Semana 3: *Bases de Datos NoSQL — CRUD y consultas reproducibles*.
> Cada actividad tiene **propósito**, **insumos**, **pasos**, **evidencia** (el archivo exacto que
> la demuestra) y **criterio de cierre**. Todas las actividades se resuelven **con la base real**;
> ninguna respuesta es simulada.
>
> **Continuidad:** las actividades A1–A6 de esta semana son la continuación de A1–A5 de la Semana 1
> (ver el mapeo de la §7). El entregable ya viene con todas las evidencias generadas; lo que el
> aprendiz debe producir es la **explicación**, no rehacer la base.

---

## Mapa rápido

| Actividad | Tema | Evidencia principal | Script |
| --- | --- | --- | --- |
| **A1** | Verificar el entorno y cargar la semilla de forma reproducible | `resultados/resultados_crud.md` (bitácora), `README.md` | `00_preparar_lab_mongodb.ps1`, `01_cargar_semilla.js` |
| **A2** | Leer y explicar un documento (tipos BSON, `null` vs. ausente) | `docs/diccionario_datos_v1.1.md` | `01_cargar_semilla.js` (muestra de lectura) |
| **A3** | Formular reglas y consultas: C01 – C10 | `resultados/resultados_consultas.md`, `docs/matriz_consultas_C01_C10.md` | `03_consultas_aprendiz.js` |
| **A4** | Demostrar el ciclo CRUD de forma segura | `resultados/resultados_crud.md`, `docs/registro_operaciones_crud.md` | `02_demo_crud.js` |
| **A5** | Verificar la base con controles automatizados | `resultados/informe_pruebas.md` | `04_verificar_base.js` |
| **A6** | Socializar, contrastar y sustentar | `docs/sustentacion.md` | — |
| **RETO** | Transferencia: sector histórico y asesorías de septiembre | `resultados/resultados_consultas.md` (sección "Reto de transferencia") | `03_consultas_aprendiz.js` |

---

## A1 — Verificar el entorno y cargar la semilla de forma reproducible

**Propósito.** Demostrar que la base de trabajo está bien (instancia correcta, base correcta,
autenticación activa, fechas de tipo `Date`) y que la semilla se puede cargar **cuantas veces se
quiera sin duplicar nada**.

**Insumos.** MongoDB Server 7.0.43, `mongosh` 2.13.0, Node v24.21.0, Windows 11 + PowerShell 5.1.

**Pasos.**

1. Levantar la instancia aislada del laboratorio:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts\00_preparar_lab_mongodb.ps1
   ```
   El script crea `.lab/mongodb/data`, genera una contraseña de práctica **en el momento**, crea el
   usuario `aprendiz_nosql` con `readWrite` + `dbAdmin` sobre `emprendimiento_sena_lab` y reinicia
   `mongod` **con** `--auth`.
2. Cargar la semilla:
   ```powershell
   & "$env:APPDATA\npm\mongosh.cmd" "mongodb://127.0.0.1:27018/emprendimiento_sena_lab" `
     --username aprendiz_nosql --password ((Get-Content .lab\mongodb\password.txt -Raw).Trim()) `
     --authenticationDatabase emprendimiento_sena_lab --quiet scripts\01_cargar_semilla.js
   ```
3. **Repetir el paso 2** y comprobar que el resultado es el mismo (idempotencia): los conteos siguen
   siendo 10 / 15 / 30 y los índices no se duplican.
4. Opcional: validar **sin escribir** con el modo simulación:
   ```powershell
   $env:E03_DRY_RUN = "1"; & "$env:APPDATA\npm\mongosh.cmd" … scripts\01_cargar_semilla.js
   ```
5. Comprobar a mano que una fecha sigue siendo `Date`:
   ```javascript
   db.s03_iniciativas.findOne({ _id: 'INI-001' }).fecha_creacion instanceof Date   // true
   ```

**Evidencia.** Salida de `01_cargar_semilla.js`: *"10 documentos insertados"*, *"15 documentos
insertados"*, *"30 documentos insertados"*, los 10 índices creados y la muestra *"fecha_creacion=…
(Date de BSON preservado por EJSON.parse)"*.

**Criterio de cierre.** El aprendiz puede explicar, sin mirar el código, **por qué** la carga es
idempotente (borra solo los documentos de `S03_UE_V1` y los vuelve a insertar) y **por qué** un
documento ajeno en la base no se toca (el filtro de borrado incluye `dataset_id`).

**Errores esperados en esta actividad.** BE-01 (BOM), BE-02 (puerto 27017), BE-03 (lanzador
`mongosh.ps1`), BE-04 (`insertedIds` es un objeto), BE-07 (`JSON.parse` no lee `$date`). Ver
`docs/bitacora_errores.md`.

---

## A2 — Leer y explicar un documento

**Propósito.** Saber qué se está mirando: identificar cadena, booleano, número, `Date`, arreglo,
subdocumento, `null` y campo ausente en un documento real, y explicar qué significa cada uno en el
caso.

**Insumos.** `s03_emprendedores`, `s03_iniciativas` y `s03_asesorias` cargadas.

**Pasos.**

1. Leer un documento completo de cada colección:
   ```javascript
   db.s03_emprendedores.findOne({ _id: 'EMP-001' });
   db.s03_iniciativas.findOne({ _id: 'INI-001' });
   db.s03_asesorias.findOne({ _id: 'ASE-001' });
   ```
2. Clasificar cada campo con `typeof` / `instanceof`:
   ```javascript
   const d = db.s03_iniciativas.findOne({ _id: 'INI-001' });
   print(typeof d.nombre);                       // string
   print(typeof d.activo);                       // boolean
   print(typeof d.presupuesto);                  // number
   print(d.fecha_creacion instanceof Date);      // true
   print(Array.isArray(d.historial_estados));    // true
   print(typeof d.historial_estados[0]);         // object  (subdocumento)
   print(d.mentor);                              // 'Carlos Ruiz' | null | undefined
   ```
3. Comprobar la diferencia entre `null` y campo ausente:
   ```javascript
   db.s03_emprendedores.countDocuments({ canal_preferido: null });                        // 5  (¡incluye los ausentes!)
   db.s03_emprendedores.countDocuments({ canal_preferido: { $type: 'null' } });            // 3
   db.s03_emprendedores.countDocuments({ canal_preferido: { $exists: false } });          // 2
   ```
4. Explicar el `historial_estados` de `INI-001` y por qué el `sector` de la cabecera
   (`economia_circular`) no es el mismo que el de las dos primeras entradas (`alimentos`).

**Evidencia.** `docs/diccionario_datos_v1.1.md` (tablas de campos, tipos BSON y dominios) y el
resultado de los conteos del paso 3, que coinciden con los de la consulta C07.

**Criterio de cierre.** El aprendiz puede señalar en un documento real una cadena, un booleano, un
número, un `Date`, un arreglo, un subdocumento, un `null` y un campo ausente, y explicar qué cambia
semánticamente entre `null` y ausente.

---

## A3 — Formular reglas y consultas de la Unidad de Emprendimiento (C01 – C10)

**Propósito.** Traducir necesidades del negocio en consultas verificables, con filtro, campos de
salida, orden y resultado esperado.

**Insumos.** La matriz `docs/matriz_consultas_C01_C10.md` (preguntas y valores esperados) y la base
cargada.

**Pasos.**

1. Ejecutar `scripts/03_consultas_aprendiz.js`. El script ejecuta las 12 consultas (C01–C10, la
   consulta de continuidad Q04-E01 y el reto), compara cada resultado con el valor esperado y
   **aborta con código de salida 1** si alguna discrepancia.
2. Reponer **a mano** al menos tres consultas en `mongosh` (no mirando el script) y comprobar que
   dan el mismo resultado:
   - C01 → 3 iniciativas
   - C05 → 4 entradas de historial de `INI-001`
   - C09 → 6 iniciativas con `$elemMatch`
3. Reproducir la **trampa** de C09 a propósito:
   ```javascript
   db.s03_iniciativas.countDocuments({ 'diagnosticos.tipo': 'mercado',
                                       'diagnosticos.puntaje': { $gte: 80 } });   // 12  (6 falsos positivos)
   ```
   Explicar, con `INI-001` como ejemplo, por qué el filtro ingenuo entra.
4. Reproducir la **trampa** del rango de fechas:
   ```javascript
   db.s03_asesorias.countDocuments({ estado: 'realizada',
     fecha_realizacion: { $gte: ISODate('2026-09-01'), $lte: ISODate('2026-09-30') } });  // 13
   db.s03_asesorias.countDocuments({ estado: 'realizada',
     fecha_realizacion: { $gte: ISODate('2026-09-01'),
                           $lte: new Date('2026-09-30T23:59:59.999Z') } });               // 14
   ```
5. Explicar por qué C10 ordena por `{ sector: 1, _id: 1 }` y no solo por `sector`.

**Evidencia.** `resultados/resultados_consultas.md` (generado, con el detalle de cada consulta) y
las anotaciones del paso 2 al 5.

**Criterio de cierre.** Las 12 consultas dan el resultado esperado y el aprendiz puede explicar al
menos **dos trampas** (notación con punto en arreglos; límite superior de un rango de fechas).

---

## A4 — Demostrar el ciclo CRUD de forma segura

**Propósito.** Ejecutar crear, leer, actualizar y eliminar **sobre documentos reales**, con
evidencia antes y después, sin tocar la semilla.

**Insumos.** La base cargada y `scripts/02_demo_crud.js`.

**Pasos.**

1. Ejecutar `scripts/02_demo_crud.js`. El script recorre las tres colecciones con la secuencia
   `insertOne` → `findOne` → `updateOne` (`$set` + `$inc`) → `findOne` → `findOneAndUpdate` →
   `findOne` → `deleteOne` → `findOne`, con contadores antes/después en cada una.
2. Comprobar el resultado: los tres deltas deben ser **0** y los residuos temporales **0**.
3. Intentar a mano a escribir sobre la semilla y comprobar que **se puede** (esto se puede hacer,
   pero no se debe):
   ```javascript
   db.s03_iniciativas.updateOne({ _id: 'INI-001' }, { $set: { nombre: 'NO HACER ESTO' } });
   ```
   → *Observación:* el script de demostración **no** lo bloquea; lo bloquea su propia función de
   guarda `escrituraPermitida()`. Si el aprendiz hace esto **a mano**, lo anota en la bitácora y
   revierte el cambio con `db.s03_iniciativas.updateOne({ _id: 'INI-001' }, { $set: { nombre: 'AgroPack Empaques Reutilizables' } })`
   o, mejor, recarga la semilla con `01_cargar_semilla.js` (que es idempotente).
4. Explicar la diferencia entre `updateOne` (devuelve contadores) y `findOneAndUpdate` (devuelve el
   documento) y por qué `$inc` es preferible a `$set` para un contador.

**Evidencia.** `resultados/resultados_crud.md` (generado) y `docs/registro_operaciones_crud.md`
(el guion, la seguridad y la bitácora).

**Criterio de cierre.** El aprendiz puede mostrar, con números, que la demostración no alteró la
semilla, y explicar el papel de la guarda de escritura.

> **Nota de seguridad:** el paso 3 es una demostración deliberada de riesgo. El laboratorio
> recomienda **revertir con `01_cargar_semilla.js`** en lugar de editar a mano, porque la carga es
> idempotente y restaura los 55 documentos desde el EJSON.

---

## A5 — Verificar la base con controles automatizados

**Propósito.** Distinguir **OK**, **AVISO** y **ERROR**, y saber qué hacer con cada uno.

**Insumos.** La base después de A1–A4.

**Pasos.**

1. Ejecutar `scripts/04_verificar_base.js` (41 controles, V-01 … V-21).
2. Leer `resultados/informe_pruebas.md` y clasificar los controles en tres grupos:
   - **OK**: el control se cumple.
   - **AVISO**: se cumple con una salvedad que hay que revisar (por ejemplo, hay documentos ajenos al
     dataset, o falta un entregable).
   - **ERROR**: el control **no** se cumple y hay que corregirlo. El script **aborta con código de
     salida 1** si hay un solo ERROR.
3. Provocar un AVISO y un ERROR a propósito, comprobarlos y **restaurar** el estado:
   - **AVISO**: insertar un documento ajeno (`{ _id: 'OTRO-001', dataset_id: 'OTRO' }`) → aparece el
     aviso **V-02** ("hay documentos ajenos… no se tocaron"); después se elimina con
     `db.s03_emprendedores.deleteOne({ _id: 'OTRO-001' })`.
   - **ERROR**: alterar un campo controlado (`db.s03_iniciativas.updateOne({ _id: 'INI-001' }, { $set: { sector: 'invalido' } })`)
     → **V-09** falla; después se restaura con `01_cargar_semilla.js`.
4. Confirmar que la base vuelve a **0 ERROR**.

**Evidencia.** `resultados/informe_pruebas.md`.

**Criterio de cierre.** El aprendiz sabe decir qué significa cada estado, puede provocar y
restaurar un AVISO y un ERROR, y deja la base en 0 ERROR.

---

## A6 — Socializar, contrastar y sustentar

**Propósito.** Compartir el trabajo con el equipo, acordar nivelación y defender las decisiones.

**Insumos.** Todo lo anterior.

**Pasos.**

1. Presentar en la reunión de socialización (formato de E01 §A5): **una elección de modelo**, **una
   consulta**, **un tipo** y **una dificultad** del trabajo.
2. Un compañero usa la lista de E01 como referencia y aporta retroalimentación.
3. Registrar **una acción de mejora concreta con fecha acordada** (campo "Fortaleza" / "Acción de
   mejora" del formato).
4. Preparar la sustentación con `docs/sustentacion.md` (guion de 12 minutos, preguntas frecuentes con
   respuesta y mapa de evidencias).

**Evidencia.** `docs/sustentacion.md` y el formato de socialización diligenciado.

**Criterio de cierre.** Cada integrante puede explicar y modificar lo entregado, y existe una acción
de mejora con fecha.

---

## RETO DE TRANSFERENCIA — Asesorías de septiembre 2026 y sector histórico

**Propósito.** Aplicar el modelo a una necesidad que **no** estaba resuelta de antemano: un reporte
de **septiembre de 2026** en el que el sector importa.

**Preguntas.**

1. ¿Cuántas asesorías se realizaron en septiembre de 2026?
2. ¿En cuántas de ellas el sector registrado en la asesoría difiere del sector **actual** de la
   iniciativa?
3. ¿Por qué ocurre esa diferencia y qué se habría perdido si el modelo no guardara el *snapshot*?

**Pasos.**

1. Consultar las asesorías realizadas en el rango:
   ```javascript
   db.s03_asesorias.find({
     dataset_id: 'S03_UE_V1', estado: 'realizada',
     fecha_realizacion: { $gte: new Date('2026-09-01T00:00:00.000Z'),
                           $lte: new Date('2026-09-30T23:59:59.999Z') } }
   ).sort({ fecha_realizacion: 1, _id: 1 });
   ```
2. Leer el sector actual de la iniciativa de cada asesoría (una segunda consulta, sin `$lookup`).
3. Comparar y localizar la diferencia.

**Respuesta correcta.**

| Pregunta | Respuesta |
| --- | --- |
| 1. Asesorías realizadas en septiembre de 2026 | **14** |
| 2. Asesorías cuyo sector histórico difiere del sector actual de la iniciativa | **1** — `ASE-001` |
| 3. Motivo | `INI-001` cambió de `alimentos` a `economia_circular` el **2026-09-30** (4.ª entrada de su `historial_estados`: *"Reclasificacion sectorial por benchmark de la unidad"*). `ASE-001` se realizó el **2026-09-10**, cuando la iniciativa todavía era de `alimentos` |

**Por qué importa (y no es un detalle menor).** Si el reporte usara `s03_iniciativas.sector`
(el valor **actual**), `ASE-001` aparecería como `economia_circular` en un reporte de septiembre, y
el conteo por sector de ese mes quedaría mal. El *snapshot* en `s03_asesorias.sector` es lo que
permite responder "en qué sector estaba el negocio cuando ocurrió esto".

**Evidencia.** Sección "Reto de transferencia" de `resultados/resultados_consultas.md`; control
**V-14** (14 asesorías) y **V-15** (una única diferencia, `ASE-001`) de
`resultados/informe_pruebas.md`.

**Criterio de cierre.** El aprendiz responde las tres preguntas con los números correctos y explica
el papel del *snapshot* sin necesidad del script.

> **Restricción del laboratorio:** el reto se resuelve con **dos consultas de lectura y un recorrido
> en JavaScript**. **No** se permite `$group`, `$lookup` ni `$unwind` (son agregaciones reservadas
> para la semana siguiente).

---

## 7. Correspondencia con las actividades de la Semana 1

| Actividad E03 | Actividad E01 equivalente | Qué se conserva | Qué cambia |
| --- | --- | --- | --- |
| **A1** | A4 *Verificar el entorno y explorar un documento* | Conectarse con la cuenta de práctica, no la administrativa; autenticar; la fecha es `Date` | Ahora la carga es **reproducible e idempotente**, con validación previa y creación de índices |
| **A2** | A4 / §5.2 *Tipos* | `true` ≠ `"true"`, `null` ≠ ausente, arreglo ≠ subdocumento | Se aplica a documentos **del diseño final**, no a `asesorias_demo` |
| **A3** | A3 *Formular reglas y consultas* | Las 6 necesidades Q01–Q06, actor / filtros / campos de salida / orden / frecuencia como hipótesis | Las consultas pasan de "formular" a **ejecutar y verificar**, y se añade el reto de transferencia |
| **A4** | (nuevo en E03) | — | El ciclo CRUD con escritura **segura** y evidencia antes/después |
| **A5** | (nuevo en E03) | — | Verificación automatizada con OK / AVISO / ERROR |
| **A6** | A5 *Socializar E01 y acordar nivelación* | Formato de presentación y acción de mejora con fecha | La sustentación es del E03, no de la D02 de la Semana 2 |
| **RETO** | §7 *Continuidad* | Distinguir el sector actual del sector del momento | Es el escenario donde esa distinción **se demuestra** con números |
