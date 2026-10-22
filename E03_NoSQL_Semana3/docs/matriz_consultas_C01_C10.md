# Matriz de consultas C01 – C10 — E03 Semana 3

> Documento de referencia del laboratorio. Cada fila es una consulta **real** que se ejecuta en
> `scripts/03_consultas_aprendiz.js` contra la base `emprendimiento_sena_lab`
> (dataset `S03_UE_V1`). Los valores esperados de la columna "Esperado" son los que el script
> compara con el resultado obtenido; la ejecución real quedó registrada en
> `resultados/resultados_consultas.md`.
>
> **Restricción del laboratorio:** las consultas C01–C10 son de **solo lectura** y **no usan**
> `$group`, `$lookup` ni `$unwind` (agregaciones reservadas para la semana siguiente). Los conteos
> "por grupo" se resuelven contando en JavaScript, no con el pipeline de agregación.

---

## 1. Tabla resumen

| Id | Necesidad | Colección | Resultado esperado | Índice que se aprovecha | Enlace en el script |
| --- | --- | --- | ---: | --- | --- |
| C01 | Iniciativas de `tecnologia` en `puesta_en_marcha` | `s03_iniciativas` | 3 | `ix_sector_etapa` | `03_consultas_aprendiz.js`, bloque `consultas[]` |
| C02 | Iniciativas `activa` con plataforma `web` | `s03_iniciativas` | 10 | `ix_estado` | ídem |
| C03 | Iniciativas del emprendedor `EMP-001` | `s03_iniciativas` | 2 | `ix_emprendedor_id` | ídem |
| C04 | Asesorías de tipo `mentoria` | `s03_asesorias` | 6 | `ix_tipo_estado` | ídem |
| C05 | Historial de estados de `INI-001` | `s03_iniciativas` | 4 entradas | — (embebido) | ídem |
| C06 | Asesorías de tipo `capacitacion` | `s03_asesorias` | 11 | `ix_tipo_estado` | ídem |
| C07 | Emprendedores por `canal_preferido` (valor / null / ausente) | `s03_emprendedores` | 5 / 3 / 2 | — | bloque `agruparPorCampo` |
| C08 | Iniciativas por `mentor` (valor / null / ausente) | `s03_iniciativas` | 6 / 5 / 4 | — | bloque `agruparPorCampo` |
| C09 | Diagnóstico de **mercado** con puntaje ≥ 80 (`$elemMatch` vs notación de punto) | `s03_iniciativas` | 6 correctas / 12 con la notación ingenua | — | bloque C09 |
| C10 | Paginación de iniciativas (5 por página) | `s03_iniciativas` | 3 páginas (5+5+5) | — | bloque C10 |
| Q04-E01 | Asesorías pendientes oct–nov por modalidad (continuidad con E01) | `s03_asesorias` | 9 (virtual 5, presencial 3, telefónica 1) | — | bloque Q04-E01 |
| RETO | Asesorías realizadas en septiembre 2026 y sector histórico vs. actual | `s03_asesorias` + `s03_iniciativas` | 14 / 1 diferencia (ASE-001) | `ix_fecha_realizacion` | bloque RETO |

---

## 2. Ficha de cada consulta

### C01 — Iniciativas de `tecnologia` en `puesta_en_marcha`

| Campo | Contenido |
| --- | --- |
| **Actor** | Coordinator de la Unidad de Emprendimiento (necesita saber qué iniciativas de tecnología ya están operando para programar mentorías) |
| **Pregunta** | ¿Qué iniciativas están en el sector `tecnologia` y ya entraron en puesta en marcha? |
| **Colección** | `s03_iniciativas` |
| **Filtro** | `{ dataset_id: "S03_UE_V1", sector: "tecnologia", etapa: "puesta_en_marcha" }` |
| **Campos de salida** | `_id`, `nombre`, `sector`, `etapa`, `presupuesto` |
| **Orden** | `{ _id: 1 }` (alfabético y estable) |
| **Frecuencia estimada** | *Hipótesis:* 1 vez por mes. No es una estadística medida: son 3 documentos en un dataset de práctica |
| **Resultado esperado** | **3** — `INI-002`, `INI-006`, `INI-013` |
| **Aprendizaje** | Dos campos de igualdad combinados en un mismo documento (`sector` + `etapa`) aprovechando el índice compuesto `ix_sector_etapa` |

```javascript
db.getCollection('s03_iniciativas')
  .find({ dataset_id: 'S03_UE_V1', sector: 'tecnologia', etapa: 'puesta_en_marcha' },
        { _id: 1, nombre: 1, sector: 1, etapa: 1, presupuesto: 1 })
  .sort({ _id: 1 });
```

---

### C02 — Iniciativas `activa` con plataforma `web`

| Campo | Contenido |
| --- | --- |
| **Actor** | Asesor que prepara una campaña digital (necesita intuitos con presencia web) |
| **Pregunta** | ¿Cuáles iniciativas activas puedo contactar por el canal web? |
| **Colección** | `s03_iniciativas` |
| **Filtro** | `{ dataset_id: "S03_UE_V1", estado: "activa", plataformas: "web" }` |
| **Campos de salida** | `_id`, `nombre`, `estado`, `plataformas`, `sector` |
| **Orden** | `{ _id: 1 }` |
| **Frecuencia estimada** | *Hipótesis:* semanal, al preparar la agenda comercial |
| **Resultado esperado** | **10** — `INI-001`, `INI-002`, `INI-004`, `INI-005`, `INI-006`, `INI-010`, `INI-011`, `INI-012`, `INI-013`, `INI-015` |
| **Aprendizaje** | Coincidencia de un valor **dentro de un arreglo** (`plataformas: "web"`). Aquí no hace falta `$elemMatch` porque se busca un solo valor |

```javascript
db.getCollection('s03_iniciativas')
  .find({ dataset_id: 'S03_UE_V1', estado: 'activa', plataformas: 'web' },
        { _id: 1, nombre: 1, estado: 1, plataformas: 1, sector: 1 })
  .sort({ _id: 1 });
```

> Hay 15 iniciativas, de las cuales **13 están `activa`** (se excluyen `INI-008` e `INI-014`, que
> están `archivada`). De esas 13 activas, **3 no tienen `web`** en su arreglo `plataformas`:
> `INI-003` (arreglo vacío), `INI-007` e `INI-009` (solo `movil`).
> 13 − 3 = **10**, que es exactamente lo que devuelve el filtro.

---

### C03 — Iniciativas del emprendedor `EMP-001`

| Campo | Contenido |
| --- | --- |
| **Actor** | El propio emprendedor, que consulta su portafolio |
| **Pregunta** | ¿Qué iniciativas tiene el emprendedor `EMP-001`? |
| **Colección** | `s03_iniciativas` (el aprendiz cruza manual con `s03_emprendedores`) |
| **Filtro** | `{ dataset_id: "S03_UE_V1", emprendedor_id: "EMP-001" }` |
| **Campos de salida** | `_id`, `nombre`, `emprendedor_id`, `sector`, `etapa`, `estado` |
| **Orden** | `{ _id: 1 }` |
| **Frecuencia estimada** | *Hipótesis:* a demanda, 1–2 veces por mes |
| **Resultado esperado** | **2** — `INI-001` y `INI-006` |
| **Aprendizaje** | Referencia entre colecciones resuelta **manualmente**: se lee la iniciativa y luego se busca el emprendedor por su `_id`, sin `$lookup` |

```javascript
db.getCollection('s03_iniciativas')
  .find({ dataset_id: 'S03_UE_V1', emprendedor_id: 'EMP-001' },
        { _id: 1, nombre: 1, emprendedor_id: 1, sector: 1, etapa: 1, estado: 1 })
  .sort({ _id: 1 });
```

> Nota: un emprendedor puede representar varias iniciativas (regla del caso). `EMP-003` tiene 2 y
> `EMP-004` tiene 2; `EMP-001` tiene 2.

---

### C04 — Asesorías de tipo `mentoria`

| Campo | Contenido |
| --- | --- |
| **Actor** | Líder de la unidad, que revisa la carga de mentorías del trimestre |
| **Pregunta** | ¿Qué asesorías de mentoría se registraron en el trimestre? |
| **Colección** | `s03_asesorias` |
| **Filtro** | `{ dataset_id: "S03_UE_V1", tipo: "mentoria" }` |
| **Campos de salida** | `_id`, `tipo`, `estado`, `modalidad`, `iniciativa_id`, `sector` |
| **Orden** | `{ _id: 1 }` |
| **Frecuencia estimada** | *Hipótesis:* mensual |
| **Resultado esperado** | **6** — `ASE-002`, `ASE-008`, `ASE-011`, `ASE-014`, `ASE-018`, `ASE-028` |
| **Aprendizaje** | Filtro por un campo de la colección de asesorías, apoyado por el índice `ix_tipo_estado` |

```javascript
db.getCollection('s03_asesorias')
  .find({ dataset_id: 'S03_UE_V1', tipo: 'mentoria' },
        { _id: 1, tipo: 1, estado: 1, modalidad: 1, iniciativa_id: 1, sector: 1 })
  .sort({ _id: 1 });
```

---

### C05 — Historial de estados de `INI-001` (array embebido)

| Campo | Contenido |
| --- | --- |
| **Actor** | Mentor, que necesita entender la evolución de la iniciativa que acompaña |
| **Pregunta** | ¿Cómo evolucionó `INI-001` y en qué sector estaba en cada etapa? |
| **Colección** | `s03_iniciativas` |
| **Filtro** | `{ _id: "INI-001" }` |
| **Campos de salida** | `_id`, `nombre`, `historial_estados` |
| **Orden** | El arreglo ya viene en orden cronológico; no se requiere `sort` |
| **Frecuencia estimada** | *Hipótesis:* a demanda, en cada sesión de mentoría |
| **Resultado esperado** | **4 entradas**: `2026-01-20`, `2026-04-10`, `2026-07-02`, `2026-09-30` |
| **Aprendizaje** | Un arreglo embebido se lee **entero** con una sola lectura; además cada entrada guarda el sector de ese momento (la historia del documento vive dentro del documento) |

```javascript
db.getCollection('s03_iniciativas')
  .findOne({ _id: 'INI-001' }, { _id: 1, nombre: 1, historial_estados: 1 });
```

Detalle real del historial:

| Fecha | Etapa | Sector | Nota |
| --- | --- | --- | --- |
| 2026-01-20 | `idea` | `alimentos` | Identificacion del problema de empaque |
| 2026-04-10 | `validacion` | `alimentos` | Piloto con doce productores |
| 2026-07-02 | `puesta_en_marcha` | `alimentos` | Lanzamiento comercial inicial |
| 2026-09-30 | `puesta_en_marcha` | `economia_circular` | Reclasificacion sectorial por benchmark de la unidad |

---

### C06 — Asesorías de tipo `capacitacion`

| Campo | Contenido |
| --- | --- |
| **Actor** | Coordinador de formación, que planifica el calendario de capacitaciones |
| **Pregunta** | ¿Cuántas asesorías de capacitación se impartieron y en qué modalidades? |
| **Colección** | `s03_asesorias` |
| **Filtro** | `{ dataset_id: "S03_UE_V1", tipo: "capacitacion" }` |
| **Campos de salida** | `_id`, `tipo`, `estado`, `modalidad`, `duracion_minutos`, `costo` |
| **Orden** | `{ _id: 1 }` |
| **Frecuencia estimada** | *Hipótesis:* mensual |
| **Resultado esperado** | **11** — `ASE-001`, `ASE-003`, `ASE-007`, `ASE-012`, `ASE-013`, `ASE-016`, `ASE-019`, `ASE-022`, `ASE-025`, `ASE-026`, `ASE-030` |
| **Aprendizaje** | Segundo tipo de asesoría, para comparar volúmenes entre tipos **sin escribir una sola línea de agregación** |

```javascript
db.getCollection('s03_asesorias')
  .find({ dataset_id: 'S03_UE_V1', tipo: 'capacitacion' },
        { _id: 1, tipo: 1, estado: 1, modalidad: 1, duracion_minutos: 1, costo: 1 })
  .sort({ _id: 1 });
```

---

### C07 — Emprendedores por `canal_preferido` (valor / `null` / ausente)

| Campo | Contenido |
| --- | --- |
| **Actor** | Responsable de comunicación, que decide por dónde contactar a cada persona |
| **Pregunta** | ¿Cuántos emprendedores tienen canal preferido, cuántos lo tienen en `null` y cuántos no lo tienen? |
| **Colección** | `s03_emprendedores` |
| **Filtro** | `{ campo: { $exists: true, $ne: null } }` · `{ campo: { $type: "null" } }` · `{ campo: { $exists: false } }` |
| **Campos de salida** | Solo conteos |
| **Orden** | No aplica |
| **Frecuencia estimada** | *Hipótesis:* trimestral |
| **Resultado esperado** | **5 con valor / 3 en `null` / 2 ausentes** |
| **Aprendizaje** | Distinguir **"sin dato"** (campo ausente) de **"dato vacío"** (`null`). MongoDB los trata distinto y por eso hay que consultarlos por separado |

```javascript
const col = db.getCollection('s03_emprendedores');
col.countDocuments({ canal_preferido: { $exists: true, $ne: null } });  // 5
col.countDocuments({ canal_preferido: { $type: 'null' } });             // 3
col.countDocuments({ canal_preferido: { $exists: false } });           // 2
```

> **Trampa:** `{ canal_preferido: null }` devuelve **5** resultados (3 `null` + 2 ausentes). Si el
> aprendiz usa ese filtro, el conteo no cuadra con 5/3/2.

---

### C08 — Iniciativas por `mentor` (valor / `null` / ausente)

| Campo | Contenido |
| --- | --- |
| **Actor** | Jefe de mentoría, que reparte la carga de acompañamiento |
| **Pregunta** | ¿Cuántas iniciativas tienen mentor asignado, cuántas lo tienen en `null` y cuántas no lo tienen? |
| **Colección** | `s03_iniciativas` |
| **Filtro** | Igual que C07, aplicado a `mentor` |
| **Campos de salida** | Solo conteos |
| **Orden** | No aplica |
| **Frecuencia estimada** | *Hipótesis:* mensual |
| **Resultado esperado** | **6 con valor / 5 en `null` / 4 ausentes** |
| **Aprendizaje** | El mismo patrón aplicado a un arreglo de documentos: primero se responde la pregunta y después se decide si el campo es `null` o no existe |

```javascript
const col = db.getCollection('s03_iniciativas');
col.countDocuments({ mentor: { $exists: true, $ne: null } });  // 6
col.countDocuments({ mentor: { $type: 'null' } });             // 5
col.countDocuments({ mentor: { $exists: false } });           // 4
```

---

### C09 — `$elemMatch` frente a la notación con punto (trampa de los arreglos)

| Campo | Contenido |
| --- | --- |
| **Actor** | Analista que prioriza iniciativas con buen diagnóstico de mercado |
| **Pregunta** | ¿Cuáles iniciativas tienen un diagnóstico de **mercado** con puntaje de al menos 80? |
| **Colección** | `s03_iniciativas` |
| **Filtro correcto** | `{ dataset_id: "S03_UE_V1", diagnosticos: { $elemMatch: { tipo: "mercado", puntaje: { $gte: 80 } } } }` |
| **Filtro ingenuo** | `{ dataset_id: "S03_UE_V1", "diagnosticos.tipo": "mercado", "diagnosticos.puntaje": { $gte: 80 } }` |
| **Campos de salida** | `_id`, `nombre` |
| **Orden** | `{ _id: 1 }` |
| **Frecuencia estimada** | *Hipótesis:* bimestral |
| **Resultado esperado** | **6 correctas** (`$elemMatch`) frente a **12** con la notación ingenua |
| **Aprendizaje** | En arreglos de subdocumentos, `$elemMatch` exige que **todas** las condiciones se cumplan en el **mismo** elemento. La notación con punto puede combinarlas entre elementos distintos |

```javascript
// Correcto: 6 iniciativas
db.getCollection('s03_iniciativas').find({
  dataset_id: 'S03_UE_V1',
  diagnosticos: { $elemMatch: { tipo: 'mercado', puntaje: { $gte: 80 } } }
}, { _id: 1, nombre: 1 }).sort({ _id: 1 });

// Ingenuo: 12 iniciativas (6 falsos positivos)
db.getCollection('s03_iniciativas').find({
  dataset_id: 'S03_UE_V1',
  'diagnosticos.tipo': 'mercado',
  'diagnosticos.puntaje': { $gte: 80 }
}, { _id: 1, nombre: 1 }).sort({ _id: 1 });
```

**Por qué el filtro ingenuo devuelve el doble.** La notación con punto comprueba cada condición
**por separado** sobre el arreglo, sin exigir que ambas se cumplan en el mismo elemento. Ejemplo
con `INI-001`:

| Diagnóstico | tipo | puntaje |
| --- | --- | ---: |
| 1 | `mercado` | 72 |
| 2 | `operativo` | 85 |

El filtro ingenuo encuentra "existe un diagnóstico de **mercado**" (el #1, con 72) **y** "existe un
diagnóstico con puntaje **≥ 80**" (el #2, operativo, con 85) → cumple y entra, aunque **ningún**
diagnóstico de mercado llegue a 80.

**Falsos positivos del filtro ingenuo (6):** `INI-001`, `INI-004`, `INI-008`, `INI-010`, `INI-011`, `INI-012`.

**Resultado correcto (6):** `INI-002`, `INI-005`, `INI-006`, `INI-009`, `INI-013`, `INI-015`.

---

### C10 — Paginación de iniciativas (orden estable, 5 por página)

| Campo | Contenido |
| --- | --- |
| **Actor** | Aplicación que lista iniciativas en la intranet sin traerlas todas de una vez |
| **Pregunta** | ¿Cómo recorro las iniciativas ordenadas por sector sin traerlas todas de una vez? |
| **Colección** | `s03_iniciativas` |
| **Filtro** | `{ dataset_id: "S03_UE_V1" }` + `.sort({ sector: 1, _id: 1 })` + `.skip(n*5)` + `.limit(5)` |
| **Campos de salida** | `_id`, `nombre`, `sector` |
| **Orden** | `{ sector: 1, _id: 1 }` — **el `_id` desempata** y por eso el orden es estable entre páginas |
| **Frecuencia estimada** | *Hipótesis:* por cada pantalla de la intranet |
| **Resultado esperado** | **3 páginas** de 5 (15 documentos) + una cuarta página vacía |
| **Aprendizaje** | `sort + skip + limit` es la paginación clásica. Ordenar por `{sector: 1, _id: 1}` garantiza un orden estable, porque el `_id` nunca se repite |

```javascript
const TAM = 5;
for (let p = 0; p < 3; p++) {
  db.getCollection('s03_iniciativas')
    .find({ dataset_id: 'S03_UE_V1' }, { _id: 1, nombre: 1, sector: 1 })
    .sort({ sector: 1, _id: 1 })
    .skip(p * TAM)
    .limit(TAM);
}
```

| Página | `skip` | `limit` | Contenido (`_id` / `sector`) |
| ---: | ---: | ---: | --- |
| 1 | 0 | 5 | `INI-007`/alimentos, `INI-012`/alimentos, `INI-001`/economia_circular, `INI-003`/economia_circular, `INI-005`/economia_circular |
| 2 | 5 | 5 | `INI-009`/economia_circular, `INI-011`/economia_circular, `INI-015`/economia_circular, `INI-002`/tecnologia, `INI-006`/tecnologia |
| 3 | 10 | 5 | `INI-008`/tecnologia, `INI-013`/tecnologia, `INI-004`/turismo, `INI-010`/turismo, `INI-014`/turismo |
| 4 | 15 | 5 | (vacía — fuera de rango) |

> Con `skip` grande el motor debe descartar documentos; para volúmenes reales se usaría
> "keyset pagination" con `{sector: 1, _id: 1}` como cursor. Queda como pregunta para la
> sustentación (ver `docs/sustentacion.md`).

---

## 3. Consultas de continuidad y reto de transferencia

### Q04-E01 — Asesorías pendientes por rango de fechas y modalidad

Equivalente a la consulta **Q04** de la guía de la Semana 1 (*"Asesorías programadas pendientes por
rango de fechas y modalidad"*), resuelta sobre el dataset de la Semana 3.

```javascript
db.getCollection('s03_asesorias').find({
  dataset_id: 'S03_UE_V1',
  estado: { $in: ['programada', 'reprogramada'] },
  fecha_programada: { $gte: ISODate('2026-10-01'), $lte: ISODate('2026-11-30') }
}, { _id: 1, estado: 1, modalidad: 1, fecha_programada: 1, iniciativa_id: 1 })
 .sort({ fecha_programada: 1, _id: 1 });
```

| Resultado | Valor |
| --- | --- |
| Asesorías pendientes | **9** |
| Por modalidad | `virtual` = 5, `presencial` = 3, `telefonica` = 1 |
| Detalle | `ASE-011`, `ASE-013`, `ASE-014`, `ASE-018`, `ASE-021`, `ASE-023`, `ASE-026`, `ASE-028`, `ASE-029` |

El conteo por modalidad se hace recorriendo el resultado en JavaScript, **sin** `$group`.

---

### RETO DE TRANSFERENCIA — Asesorías de septiembre 2026 y sector histórico

```javascript
// Paso 1: las asesorías realizadas en septiembre de 2026
db.getCollection('s03_asesorias').find({
  dataset_id: 'S03_UE_V1',
  estado: 'realizada',
  fecha_realizacion: { $gte: ISODate('2026-09-01'), $lte: ISODate('2026-09-30') }
}, { _id: 1, iniciativa_id: 1, sector: 1, tipo: 1, modalidad: 1, fecha_realizacion: 1 })
 .sort({ fecha_realizacion: 1, _id: 1 });

// Paso 2: el sector actual de cada iniciativa, leído en una segunda consulta
db.getCollection('s03_iniciativas').findOne({ _id: 'INI-001' }, { sector: 1 });
```

| Resultado | Valor |
| --- | --- |
| Asesorías realizadas en septiembre de 2026 | **14** |
| Cuyo sector histórico difiere del sector actual de la iniciativa | **1** |

| Asesoría | Iniciativa | Sector histórico (en la asesoría) | Sector actual (en la iniciativa) |
| --- | --- | --- | --- |
| `ASE-001` | `INI-001` | `alimentos` | `economia_circular` |

**Por qué.** `INI-001` cambió de sector el **2026-09-30** (entrada #4 de su `historial_estados`:
*"Reclasificacion sectorial por benchmark de la unidad"*). `ASE-001` se realizó el **2026-09-10**, cuando la
iniciativa todavía era de `alimentos`. La asesoría guarda la **fotografía** del sector en ese
momento; la iniciativa guarda el valor **actual**. Leer solo `s03_iniciativas.sector` y aplicar el
resultado a septiembre de 2026 daría un reporte equivocado.

**Las 14 asesorías realizadas en septiembre de 2026**, en el orden que las imprime el script
(`sort({ fecha_realizacion: 1, _id: 1 })`):

| # | Asesoría | Fecha de realización | Iniciativa | Sector histórico | Tipo | Modalidad |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | `ASE-012` | 2026-09-05 | `INI-003` | `economia_circular` | `capacitacion` | `virtual` |
| 2 | `ASE-008` | 2026-09-08 | `INI-008` | `tecnologia` | `mentoria` | `presencial` |
| 3 | `ASE-022` | 2026-09-09 | `INI-009` | `economia_circular` | `capacitacion` | `virtual` |
| 4 | **`ASE-001`** | 2026-09-10 | `INI-001` | **`alimentos`** | `capacitacion` | `virtual` |
| 5 | `ASE-015` | 2026-09-11 | `INI-005` | `economia_circular` | `diagnostico` | `virtual` |
| 6 | `ASE-010` | 2026-09-15 | `INI-010` | `turismo` | `mercadeo` | `presencial` |
| 7 | `ASE-024` | 2026-09-15 | `INI-013` | `tecnologia` | `financiacion` | `virtual` |
| 8 | `ASE-002` | 2026-09-16 | `INI-002` | `tecnologia` | `mentoria` | `presencial` |
| 9 | `ASE-016` | 2026-09-19 | `INI-006` | `tecnologia` | `capacitacion` | `virtual` |
| 10 | `ASE-025` | 2026-09-22 | `INI-011` | `economia_circular` | `capacitacion` | `virtual` |
| 11 | `ASE-017` | 2026-09-23 | `INI-011` | `economia_circular` | `acompanamiento_tecnico` | `virtual` |
| 12 | `ASE-006` | 2026-09-24 | `INI-006` | `tecnologia` | `acompanamiento_tecnico` | `virtual` |
| 13 | `ASE-019` | 2026-09-29 | `INI-012` | `alimentos` | `capacitacion` | `presencial` |
| 14 | `ASE-020` | 2026-09-30 | `INI-010` | `turismo` | `mercadeo` | `presencial` |

> **Cuidado con el límite superior del rango.** `ISODate('2026-09-30')` significa
> `2026-09-30T00:00:00.000Z` (medianoche). Con ese límite, `ASE-020` (realizada el 2026-09-30 a
> las 14:00) **queda fuera** y el conteo da 13 en lugar de 14. El script usa el rango completo
> `$gte: 2026-09-01T00:00:00.000Z` … `$lte: 2026-09-30T23:59:59.999Z`.
> Este detalle se detectó al recontar el reto a mano y se documenta en `docs/bitacora_errores.md`
> (entrada **BE-09**).

---

## 4. Trazabilidad con la guía de la Semana 1

| Necesidad E01 (guía, A3) | Consulta de E03 | Observación |
| --- | --- | --- |
| Q01 Iniciativas activas por sector y etapa | **C01** (+ filtro `estado`) | E03 añade el campo `estado` a la necesidad |
| Q02 Detalle de una iniciativa con sus atributos | **C05** (historial) + lectura de `s03_iniciativas` | El detalle completo se obtiene con `findOne` |
| Q03 Iniciativas de un emprendedor responsable por estado | **C03** | E03 agrupa por-sector en lugar de por-estado en la cabecera |
| Q04 Asesorías pendientes por rango y modalidad | **Q04-E01** | Idéntica necesidad, dataset nuevo |
| Q05 Historial de asesorías de una iniciativa | Lectura por `iniciativa_id` (índice `ix_iniciativa_id`) | Requiere el filtro `iniciativa_id` |
| Q06 Asesorías realizadas por sector de iniciativa y mes | **RETO** (cruce de sector histórico vs. actual) | La decisión sobre "sector actual o sector del momento" se resuelve con el *snapshot* de la asesoría |
