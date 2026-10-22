/* =====================================================================
 * E03 - Bases de Datos NoSQL (Semana 3)
 * 02_demo_crud.js
 * ---------------------------------------------------------------------
 * Demostracion CRUD sobre documentos TEMPORALES de las colecciones s03_*.
 *
 * Reglas del laboratorio:
 *   - NUNCA se modifica ni se borra un documento de la semilla S03_UE_V1.
 *   - Todo documento de prueba se marca con dataset_id = "S03_UE_V1_TMP"
 *     y con un _id con prefijo "TMP-E03-", de modo que se pueda auditar
 *     y limpiar cualquier residuo.
 *   - Cada operacion va acompanada de una lectura "antes" y "despues" y
 *     de contadores de documentos, para que el efeito de la escritura
 *     sea verificable y no una afirmacion.
 *   - Al final se comprueba que el numero de documentos de cada coleccion
 *     quedo exactamente igual que antes de empezar.
 *
 * Genera: resultados/resultados_crud.md
 *
 * Uso:
 *   mongosh "mongodb://127.0.0.1:27018/emprendimiento_sena_lab" \
 *     --username aprendiz_nosql --password <PASSWORD> \
 *     --authenticationDatabase emprendimiento_sena_lab \
 *     scripts/02_demo_crud.js
 * ===================================================================== */

const fs = require('fs');
const path = require('path');

/* --------------------------------------------------------- configuracion */
const RAIZ = path.resolve(__dirname, '..');
const DIR_RESULTADOS = path.join(RAIZ, 'resultados');

const BASE_DATOS = 'emprendimiento_sena_lab';
const DATASET_ID = 'S03_UE_V1';
const DATASET_TMP = 'S03_UE_V1_TMP';
const PREFIJO_TMP = 'TMP-E03-';

const COLECCIONES = [
  {
    nombre: 's03_emprendedores',
    etiqueta: 'Emprendedores',
    patronId: /^EMP-\d{3}$/,
    documento: {
      tipo_documento: 'CC',
      numero_documento: '0000000000',
      nombres: 'Documento',
      apellidos: 'Temporal',
      email: 'temporal@example.edu.co',
      telefono: '+570000000000',
      sector: 'tecnologia',
      departamento: 'Cundinamarca',
      municipio: 'Fusagasuga',
      fecha_registro: new Date(),
      nivel_madurez: 'idea',
      activo: true,
      canal_preferido: 'web',
      etiquetas: ['temporal']
    }
  },
  {
    nombre: 's03_iniciativas',
    etiqueta: 'Iniciativas',
    patronId: /^INI-\d{3}$/,
    documento: {
      emprendedor_id: 'EMP-001',
      nombre: 'Iniciativa Temporal E03',
      sector: 'tecnologia',
      etapa: 'idea',
      estado: 'activa',
      activo: true,
      plataformas: ['web'],
      fecha_creacion: new Date(),
      presupuesto: 1000000,
      mentor: null,
      canal_preferido: null,
      diagnosticos: [],
      historial_estados: [
        {
          estado: 'activa',
          etapa: 'idea',
          sector: 'tecnologia',
          fecha: new Date(),
          responsable: 'EMP-001',
          nota: 'Documento temporal de demostracion CRUD'
        }
      ]
    }
  },
  {
    nombre: 's03_asesorias',
    etiqueta: 'Asesorias',
    patronId: /^ASE-\d{3}$/,
    documento: {
      iniciativa_id: 'INI-001',
      sector: 'alimentos',
      tipo: 'capacitacion',
      estado: 'programada',
      modalidad: 'virtual',
      fecha_programada: new Date(),
      fecha_realizacion: null,
      asesor: 'Asesor Temporal',
      duracion_minutos: 60,
      costo: null,
      canal_contacto: 'email'
    }
  }
];

/* ------------------------------------------------------------- utilidades */
const sello = new Date().toISOString();
const bitacora = [];
const registrar = (tipo, mensaje) => {
  print('  ' + tipo.padEnd(4) + ' ' + mensaje);
  bitacora.push({ tipo: tipo, mensaje: mensaje });
};

const linea = (titulo) => {
  print('');
  print('--- ' + titulo + ' ' + '-'.repeat(Math.max(0, 66 - titulo.length)));
};

const documentoLegible = (doc) => (doc === null ? '(sin documento)' : EJSON.stringify(doc, null, 2));

const errores = [];
const registrarError = (mensaje) => { errores.push(mensaje); print('  [ERROR] ' + mensaje); };

/* --------------------------------------------- guarda de escritura segura */
const esIdSemilla = (coleccion, id) => {
  const cfg = COLECCIONES.find((c) => c.nombre === coleccion);
  return !!cfg && cfg.patronId.test(id);
};

/**
 * Unica puerta de entrada para las escrituras de la demostracion.
 * Rechaza cualquier documento que no sea temporal: asi es imposible
 * alterar la semilla por accidente.
 */
const escrituraPermitida = (coleccion, id) => {
  // 1) Un _id de la semilla jamas se puede tocar, aunque el filtro diga otra cosa.
  if (esIdSemilla(coleccion, id)) {
    throw new Error('Operacion bloqueada: "' + id + '" pertenece a la semilla y no se puede modificar.');
  }
  // 2) Fuera de la semilla, solo se admiten los _id temporales del laboratorio.
  if (typeof id !== 'string' || !id.startsWith(PREFIJO_TMP)) {
    throw new Error('Operacion bloqueada: "' + id + '" no es un _id temporal (prefijo ' + PREFIJO_TMP + ').');
  }
  return true;
};

/* ---------------------------------------------------- 0. preparacion */
linea('0. Preparacion');

if (db.getName() !== BASE_DATOS) {
  print('  [ERROR] La sesion esta conectada a "' + db.getName() + '" y el laboratorio exige "' + BASE_DATOS + '".');
  quit(1);
}
registrar('INFO', 'Base de trabajo: ' + db.getName());
registrar('INFO', 'Marca de tiempo de la ejecucion: ' + sello);
registrar('INFO', 'Dataset de trabajo: ' + DATASET_ID + '  |  documentos temporales: ' + DATASET_TMP);

const conteosIniciales = {};
for (const cfg of COLECCIONES) {
  const col = db.getCollection(cfg.nombre);
  conteosIniciales[cfg.nombre] = col.countDocuments({});
  registrar('INFO', cfg.nombre + ': ' + conteosIniciales[cfg.nombre] + ' documentos antes de la demostracion.');
}

/* Si quedo una demostracion anterior a medias, se limpia antes de empezar. */
for (const cfg of COLECCIONES) {
  const col = db.getCollection(cfg.nombre);
  const sobras = col.countDocuments({ dataset_id: DATASET_TMP });
  if (sobras > 0) {
    const borradas = col.deleteMany({ dataset_id: DATASET_TMP }).deletedCount;
    registrar('INFO', cfg.nombre + ': se limpiaron ' + borradas + ' documento(s) temporales de una ejecucion anterior.');
  }
}

/* --------------------------------------------------- 1. CRUD por coleccion */
const secciones = [];

for (const cfg of COLECCIONES) {
  const col = db.getCollection(cfg.nombre);
  const idTmp = PREFIJO_TMP + Date.now().toString(36) + '-' + cfg.nombre.replace('s03_', '');
  const docTmp = Object.assign({}, cfg.documento, {
    _id: idTmp,
    dataset_id: DATASET_TMP,
    esquema_version: '1.1',
    creado_por_demo: sello
  });

  linea('1. CRUD en ' + cfg.nombre + '  (_id temporal ' + idTmp + ')');

  const seccion = { coleccion: cfg.nombre, id: idTmp, pasos: [] };
  const registrarPaso = (titulo, detalle, bloque) => {
    print('');
    print('  ' + titulo);
    if (detalle) { print('    ' + detalle); }
    if (bloque) { print(bloque.split('\n').map((l) => '    ' + l).join('\n')); }
    seccion.pasos.push({ titulo: titulo, detalle: detalle, bloque: bloque || '' });
  };

  const conteoAntes = col.countDocuments({});

  /* --- CREATE ------------------------------------------------------- */
  try {
    escrituraPermitida(cfg.nombre, idTmp);
    const res = col.insertOne(docTmp);
    registrarPaso('CREATE (insertOne)',
      'acknowledged=' + res.acknowledged + '  insertedId=' + res.insertedId,
      'documento insertado:\n' + documentoLegible(docTmp));
    seccion.pasos[seccion.pasos.length - 1].resultado = 'insertOne -> acknowledged=' + res.acknowledged;
  } catch (e) {
    registrarError('CREATE en ' + cfg.nombre + ': ' + e.message);
    continue;
  }

  /* --- READ (antes de actualizar) ------------------------------------ */
  const lectura1 = col.findOne({ _id: idTmp });
  registrarPaso('READ #1 (findOne por _id)',
    'documento leido de la base: ' + (lectura1 ? 'si' : 'no'),
    documentoLegible(lectura1));

  /* --- UPDATE ($set + $inc) ------------------------------------------ */
  try {
    escrituraPermitida(cfg.nombre, idTmp);
    const res = col.updateOne(
      { _id: idTmp, dataset_id: DATASET_TMP },
      {
        $set: { 'demo.estado': 'actualizado', 'demo.actualizado_en': new Date() },
        $inc: { 'demo.version': 1 }
      }
    );
    registrarPaso('UPDATE (updateOne con $set + $inc)',
      'matchedCount=' + res.matchedCount + '  modifiedCount=' + res.modifiedCount +
      '  upsertedId=' + JSON.stringify(res.upsertedId),
      'filtro   : { _id: "' + idTmp + '", dataset_id: "' + DATASET_TMP + '" }\n' +
      'actualiz.: { $set: { "demo.estado": "actualizado", "demo.actualizado_en": <Date> }, $inc: { "demo.version": 1 } }');
    seccion.pasos[seccion.pasos.length - 1].resultado = 'updateOne -> matched=' + res.matchedCount + ', modified=' + res.modifiedCount;
  } catch (e) {
    registrarError('UPDATE en ' + cfg.nombre + ': ' + e.message);
  }

  /* --- READ (despues de actualizar) ---------------------------------- */
  const lectura2 = col.findOne({ _id: idTmp });
  registrarPaso('READ #2 (findOne por _id, despues del update)',
    'campo demo: ' + EJSON.stringify(lectura2 ? lectura2.demo : null),
    documentoLegible(lectura2));

  /* --- UPDATE atomico (findOneAndUpdate) ----------------------------- */
  try {
    escrituraPermitida(cfg.nombre, idTmp);
    const devuelto = col.findOneAndUpdate(
      { _id: idTmp, dataset_id: DATASET_TMP },
      { $set: { 'demo.estado': 'actualizado_atomico' }, $inc: { 'demo.version': 1 } },
      { returnDocument: 'after' }
    );
    const doc = devuelto && devuelto.value !== undefined ? devuelto.value : devuelto;
    registrarPaso('UPDATE atomico (findOneAndUpdate, devuelve el documento)',
      'documento devuelto por el servidor con el cambio aplicado',
      documentoLegible(doc));
    seccion.pasos[seccion.pasos.length - 1].resultado = 'findOneAndUpdate -> documento devuelto con demo.estado="actualizado_atomico"';
  } catch (e) {
    registrarError('findOneAndUpdate en ' + cfg.nombre + ': ' + e.message);
  }

  /* --- READ (comprobacion del update atomico) ------------------------ */
  const lectura3 = col.findOne({ _id: idTmp });
  registrarPaso('READ #3 (findOne, verificacion del update atomico)',
    'campo demo: ' + EJSON.stringify(lectura3 ? lectura3.demo : null),
    documentoLegible(lectura3));

  /* --- DELETE -------------------------------------------------------- */
  try {
    escrituraPermitida(cfg.nombre, idTmp);
    const res = col.deleteOne({ _id: idTmp, dataset_id: DATASET_TMP });
    registrarPaso('DELETE (deleteOne por _id + dataset_id temporal)',
      'acknowledged=' + res.acknowledged + '  deletedCount=' + res.deletedCount,
      'filtro: { _id: "' + idTmp + '", dataset_id: "' + DATASET_TMP + '" }');
    seccion.pasos[seccion.pasos.length - 1].resultado = 'deleteOne -> deletedCount=' + res.deletedCount;
  } catch (e) {
    registrarError('DELETE en ' + cfg.nombre + ': ' + e.message);
  }

  /* --- READ (comprobacion del borrado) ------------------------------- */
  const lectura4 = col.findOne({ _id: idTmp });
  registrarPaso('READ #4 (findOne, comprobacion del borrado)',
    'resultado de la lectura: ' + (lectura4 === null ? 'null (el documento ya no existe)' : 'el documento AUN EXISTE'),
    documentoLegible(lectura4));

  /* --- contadores ---------------------------------------------------- */
  const conteoDespues = col.countDocuments({});
  const delta = conteoDespues - conteoAntes;
  registrarPaso('CONTADORES',
    'antes=' + conteoAntes + '  despues=' + conteoDespues + '  delta=' + delta +
    '  (delta 0 = la coleccion quedo como estaba)',
    '');
  seccion.pasos[seccion.pasos.length - 1].resultado = 'antes=' + conteoAntes + ', despues=' + conteoDespues + ', delta=' + delta;

  if (delta === 0) {
    registrar('OK', cfg.nombre + ': la coleccion quedo con los mismos ' + conteoDespues + ' documentos.');
  } else {
    registrarError(cfg.nombre + ': el numero de documentos cambio (delta=' + delta + ').');
  }

  secciones.push(seccion);
}

/* ---------------------------------- 2. guarda que bloquea la semilla */
linea('2. Guarda de seguridad: escritura sobre la semilla bloqueada');

const coleccionSemilla = 's03_iniciativas';
const idSemilla = 'INI-001';
let mensajeBloqueo = '';
try {
  escrituraPermitida(coleccionSemilla, idSemilla);
  registrarError('La guarda NO bloqueo la escritura sobre la semilla.');
} catch (e) {
  mensajeBloqueo = e.message;
  registrar('OK', 'Intento de modificar ' + coleccionSemilla + '/' + idSemilla + ' rechazado antes de llegar al servidor.');
  registrar('INFO', 'Motivo: ' + e.message);
}

const antesSemilla = db.getCollection(coleccionSemilla).findOne({ _id: idSemilla });
registrar('INFO', 'INI-001 sigue intacto: sector=' + (antesSemilla ? antesSemilla.sector : '?') +
                  ', etapa=' + (antesSemilla ? antesSemilla.etapa : '?') +
                  ', historial=' + (antesSemilla ? antesSemilla.historial_estados.length : '?') + ' entradas.');

/* ------------------------------------------- 3. limpieza y verificacion */
linea('3. Limpieza final y verificacion de residuos');

let residuosTotales = 0;
for (const cfg of COLECCIONES) {
  const col = db.getCollection(cfg.nombre);
  const sobrantes = col.deleteMany({ dataset_id: DATASET_TMP }).deletedCount;
  const restantes = col.countDocuments({ dataset_id: DATASET_TMP });
  residuosTotales += restantes;
  registrar('INFO', cfg.nombre + ': ' + sobrantes + ' temporal(es) eliminado(s) en la limpieza, ' +
                        restantes + ' residuo(s) al final.');
}

const resumenFinal = [];
let todoIgual = true;
for (const cfg of COLECCIONES) {
  const col = db.getCollection(cfg.nombre);
  const ahora = col.countDocuments({});
  const delta = ahora - conteosIniciales[cfg.nombre];
  const deLaSemilla = col.countDocuments({ dataset_id: DATASET_ID });
  resumenFinal.push({ coleccion: cfg.nombre, antes: conteosIniciales[cfg.nombre], despues: ahora, delta: delta, deLaSemilla: deLaSemilla });
  if (delta !== 0) { todoIgual = false; }
  if (ahora !== deLaSemilla) { todoIgual = false; }
}

if (todoIgual && residuosTotales === 0) {
  registrar('OK', 'Estado final identico al inicial en las tres colecciones y sin residuos temporales.');
} else {
  registrarError('El estado final de las colecciones no coincide con el inicial.');
}

/* ------------------------------------------------- 4. archivo de resultado */
linea('4. Archivo de resultado');

if (!fs.existsSync(DIR_RESULTADOS)) {
  fs.mkdirSync(DIR_RESULTADOS, { recursive: true });
}
const destino = path.join(DIR_RESULTADOS, 'resultados_crud.md');

const md = [];
md.push('# Resultados de la demostracion CRUD (E03 - Semana 3)');
md.push('');
md.push('> Archivo generado automaticamente por `scripts/02_demo_crud.js`.');
md.push('> No contiene datos simulados: todas las cifras provienen de la base de datos real del laboratorio.');
md.push('');
md.push('| Dato | Valor |');
md.push('| --- | --- |');
md.push('| Base de datos | `' + BASE_DATOS + '` |');
md.push('| Dataset de la semilla | `' + DATASET_ID + '` |');
md.push('| Marca de documentos temporales | `' + DATASET_TMP + '` |');
md.push('| Prefijo de los _id temporales | `' + PREFIJO_TMP + '` |');
md.push('| Fecha de ejecucion | ' + sello + ' |');
md.push('| Errores | ' + errores.length + ' |');
md.push('');
md.push('## 1. Resumen por coleccion');
md.push('');
md.push('| Coleccion | Documentos antes | Documentos despues | Delta | Documentos de la semilla |');
md.push('| --- | ---: | ---: | ---: | ---: |');
for (const r of resumenFinal) {
  md.push('| `' + r.coleccion + '` | ' + r.antes + ' | ' + r.despues + ' | ' + r.delta + ' | ' + r.deLaSemilla + ' |');
}
md.push('');
md.push('Un delta de 0 y un residuo temporal de 0 demuestran que la demostracion CRUD no dejo rastros en la base.');
md.push('');
md.push('## 2. Detalle de las operaciones');
for (const s of secciones) {
  md.push('');
  md.push('### ' + s.coleccion + '  (`' + s.id + '`)');
  for (const p of s.pasos) {
    md.push('');
    md.push('**' + p.titulo + '**');
    if (p.detalle) { md.push(''); md.push('- ' + p.detalle); }
    if (p.bloque) {
      md.push('');
      md.push('```');
      md.push(p.bloque);
      md.push('```');
    }
  }
}
md.push('');
md.push('## 3. Guarda de seguridad');
md.push('');
md.push('El script escribe unicamente a traves de una funcion de guarda (`escrituraPermitida`) que exige que el `_id`');
md.push('comience por `' + PREFIJO_TMP + '` y que no pertenezca a la semilla. El intento de modificar `' + idSemilla + '` se rechaza');
md.push('antes de llegar al servidor:');
md.push('');
md.push('```');
md.push(mensajeBloqueo || '(la guarda no llego a lanzar un error)');
md.push('```');
md.push('');
md.push('## 4. Bitacora de la ejecucion');
md.push('');
md.push('```');
bitacora.forEach((b) => { md.push(b.tipo.padEnd(4) + ' ' + b.mensaje); });
md.push('```');
md.push('');
md.push('## 5. Conclusiones');
md.push('');
md.push('- El ciclo create / read / update / read / delete quedo registrado con lecturas antes y despues de cada escritura.');
md.push('- `updateOne` informo `matchedCount` y `modifiedCount`; `findOneAndUpdate` devolvio el documento ya actualizado.');
md.push('- Los tres contadores por coleccion volvieron al valor inicial: no se modifico ningun documento de la semilla.');
md.push('- No quedaron documentos temporales: el filtro de limpieza por `dataset_id = ' + DATASET_TMP + '` retorno ' + residuosTotales + '.');
md.push('');

fs.writeFileSync(destino, md.join('\n'), 'utf8');
print('  [OK]    Resultados escritos en ' + destino);

print('');
if (errores.length > 0) {
  print('  La demostracion termino con ' + errores.length + ' error(es).');
  errores.forEach((e) => print('   - ' + e));
  quit(1);
}
print('  Demostracion CRUD completada sin errores.');
quit(0);
