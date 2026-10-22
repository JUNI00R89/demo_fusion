# Sustentación — E03 Semana 3

> **Qué es:** el guion de defensa oral del entregable de la Semana 3 (*Bases de Datos NoSQL — CRUD y
> consultas reproducibles*). Está pensado para una sustentación de **12 minutos** más **5 minutos de
> preguntas**.
>
> **Regla de oro de la sustentación:** toda cifra que se mencione en voz alta debe poder **señalarse
> en un archivo del entregable**. No hay resultados simulados: todo lo que se afirma aquí sale de
> una ejecución real sobre la instancia del laboratorio y está escrito en `resultados/`.

---

## 1. Mapa de evidencias (saber dónde está todo antes de hablar)

| Afirmación | Dónde se demuestra |
| --- | --- |
| La base tiene 10 / 15 / 30 documentos del dataset `S03_UE_V1` | `resultados/informe_pruebas.md`, control **V-01** |
| Las 12 consultas dan el resultado esperado | `resultados/resultados_consultas.md`, tabla "Cuadro de resultados" |
| La demostración CRUD no alteró la semilla | `resultados/resultados_crud.md`, tabla "Resumen por colección" (delta 0) |
| La base cumple 41 controles | `resultados/informe_pruebas.md`, resumen final |
| El reto de transferencia tiene una única diferencia (`ASE-001`) | `resultados/resultados_consultas.md`, sección "Reto de transferencia" |
| El sector de la asesoría cuadra con el historial de la iniciativa | `resultados/informe_pruebas.md`, control **V-07** |
| No hay dos asesorías del mismo asesor en la misma franja | `resultados/informe_pruebas.md`, control **V-20** |
| No hay secretos en el entregable | `resultados/informe_pruebas.md`, control **V-18** |
| Las reglas de E01 se cumplen una a una | `docs/revision_cruzada.md`, §2 |
| Los errores encontrados y cómo se resolvieron | `docs/bitacora_errores.md`, BE-01 … BE-12 |
| Qué es cada campo y de qué tipo | `docs/diccionario_datos_v1.1.md` |

---

## 2. Guion de 12 minutos

### Minuto 0–1 — Contexto y alcance

> "Buen día. Este es el entregable de la Unidad de Emprendimiento para la Semana 3, *Bases de Datos
> NoSQL: CRUD y consultas reproducibles*. El objetivo no era 'tener una base de datos': era
> dejar una base **reproducible**, sobre la que cualquier persona pueda repetir las mismas
> consultas y obtener exactamente los mismos números, y en la que quede **registrado por escrito**
> qué decisiones de modelado se tomaron y por qué."
>
> "El punto de partida fue la guía de la Semana 1: el conjunto didáctico de 10 emprendedores, 15
> iniciativas y 30 asesorías, y una regla que me pareció la más importante de todas: *distinguir el
> sector actual de una iniciativa del sector registrado al momento de una asesoría*. Todo el
> modelo está construido alrededor de esa regla."

### Minuto 1–3 — El entorno y la reproducibilidad

> "Lo primero fue el entorno. El servidor que ya estaba corriendo en el puerto 27017 tiene
> autenticación activada y su cuenta administrativa no era conocida. Como la guía de la Semana 1
> pide que cada equipo tenga una instancia aislada, levanté una instancia propia en el **puerto
> 27018**, con su propio `dbPath`, con `--auth` y con su propia cuenta de práctica
> `aprendiz_nosql`. La contraseña se genera en el momento y se guarda en `.lab/`, que está en
> `.gitignore`; no hay ninguna contraseña escrita en los archivos que entrego."

> "El primer error real que cometí fue silencioso: en PowerShell 5.1, `Set-Content -Encoding UTF8`
> escribe un **BOM** al principio del archivo, y `mongosh` lo rechaza con un error de sintaxis antes
> de ejecutar una sola línea. Como el script solo miraba la salida, el fallo pasaba desapercibido y
> parecía un problema de contraseña. Está documentado como BE-01 en la bitácora."

### Minuto 3–5 — El modelo y el *snapshot* de sector

> "El modelo tiene tres colecciones. Dos decisiones definen el resto:"
>
> "**Primera: qué va embebido y qué va referenciado.** El historial de etapas y los diagnósticos
> van **embebidos** en la iniciativa, porque siempre se consultan juntos con ella y son cortos: entre
> una y cuatro entradas por documento. En cambio, las asesorías están en su **propia** colección y
> la iniciativa las **referencia** por `_id`, porque crecerían sin control si se embebieran."
>
> "**Segunda: el sector.** El campo `sector` de la iniciativa es el valor **actual**. La asesoría
> guarda su propio `sector`, que es una **fotografía** del sector en el momento en que ocurrió. No
> es duplicación: es un dato distinto, y sin él los reportes históricos quedan mal."

> "Eso no es una frase teórica. El reto de transferencia lo demuestra: 14 asesorías se realizaron
> en septiembre de 2026, y en **una sola** —`ASE-001`— el sector guardado difiere del sector actual
> de la iniciativa. `INI-001` cambió de `alimentos` a `economia_circular` el 30 de septiembre, tres
> días antes de que acabara el mes; la asesoría se realizó el 10 de septiembre. Si el reporte usara
> el valor actual, `ASE-001` aparecería como `economia_circular` en un reporte de septiembre, y el
> conteo por sector de ese mes quedaría mal."
### Minuto 5–7 — Las consultas y sus trampas

> "Hay diez consultas, más una de continuidad con la Semana 1 y el reto. Cada una tiene un filtro,
> campos de salida, un orden y un **valor esperado**, y el script compara el resultado real con el
> esperado y **aborta con error** si no coinciden. Las doce coinciden."

> "De las trampas, quiero destacar dos, porque son las que más se repiten:"
>
> "La primera es la **notación con punto en arreglos**. La consulta C09 pide iniciativas con un
> diagnóstico de **mercado** de puntaje 80 o más. Con `$elemMatch` salen 6. Con la notación ingenua
> `'diagnosticos.tipo': 'mercado'` y `'diagnosticos.puntaje': { $gte: 80 }` salen **12**. ¿Por qué?
> Porque la notación con punto evalúa cada condición por separado: le basta con que *algún*
> elemento sea de tipo mercado y *algún* elemento —distinto— tenga puntaje 80. `INI-001` tiene un
> diagnóstico de mercado con 72 y uno operativo con 85: entra sin que ningún diagnóstico de
> mercado llegue a 80. Seis falsos positivos. **El filtro correcto es `$elemMatch`, porque exige que
> las dos condiciones se cumplan en el mismo elemento.**"
>
> "La segunda es más discreta y la descubrí **recontando a mano**: el filtro con
> `$lte: ISODate('2026-09-30')` devuelve 13 asesorías y no 14, porque `ISODate('2026-09-30')` es
> la medianoche y una asesoría ocurrió ese día a las 2 de la tarde. Un rango de fechas es un
> intervalo **cerrado**, con hora, no solo un día."

### Minuto 7–9 — El CRUD y la seguridad de las escrituras

> "El CRUD no se hizo sobre la semilla. Todos los documentos de prueba llevan `dataset_id` con
> sufijo `_TMP` y un `_id` con prefijo `TMP-E03-`, y **toda** escritura pasa por una función de
> guarda que lanza una excepción si el identificador no cumple. El script lo demuestra a propósito:
> intenta modificar `INI-001` y la excepción salta antes de llegar al servidor; después comprueba
> que `INI-001` sigue intacto, con su historial completo."
>
> "Cada operación tiene una lectura antes y una después, y hay contadores de documentos por
> colección. Los tres deltas son **0** y no queda ningún documento temporal. La demostración es
> repetible: si se interrumpe, el script limpia los residuos antes de empezar."

> "También hay dos que no había hecho nunca: `findOneAndUpdate` con `returnDocument: 'after'`, que
> devuelve el documento ya actualizado, y `$inc` para el contador, que evita la condición de
> carrera de leer-modificar-escribir."

### Minuto 9–10 — La verificación

> "El laboratorio no se entrega 'a ojo'. Hay un script con 41 controles, que devuelven **OK**,
> **AVISO** o **ERROR** — el ERROR aborta con código de salida 1. Comprueban el volumen, la
> integridad referencial, los dominios de valores, la regla de `fecha_realizacion`, los cubos de
> `null` y ausente, los índices, que la semilla en disco coincida con la de la base, que no haya
> contraseñas en los archivos y que los entregables existan."
>
> "El control que más me importa es el **V-07**: recorre las 30 asesorías, toma la fecha del
> evento, busca en el historial de la iniciativa la entrada anterior a esa fecha y comprueba que el
> sector guardado en la asesoría es ese. Es decir, **el snapshot no es un valor escrito a mano: es
> un valor verificable contra la historia del documento**."

### Minuto 10–11 — Qué no está resuelto y qué aprendí

> "Tres cosas que quiero decir con honestidad."
>
> "**La primera**: en este equipo **no existe el kit de la Semana 2**. Lo busqué. No hay ningún
> `.ejson` en todo el árbol de archivos. Así que la semilla **no es una recuperación**: la construí
> desde la especificación explícita de la guía de la Semana 1 —los conteos 10/15/30 y las reglas
> del caso— y lo dejé declarado en la revisión cruzada, en vez de presentarlo como algo recuperado.
> Si el instructor entrega el kit de E02, el laboratorio se adapta con un cambio acotado: sustituir
> tres archivos y ajustar los valores esperados."
>
> "**La segunda**: hay ocho desviaciones respecto de las listas de la guía —un cuarto sector, una
> cuarta etapa, un cuarto estado de asesoría, campos nuevos de modalidad y tipo—. Todas están
> justificadas por escrito en la revisión cruzada, porque son reversibles y una guía que no explica
> sus desviaciones no sirve."
>
> "**La tercera**: lo que aprendí que más me costó no fue MongoDB, fue el **modelo de datos**. Que
> `null` y 'campo ausente' no son lo mismo; que un filtro puede devolver filas correctas y aun así
> estar mal; que un snapshot es un dato, no una redundancia."

### Minuto 11–12 — Cierre

> "Cierro con lo que queda demostrado: una base de datos que se puede **reconstruir desde
> cero**, una **matriz de consultas** con entrada y salida verificable, un **registro CRUD** con
> evidencia antes y después, un **informe de 41 controles** y una **bitácora de 12 errores reales**
> con su causa y su solución. Todo lo que afirmo se puede señalar en un archivo."

---

## 3. Preguntas frecuentes con respuesta

**P1. ¿Por qué no usaste el servidor del puerto 27017?**
Porque tiene `authorization: enabled` y su cuenta administrativa no era conocida. La guía de la
Semana 1 (§5.6) pide que cada equipo tenga una instancia aislada o una base/cuenta equivalente, así
que levanté una instancia en el 27018 con su propio `dbPath`. Es más seguro: no hay forma de que
mis escrituras alcancen los datos del instructor. Está en `docs/bitacora_errores.md`, BE-02.

**P2. ¿Y si el instructor entrega la semilla de E02?**
Se sustituyen los tres archivos `data/*.ejson` por los del kit y se ajustan los valores esperados,
que están concentrados en dos sitios: el arreglo `consultas[]` de `scripts/03_consultas_aprendiz.js`
y las constantes de `scripts/04_verificar_base.js`. El resto del laboratorio (el CRUD, la guarda de
escritura, los controles) no depende de los valores concretos.

**P3. ¿Por qué las colecciones se llaman `s03_*` y no `emprendedores`?**
E01 §5.3 dice que esas colecciones se decidirían en la Semana 2. Con el prefijo `s03_` se evita
cualquier colisión con lo que ya esté cargado de E01/E02 en la misma base, y la separación entre
"diseño final" y "experimento" queda visible de un vistazo. Los documentos además llevan
`dataset_id`, así que cualquier script puede delimitar exactamente su subconjunto.

**P4. ¿Cómo sé que la demostración CRUD no dañó la base?**
Tres pruebas independientes. **Una**: el propio script compara los conteos antes y después de cada
colección y el delta es 0. **Dos**: el control V-04 busca documentos temporales
(`dataset_id = S03_UE_V1_TMP` o `_id` con prefijo `TMP-E03-`) y falla si encuentra alguno.
**Tres**: la carga de la semilla es idempotente, así que `01_cargar_semilla.js` la reconstruye
completa desde el EJSON en cualquier momento.

**P5. ¿Por qué `findOneAndUpdate` y no `updateOne`?**
Porque devuelven cosas distintas. `updateOne` informa `matchedCount` y `modifiedCount`, pero no
devuelve el documento: hay que leer otra vez para ver qué pasó. `findOneAndUpdate` con
`returnDocument: 'after'` lee y escribe en la misma operación y devuelve el documento ya
actualizado. En una aplicación real, esa es la forma de no tener una ventana entre "escribí" y
"leí".

**P6. ¿Por qué `$inc` y no `$set` para el contador?**
Porque `$inc` es una operación atómica del servidor. Con `$set` habría que leer el valor, sumarlo
en el cliente y escribirlo: entre la lectura y la escritura, otra escritura podría colarse y se
perdería el incremento. Es el patrón básico para evitar la condición de carrera. El laboratorio lo
muestra con `demo.version`: 1 después del `updateOne` y 2 después del `findOneAndUpdate`.

**P7. ¿Qué diferencia hay entre `null` y un campo ausente en tu modelo?**
En MongoDB son estados distintos y se consultan distinto. `{ campo: null }` devuelve **los dos**:
los que valen `null` y los que no existen. Para separarlos hay que usar `{ campo: { $type: "null" } }`
y `{ campo: { $exists: false } }`. En el modelo: `canal_preferido` de los emprendedores está en
5 con valor, 3 en `null` y 2 ausente, y la consulta C07 cuenta los tres por separado.

**P8. ¿Por qué `fecha_realizacion` es `null` en una programada y no existe en una cancelada?**
Es una decisión de modelo explícita. En `programada` y `reprogramada` la asesoría **está agendada**
y no ha ocurrido: el campo existe con `null` para dejar claro que se espera. En `cancelada` la
asesoría **no va a ocurrir**: el campo no existe, y su presencia con `null` sería ambigua. La regla
la comprueba el control V-10 sobre las 30 asesorías.

**P9. ¿Qué garantiza la regla de franja y qué no?**
La **regla** es funcional: en el laboratorio, un asesor no tiene dos asesorías el mismo día UTC.
Se comprueba con el control V-20, que recorre las 30 asesorías y las 9 fechas de cada asesor y
encuentra 0 choques. Lo que **no** es la regla es la garantía: en producción, dos sesiones
podrían empezar a la vez y la regla no lo impide por sí sola. Para eso hacen falta mecanismos —
bloqueo, franja con hora de inicio más duración, o un índice único parcial— que son materia de
las semanas siguientes. La guía de E01 pide exactamente esa distinción entre regla funcional y
mecanismo.

**P10. ¿Por qué no usaste `$lookup` ni `$group` en el reto?**
Porque la agregación es el tema de la semana siguiente, y este laboratorio es la semana de **CRUD
y consultas**. Resolver el reto con dos lecturas y un recorrido en JavaScript obliga a entender
bien qué se está cruzando. Cuando se vea `$lookup` y `$group`, el paso natural es entender por
qué el cruce "a mano" era exactamente lo que el motor hacía por dentro.

**P11. ¿Cómo verificaste que la semilla en disco es la misma que la de la base?**
El control V-17 relee los tres archivos `.ejson` con `EJSON.parse`, extrae los identificadores y
los compara con los de la base. Comprueba además que el EJSON sigue siendo válido y que las
fechas llegan como `Date`. Si alguien edita a mano el EJSON y no recarga, V-17 lo detecta.

**P12. ¿Hay contraseñas o datos personales en lo que entregas?**
No. La contraseña del laboratorio se genera al preparar el entorno y vive en `.lab/`, que está en
`.gitignore`. El control **V-18** recorre todo el árbol del entregable (excluyendo `.lab`) buscando
la contraseña literal: si aparece en cualquier `.js`, `.md`, `.ejson`, `.json`, `.ps1` o `.txt`, el
control falla. Los correos son del dominio ficticio `example.edu.co` y los documentos de identidad
son números inventados.

**P13. ¿Por qué hay dos controles de conteo (V-01 y V-02)?**
V-01 comprueba que el volumen del dataset sea el esperado. V-02 comprueba que **no haya
documentos ajenos** al dataset en las mismas colecciones. Son cosas distintas: la base puede
tener 10 documentos correctos y un undécimo que no es nuestro. V-02 avisa y los deja intactos.

**P14. ¿Qué harías distinto con más tiempo?**
Tres cosas. **Primera**: un `JSON Schema` por colección para que la validación no viva solo en el
script de carga. **Segunda**: transacción para las operaciones que tocan dos colecciones —registrar
una asesoría y cobrarla—, porque ahora son dos escrituras independientes. **Tercera**: reemplazar
`skip`/`limit` por paginación por cursor (*keyset pagination*), porque `skip` obliga al motor a
descartar documentos y se degrada en tablas grandes.

---

## 4. Frases que conviene evitar en la sustentación

| No decir | Decir en su lugar |
| --- | --- |
| "La base de datos está perfecta" | "La base cumple los 41 controles del verificador; los AVISOS que quedan son los que están declarados en el informe" |
| "Las consultas devuelven 6" | "La consulta con `$elemMatch` devuelve 6; con la notación con punto devuelven 12, y esa es justamente la trampa que C09 demuestra" |
| "Recuperé la semilla de la Semana 2" | "La semilla se construyó desde la especificación de la guía de la Semana 1, porque el kit de E02 no está en este equipo; está declarado en la revisión cruzada" |
| "`null` significa que no hay dato" | "`null` significa que el campo existe y está vacío; que el campo no exista es otro estado, y el modelo los usa con significados distintos" |
| "MongoDB no tiene relaciones" | "MongoDB sí puede referenciar; lo que no tiene son las claves foráneas automáticas. Aquí las referencias se validan en la carga y en el verificador" |
| "El snapshot es denormalización" | "El snapshot es un dato con significado propio: el sector en el momento del hecho. Duplicarlo no es un error si se define quién es la fuente de verdad de cada copia" |

---

## 5. Checklist antes de sustentar

- [ ] La instancia del puerto 27018 está corriendo (`powershell -File scripts\00_preparar_lab_mongodb.ps1`).
- [ ] `01_cargar_semilla.js` ejecutado (10 / 15 / 30) y **vuelto a ejecutar** para mostrar idempotencia.
- [ ] `02_demo_crud.js` ejecutado → deltas en 0, residuos en 0.
- [ ] `03_consultas_aprendiz.js` ejecutado → las 12 consultas "COINCIDE".
- [ ] `04_verificar_base.js` ejecutado → **0 ERROR**.
- [ ] `resultados/informe_pruebas.md` abierto y fresca (fecha de hoy).
- [ ] Las dos trampas (notación con punto, límite de rango) reproducidas a mano por si preguntan.
- [ ] El reto de transferencia recontado a mano: 14 asesorías, 1 diferencia (`ASE-001`).
- [ ] La brecha del kit de E02 y las 8 desviaciones, explicadas **antes** de que las pregunten.
- [ ] Una acción de mejora con fecha acordada, del formato de socialización.
