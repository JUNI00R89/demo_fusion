# Resultados de las consultas C01 - C10 y del reto de transferencia (E03 - Semana 3)

> Archivo generado automaticamente por `scripts/03_consultas_aprendiz.js` sobre la base real del laboratorio.
> Todas las consultas son de solo lectura: los conteos de las tres colecciones se comparan antes y despues.

| Dato | Valor |
| --- | --- |
| Base de datos | `emprendimiento_sena_lab` |
| Dataset | `S03_UE_V1` |
| Fecha de ejecucion | 2026-10-22T12:15:24.330Z |
| Consultas ejecutadas | 12 |
| Discrepancias | 0 |
| Modificacion de datos | ninguna (solo lectura) |

## Cuadro de resultados

| Id | Consulta | Resultado | Esperado | Estado |
| --- | --- | ---: | ---: | --- |
| C01 | Iniciativas del sector tecnologia en etapa puesta_en_marcha | 3 | 3 | COINCIDE |
| C02 | Iniciativas activas que tienen plataforma web | 10 | 10 | COINCIDE |
| C03 | Iniciativas que pertenecen al emprendedor EMP-001 | 2 | 2 | COINCIDE |
| C04 | Asesorias de tipo mentoria | 6 | 6 | COINCIDE |
| C05 | Historial de estados de una iniciativa (array embebido) | 4 | 4 | COINCIDE |
| C06 | Asesorias de tipo capacitacion | 11 | 11 | COINCIDE |
| C07 | Emprendedores agrupados por canal_preferido (valor / null / ausente) | 5/3/2 | 5 / 3 / 2 | COINCIDE |
| C08 | Iniciativas agrupadas por mentor (valor / null / ausente) | 6/5/4 | 6 / 5 / 4 | COINCIDE |
| C09 | Iniciativas con diagnostico de mercado y puntaje >= 80 ($elemMatch vs notacion de punto) | 6 correctas / 12 con la notacion ingenua | 6 / 12 | COINCIDE |
| C10 | Paginacion de iniciativas por sector y _id (5 por pagina) | 3 paginas de 5 (15 documentos) | 3 paginas (5 + 5 + 5) | COINCIDE |
| Q04-E01 | Asesorias pendientes por rango de fechas y modalidad (continuidad con la guia de la Semana 1) | 9 pendientes (presencial=3, telefonica=1, virtual=5) | 9 pendientes (virtual=5, presencial=3, telefonica=1) | COINCIDE |
| RETO | Asesorias realizadas en septiembre 2026 y sector historico vs sector actual | 14 asesorias / 1 diferencia(s) de sector | 14 asesorias / 1 diferencia (ASE-001: alimentos vs economia_circular) | COINCIDE |

## Detalle de cada consulta

### C01 - Iniciativas del sector tecnologia en etapa puesta_en_marcha

- **Pregunta:** Que iniciativas estan en el sector tecnologia y ya entraron en puesta en marcha?
- **Coleccion:** `s03_iniciativas`
- **Filtro:** `[object Object]`
- **Resultado real:** 3
- **Valor esperado:** 3
- **Estado:** COINCIDE
- **Identificadores devueltos:** INI-002, INI-006, INI-013
- **Aprendizaje:** Dos campos de igualdad combinados en un mismo documento (sector + etapa) y uso del indice ix_sector_etapa.

```
{
  "_id": "INI-002",
  "nombre": "Marketplace Cuota Serena",
  "sector": "tecnologia",
  "etapa": "puesta_en_marcha",
  "presupuesto": 32000000
}
{
  "_id": "INI-006",
  "nombre": "Logistica Inteligente",
  "sector": "tecnologia",
  "etapa": "puesta_en_marcha",
  "presupuesto": 27000000
}
{
  "_id": "INI-013",
  "nombre": "Loteria Electronica Local",
  "sector": "tecnologia",
  "etapa": "puesta_en_marcha",
  "presupuesto": 22000000
}
```

### C02 - Iniciativas activas que tienen plataforma web

- **Pregunta:** Cuales iniciativas activas puedo contactar por el canal web?
- **Coleccion:** `s03_iniciativas`
- **Filtro:** `[object Object]`
- **Resultado real:** 10
- **Valor esperado:** 10
- **Estado:** COINCIDE
- **Identificadores devueltos:** INI-001, INI-002, INI-004, INI-005, INI-006, INI-010, INI-011, INI-012, INI-013, INI-015
- **Aprendizaje:** Coincidencia de un valor dentro de un arreglo (plataformas: "web") sin usar $elemMatch: aqui basta porque solo se busca un valor.

```
{
  "_id": "INI-001",
  "nombre": "AgroPack Empaques Reutilizables",
  "sector": "economia_circular",
  "estado": "activa",
  "plataformas": [
    "web",
    "movil"
  ]
}
{
  "_id": "INI-002",
  "nombre": "Marketplace Cuota Serena",
  "sector": "tecnologia",
  "estado": "activa",
  "plataformas": [
    "web"
  ]
}
{
  "_id": "INI-004",
  "nombre": "Turismo Rural Boyaca",
  "sector": "turismo",
  "estado": "activa",
  "plataformas": [
    "web",
    "movil"
  ]
}
{
  "_id": "INI-005",
  "nombre": "Textiles Circulares",
  "sector": "economia_circular",
  "estado": "activa",
  "plataformas": [
    "web"
  ]
}
{
  "_id": "INI-006",
  "nombre": "Logistica Inteligente",
  "sector": "tecnologia",
  "estado": "activa",
  "plataformas": [
    "web"
  ]
}
{
  "_id": "INI-010",
  "nombre": "Termas y Experiencias",
  "sector": "turismo",
  "estado": "activa",
  "plataformas": [
    "web"
  ]
}
{
  "_id": "INI-011",
  "nombre": "Artesanias Digitales",
  "sector": "economia_circular",
  "estado": "activa",
  "plataformas": [
    "web",
    "movil"
  ]
}
{
  "_id": "INI-012",
  "nombre": "Panaderia Regenerativa",
  "sector": "alimentos",
  "estado": "activa",
  "plataformas": [
    "web"
  ]
}
{
  "_id": "INI-013",
  "nombre": "Loteria Electronica Local",
  "sector": "tecnologia",
  "estado": "activa",
  "plataformas": [
    "web",
    "movil"
  ]
}
{
  "_id": "INI-015",
  "nombre": "Pesca Artesanal Pacifico",
  "sector": "economia_circular",
  "estado": "activa",
  "plataformas": [
    "web"
  ]
}
```

### C03 - Iniciativas que pertenecen al emprendedor EMP-001

- **Pregunta:** Que iniciativas tiene el emprendedor EMP-001?
- **Coleccion:** `s03_iniciativas`
- **Filtro:** `[object Object]`
- **Resultado real:** 2
- **Valor esperado:** 2
- **Estado:** COINCIDE
- **Identificadores devueltos:** INI-001, INI-006
- **Aprendizaje:** Referencia entre colecciones resuelta de forma manual (sin $lookup): se lee la iniciativa y luego se busca el emprendedor por su _id.

```
{
  "_id": "INI-001",
  "emprendedor_id": "EMP-001",
  "nombre": "AgroPack Empaques Reutilizables",
  "sector": "economia_circular",
  "etapa": "puesta_en_marcha",
  "estado": "activa"
}
{
  "_id": "INI-006",
  "emprendedor_id": "EMP-001",
  "nombre": "Logistica Inteligente",
  "sector": "tecnologia",
  "etapa": "puesta_en_marcha",
  "estado": "activa"
}
```

### C04 - Asesorias de tipo mentoria

- **Pregunta:** Que asesorias de mentoria se registraron en el trimestre?
- **Coleccion:** `s03_asesorias`
- **Filtro:** `[object Object]`
- **Resultado real:** 6
- **Valor esperado:** 6
- **Estado:** COINCIDE
- **Identificadores devueltos:** ASE-002, ASE-008, ASE-011, ASE-014, ASE-018, ASE-028
- **Aprendizaje:** Filtro por tipo sobre la coleccion de asesorias, con el indice ix_tipo_estado.

```
{
  "_id": "ASE-002",
  "iniciativa_id": "INI-002",
  "sector": "tecnologia",
  "tipo": "mentoria",
  "estado": "realizada",
  "modalidad": "presencial"
}
{
  "_id": "ASE-008",
  "iniciativa_id": "INI-008",
  "sector": "tecnologia",
  "tipo": "mentoria",
  "estado": "realizada",
  "modalidad": "presencial"
}
{
  "_id": "ASE-011",
  "iniciativa_id": "INI-008",
  "sector": "tecnologia",
  "tipo": "mentoria",
  "estado": "programada",
  "modalidad": "presencial"
}
{
  "_id": "ASE-014",
  "iniciativa_id": "INI-004",
  "sector": "turismo",
  "tipo": "mentoria",
  "estado": "programada",
  "modalidad": "presencial"
}
{
  "_id": "ASE-018",
  "iniciativa_id": "INI-013",
  "sector": "tecnologia",
  "tipo": "mentoria",
  "estado": "programada",
  "modalidad": "virtual"
}
{
  "_id": "ASE-028",
  "iniciativa_id": "INI-001",
  "sector": "economia_circular",
  "tipo": "mentoria",
  "estado": "reprogramada",
  "modalidad": "virtual"
}
```

### C05 - Historial de estados de una iniciativa (array embebido)

- **Pregunta:** Como evoluciono la iniciativa INI-001 y en que sector estaba cada etapa?
- **Coleccion:** `s03_iniciativas`
- **Filtro:** `[object Object]`
- **Resultado real:** 4
- **Valor esperado:** 4
- **Estado:** COINCIDE
- **Identificadores devueltos:** 2026-01-20, 2026-04-10, 2026-07-02, 2026-09-30
- **Aprendizaje:** Los arreglos embebidos se leen enteros con una sola lectura; ademas cada entrada guarda el sector de ese momento (historia del documento).

```
{
  "_id": "INI-001",
  "nombre": "AgroPack Empaques Reutilizables",
  "historial_estados": [
    {
      "estado": "activa",
      "etapa": "idea",
      "sector": "alimentos",
      "fecha": {
        "$date": "2026-01-20T13:00:00Z"
      },
      "responsable": "EMP-001",
      "nota": "Identificacion del problema de empaque"
    },
    {
      "estado": "activa",
      "etapa": "validacion",
      "sector": "alimentos",
      "fecha": {
        "$date": "2026-04-10T15:00:00Z"
      },
      "responsable": "EMP-001",
      "nota": "Piloto con doce productores"
    },
    {
      "estado": "activa",
      "etapa": "puesta_en_marcha",
      "sector": "alimentos",
      "fecha": {
        "$date": "2026-07-02T16:00:00Z"
      },
      "responsable": "EMP-001",
      "nota": "Lanzamiento comercial inicial"
    },
    {
      "estado": "activa",
      "etapa": "puesta_en_marcha",
      "sector": "economia_circular",
      "fecha": {
        "$date": "2026-09-30T14:00:00Z"
      },
      "responsable": "EMP-001",
      "nota": "Reclasificacion sectorial por benchmark de la unidad"
    }
  ]
}
```

### C06 - Asesorias de tipo capacitacion

- **Pregunta:** Cuantas asesorias de capacitacion se impartieron y en que modalidades?
- **Coleccion:** `s03_asesorias`
- **Filtro:** `[object Object]`
- **Resultado real:** 11
- **Valor esperado:** 11
- **Estado:** COINCIDE
- **Identificadores devueltos:** ASE-001, ASE-003, ASE-007, ASE-012, ASE-013, ASE-016, ASE-019, ASE-022, ASE-025, ASE-026, ASE-030
- **Aprendizaje:** Segundo tipo de asesoria: sirve para comparar volumenes entre tipos sin escribir una sola linea de agregacion.

```
{
  "_id": "ASE-001",
  "tipo": "capacitacion",
  "estado": "realizada",
  "modalidad": "virtual",
  "duracion_minutos": 120,
  "costo": 480000
}
{
  "_id": "ASE-003",
  "tipo": "capacitacion",
  "estado": "realizada",
  "modalidad": "virtual",
  "duracion_minutos": 180,
  "costo": 750000
}
{
  "_id": "ASE-007",
  "tipo": "capacitacion",
  "estado": "realizada",
  "modalidad": "virtual",
  "duracion_minutos": 120,
  "costo": 400000
}
{
  "_id": "ASE-012",
  "tipo": "capacitacion",
  "estado": "realizada",
  "modalidad": "virtual",
  "duracion_minutos": 180,
  "costo": 750000
}
{
  "_id": "ASE-013",
  "tipo": "capacitacion",
  "estado": "programada",
  "modalidad": "virtual",
  "duracion_minutos": 180,
  "costo": null
}
{
  "_id": "ASE-016",
  "tipo": "capacitacion",
  "estado": "realizada",
  "modalidad": "virtual",
  "duracion_minutos": 150,
  "costo": 520000
}
{
  "_id": "ASE-019",
  "tipo": "capacitacion",
  "estado": "realizada",
  "modalidad": "presencial",
  "duracion_minutos": 120,
  "costo": 400000
}
{
  "_id": "ASE-022",
  "tipo": "capacitacion",
  "estado": "realizada",
  "modalidad": "virtual",
  "duracion_minutos": 180,
  "costo": 750000
}
{
  "_id": "ASE-025",
  "tipo": "capacitacion",
  "estado": "realizada",
  "modalidad": "virtual",
  "duracion_minutos": 120,
  "costo": 400000
}
{
  "_id": "ASE-026",
  "tipo": "capacitacion",
  "estado": "programada",
  "modalidad": "presencial",
  "duracion_minutos": 120,
  "costo": null
}
{
  "_id": "ASE-030",
  "tipo": "capacitacion",
  "estado": "cancelada",
  "modalidad": "virtual",
  "duracion_minutos": 120
}
```

### C07 - Emprendedores agrupados por canal_preferido (valor / null / ausente)

- **Pregunta:** Cuantos emprendedores tienen canal preferido, cuantos lo tienen en null y cuantos no lo tienen?
- **Coleccion:** `s03_emprendedores`
- **Filtro:** `{ campo: { $exists: true, $ne: null } } | { campo: { $type: "null" } } | { campo: { $exists: false } }`
- **Resultado real:** 5/3/2
- **Valor esperado:** 5 / 3 / 2
- **Estado:** COINCIDE
- **Aprendizaje:** Distinguir "sin dato" (campo ausente) de "dato vacio" (null). MongoDB los trata diferente y por eso hay que consultarlos por separado.

### C08 - Iniciativas agrupadas por mentor (valor / null / ausente)

- **Pregunta:** Cuantas iniciativas tienen mentor asignado, cuantas lo tienen en null y cuantas no lo tienen?
- **Coleccion:** `s03_iniciativas`
- **Filtro:** `{ mentor: { $exists: true, $ne: null } } | { mentor: { $type: "null" } } | { mentor: { $exists: false } }`
- **Resultado real:** 6/5/4
- **Valor esperado:** 6 / 5 / 4
- **Estado:** COINCIDE
- **Aprendizaje:** El mismo patron aplicado a un arreglo de documentos: primero se responde la pregunta y despues se decide si el campo es null o no existe.

### C09 - Iniciativas con diagnostico de mercado y puntaje >= 80 ($elemMatch vs notacion de punto)

- **Pregunta:** Cuales iniciativas tienen un diagnostico de mercado con puntaje de al menos 80?
- **Coleccion:** `s03_iniciativas`
- **Filtro:** `diagnosticos: { $elemMatch: { tipo: "mercado", puntaje: { $gte: 80 } } }`
- **Resultado real:** 6 correctas / 12 con la notacion ingenua
- **Valor esperado:** 6 / 12
- **Estado:** COINCIDE
- **Identificadores devueltos:** INI-002, INI-003, INI-006, INI-009, INI-013, INI-015
- **Aprendizaje:** En arreglos de subdocumentos, $elemMatch exige que TODAS las condiciones se cumplan en el MISMO elemento. La notacion con punto puede combinarlas entre elementos distintos.

### C10 - Paginacion de iniciativas por sector y _id (5 por pagina)

- **Pregunta:** Como recorro las iniciativas ordenadas por sector sin traerlas todas de una vez?
- **Coleccion:** `s03_iniciativas`
- **Filtro:** `{ dataset_id: "S03_UE_V1" } + .sort({ sector: 1, _id: 1 }) + .skip(n*5) + .limit(5)`
- **Resultado real:** 3 paginas de 5 (15 documentos)
- **Valor esperado:** 3 paginas (5 + 5 + 5)
- **Estado:** COINCIDE
- **Identificadores devueltos:** INI-007 | INI-012 | INI-001 | INI-003 | INI-005, INI-009 | INI-011 | INI-015 | INI-002 | INI-006, INI-008 | INI-013 | INI-004 | INI-010 | INI-014
- **Aprendizaje:** sort + skip + limit es la paginacion clasica. Ordenar por {sector: 1, _id: 1} garantiza un orden estable entre paginas, porque el _id nunca se repite.

### Q04-E01 - Asesorias pendientes por rango de fechas y modalidad (continuidad con la guia de la Semana 1)

- **Pregunta:** Que asesorias siguen pendientes entre el 1 de octubre y el 30 de noviembre y en que modalidad se haran?
- **Coleccion:** `s03_asesorias`
- **Filtro:** `{ estado: { $in: ["programada", "reprogramada"] }, fecha_programada: { $gte: IS(2026-10-01), $lte: IS(2026-11-30) } }`
- **Resultado real:** 9 pendientes (presencial=3, telefonica=1, virtual=5)
- **Valor esperado:** 9 pendientes (virtual=5, presencial=3, telefonica=1)
- **Estado:** COINCIDE
- **Identificadores devueltos:** ASE-011, ASE-023, ASE-013, ASE-014, ASE-018, ASE-026, ASE-021, ASE-028, ASE-029
- **Aprendizaje:** Misma necesidad que la consulta Q04 de la Semana 1 (asesorias programadas pendientes por rango de fechas y modalidad), resuelta aqui sobre el dataset de la Semana 3.

### RETO - Asesorias realizadas en septiembre 2026 y sector historico vs sector actual

- **Pregunta:** Cuantas asesorias se realizaron en septiembre de 2026 y en cuantas el sector guardado en la asesoria difiere del sector actual de la iniciativa?
- **Coleccion:** `s03_asesorias + s03_iniciativas`
- **Filtro:** `{ estado: "realizada", fecha_realizacion: { $gte: IS(2026-09-01), $lte: IS(2026-09-30) } }`
- **Resultado real:** 14 asesorias / 1 diferencia(s) de sector
- **Valor esperado:** 14 asesorias / 1 diferencia (ASE-001: alimentos vs economia_circular)
- **Estado:** COINCIDE
- **Identificadores devueltos:** ASE-012, ASE-008, ASE-022, ASE-001, ASE-015, ASE-010, ASE-024, ASE-002, ASE-016, ASE-025, ASE-017, ASE-006, ASE-019, ASE-020
- **Aprendizaje:** La asesoria guarda el sector como foto del momento en que ocurrio. Si hoy se lee el sector de la iniciativa se obtiene el valor actual y se pierde la historia: por eso el snapshot vive en el documento de la asesoria.

## Reto de transferencia

1. **asesorias realizadas en septiembre de 2026:** 14
2. **asesorias cuyo sector historico difiere del sector actual de la iniciativa:** 1

| Asesoria | Iniciativa | Sector historico (guardado en la asesoria) | Sector actual (de la iniciativa) |
| --- | --- | --- | --- |
| ASE-001 | INI-001 | alimentos | economia_circular |

El cruce se resolvio con dos consultas de lectura y un recorrido en JavaScript:
sin `$group`, sin `$lookup` y sin `$unwind`, que son las agregaciones reservadas para la semana siguiente.

## Comprobacion de solo lectura

| Coleccion | Documentos antes | Documentos despues |
| --- | ---: | ---: |
| `s03_emprendedores` | 10 | 10 |
| `s03_iniciativas` | 15 | 15 |
| `s03_asesorias` | 30 | 30 |
