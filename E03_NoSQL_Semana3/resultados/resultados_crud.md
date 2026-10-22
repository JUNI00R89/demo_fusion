# Resultados de la demostracion CRUD (E03 - Semana 3)

> Archivo generado automaticamente por `scripts/02_demo_crud.js`.
> No contiene datos simulados: todas las cifras provienen de la base de datos real del laboratorio.

| Dato | Valor |
| --- | --- |
| Base de datos | `emprendimiento_sena_lab` |
| Dataset de la semilla | `S03_UE_V1` |
| Marca de documentos temporales | `S03_UE_V1_TMP` |
| Prefijo de los _id temporales | `TMP-E03-` |
| Fecha de ejecucion | 2026-10-21T15:51:37.308Z |
| Errores | 0 |

## 1. Resumen por coleccion

| Coleccion | Documentos antes | Documentos despues | Delta | Documentos de la semilla |
| --- | ---: | ---: | ---: | ---: |
| `s03_emprendedores` | 10 | 10 | 0 | 10 |
| `s03_iniciativas` | 15 | 15 | 0 | 15 |
| `s03_asesorias` | 30 | 30 | 0 | 30 |

Un delta de 0 y un residuo temporal de 0 demuestran que la demostracion CRUD no dejo rastros en la base.

## 2. Detalle de las operaciones

### s03_emprendedores  (`TMP-E03-mviai5x6-emprendedores`)

**CREATE (insertOne)**

- acknowledged=true  insertedId=TMP-E03-mviai5x6-emprendedores

```
documento insertado:
{
  "tipo_documento": "CC",
  "numero_documento": "0000000000",
  "nombres": "Documento",
  "apellidos": "Temporal",
  "email": "temporal@example.edu.co",
  "telefono": "+570000000000",
  "sector": "tecnologia",
  "departamento": "Cundinamarca",
  "municipio": "Fusagasuga",
  "fecha_registro": {
    "$date": "2026-10-21T15:51:37.308Z"
  },
  "nivel_madurez": "idea",
  "activo": true,
  "canal_preferido": "web",
  "etiquetas": [
    "temporal"
  ],
  "_id": "TMP-E03-mviai5x6-emprendedores",
  "dataset_id": "S03_UE_V1_TMP",
  "esquema_version": "1.1",
  "creado_por_demo": "2026-10-21T15:51:37.308Z"
}
```

**READ #1 (findOne por _id)**

- documento leido de la base: si

```
{
  "_id": "TMP-E03-mviai5x6-emprendedores",
  "tipo_documento": "CC",
  "numero_documento": "0000000000",
  "nombres": "Documento",
  "apellidos": "Temporal",
  "email": "temporal@example.edu.co",
  "telefono": "+570000000000",
  "sector": "tecnologia",
  "departamento": "Cundinamarca",
  "municipio": "Fusagasuga",
  "fecha_registro": {
    "$date": "2026-10-21T15:51:37.308Z"
  },
  "nivel_madurez": "idea",
  "activo": true,
  "canal_preferido": "web",
  "etiquetas": [
    "temporal"
  ],
  "dataset_id": "S03_UE_V1_TMP",
  "esquema_version": "1.1",
  "creado_por_demo": "2026-10-21T15:51:37.308Z"
}
```

**UPDATE (updateOne con $set + $inc)**

- matchedCount=1  modifiedCount=1  upsertedId=undefined

```
filtro   : { _id: "TMP-E03-mviai5x6-emprendedores", dataset_id: "S03_UE_V1_TMP" }
actualiz.: { $set: { "demo.estado": "actualizado", "demo.actualizado_en": <Date> }, $inc: { "demo.version": 1 } }
```

**READ #2 (findOne por _id, despues del update)**

- campo demo: {"actualizado_en":{"$date":"2026-10-21T15:51:37.347Z"},"estado":"actualizado","version":1}

```
{
  "_id": "TMP-E03-mviai5x6-emprendedores",
  "tipo_documento": "CC",
  "numero_documento": "0000000000",
  "nombres": "Documento",
  "apellidos": "Temporal",
  "email": "temporal@example.edu.co",
  "telefono": "+570000000000",
  "sector": "tecnologia",
  "departamento": "Cundinamarca",
  "municipio": "Fusagasuga",
  "fecha_registro": {
    "$date": "2026-10-21T15:51:37.308Z"
  },
  "nivel_madurez": "idea",
  "activo": true,
  "canal_preferido": "web",
  "etiquetas": [
    "temporal"
  ],
  "dataset_id": "S03_UE_V1_TMP",
  "esquema_version": "1.1",
  "creado_por_demo": "2026-10-21T15:51:37.308Z",
  "demo": {
    "actualizado_en": {
      "$date": "2026-10-21T15:51:37.347Z"
    },
    "estado": "actualizado",
    "version": 1
  }
}
```

**UPDATE atomico (findOneAndUpdate, devuelve el documento)**

- documento devuelto por el servidor con el cambio aplicado

```
{
  "_id": "TMP-E03-mviai5x6-emprendedores",
  "tipo_documento": "CC",
  "numero_documento": "0000000000",
  "nombres": "Documento",
  "apellidos": "Temporal",
  "email": "temporal@example.edu.co",
  "telefono": "+570000000000",
  "sector": "tecnologia",
  "departamento": "Cundinamarca",
  "municipio": "Fusagasuga",
  "fecha_registro": {
    "$date": "2026-10-21T15:51:37.308Z"
  },
  "nivel_madurez": "idea",
  "activo": true,
  "canal_preferido": "web",
  "etiquetas": [
    "temporal"
  ],
  "dataset_id": "S03_UE_V1_TMP",
  "esquema_version": "1.1",
  "creado_por_demo": "2026-10-21T15:51:37.308Z",
  "demo": {
    "actualizado_en": {
      "$date": "2026-10-21T15:51:37.347Z"
    },
    "estado": "actualizado_atomico",
    "version": 2
  }
}
```

**READ #3 (findOne, verificacion del update atomico)**

- campo demo: {"actualizado_en":{"$date":"2026-10-21T15:51:37.347Z"},"estado":"actualizado_atomico","version":2}

```
{
  "_id": "TMP-E03-mviai5x6-emprendedores",
  "tipo_documento": "CC",
  "numero_documento": "0000000000",
  "nombres": "Documento",
  "apellidos": "Temporal",
  "email": "temporal@example.edu.co",
  "telefono": "+570000000000",
  "sector": "tecnologia",
  "departamento": "Cundinamarca",
  "municipio": "Fusagasuga",
  "fecha_registro": {
    "$date": "2026-10-21T15:51:37.308Z"
  },
  "nivel_madurez": "idea",
  "activo": true,
  "canal_preferido": "web",
  "etiquetas": [
    "temporal"
  ],
  "dataset_id": "S03_UE_V1_TMP",
  "esquema_version": "1.1",
  "creado_por_demo": "2026-10-21T15:51:37.308Z",
  "demo": {
    "actualizado_en": {
      "$date": "2026-10-21T15:51:37.347Z"
    },
    "estado": "actualizado_atomico",
    "version": 2
  }
}
```

**DELETE (deleteOne por _id + dataset_id temporal)**

- acknowledged=true  deletedCount=1

```
filtro: { _id: "TMP-E03-mviai5x6-emprendedores", dataset_id: "S03_UE_V1_TMP" }
```

**READ #4 (findOne, comprobacion del borrado)**

- resultado de la lectura: null (el documento ya no existe)

```
(sin documento)
```

**CONTADORES**

- antes=10  despues=10  delta=0  (delta 0 = la coleccion quedo como estaba)

### s03_iniciativas  (`TMP-E03-mviai5y0-iniciativas`)

**CREATE (insertOne)**

- acknowledged=true  insertedId=TMP-E03-mviai5y0-iniciativas

```
documento insertado:
{
  "emprendedor_id": "EMP-001",
  "nombre": "Iniciativa Temporal E03",
  "sector": "tecnologia",
  "etapa": "idea",
  "estado": "activa",
  "activo": true,
  "plataformas": [
    "web"
  ],
  "fecha_creacion": {
    "$date": "2026-10-21T15:51:37.308Z"
  },
  "presupuesto": 1000000,
  "mentor": null,
  "canal_preferido": null,
  "diagnosticos": [],
  "historial_estados": [
    {
      "estado": "activa",
      "etapa": "idea",
      "sector": "tecnologia",
      "fecha": {
        "$date": "2026-10-21T15:51:37.308Z"
      },
      "responsable": "EMP-001",
      "nota": "Documento temporal de demostracion CRUD"
    }
  ],
  "_id": "TMP-E03-mviai5y0-iniciativas",
  "dataset_id": "S03_UE_V1_TMP",
  "esquema_version": "1.1",
  "creado_por_demo": "2026-10-21T15:51:37.308Z"
}
```

**READ #1 (findOne por _id)**

- documento leido de la base: si

```
{
  "_id": "TMP-E03-mviai5y0-iniciativas",
  "emprendedor_id": "EMP-001",
  "nombre": "Iniciativa Temporal E03",
  "sector": "tecnologia",
  "etapa": "idea",
  "estado": "activa",
  "activo": true,
  "plataformas": [
    "web"
  ],
  "fecha_creacion": {
    "$date": "2026-10-21T15:51:37.308Z"
  },
  "presupuesto": 1000000,
  "mentor": null,
  "canal_preferido": null,
  "diagnosticos": [],
  "historial_estados": [
    {
      "estado": "activa",
      "etapa": "idea",
      "sector": "tecnologia",
      "fecha": {
        "$date": "2026-10-21T15:51:37.308Z"
      },
      "responsable": "EMP-001",
      "nota": "Documento temporal de demostracion CRUD"
    }
  ],
  "dataset_id": "S03_UE_V1_TMP",
  "esquema_version": "1.1",
  "creado_por_demo": "2026-10-21T15:51:37.308Z"
}
```

**UPDATE (updateOne con $set + $inc)**

- matchedCount=1  modifiedCount=1  upsertedId=undefined

```
filtro   : { _id: "TMP-E03-mviai5y0-iniciativas", dataset_id: "S03_UE_V1_TMP" }
actualiz.: { $set: { "demo.estado": "actualizado", "demo.actualizado_en": <Date> }, $inc: { "demo.version": 1 } }
```

**READ #2 (findOne por _id, despues del update)**

- campo demo: {"actualizado_en":{"$date":"2026-10-21T15:51:37.374Z"},"estado":"actualizado","version":1}

```
{
  "_id": "TMP-E03-mviai5y0-iniciativas",
  "emprendedor_id": "EMP-001",
  "nombre": "Iniciativa Temporal E03",
  "sector": "tecnologia",
  "etapa": "idea",
  "estado": "activa",
  "activo": true,
  "plataformas": [
    "web"
  ],
  "fecha_creacion": {
    "$date": "2026-10-21T15:51:37.308Z"
  },
  "presupuesto": 1000000,
  "mentor": null,
  "canal_preferido": null,
  "diagnosticos": [],
  "historial_estados": [
    {
      "estado": "activa",
      "etapa": "idea",
      "sector": "tecnologia",
      "fecha": {
        "$date": "2026-10-21T15:51:37.308Z"
      },
      "responsable": "EMP-001",
      "nota": "Documento temporal de demostracion CRUD"
    }
  ],
  "dataset_id": "S03_UE_V1_TMP",
  "esquema_version": "1.1",
  "creado_por_demo": "2026-10-21T15:51:37.308Z",
  "demo": {
    "actualizado_en": {
      "$date": "2026-10-21T15:51:37.374Z"
    },
    "estado": "actualizado",
    "version": 1
  }
}
```

**UPDATE atomico (findOneAndUpdate, devuelve el documento)**

- documento devuelto por el servidor con el cambio aplicado

```
{
  "_id": "TMP-E03-mviai5y0-iniciativas",
  "emprendedor_id": "EMP-001",
  "nombre": "Iniciativa Temporal E03",
  "sector": "tecnologia",
  "etapa": "idea",
  "estado": "activa",
  "activo": true,
  "plataformas": [
    "web"
  ],
  "fecha_creacion": {
    "$date": "2026-10-21T15:51:37.308Z"
  },
  "presupuesto": 1000000,
  "mentor": null,
  "canal_preferido": null,
  "diagnosticos": [],
  "historial_estados": [
    {
      "estado": "activa",
      "etapa": "idea",
      "sector": "tecnologia",
      "fecha": {
        "$date": "2026-10-21T15:51:37.308Z"
      },
      "responsable": "EMP-001",
      "nota": "Documento temporal de demostracion CRUD"
    }
  ],
  "dataset_id": "S03_UE_V1_TMP",
  "esquema_version": "1.1",
  "creado_por_demo": "2026-10-21T15:51:37.308Z",
  "demo": {
    "actualizado_en": {
      "$date": "2026-10-21T15:51:37.374Z"
    },
    "estado": "actualizado_atomico",
    "version": 2
  }
}
```

**READ #3 (findOne, verificacion del update atomico)**

- campo demo: {"actualizado_en":{"$date":"2026-10-21T15:51:37.374Z"},"estado":"actualizado_atomico","version":2}

```
{
  "_id": "TMP-E03-mviai5y0-iniciativas",
  "emprendedor_id": "EMP-001",
  "nombre": "Iniciativa Temporal E03",
  "sector": "tecnologia",
  "etapa": "idea",
  "estado": "activa",
  "activo": true,
  "plataformas": [
    "web"
  ],
  "fecha_creacion": {
    "$date": "2026-10-21T15:51:37.308Z"
  },
  "presupuesto": 1000000,
  "mentor": null,
  "canal_preferido": null,
  "diagnosticos": [],
  "historial_estados": [
    {
      "estado": "activa",
      "etapa": "idea",
      "sector": "tecnologia",
      "fecha": {
        "$date": "2026-10-21T15:51:37.308Z"
      },
      "responsable": "EMP-001",
      "nota": "Documento temporal de demostracion CRUD"
    }
  ],
  "dataset_id": "S03_UE_V1_TMP",
  "esquema_version": "1.1",
  "creado_por_demo": "2026-10-21T15:51:37.308Z",
  "demo": {
    "actualizado_en": {
      "$date": "2026-10-21T15:51:37.374Z"
    },
    "estado": "actualizado_atomico",
    "version": 2
  }
}
```

**DELETE (deleteOne por _id + dataset_id temporal)**

- acknowledged=true  deletedCount=1

```
filtro: { _id: "TMP-E03-mviai5y0-iniciativas", dataset_id: "S03_UE_V1_TMP" }
```

**READ #4 (findOne, comprobacion del borrado)**

- resultado de la lectura: null (el documento ya no existe)

```
(sin documento)
```

**CONTADORES**

- antes=15  despues=15  delta=0  (delta 0 = la coleccion quedo como estaba)

### s03_asesorias  (`TMP-E03-mviai5yl-asesorias`)

**CREATE (insertOne)**

- acknowledged=true  insertedId=TMP-E03-mviai5yl-asesorias

```
documento insertado:
{
  "iniciativa_id": "INI-001",
  "sector": "alimentos",
  "tipo": "capacitacion",
  "estado": "programada",
  "modalidad": "virtual",
  "fecha_programada": {
    "$date": "2026-10-21T15:51:37.308Z"
  },
  "fecha_realizacion": null,
  "asesor": "Asesor Temporal",
  "duracion_minutos": 60,
  "costo": null,
  "canal_contacto": "email",
  "_id": "TMP-E03-mviai5yl-asesorias",
  "dataset_id": "S03_UE_V1_TMP",
  "esquema_version": "1.1",
  "creado_por_demo": "2026-10-21T15:51:37.308Z"
}
```

**READ #1 (findOne por _id)**

- documento leido de la base: si

```
{
  "_id": "TMP-E03-mviai5yl-asesorias",
  "iniciativa_id": "INI-001",
  "sector": "alimentos",
  "tipo": "capacitacion",
  "estado": "programada",
  "modalidad": "virtual",
  "fecha_programada": {
    "$date": "2026-10-21T15:51:37.308Z"
  },
  "fecha_realizacion": null,
  "asesor": "Asesor Temporal",
  "duracion_minutos": 60,
  "costo": null,
  "canal_contacto": "email",
  "dataset_id": "S03_UE_V1_TMP",
  "esquema_version": "1.1",
  "creado_por_demo": "2026-10-21T15:51:37.308Z"
}
```

**UPDATE (updateOne con $set + $inc)**

- matchedCount=1  modifiedCount=1  upsertedId=undefined

```
filtro   : { _id: "TMP-E03-mviai5yl-asesorias", dataset_id: "S03_UE_V1_TMP" }
actualiz.: { $set: { "demo.estado": "actualizado", "demo.actualizado_en": <Date> }, $inc: { "demo.version": 1 } }
```

**READ #2 (findOne por _id, despues del update)**

- campo demo: {"actualizado_en":{"$date":"2026-10-21T15:51:37.394Z"},"estado":"actualizado","version":1}

```
{
  "_id": "TMP-E03-mviai5yl-asesorias",
  "iniciativa_id": "INI-001",
  "sector": "alimentos",
  "tipo": "capacitacion",
  "estado": "programada",
  "modalidad": "virtual",
  "fecha_programada": {
    "$date": "2026-10-21T15:51:37.308Z"
  },
  "fecha_realizacion": null,
  "asesor": "Asesor Temporal",
  "duracion_minutos": 60,
  "costo": null,
  "canal_contacto": "email",
  "dataset_id": "S03_UE_V1_TMP",
  "esquema_version": "1.1",
  "creado_por_demo": "2026-10-21T15:51:37.308Z",
  "demo": {
    "actualizado_en": {
      "$date": "2026-10-21T15:51:37.394Z"
    },
    "estado": "actualizado",
    "version": 1
  }
}
```

**UPDATE atomico (findOneAndUpdate, devuelve el documento)**

- documento devuelto por el servidor con el cambio aplicado

```
{
  "_id": "TMP-E03-mviai5yl-asesorias",
  "iniciativa_id": "INI-001",
  "sector": "alimentos",
  "tipo": "capacitacion",
  "estado": "programada",
  "modalidad": "virtual",
  "fecha_programada": {
    "$date": "2026-10-21T15:51:37.308Z"
  },
  "fecha_realizacion": null,
  "asesor": "Asesor Temporal",
  "duracion_minutos": 60,
  "costo": null,
  "canal_contacto": "email",
  "dataset_id": "S03_UE_V1_TMP",
  "esquema_version": "1.1",
  "creado_por_demo": "2026-10-21T15:51:37.308Z",
  "demo": {
    "actualizado_en": {
      "$date": "2026-10-21T15:51:37.394Z"
    },
    "estado": "actualizado_atomico",
    "version": 2
  }
}
```

**READ #3 (findOne, verificacion del update atomico)**

- campo demo: {"actualizado_en":{"$date":"2026-10-21T15:51:37.394Z"},"estado":"actualizado_atomico","version":2}

```
{
  "_id": "TMP-E03-mviai5yl-asesorias",
  "iniciativa_id": "INI-001",
  "sector": "alimentos",
  "tipo": "capacitacion",
  "estado": "programada",
  "modalidad": "virtual",
  "fecha_programada": {
    "$date": "2026-10-21T15:51:37.308Z"
  },
  "fecha_realizacion": null,
  "asesor": "Asesor Temporal",
  "duracion_minutos": 60,
  "costo": null,
  "canal_contacto": "email",
  "dataset_id": "S03_UE_V1_TMP",
  "esquema_version": "1.1",
  "creado_por_demo": "2026-10-21T15:51:37.308Z",
  "demo": {
    "actualizado_en": {
      "$date": "2026-10-21T15:51:37.394Z"
    },
    "estado": "actualizado_atomico",
    "version": 2
  }
}
```

**DELETE (deleteOne por _id + dataset_id temporal)**

- acknowledged=true  deletedCount=1

```
filtro: { _id: "TMP-E03-mviai5yl-asesorias", dataset_id: "S03_UE_V1_TMP" }
```

**READ #4 (findOne, comprobacion del borrado)**

- resultado de la lectura: null (el documento ya no existe)

```
(sin documento)
```

**CONTADORES**

- antes=30  despues=30  delta=0  (delta 0 = la coleccion quedo como estaba)

## 3. Guarda de seguridad

El script escribe unicamente a traves de una funcion de guarda (`escrituraPermitida`) que exige que el `_id`
comience por `TMP-E03-` y que no pertenezca a la semilla. El intento de modificar `INI-001` se rechaza
antes de llegar al servidor:

```
Operacion bloqueada: "INI-001" pertenece a la semilla y no se puede modificar.
```

## 4. Bitacora de la ejecucion

```
INFO Base de trabajo: emprendimiento_sena_lab
INFO Marca de tiempo de la ejecucion: 2026-10-21T15:51:37.308Z
INFO Dataset de trabajo: S03_UE_V1  |  documentos temporales: S03_UE_V1_TMP
INFO s03_emprendedores: 10 documentos antes de la demostracion.
INFO s03_iniciativas: 15 documentos antes de la demostracion.
INFO s03_asesorias: 30 documentos antes de la demostracion.
OK   s03_emprendedores: la coleccion quedo con los mismos 10 documentos.
OK   s03_iniciativas: la coleccion quedo con los mismos 15 documentos.
OK   s03_asesorias: la coleccion quedo con los mismos 30 documentos.
OK   Intento de modificar s03_iniciativas/INI-001 rechazado antes de llegar al servidor.
INFO Motivo: Operacion bloqueada: "INI-001" pertenece a la semilla y no se puede modificar.
INFO INI-001 sigue intacto: sector=economia_circular, etapa=puesta_en_marcha, historial=4 entradas.
INFO s03_emprendedores: 0 temporal(es) eliminado(s) en la limpieza, 0 residuo(s) al final.
INFO s03_iniciativas: 0 temporal(es) eliminado(s) en la limpieza, 0 residuo(s) al final.
INFO s03_asesorias: 0 temporal(es) eliminado(s) en la limpieza, 0 residuo(s) al final.
OK   Estado final identico al inicial en las tres colecciones y sin residuos temporales.
```

## 5. Conclusiones

- El ciclo create / read / update / read / delete quedo registrado con lecturas antes y despues de cada escritura.
- `updateOne` informo `matchedCount` y `modifiedCount`; `findOneAndUpdate` devolvio el documento ya actualizado.
- Los tres contadores por coleccion volvieron al valor inicial: no se modifico ningun documento de la semilla.
- No quedaron documentos temporales: el filtro de limpieza por `dataset_id = S03_UE_V1_TMP` retorno 0.
