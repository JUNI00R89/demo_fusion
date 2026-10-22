# E03 — Bases de Datos NoSQL · Semana 3: CRUD y consultas reproducibles

Laboratorio de la **Unidad de Emprendimiento** (SENA / ADSO) sobre **MongoDB**, con la
situación problema de la Unidad de Emprendimiento: emprendedores, iniciativas y asesorías.

El objetivo de esta semana **no es** "tener una base de datos". Es dejar una base
**reproducible**: que cualquiera pueda reconstruirla desde cero, ejecutar las mismas consultas y
obtener **exactamente los mismos números**, y que queden **registrados por escrito** los errores
encontrados y las decisiones de modelado tomadas.

| Dato | Valor |
| --- | --- |
| Base de datos | `emprendimiento_sena_lab` |
| Colecciones | `s03_emprendedores` (10) · `s03_iniciativas` (15) · `s03_asesorias` (30) |
| Dataset | `S03_UE_V1` (`esquema_version` `1.1`) |
| Instancia | MongoDB aislada en `127.0.0.1:27018`, con `--auth` y base propia `.lab/mongodb/data` |
| Cuenta de práctica | `aprendiz_nosql`, base de autenticación `emprendimiento_sena_lab` |
| Consultas | C01 – C10 (solo lectura) + continuidad Q04-E01 + reto de transferencia |
| Verificación | 41 controles (V-01 … V-21) con estado **OK / AVISO / ERROR** |
| Última ejecución | `resultados/informe_pruebas.md` — **41 controles, 0 ERROR** |

---

## 1. Estructura del entregable

```
E03_NoSQL_Semana3/
├─ README.md                              Este archivo: qué es, cómo se ejecuta, qué hacer a mano
├─ .gitignore                            Excluye la carpeta .lab/ (datos y credenciales del laboratorio)
├─ data/
│  ├─ emprendedores.ejson                10 emprendedores   (EMP-001 … EMP-010)
│  ├─ iniciativas.ejson                   15 iniciativas      (INI-001 … INI-015)
│  └─ asesorias.ejson                    30 asesorías        (ASE-001 … ASE-030)
├─ scripts/
│  ├─ 00_preparar_lab_mongodb.ps1         Levanta la instancia aislada y crea la cuenta de práctica
│  ├─ 01_cargar_semilla.js                Valida y carga la semilla (idempotente) + crea los índices
│  ├─ 02_demo_crud.js                     Demostración CRUD sobre documentos TEMPORALES
│  ├─ 03_consultas_aprendiz.js            Consultas C01 – C10, Q04-E01 y reto de transferencia
│  └─ 04_verificar_base.js                Suite de 41 controles → resultados/informe_pruebas.md
├─ docs/
│  ├─ diccionario_datos_v1.1.md           Qué campo tiene cada documento, de qué tipo y con qué dominio
│  ├─ matriz_consultas_C01_C10.md         Las 10 consultas: filtro, salida, orden, valor esperado
│  ├─ registro_operaciones_crud.md        Guion del CRUD, la guarda de escritura y los contadores
│  ├─ bitacora_errores.md                 BE-01 … BE-12: los errores reales y cómo se resolvieron
│  ├─ revision_cruzada.md                 Regla por regla contra la guía de la Semana 1 + desviaciones
│  ├─ actividades_A1_A6.md                A1 – A6 y el reto de transferencia, con criterios de cierre
│  └─ sustentacion.md                     Guion de sustentación y preguntas frecuentes
├─ resultados/                            (generados por los scripts, se versionan)
│  ├─ resultados_crud.md                  Bitácora real del CRUD
│  ├─ resultados_consultas.md             Resultado real de las 12 consultas
│  └─ informe_pruebas.md                  Resultado real de los 41 controles
└─ .lab/                                  (NO se versiona) datos, log y credenciales del laboratorio
```

> **La carpeta `.lab/` está en `.gitignore` y nunca debe versionarse**: contiene los archivos de
> datos de MongoDB y el archivo con la contraseña de práctica.

---

## 2. Requisitos

| Componente | Versión usada | Cómo comprobarlo |
| --- | --- | --- |
| Windows | 11 | `systeminfo` |
| MongoDB Server | 7.0.43 | `mongod --version` |
| mongosh | 2.13.0 | `mongosh --version` |
| Node.js | v24.21.0 | `node --version` (opcional: solo para herramientas de apoyo) |
| PowerShell | 5.1 o superior | `$PSVersionTable.PSVersion` |

Si `mongosh` se instaló con npm en Windows, hay que invocarlo como **`mongosh.cmd`**:
PowerShell elige el lanzador `.ps1`, que la política de ejecución suele bloquear
(ver `docs/bitacora_errores.md`, BE-03).

```powershell
& "$env:APPDATA\npm\mongosh.cmd" --version
```

---

## 3. Cómo ejecutar el laboratorio (comandos exactos)

> Todos los comandos se ejecutan **desde la raíz de la carpeta `E03_NoSQL_Semana3`**.
> Reemplaza `<PASSWORD>` por la contraseña que genera el paso 0 (nunca la escribas en un archivo
> versionado).

### Paso 0 — Preparar el entorno (una sola vez, o si la instancia no responde)

```powershell
powershell -ExecutionPolicy Bypass -File scripts\00_preparar_lab_mongodb.ps1
```

Crea `.lab/mongodb/data`, **genera una contraseña de práctica**, crea el usuario `aprendiz_nosql`
con `readWrite` + `dbAdmin` sobre `emprendimiento_sena_lab`, reinicia `mongod` **con** `--auth` y
verifica la conexión. La contraseña queda en `.lab/mongodb/password.txt` (fuera de Git).

Opciones: `-Reparar` (recrea el usuario), `-Detener` (apaga la instancia), `-Puerto 27018`.

### Variable de entorno para no escribir la contraseña en cada comando

```powershell
$pw = (Get-Content .lab\mongodb\password.txt -Raw).Trim()
```

### Paso 1 — Cargar la semilla (valida, inserta y crea los índices)

```powershell
& "$env:APPDATA\npm\mongosh.cmd" "mongodb://127.0.0.1:27018/emprendimiento_sena_lab" `
  --username aprendiz_nosql --password $pw `
  --authenticationDatabase emprendimiento_sena_lab `
  --quiet scripts\01_cargar_semilla.js
```

Modo simulación (valida **sin** escribir): `$env:E03_DRY_RUN = "1"` antes del comando.

### Paso 2 — Demostración CRUD (escribe solo en documentos temporales)

```powershell
& "$env:APPDATA\npm\mongosh.cmd" "mongodb://127.0.0.1:27018/emprendimiento_sena_lab" `
  --username aprendiz_nosql --password $pw `
  --authenticationDatabase emprendimiento_sena_lab `
  --quiet scripts\02_demo_crud.js
```

### Paso 3 — Consultas C01 – C10 y reto de transferencia (solo lectura)

```powershell
& "$env:APPDATA\npm\mongosh.cmd" "mongodb://127.0.0.1:27018/emprendimiento_sena_lab" `
  --username aprendiz_nosql --password $pw `
  --authenticationDatabase emprendimiento_sena_lab `
  --quiet scripts\03_consultas_aprendiz.js
```

### Paso 4 — Verificación integral (41 controles)

```powershell
& "$env:APPDATA\npm\mongosh.cmd" "mongodb://127.0.0.1:27018/emprendimiento_sena_lab" `
  --username aprendiz_nosql --password $pw `
  --authenticationDatabase emprendimiento_sena_lab `
  --quiet scripts\04_verificar_base.js
```

Los tres scripts de `.js` **terminan con código de salida 1** si algo no cuadra, de modo que se
pueden encadenar en un pipeline o usar en un control automático.

### Variante para Linux / macOS / WSL

```bash
mongosh "mongodb://127.0.0.1:27018/emprendimiento_sena_lab" \
  --username aprendiz_nosql --password '<PASSWORD>' \
  --authenticationDatabase emprendimiento_sena_lab \
  --quiet scripts/01_cargar_semilla.js
```

---

## 4. Qué produce cada script

| Script | Escribe en la base | Genera | Termina con error si |
| --- | --- | --- | --- |
| `00_preparar_lab_mongodb.ps1` | Configura la instancia y crea el usuario | — | No se pudo crear el usuario o falla la verificación autenticada |
| `01_cargar_semilla.js` | Sí: **reemplaza** los documentos de `S03_UE_V1` y crea 10 índices | — | La semilla no valida, o el volumen final no es 10/15/30 |
| `02_demo_crud.js` | Sí: **solo** documentos `TMP-E03-*` (y los borra al final) | `resultados/resultados_crud.md` | Algún delta de documentos ≠ 0, queda un temporal, o se produce un error en una operación |
| `03_consultas_aprendiz.js` | **No** (solo lectura) | `resultados/resultados_consultas.md` | Alguna consulta no coincide con el valor esperado, o cambia algún conteo |
| `04_verificar_base.js` | **No** (solo lectura) | `resultados/informe_pruebas.md` | Hay un solo control en estado **ERROR** |

---

## 5. Qué hay que hacer a mano (lo que el script no puede hacer por ti)

Los scripts dejan la base lista y **verificada**. Estas tareas son del aprendiz y son la mitad del
trabajo:

1. **Repetir la carga** y comprobar la idempotencia: ejecutar `01_cargar_semilla.js` dos veces y
   ver que los conteos siguen siendo 10 / 15 / 30.
2. **Reponer a mano tres consultas** en `mongosh` (sin mirar el script) y comprobar que dan lo
   mismo: C01 → 3, C05 → 4 entradas de historial, C09 con `$elemMatch` → 6.
3. **Reproducir las dos trampas**:
   - la notación con punto devuelve **12** en vez de 6 (`docs/matriz_consultas_C01_C10.md`, C09);
   - `$lte: ISODate('2026-09-30')` devuelve **13** asesorías en vez de **14**, porque ese límite es
     la medianoche (`docs/bitacora_errores.md`, BE-09).
4. **Provocar un AVISO y un ERROR** a propósito y restaurar el estado:
   - insertar un documento ajeno → aviso **V-02** → borrarlo;
   - cambiar el `sector` de `INI-001` a un valor inválido → **ERROR V-09** → restaurar con
     `01_cargar_semilla.js`.
5. **Redactar la respuesta de cada actividad A1 – A6** (`docs/actividades_A1_A6.md`) y la
   **conclusión de cada consulta** (`docs/matriz_consultas_C01_C10.md`).
6. **Sustentar** el reto de transferencia: 14 asesorías realizadas en septiembre de 2026 y **una
   sola** cuyo sector histórico difiere del actual (`ASE-001`).
7. **Revisar en MongoDB Compass** las colecciones `s03_*` con la misma cuenta de práctica y
   compararlas con los resultados generados.

---

## 6. Seguridad del entregable

- **Ninguna contraseña** está escrita en `data/`, `docs/`, `scripts/` ni `resultados/`.
  La contraseña vive en `.lab/mongodb/password.txt`, y `.lab/` está en `.gitignore`.
  El control **V-18** recorre todo el entregable buscando la contraseña literal y falla si la
  encuentra.
- La cuenta `aprendiz_nosql` tiene permisos `readWrite` + `dbAdmin` **solo** sobre
  `emprendimiento_sena_lab`. Nunca se usa la cuenta administrativa.
- La demostración CRUD **no puede** tocar la semilla: toda escritura pasa por una guarda que exige
  un `_id` con prefijo `TMP-E03-` y rechaza los patrones de la semilla.
- Los datos personales son **ficticios**: correos del dominio `example.edu.co`, documentos de
  identidad y teléfonos inventados.

---

## 7. Problemas frecuentes y cómo resolverlos

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| `MongoServerError: Authentication failed` | La contraseña no es la de `.lab/mongodb/password.txt`, o el usuario no existe | Ejecutar `00_preparar_lab_mongodb.ps1 -Reparar` y volver a leer el archivo de contraseña |
| `Authentication failed` **justo después** de preparar el entorno | El `.js` temporal se escribió con BOM y `mongosh` no ejecutó nada | Ya está corregido en el script; si reaparece, verifica que el archivo se escriba **sin** BOM |
| `mongosh` no se ejecuta en PowerShell | Se está invocando el lanzador `.ps1` | Usa `& "$env:APPDATA\npm\mongosh.cmd" …` |
| `mongod.exe no se encontró` | MongoDB Server no está en las rutas habituales | `00_preparar_lab_mongodb.ps1 -Mongod "C:\ruta\a\mongod.exe"` |
| `EJSON.parse` falla al leer un `.ejson` | El archivo se editó a mano y quedó mal formado | Valida con `node -e "JSON.parse(require('fs').readFileSync('data/iniciativas.ejson','utf8'))"` |
| Un control de `04_verificar_base.js` da **ERROR** | La base se modificó a mano | Recarga la semilla: `01_cargar_semilla.js` (es idempotente) |
| `04_verificar_base.js` da **AVISO** en V-19 | Falta un entregable de `docs/` o `resultados/` | Ejecuta los pasos 2, 3 y 4 en orden |
| El puerto 27018 está ocupado | Ya hay una instancia del laboratorio corriendo | Es normal: el paso 0 lo detecta y avisa. Usa `-Detener` o `-Reparar` |
| `mongosh` se queda colgado esperando contraseña | No se pasó `--password` | Pasa `$pw` explícitamente |

---

## 8. Nota de contexto: el kit de la Semana 2 (E02) no está en este equipo

Se buscó en todo el equipo antes de construir el entregable y **no existe ningún archivo `.ejson`
ni carpeta `E0*`** con el material de E02. Por eso la semilla `S03_UE_V1` **no es una recuperación**
del kit de la Semana 2: **se construyó desde la especificación explícita de la guía de la Semana 1**
(los conteos 10 / 15 / 30 de su §7 y las reglas del caso de su §A3).

Esto está declarado de forma expresa en `docs/revision_cruzada.md`, §3, junto con las **8
desviaciones** respecto de las listas de la guía. Si el instructor entrega el kit de E02, el
laboratorio se adapta con un cambio acotado: sustituir los tres `data/*.ejson` y ajustar los
valores esperados, que están concentrados en el arreglo `consultas[]` de
`scripts/03_consultas_aprendiz.js` y en las constantes de `scripts/04_verificar_base.js`.

---

## 9. Git

El trabajo está organizado en commits por capa (semilla → scripts → resultados → documentación) y
**no se publica en ningún repositorio remoto**, tal como permite la guía de la Semana 1
(§4: *"No se exige publicar un repositorio externo si no se ha acordado"*).

Antes de subir cualquier cosa, comprueba que `.lab/` no aparece en el índice:

```powershell
git status --short
git check-ignore -v .lab\mongodb\password.txt
```

---

## 10. Referencias

- Guía de la Semana 1: `C:\Users\Sena\Downloads\Guia_Semana_01_NoSQL_Unidad_Emprendimiento`
  (texto legible en `C:\Users\Sena\Downloads\guia.txt`).
- MongoDB — Data Modeling: <https://www.mongodb.com/docs/manual/data-modeling/>
- MongoDB — BSON Types: <https://www.mongodb.com/docs/manual/reference/bson-types/>
- MongoDB — `mongosh` options: <https://www.mongodb.com/docs/mongodb-shell/reference/options/>
- MongoDB — `createUser`: <https://www.mongodb.com/docs/manual/reference/method/db.createUser/>
