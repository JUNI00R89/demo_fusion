# Revisión cruzada — E03 Semana 3 contra la guía de la Semana 1 (E01)

> **Propósito.** Comprobar, regla por regla, que el entregable de la Semana 3 es coherente con lo
> que la guía de la Semana 1 (E01) dejó establecido: el conjunto didáctico de 10/15/30, las reglas
> del caso, la necesidad de distinguir el sector actual del sector histórico, y la forma del
> entorno de trabajo.
>
> **Fuente normativa:** `Guia_Semana_01_NoSQL_Unidad_Emprendimiento_SENA` (copia legible en
> `C:\Users\Sena\Downloads\guia.txt`, codificación UTF-16LE con doblemojibake; el texto de
> referencia que se cita aquí se recuperó decodificando UTF-8 → CP437 → UTF-16LE).
>
> **Alcance.** Esta revisión cruza **reglas y hechos verificables**, no redacta textos nuevos. Cada
> fila indica en qué archivo y en qué control del verificador se comprueba.

---

## 1. El conjunto didáctico previsto

> Guía E01, §7 *"Continuidad con la semana 2"*: *"El conjunto didáctico previsto será de **10
> emprendedores ficticios, 15 iniciativas y 30 asesorías**."*

| Colección de E03 | Conteo exigido | Conteo real | Verificador | Estado |
| --- | ---: | ---: | --- | :-: |
| `s03_emprendedores` | 10 | 10 (`EMP-001`…`EMP-010`) | V-01, V-17 | ✔ |
| `s03_iniciativas` | 15 | 15 (`INI-001`…`INI-015`) | V-01, V-17 | ✔ |
| `s03_asesorias` | 30 | 30 (`ASE-001`…`ASE-030`) | V-01, V-17 | ✔ |

> Guía E01, §7: *"Se analizará cuándo embeber información, cuándo referenciar y cómo evitar
> historiales de crecimiento indefinido. También se distinguirá el sector actual de una iniciativa
> del sector registrado al momento de una asesoría, si los reportes requieren conservar esa
> historia."*

Las tres decisiones que la guía pide para la Semana 2 quedan implementadas y comprobadas así:

| Decisión | Implementación en E03 | Verificador |
| --- | --- | --- |
| **Cuándo embeber** | El historial y los diagnósticos van **embebidos** dentro de la iniciativa (`historial_estados[]`, `diagnosticos[]`): se leen con una sola consulta, se consultan juntos y no crecen sin control (1–4 entradas por documento) | V-08, C05 |
| **Cuándo referenciar** | Las relaciones entre colecciones van **referenciadas** por `_id`: `iniciativa.emprendedor_id → s03_emprendedores._id`, `asesoria.iniciativa_id → s03_iniciativas._id`, `asesoria.emprendedor_id → s03_emprendedores._id` | V-05, V-06 |
| **Historial sin crecimiento indefinido** | El historial se acota a los **cambios de etapa/estado** (40 entradas en 15 iniciativas), no a cada sesión. Las asesorías (que sí crecen con la actividad) están en su propia colección y se **referencian**, no se embeben | V-08, C05 |
| **Sector actual vs. sector del momento** | El sector **actual** vive en `s03_iniciativas.sector`; el sector **del momento** queda congelado como *snapshot* en `s03_asesorias.sector` y es reconstruible desde `historial_estados[]` | **V-07**, **V-15**, RETO |

---

## 2. Reglas del caso de la guía E01 (§A3, líneas 148–155) y su cumplimiento

| # | Regla de la guía E01 | Cómo se cumple en E03 | Evidencia | Estado |
| ---: | --- | --- | --- | :-: |
| 1 | *"Códigos únicos para emprendedores, iniciativas y asesorías."* | `_id` de tipo string con patrón fijo: `EMP-###`, `INI-###`, `ASE-###`. Los tres prefijos son disjuntos, así que un código no puede pertenecer a dos colecciones | `01_cargar_semilla.js` (valida el patrón y la unicidad antes de escribir), V-17 | ✔ |
| 2 | *"Cada iniciativa tiene un emprendedor responsable existente; una persona puede representar varias iniciativas."* | Toda iniciativa tiene `emprendedor_id`; la integridad referencial se comprueba documento a documento. `EMP-003` e `EMP-004` tienen 2 iniciativas cada uno | V-05, C03 | ✔ |
| 3 | *"Cada asesoría se vincula con una iniciativa existente y registra el código ficticio del asesor que la atiende."* | `iniciativa_id` + `emprendedor_id` + `asesor` (nombre) + `asesor_id` (código ficticio `ADV-##`). Cada código corresponde a **un solo** asesor | V-06, V-21 | ✔ |
| 4 | *"Sectores de ejemplo: tecnologia, alimentos y economia_circular. Etapas didácticas: idea, validacion y puesta_en_marcha; no son categorías oficiales de un programa."* | Los tres sectores y las tres etapas de la guía se usan tal cual. E03 **añade** un cuarto sector (`turismo`) y una cuarta etapa (`escalamiento`) → desviación documentada en §4 | V-09, `docs/diccionario_datos_v1.1.md` | ✔ con desviación declarada |
| 5 | *"Estado de iniciativa: activa o archivada. Estado de asesoría: programada, realizada o cancelada."* | Se usan exactamente esos valores. E03 **añade** un cuarto estado de asesoría (`reprogramada`) → desviación documentada en §4 | V-09, V-11 | ✔ con desviación declarada |
| 6 | *"Registrar fecha_programada y, cuando se realiza la sesión, fecha_realizacion. La fecha real puede diferir de la programada; no se debe alterar para ocultar una reprogramación."* | `fecha_programada` **siempre** presente (30/30). `fecha_realizacion` es `Date` en `realizada` (19), `null` en `programada`/`reprogramada` (9) y **ausente** en `cancelada` (2). Hay **3 asesorías con fecha real ≠ fecha programada** (`ASE-002`, `ASE-016`, `ASE-025`), y ninguna reprogramación "ocultada": `ASE-028` conserva las dos fechas y su `motivo_reprogramacion` | **V-10** | ✔ |
| 7 | *"No programar dos asesorías para el mismo asesor en la misma franja definida para el laboratorio. Documentar la franja y distinguir la regla de su futura garantía concurrente."* | **Franja documentada: día UTC completo** (se consideran la fecha de programación y la de realización). El control recorre las 30 asesorías × 9 asesores y encuentra **0 choques**. La distinción regla/mecanismo se explica en `docs/sustentacion.md` | **V-20** | ✔ |
| 8 | *"Archivar una iniciativa no elimina automáticamente su historial de asesorías."* | Las 2 iniciativas archivadas (`INI-008`, `INI-014`) conservan sus asesorías: `INI-008` tiene `ASE-008` (realizada) y `ASE-011` (programada); `INI-014` tiene `ASE-026` (programada). Ninguna deletes cascades | V-06, lectura directa de la base | ✔ |

### 2.1 Reglas añadidas por E03 (no estaban en E01, se declaran aquí)

| Regla | Justificación | Verificador |
| --- | --- | --- |
| Todo documento lleva `dataset_id` y `esquema_version` | Permitir que un script trabaje sobre un subconjunto auditable de la base y versionar el esquema | V-01, V-03 |
| `s03_iniciativas.activo` es coherente con `s03_iniciativas.estado` | Un booleano y un texto no pueden contradecirse | V-12 |
| El sector de la asesoría debe cuadrar con el historial de la iniciativa en la fecha del evento | Es la regla que convierte el *snapshot* en un dato **verificable** y no en un valor que se escribe a mano | **V-07** (30/30) |
| `mentor`, `canal_preferido` y `canal_contacto` admiten los tres estados (valor / `null` / ausente) | Entrena la diferencia entre "sin dato" y "dato vacío", que es el error más común al filtrar | V-13, C07, C08 |
| La demostración CRUD solo escribe en documentos `TMP-E03-*` | Que el aprendiz pueda repetir la demostración sin miedo a romper la semilla | V-04, guarda de `02_demo_crud.js` |

---

## 3. Continuidad con la Semana 2 (E02): **brecha documentada**

### 3.1 Qué se encontró en este equipo

Se revisó el equipo completo antes de construir el entregable:

| Busqueda | Resultado |
| --- | --- |
| Archivos `*.ejson` en todo el árbol de `C:\Users\Sena\Downloads` | **Ninguno** |
| Carpetas `E0*` (E01, E02, E03…) | **Ninguna** |
| Carpeta `E03_NoSQL_Semana3` | Creada por esta entrega |
| Entrega E01 disponible | Sí: `C:\Users\Sena\Downloads\Guia_Semana_01_NoSQL_Unidad_Emprendimiento` (guía y proyecto) y `C:\Users\Sena\Downloads\Wilson\proyecto` |
| Guía de la Semana 2 (E02) | **No está en este equipo** |
| Guía de la Semana 3 (E03) | **No está en este equipo** (esta entrega es la guía del E03) |

### 3.2 Qué se hizo, exactamente

La semilla `S03_UE_V1` **no es una recuperación** del kit de E02: **se construyó desde cero** a partir
de la especificación explícita de la guía de E01, que es la única fuente normativa disponible:

1. **Conteos**: 10 / 15 / 30, tomados literalmente de la §7 de la guía de E01.
2. **Dominios de valores**: los de las reglas del caso (§A3), más las desviaciones declaradas en §4.
3. **Casos de prueba**: el *snapshot* de sector, la franja del asesor y el histórico de `INI-001`
   se construyeron **para poder responder** a las consultas C01–C10 y al reto de transferencia,
   que son los objetivos de esta semana.

> **Esto se declara de forma expresa:** la semilla de E03 es **compatible con** el enunciado de E01,
> pero **no es idéntica** a la que habría construido el equipo de la Semana 2. Si el instructor
> entrega el kit de E02, este laboratorio se adapta con un cambio acotado: sustituir los tres
> archivos `data/*.ejson` por los del kit y ajustar los valores esperados de la matriz
> (`docs/matriz_consultas_C01_C10.md`), que están todos en un único bloque del array `consultas[]`
> de `scripts/03_consultas_aprendiz.js` y en las constantes de `scripts/04_verificar_base.js`.

### 3.3 Lo que sí coincide con E01

| Elemento | Compatibilidad |
| --- | --- |
| Nombres de dominio | `emprendedores`, `iniciativas`, `asesorias` (los de E01 §5.3) |
| Base de datos | `emprendimiento_sena_lab` (E01 §5.6) |
| Usuario de práctica | `aprendiz_nosql` con base de autenticación `emprendimiento_sena_lab` (E01 §5.6) |
| Cuentas por defecto | `readWrite` + `dbAdmin` sobre la base del laboratorio |
| Separación de la colección de práctica | E01 §5.3 dice que `asesorias_demo` está **separada** "para experimentar sin confundirla con el diseño final". En E03 la separación se logra con el **prefijo `s03_`** en las colecciones y con `dataset_id` en los documentos: `s03_*` es el diseño final y `S03_UE_V1_TMP` es el experimento |
| Código como cadena estable | E01 §5.3: *"usaremos cadenas estables en los primeros ejemplos para facilitar la trazabilidad"*. E03 mantiene `_id` como **string** con patrón, no `ObjectId` |
| Fecha como `Date` | E01 §5.4 y §5.2: la fecha es un instante, no texto. E03 exige `Date` de BSON y lo verifica |

### 3.4 Estructura del repositorio

E01 §4 (línea 381) propone: *"docs/ para matrices y reglas; scripts/…; evidencias/ para resultados
sin secretos; README.md para ejecutar y comprender el trabajo."*

| Sugerencia de E01 | En E03 | Nota |
| --- | --- | --- |
| `docs/` con matrices y reglas | `docs/matriz_consultas_C01_C10.md`, `docs/revision_cruzada.md`, `docs/actividades_A1_A6.md` | ✔ |
| `scripts/` | `scripts/00_preparar_lab_mongodb.ps1` … `scripts/04_verificar_base.js` | ✔ |
| `evidencias/` para resultados sin secretos | `resultados/` (3 archivos generados) | Se llama `resultados/` y **no** `evidencias/` para no sugerir que hay capturas; el contenido es texto generado, sin secretos |
| `README.md` | `README.md` | ✔ |
| "No se exige publicar un repositorio externo si no se ha acordado" | Repositorio local, **sin publicación** | ✔ |

---

## 4. Desviaciones respecto de las listas de la guía E01

Todas están declaradas, son reversibles y están justificadas por el caso de uso.

| # | En E01 | En E03 | Justificación | Impacto |
| ---: | --- | --- | --- | --- |
| D-1 | 3 sectores: `tecnologia`, `alimentos`, `economia_circular` | 4 sectores: los tres anteriores + `turismo` | El sector `turismo` permite mostrar dos iniciativas **archivadas** del mismo sector y una reorientación sectorial adicional; da variety al conjunto sin salirse del dominio económico del caso | Los conteos de C01 y del RETO cambian; el resto de las consultas no se ve afectada |
| D-2 | 3 etapas: `idea`, `validacion`, `puesta_en_marcha` | 4 etapas: las tres anteriores + `escalamiento` | Permite que el historial de estados tenga una transición completa y que `escalamiento` aparezca en el estado actual | Sin impacto en C01 (que filtra `tecnologia` + `puesta_en_marcha`) |
| D-3 | 3 estados de asesoría: `programada`, `realizada`, `cancelada` | 4 estados: los tres anteriores + `reprogramada` | La regla 6 de E01 habla explícitamente de "no alterar la fecha para ocultar una reprogramación": hace falta un estado que la represente | `ASE-028` es la única `reprogramada`; aparece en C04 y en Q04-E01 |
| D-4 | (no existe) | `modalidad`: `virtual`, `presencial`, `telefonica` | E01 §5.5 usa `modalidad: "virtual"` en el documento de ejemplo y la Q04 pide "por rango de fechas y modalidad"; la guía no fija la lista | Dominio nuevo, validado por V-09 |
| D-5 | (no existe) | `tipo` de asesoría: 7 valores | La Q04/E03 requiere clasificar el tipo de sesión; `mentoria` y `capacitacion` son los que dan juego a C04 y C06 | Dominio nuevo, validado por V-09 |
| D-6 | (no existe) | `nivel_madurez` del emprendedor: `idea`, `prototipo`, `validacion`, `escala` | Permite cruzar el perfil del emprendedor con la etapa de su iniciativa sin usar agregaciones | Dominio nuevo, validado por V-09 |
| D-7 | (no existe) | `asesor_id` ficticio `ADV-##` | **No es una desviación**: la regla 3 de E01 lo exige ("registra el código ficticio del asesor que la atiende"). Se anota aquí porque la guía no especifica el formato | V-21 valida el formato `^ADV-\d{2}$` y la unicidad nombre↔código |
| D-8 | (no existe) | Colecciones con prefijo `s03_` en lugar de `emprendedores`, `iniciativas`, `asesorias` | La guía de E01 §5.3 dice que las colecciones *se decidirán en S02*. Con el prefijo se evita cualquier colisión con los entregables de E01/E02 que viven en la misma base, y la separación entre "diseño final" y "experimento" queda a un vistazo | Es la razón de que los comandos usen `s03_*` y no los nombres desnudos |

---

## 5. Trazabilidad de las "necesidades" Q01–Q06 de E01

E01 §A3 pide seis consultas con "entrada y salida verificables". Este laboratorio las retoma y las
convierte en C01–C10:

| Necesidad E01 | Consulta E03 | Colección | Entrada | Salida | Verificación |
| --- | --- | --- | --- | --- | --- |
| **Q01** Iniciativas activas por sector y etapa didáctica | **C01** | `s03_iniciativas` | `sector`, `etapa` | `_id`, `nombre`, `sector`, `etapa`, `presupuesto` | 3 documentos, IDs exactos |
| **Q02** Detalle de una iniciativa con su propuesta de valor y atributos específicos | **C05** + lectura de `s03_iniciativas` | `s03_iniciativas` | `_id` | documento completo con `historial_estados[]` y `diagnosticos[]` | 4 entradas de historial |
| **Q03** Iniciativas de un emprendedor responsable por estado | **C03** | `s03_iniciativas` | `emprendedor_id` | `_id`, `nombre`, `sector`, `etapa`, `estado` | 2 documentos, IDs exactos |
| **Q04** Asesorías programadas pendientes por rango de fechas y modalidad | **Q04-E01** | `s03_asesorias` | `estado ∈ {programada, reprogramada}`, rango de fechas | `_id`, `estado`, `modalidad`, `fecha_programada` | 9 pendientes (virtual 5 / presencial 3 / telefónica 1) |
| **Q05** Historial de asesorías de una iniciativa | Lectura por `iniciativa_id` (índice `ix_iniciativa_id`) | `s03_asesorias` | `iniciativa_id` | asesorías de la iniciativa | Índice verificado en V-16 |
| **Q06** Cantidad de asesorías realizadas por sector de iniciativa y mes | **RETO** | `s03_asesorias` + `s03_iniciativas` | `estado`, rango de fechas, `sector` | 14 asesorías de septiembre; 1 diferencia entre sector histórico y actual | V-14, V-15 |

> La decisión que E01 pide explícitamente sobre Q06 (*"aclara si el sector corresponde al valor
> actual o al momento de la asesoría"*) queda **respondida por el modelo**: el reporte usa el
> sector **del momento de la asesoría** (el *snapshot*), y el sector actual de la iniciativa se
> usa solo para el reporte "de hoy". La fila del reto de transferencia demuestra por qué: si se
> usara el valor actual, `ASE-001` aparecería como `economia_circular` cuando ocurrió en `alimentos`.

---

## 6. Cobertura de los tipos BSON y de los errores frecuentes de E01 §5.2

| Valor / estructura de E01 §5.2 | Dónde aparece en E03 | Dónde se comprueba |
| --- | --- | --- |
| `true` (booleano) | `activo` en emprendedores e iniciativas (9 `true`/`false` en emprendedores, 15 en iniciativas) | V-08, V-12 |
| `null` (nulo explícito) | `canal_preferido`, `mentor`, `canal_contacto`, `costo`, `fecha_realizacion` | V-13, V-10 |
| Campo ausente | `canal_preferido` (2), `mentor` (4), `canal_contacto` (3), `resultado` (11), `costo` (2), `observaciones` (2), `fecha_realizacion` en `cancelada` (2) | V-13, V-10 |
| `""` (cadena vacía) | **Prohibido**: no hay ninguna cadena vacía en la semilla. El cargador valida el EJSON y el verificador revisa los dominios | V-08, V-09 |
| Arreglo | `etiquetas`, `plataformas`, `diagnosticos`, `historial_estados` | C02, C05, C09 |
| Subdocumento | `diagnosticos[]`, `historial_estados[]` | C05, C09 |
| `Date` | 10 `fecha_registro` + 15 `fecha_creacion` + 30 `fecha_programada` + 19 `fecha_realizacion` + 40 `historial_estados[].fecha` + 30 `diagnosticos[].fecha` | V-07, V-17, `01_cargar_semilla.js` |
| `ObjectId` | **No se usa**: los `_id` son cadenas estables (E01 §5.3) | V-17 |

---

## 7. Resultado de la revisión

| Aspecto revisado | Resultado |
| --- | --- |
| Conteos 10/15/30 | ✔ Coinciden con la guía E01 |
| Reglas del caso (8 de E01) | ✔ 8/8 implementadas y verificadas |
| Decisiones de modelado de la §7 (embeber / referenciar / historial acotado / sector histórico) | ✔ 4/4 implementadas y verificadas |
| Necesidades Q01–Q06 | ✔ 6/6 retomadas como consultas con salida verificable |
| Tipos BSON y errores frecuentes de §5.2 | ✔ Todos presentes y verificados |
| Estructura de repositorio de §4 | ✔ `docs/`, `scripts/`, resultados y `README.md` |
| Entorno de §5.6 | ✔ Instancia aislada autenticada (puerto 27018, cuenta de práctica, base de autenticación correcta) |
| Separación diseño final / experimento de §5.3 | ✔ Prefijo `s03_` + `dataset_id` |
| **Desviaciones** | 8 declaradas en §4, todas justificadas y reversibles |
| **Brecha de contexto** | No existe el kit de E02 en este equipo; la semilla se construyó desde la especificación de E01 (§3) |

**Conclusión.** El entregable de la Semana 3 es coherente con la guía de la Semana 1 en todas las
reglas verificables, con ocho desviaciones declaradas y una brecha de contexto (ausencia del kit de
E02) documentada de forma expresa en lugar de ocultarse.
