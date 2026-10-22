# Diccionario de datos — E03 Semana 3 (esquema 1.1)

> **Base de datos:** `emprendimiento_sena_lab`  ·  **Dataset:** `S03_UE_V1`  ·  **esquema_version:** `1.1`
> **Colecciones:** `s03_emprendedores` (10), `s03_iniciativas` (15), `s03_asesorias` (30)
>
> Este documento describe **exactamente** lo que hay en `data/*.ejson` y en la base real del
> laboratorio. Los conteos y los dominios de valores se obtuvieron ejecutando un inventario
> sobre los tres archivos de semilla y contrastándolos con `scripts/04_verificar_base.js`.
> No hay campos "previstos": cada campo que aparece abajo existe en los documentos, con el
> tipo BSON y la obligatoriedad indicados.

---

## 1. Convenciones del laboratorio

| Elemento | Convención |
| --- | --- |
| Prefijo de colecciones | `s03_` — permite saber de un vistazo que una colección pertenece a esta semana y evita colisiones con `s01_`/`s02_` de entregas anteriores |
| Identificadores de entrepreneurial | `EMP-001` … `EMP-010`, `INI-001` … `INI-015`, `ASE-001` … `ASE-030` (código de 3 dígitos, cero a la izquierda) |
| Identificadores de asesor | `ADV-01` … `ADV-09` (código **ficticio**, exigido por la regla del caso de la guía E01) |
| Marcador de dataset | Todo documento lleva `dataset_id: "S03_UE_V1"`. Los documentos de la demostración CRUD llevan `dataset_id: "S03_UE_V1_TMP"` |
| Versión de esquema | Todo documento lleva `esquema_version: "1.1"` |
| Fechas | Siempre tipo **Date de BSON** (no cadenas). Se transportan en Extended JSON como `{ "$date": "2026-01-15T14:30:00.000Z" }` |
| Ausente vs. `null` | Son cosas distintas y el laboratorio las distingue a propósito: *valor* = tiene dato, *null* = el campo existe pero está vacío, *ausente* = el campo no existe en el documento |

### 1.1 Tres estados posibles de un campo opcional

Es el detalle más importante del esquema y el que se evalúa en las consultas C07 y C08:

| Estado | Cómo se pregunta en MongoDB | Ejemplo (emprendedores) |
| --- | --- | --- |
| Con valor | `{ campo: { $exists: true, $ne: null } }` | `canal_preferido: "web"` — 5 documentos |
| `null` explícito | `{ campo: { $type: "null" } }` | `canal_preferido: null` — 3 documentos |
| Ausente | `{ campo: { $exists: false } }` | `canal_preferido` no existe — 2 documentos |

> **Trampa documentada:** el filtro `{ campo: null }` en MongoDB devuelve **tanto** los `null`
> como los ausentes. Por eso el laboratorio usa `$type: "null"` y `$exists: false` por separado.

---

## 2. Colección `s03_emprendedores` (10 documentos)

Documento de ejemplo (`EMP-001`):

```json
{
  "_id": "EMP-001",
  "dataset_id": "S03_UE_V1",
  "esquema_version": "1.1",
  "tipo_documento": "CC",
  "numero_documento": "1020304050",
  "nombres": "Camila",
  "apellidos": "Rodriguez Salazar",
  "email": "camila.rodriguez@example.edu.co",
  "telefono": "+571800000001",
  "sector": "tecnologia",
  "departamento": "Cundinamarca",
  "municipio": "Fusagasuga",
  "fecha_registro": { "$date": "2026-01-15T14:30:00.000Z" },
  "nivel_madurez": "validacion",
  "activo": true,
  "canal_preferido": "web",
  "etiquetas": ["tecnologia", "logistica"]
}
```

| Campo | Tipo BSON | Oblig. | Dominio / formato | Descripción |
| --- | --- | :-: | --- | --- |
| `_id` | string | Sí | `^EMP-\d{3}$` | Código único del emprendedor. Clave primaria lógica |
| `dataset_id` | string | Sí | `S03_UE_V1` | Marca de pertenencia al dataset de la Semana 3 |
| `esquema_version` | string | Sí | `1.1` | Versión del esquema del documento |
| `tipo_documento` | string | Sí | `CC` \| `CE` | Tipo de documento de identidad (ficticio) |
| `numero_documento` | string | Sí | 6–10 dígitos | Número de identidad (ficticio). Se guarda como **string**, no como número, para no perder ceros a la izquierda |
| `nombres` | string | Sí | texto | Nombre de pila |
| `apellidos` | string | Sí | texto | Apellidos |
| `email` | string | Sí | `*@example.edu.co` | Correo institucional ficticio del dominio `example.edu.co` |
| `telefono` | string | Sí | `+57...` | Teléfono móvil ficticio. String con prefijo internacional |
| `sector` | string | Sí | `tecnologia` \| `alimentos` \| `economia_circular` \| `turismo` | Sector económico de experiencia del emprendedor. **Valor actual**, no histórico |
| `departamento` | string | Sí | 9 valores | Departamento de registro (`Antioquia`, `Atlantico`, `Bogota D.C.`, `Boyaca`, `Caldas`, `Cundinamarca`, `Narino`, `Santander`, `Valle del Cauca`). Se guardan **sin tilde** para no depender de la codificación al comparar valores |
| `municipio` | string | Sí | texto | Municipio de registro |
| `fecha_registro` | **Date** | Sí | 2026-01-15 … 2026-08-30 | Fecha de inscripción en el programa. OJO: `2026-01-15T14:30:00.000Z` es fecha **y hora** |
| `nivel_madurez` | string | Sí | `idea` \| `prototipo` \| `validacion` \| `escala` | Nivel de madurez entrepreneurial declarado |
| `activo` | boolean | Sí | `true` \| `false` | 9 activos, 1 inactivo (el inactivo tiene iniciativas, para que "activo" tenga sentido como filtro) |
| `canal_preferido` | string \| null \| ausente | No | `web` \| `movil` \| `email` | Canal de contacto preferido. **5 con valor / 3 en `null` / 2 ausentes** |
| `etiquetas` | array\<string\> | Sí | 2 etiquetas por documento | Etiquetas libres de gestión. Dominio real (14 valores, sin tildes): `alimentos`, `artesanias`, `cafe`, `cooperativas`, `economia_circular`, `experiencias`, `exportacion`, `fintech`, `hospedaje`, `logistica`, `panificacion`, `software`, `tecnologia`, `turismo` |

**Distribución verificada**

| `sector` | n | | `nivel_madurez` | n | | `departamento` | n |
| --- | ---: | --- | --- | ---: | --- | --- | ---: |
| `economia_circular` | 4 | | `validacion` | 4 | | Cundinamarca | 1 |
| `tecnologia` | 3 | | `prototipo` | 3 | | Boyacá | 2 |
| `turismo` | 2 | | `escala` | 2 | | Antioquia | 1 |
| `alimentos` | 1 | | `idea` | 1 | | Atlántico | 1 |
| | | | | | Bogotá D.C. | 1 |
| | | | | | Boyacá | 2 |
| | | | | | Caldas | 1 |
| | | | | | Cundinamarca | 1 |
| | | | | | Nariño | 1 |
| | | | | | Santander | 1 |
| | | | | | Valle del Cauca | 1 |

> Los departamentos se muestran aquí con tilde para leerlos mejor, pero **el valor guardado en la
> base no lleva tilde** (`Bogota D.C.`, `Boyaca`, `Narino`, `Atlantico`). Un filtro debe usar el
> valor real: si se escribe `Bogotá D.C.` la consulta devuelve 0 documentos.

---

## 3. Colección `s03_iniciativas` (15 documentos)

Documento de ejemplo (`INI-001`, la iniciativa con más historia — 4 entradas de historial y 3
diagnósticos; aquí se muestran **solo 2 diagnósticos y la primera entrada del historial** para que
el ejemplo quepa en la pantalla):

```json
{
  "_id": "INI-001",
  "dataset_id": "S03_UE_V1",
  "esquema_version": "1.1",
  "emprendedor_id": "EMP-001",
  "nombre": "AgroPack Empaques Reutilizables",
  "sector": "economia_circular",
  "etapa": "puesta_en_marcha",
  "estado": "activa",
  "activo": true,
  "plataformas": ["web", "movil"],
  "canal_preferido": "web",
  "fecha_creacion": { "$date": "2026-01-20T13:00:00.000Z" },
  "presupuesto": 18000000,
  "mentor": "Carlos Ruiz",
  "diagnosticos": [
    { "tipo": "mercado", "puntaje": 72, "fecha": { "$date": "2026-03-05T00:00:00.000Z" }, "observacion": "Demanda no validada en tres regiones" },
    { "tipo": "operativo", "puntaje": 85, "fecha": { "$date": "2026-04-12T00:00:00.000Z" }, "observacion": "Capacidad de produccion ajustada" }
  ],
  "historial_estados": [
    { "estado": "activa", "etapa": "idea", "sector": "alimentos", "fecha": { "$date": "2026-01-20T13:00:00.000Z" }, "responsable": "EMP-001", "nota": "Identificacion del problema de empaque" }
  ]
}
```

### 3.1 Campos planos

| Campo | Tipo BSON | Oblig. | Dominio / formato | Descripción |
| --- | --- | :-: | --- | --- |
| `_id` | string | Sí | `^INI-\d{3}$` | Código único de la iniciativa |
| `dataset_id` | string | Sí | `S03_UE_V1` | Marcador de dataset |
| `esquema_version` | string | Sí | `1.1` | Versión del esquema |
| `emprendedor_id` | string | Sí | `^EMP-\d{3}$` | **Referencia** al `_id` de `s03_emprendedores`. Un emprendedor puede tener varias iniciativas |
| `nombre` | string | Sí | texto | Nombre comercial de la iniciativa |
| `sector` | string | Sí | 4 valores del dominio de `sector` | Sector **actual** de la iniciativa. Cambia si el negocio se reorienta (ver `historial_estados`) |
| `etapa` | string | Sí | `idea` \| `validacion` \| `puesta_en_marcha` \| `escalamiento` | Etapa didáctica actual |
| `estado` | string | Sí | `activa` \| `archivada` | Estado de la iniciativa. 13 activas, 2 archivadas |
| `activo` | boolean | Sí | `true` \| `false` | Coherente con `estado`: `activa` ⇒ `true`, `archivada` ⇒ `false`. El control V-12 lo verifica documento a documento |
| `plataformas` | array\<string\> | Sí | `web`, `movil` | Canales digitales donde opera. 17 valores en total; `INI-003` e `INI-014` lo tienen **vacío** (`[]`), que es distinto de ausente |
| `canal_preferido` | string \| null | No | `web` \| `movil` \| `email` | 13 con valor, 2 en `null`, ninguno ausente |
| `fecha_creacion` | **Date** | Sí | 2026-01-20 … 2026-08-10 | Fecha (y hora) de creación de la iniciativa |
| `presupuesto` | number (int) | Sí | 9 000 000 … 45 000 000 | Presupuesto asignado en COP, como número (sí se puede ordenar y comparar) |
| `mentor` | string \| null \| ausente | No | 4 nombres | Mentor asignado a la iniciativa. **6 con valor / 5 en `null` / 4 ausentes** |

### 3.2 Subdocumento embebido `diagnosticos[]`

Arreglo de subdocumentos heterogeneousos en la práctica: 30 entradas en 15 iniciativas (11 con 2, 2 con 1, 2 con 3).

| Subcampo | Tipo BSON | Oblig. | Dominio | Descripción |
| --- | --- | :-: | --- | --- |
| `tipo` | string | Sí | `mercado` (15) \| `operativo` (8) \| `financiero` (6) \| `regulatorio` (1) | Tipo de diagnóstico realizado |
| `puntaje` | number (int) | Sí | 40 … 95 | Puntaje del diagnóstico en escala 0–100 |
| `fecha` | **Date** | Sí | 2026-01 … 2026-08 | Fecha en que se levantó el diagnóstico |
| `observacion` | string | Sí | texto | Lectura cualitativa del diagnóstico |

### 3.3 Subdocumento embebido `historial_estados[]` (autoridad del sector histórico)

40 entradas en 15 iniciativas (1 a 4 por documento). Es el documento embebido que responde
"¿en qué sector estaba esta iniciativa cuando ocurrió X?".

| Subcampo | Tipo BSON | Oblig. | Dominio | Descripción |
| --- | --- | :-: | --- | --- |
| `estado` | string | Sí | `activa` (38) \| `archivada` (2) | Estado de la iniciativa en ese momento |
| `etapa` | string | Sí | 4 valores del dominio de `etapa` | Etapa didáctica en ese momento |
| `sector` | string | Sí | 4 valores del dominio de `sector` | **Sector en ese momento.** Esta es la fuente de verdad del sector histórico |
| `fecha` | **Date** | Sí | 2026-01-20 … 2026-09-30 | Fecha del cambio de estado |
| `responsable` | string | Sí | `^EMP-\d{3}$` | Emprendedor responsable del avance en esa fecha |
| `nota` | string | Sí | texto | Descripción del avance (qué se hizo, no qué se decidió) |

> **Relación con `sector`:** el `sector` de la cabecera es el valor **actual**; el `sector` de la
> última entrada de `historial_estados` anterior a una fecha dada es el valor **histórico**.
> El control V-07 de `04_verificar_base.js` contrasta ambos para las 30 asesorías.

---

## 4. Colección `s03_asesorias` (30 documentos)

Documento de ejemplo (`ASE-002`, asesoría realizada):

```json
{
  "_id": "ASE-002",
  "dataset_id": "S03_UE_V1",
  "esquema_version": "1.1",
  "iniciativa_id": "INI-002",
  "emprendedor_id": "EMP-002",
  "sector": "tecnologia",
  "asesor": "Andres Villamil",
  "asesor_id": "ADV-02",
  "tipo": "mentoria",
  "estado": "realizada",
  "modalidad": "presencial",
  "fecha_programada": { "$date": "2026-09-14T14:00:00.000Z" },
  "fecha_realizacion": { "$date": "2026-09-16T10:00:00.000Z" },
  "duracion_minutos": 120,
  "costo": 600000,
  "resultado": "satisfactorio",
  "canal_contacto": "email",
  "observaciones": "Acompanamiento en la arquitectura del marketplace"
}
```

| Campo | Tipo BSON | Oblig. | Dominio / formato | Descripción |
| --- | --- | :-: | --- | --- |
| `_id` | string | Sí | `^ASE-\d{3}$` | Código único de la asesoría |
| `dataset_id` | string | Sí | `S03_UE_V1` | Marcador de dataset |
| `esquema_version` | string | Sí | `1.1` | Versión del esquema |
| `iniciativa_id` | string | Sí | `^INI-\d{3}$` | **Referencia** a `s03_iniciativas`. Toda asesoría pertenece a una iniciativa existente |
| `emprendedor_id` | string | Sí | `^EMP-\d{3}$` | **Referencia** a `s03_emprendedores`. Se desnormaliza para no tener que recorrer dos saltos en cada consulta |
| `sector` | string | Sí | 4 valores del dominio de `sector` | **Snapshot (fotografía) del sector en el momento de la asesoría.** No se actualiza aunque la iniciativa cambie de sector. Es el campo que resuelve el reto de transferencia |
| `asesor` | string | Sí | 9 nombres | Nombre del asesor que atendió la sesión |
| `asesor_id` | string | Sí | `^ADV-\d{2}$` | Código **ficticio** del asesor. Regla del caso de E01: "cada asesoría registra el código ficticio del asesor que la atiende". Un código = un solo asesor |
| `tipo` | string | Sí | `capacitacion` (11) \| `mentoria` (6) \| `diagnostico` (4) \| `acompanamiento_tecnico` (3) \| `legal` (2) \| `mercadeo` (2) \| `financiacion` (2) | Tipo de asesoría |
| `estado` | string | Sí | `realizada` (19) \| `programada` (8) \| `cancelada` (2) \| `reprogramada` (1) | Estado de la asesoría |
| `modalidad` | string | Sí | `virtual` (18) \| `presencial` (9) \| `telefonica` (3) | Modalidad de la sesión |
| `fecha_programada` | **Date** | Sí | 2026-06-11 … 2026-11-18 | Fecha en que se agendó. **Siempre presente**, incluso si la asesoría se cancela |
| `fecha_realizacion` | **Date** \| null \| ausente | No | — | Fecha real de la sesión. Regla (control V-10): `Date` si `estado = "realizada"`; `null` si `programada`/`reprogramada`; **ausente** si `cancelada` |
| `duracion_minutos` | number (int) | Sí | 45 … 180 | Duración de la sesión |
| `costo` | number (int) \| null \| ausente | No | 250 000 … 750 000 | Costo de la asesoría en COP. 19 con valor, 9 en `null`, 2 ausentes |
| `resultado` | string \| ausente | No | `satisfactorio` (12) \| `parcial` (6) \| `no_satisfactorio` (1) \| ausente (11) | Evaluación de la asesoría. Solo existe cuando la asesoría se realizó |
| `canal_contacto` | string \| null \| ausente | No | `email` (16) \| `telefono` (4) \| `web` (2) | Canal por el que se coordinó. **22 con valor / 5 en `null` / 3 ausentes** |
| `observaciones` | string | No | texto | Nota de la sesión. Presente en 28 de 30 |
| `motivo_cancelacion` | string | No | texto | Solo en `cancelada` (ASE-005, ASE-030) |
| `motivo_reprogramacion` | string | No | texto | Solo en `reprogramada` (ASE-028) |

---

## 5. Reglas de integridad que la base cumple (y que el verificador comprueba)

| Regla | Control | Estado |
| --- | --- | --- |
| Todo `_id` sigue el patrón de su colección | V-01, V-17 | OK |
| Todo documento tiene `dataset_id = S03_UE_V1` y `esquema_version = 1.1` | V-01, V-03 | OK |
| Todo `emprendedor_id` de iniciativas existe en `s03_emprendedores` | V-05 | OK |
| Todo `iniciativa_id` y `emprendedor_id` de asesorías existe | V-06 | OK |
| El `sector` de la asesoría = sector de la iniciativa según `historial_estados` en la fecha del evento | V-07 | OK (30/30) |
| Todo documento tiene sus campos obligatorios | V-08 | OK |
| Todo valor controlado pertenece a su lista | V-09 | OK (10 listas, 55 documentos) |
| `fecha_realizacion` respeta la regla Date / null / ausente | V-10 | OK |
| Distribución de estados de asesoría = 19/8/2/1 | V-11 | OK |
| `activo` es coherente con `estado` en iniciativas | V-12 | OK |
| Los cubos valor/null/ausente son los esperados | V-13 | OK |
| 14 asesorías realizadas en septiembre de 2026 | V-14 | OK |
| Solo ASE-001 difiere del sector actual de su iniciativa | V-15 | OK |
| No hay dos asesorías del mismo asesor en la misma franja (día UTC) | V-20 | OK (9 asesores, 0 choques) |
| Cada `asesor_id` corresponde a un solo asesor | V-21 | OK (ADV-01 … ADV-09) |
| Los índices de consulta del laboratorio existen | V-16 | OK |

---

## 6. Índices definidos por `scripts/01_cargar_semilla.js`

| Colección | Índice | Clave | Consulta que lo aprovecha |
| --- | --- | --- | --- |
| `s03_emprendedores` | `ix_sector` | `{ sector: 1 }` | Filtros por sector |
| `s03_emprendedores` | `ix_departamento` | `{ departamento: 1 }` | Filtros por departamento |
| `s03_emprendedores` | `ix_dataset_id` | `{ dataset_id: 1 }` | Aislamiento del dataset en todas las consultas |
| `s03_iniciativas` | `ix_sector_etapa` | `{ sector: 1, etapa: 1 }` | **C01** |
| `s03_iniciativas` | `ix_emprendedor_id` | `{ entrepreneur_id: 1 }` | **C03** |
| `s03_iniciativas` | `ix_estado` | `{ estado: 1 }` | **C02** |
| `s03_iniciativas` | `ix_dataset_id` | `{ dataset_id: 1 }` | Aislamiento del dataset |
| `s03_asesorias` | `ix_tipo_estado` | `{ tipo: 1, estado: 1 }` | **C04**, **C06** |
| `s03_asesorias` | `ix_iniciativa_id` | `{ iniciativa_id: 1 }` | Historial de asesorías de una iniciativa (Q05 de E01) |
| `s03_asesorias` | `ix_fecha_realizacion` | `{ fecha_realizacion: 1 }` | Reto de transferencia y consultas por rango de fechas |
| `s03_asesorias` | `ix_dataset_id` | `{ dataset_id: 1 }` | Aislamiento del dataset |

> MongoDB crea además el índice `_id_` de forma automática en cada colección.

---

## 7. Cómo cambiar el esquema sin romper el laboratorio

1. Subir `esquema_version` (por ejemplo a `1.2`) en **los tres** archivos de semilla.
2. Actualizar la constante `ESQUEMA_VERSION` de `scripts/01_cargar_semilla.js` y `scripts/04_verificar_base.js`.
3. Volver a ejecutar `01_cargar_semilla.js` (es idempotente: reemplaza los documentos de `S03_UE_V1` y deja intactos los demás).
4. Ejecutar `04_verificar_base.js` y confirmar `0 ERROR`.
5. Registrar el cambio en `docs/bitacora_errores.md` o en `docs/revision_cruzada.md`.

Los campos nuevos se **agregan**; los campos existentes no se eliminan ni se renombran sin
actualizar antes el diccionario de datos y el verificador.
