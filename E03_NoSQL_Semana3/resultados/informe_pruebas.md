# Informe de pruebas E03 - Bases de Datos NoSQL (Semana 3)

> Archivo generado automaticamente por `scripts/04_verificar_base.js` sobre la base real del laboratorio.
> Cada control se marca como **OK**, **AVISO** o **ERROR**; los AVISOS no impiden la entrega, los ERRORES si.

| Dato | Valor |
| --- | --- |
| Servidor MongoDB | 7.0.43 |
| Base de datos | `emprendimiento_sena_lab` |
| Dataset | `S03_UE_V1` (esquema `1.1`) |
| Colecciones | `s03_emprendedores`, `s03_iniciativas`, `s03_asesorias` |
| Fecha de ejecucion | 2026-10-21T16:16:59.474Z |
| Controles ejecutados | 41 |
| OK | 41 |
| AVISO | 0 |
| ERROR | 0 |

## Resultado de cada control

| Control | Estado | Descripcion | Detalle |
| --- | --- | --- | --- |
| V-01.emprendedores | OK | Coleccion s03_emprendedores con 10 documentos del dataset S03_UE_V1 | total=10, con dataset_id=10 |
| V-02.emprendedores | OK | No hay documentos ajenos al dataset en s03_emprendedores | 0 registros |
| V-01.iniciativas | OK | Coleccion s03_iniciativas con 15 documentos del dataset S03_UE_V1 | total=15, con dataset_id=15 |
| V-02.iniciativas | OK | No hay documentos ajenos al dataset en s03_iniciativas | 0 registros |
| V-01.asesorias | OK | Coleccion s03_asesorias con 30 documentos del dataset S03_UE_V1 | total=30, con dataset_id=30 |
| V-02.asesorias | OK | No hay documentos ajenos al dataset en s03_asesorias | 0 registros |
| V-03 | OK | Todas las iniciativas declaran esquema_version 1.1 | 1.1 |
| V-04 | OK | No quedan documentos temporales de la demostracion CRUD | dataset S03_UE_V1_TMP: 0 en las tres colecciones |
| V-05 | OK | Toda iniciativa referencia a un emprendedor existente | 15 iniciativas verificadas |
| V-06 | OK | Toda asesoria referencia a una iniciativa y a un emprendedor existentes | 30 asesorias verificadas |
| V-07 | OK | El sector guardado en cada asesoria coincide con el sector de la iniciativa en la fecha del evento | 30 asesorias contrastadas con historial_estados |
| V-08.emprendedores | OK | Todos los documentos de emprendedores tienen los campos obligatorios | 15 campos verificados |
| V-08.iniciativas | OK | Todos los documentos de iniciativas tienen los campos obligatorios | 14 campos verificados |
| V-08.asesorias | OK | Todos los documentos de asesorias tienen los campos obligatorios | 12 campos verificados |
| V-09 | OK | Todos los valores controlados (sector, etapa, estado, modalidad, tipo, nivel de madurez) pertenecen a sus listas | 10 listas controladas, 55 documentos revisados |
| V-10 | OK | fecha_realizacion cumple la regla: Date en "realizada", null en "programada"/"reprogramada" y ausente en "cancelada" | 30 asesorias revisadas |
| V-11 | OK | La distribucion por estado de las asesorias es la esperada (19 realizada, 8 programada, 2 cancelada, 1 reprogramada) | cancelada=2, programada=8, realizada=19, reprogramada=1 |
| V-12 | OK | El campo activo es coherente con el estado en todas las iniciativas | 15 iniciativas: activa=true, archivada=false |
| V-13.canal_preferido (emprendedores) | OK | Cubo de "canal_preferido (emprendedores)" (valor / null / ausente) | 5 / 3 / 2 |
| V-13.mentor (iniciativas) | OK | Cubo de "mentor (iniciativas)" (valor / null / ausente) | 6 / 5 / 4 |
| V-13.canal_contacto (asesorias) | OK | Cubo de "canal_contacto (asesorias)" (valor / null / ausente) | 22 / 5 / 3 |
| V-14 | OK | Las asesorias realizadas en septiembre de 2026 son 14 | ASE-012, ASE-008, ASE-022, ASE-001, ASE-015, ASE-010, ASE-024, ASE-002, ASE-016, ASE-025, ASE-017, ASE-006, ASE-019, ASE-020 |
| V-15 | OK | Solo ASE-001 tiene sector historico distinto del sector actual de su iniciativa (alimentos vs economia_circular) | ASE-001 (alimentos vs economia_circular) |
| V-20 | OK | No hay dos asesorias del mismo asesor en la misma franja (dia UTC de programacion o realizacion) | 9 asesores, 0 choques |
| V-21 | OK | Cada asesoria registra el codigo ficticio del asesor (ADV-xx) y cada codigo corresponde a un solo asesor | 9 codigos: ADV-01, ADV-02, ADV-03, ADV-04, ADV-05, ADV-06, ADV-07, ADV-08, ADV-09 |
| V-16.s03_emprendedores | OK | Indices de consulta presentes en s03_emprendedores | _id_, ix_sector, ix_departamento, ix_dataset_id |
| V-16.s03_iniciativas | OK | Indices de consulta presentes en s03_iniciativas | _id_, ix_sector_etapa, ix_emprendedor_id, ix_estado, ix_dataset_id |
| V-16.s03_asesorias | OK | Indices de consulta presentes en s03_asesorias | _id_, ix_tipo_estado, ix_iniciativa_id, ix_fecha_realizacion, ix_dataset_id |
| V-17.emprendedores.ejson | OK | Los 10 identificadores del archivo coinciden con los de s03_emprendedores | EJSON valido y Dates preservados |
| V-17.iniciativas.ejson | OK | Los 15 identificadores del archivo coinciden con los de s03_iniciativas | EJSON valido y Dates preservados |
| V-17.asesorias.ejson | OK | Los 30 identificadores del archivo coinciden con los de s03_asesorias | EJSON valido y Dates preservados |
| V-18 | OK | Ningun archivo del entregable contiene la contrasena de practica | carpeta .lab excluida por estar en .gitignore |
| V-19 | OK | Entregable presente y con contenido: resultados/resultados_crud.md | 17928 bytes |
| V-19 | OK | Entregable presente y con contenido: resultados/resultados_consultas.md | 16328 bytes |
| V-19 | OK | Entregable presente y con contenido: docs/diccionario_datos_v1.1.md | 18275 bytes |
| V-19 | OK | Entregable presente y con contenido: docs/matriz_consultas_C01_C10.md | 21846 bytes |
| V-19 | OK | Entregable presente y con contenido: docs/registro_operaciones_crud.md | 11263 bytes |
| V-19 | OK | Entregable presente y con contenido: docs/bitacora_errores.md | 16124 bytes |
| V-19 | OK | Entregable presente y con contenido: docs/revision_cruzada.md | 18475 bytes |
| V-19 | OK | Entregable presente y con contenido: docs/actividades_A1_A6.md | 16596 bytes |
| V-19 | OK | Entregable presente y con contenido: docs/sustentacion.md | 18650 bytes |

## Como se ejecuto la suite

```
powershell -ExecutionPolicy Bypass -File scripts\00_preparar_lab_mongodb.ps1
mongosh "mongodb://127.0.0.1:27018/emprendimiento_sena_lab" --username aprendiz_nosql --password <PASSWORD> --authenticationDatabase emprendimiento_sena_lab scripts/01_cargar_semilla.js
mongosh "mongodb://127.0.0.1:27018/emprendimiento_sena_lab" --username aprendiz_nosql --password <PASSWORD> --authenticationDatabase emprendimiento_sena_lab scripts/02_demo_crud.js
mongosh "mongodb://127.0.0.1:27018/emprendimiento_sena_lab" --username aprendiz_nosql --password <PASSWORD> --authenticationDatabase emprendimiento_sena_lab scripts/03_consultas_aprendiz.js
mongosh "mongodb://127.0.0.1:27018/emprendimiento_sena_lab" --username aprendiz_nosql --password <PASSWORD> --authenticationDatabase entrepreneurship_sena_lab scripts/04_verificar_base.js
```

## Resultado global

**La base cumple los 41 controles ejecutados sin observaciones pendientes.**

| Que falta por hacer a mano | Por que no lo hace el script |
| --- | --- |
| Recorrer en Compass las colecciones `s03_*` y comparar con los resultados | Requiere la interfaz grafica del instructor |
| Redactar la conclusion de cada actividad A1 - A6 | Es una entrega del aprendiz, no una comprobacion automatica |
| Sustentar el reto de transferencia en la reunion | Requiere la defensa oral del aprendiz |
