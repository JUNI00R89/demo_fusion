/* =====================================================================
 * E03 - Bases de Datos NoSQL (Semana 3)
 * 01_cargar_semilla.js
 * ---------------------------------------------------------------------
 * Carga la semilla EJSON (data/*.ejson) en las colecciones s03_* de la
 * base `emprendimiento_sena_lab`, de forma segura, idempotente y
 * verificable.
 *
 *   - Lee los tres archivos .ejson con EJSON.parse (conserva el tipo BSON
 *     Date: las fechas NO llegan como cadenas).
 *   - Valida el contenido antes de escribir: formato de _id, dataset_id,
 *     esquema_version, conteos esperados e integridad referencial.
 *   - Solo toca colecciones con prefijo `s03_` y solo documentos cuyo
 *     dataset_id sea S03_UE_V1. Cualquier registro ajeno se reporta y se
 *     deja intacto.
 *   - Vuelve a cargar el mismo resultado aunque se ejecute varias veces
 *     (idempotencia) y crea los indices de consulta del laboratorio.
 *
 * Uso:
 *   mongosh "mongodb://127.0.0.1:27018/emprendimiento_sena_lab" \
 *     --username aprendiz_nosql --password <PASSWORD> \
 *     --authenticationDatabase emprendimiento_sena_lab \
 *     scripts/01_cargar_semilla.js
 *
 *   Modo simulacion (valida pero NO escribe):  E03_DRY_RUN=1
 * ===================================================================== */

const fs = require('fs');
const path = require('path');

/* --------------------------------------------------------- configuracion */
const RAIZ = path.resolve(__dirname, '..');
const DIR_DATOS = path.join(RAIZ, 'data');
const DIR_RESULTADOS = path.join(RAIZ, 'resultados');

const BASE_DATOS = 'emprendimiento_sena_lab';
const DATASET_ID = 'S03_UE_V1';
const ESQUEMA_VERSION = '1.1';
const PREFIJO_PERMITIDO = 's03_';
const MODO_SIMULACION = process.env.E03_DRY_RUN === '1';

const COLECCIONES = [
  {
    nombre: 's03_emprendedores',
    archivo: 'emprendedores.ejson',
    etiqueta: 'Emprendedores',
    patronId: /^EMP-\d{3}$/,
    conteoEsperado: 10
  },
  {
    nombre: 's03_iniciativas',
    archivo: 'iniciativas.ejson',
    etiqueta: 'Iniciativas',
    patronId: /^INI-\d{3}$/,
    conteoEsperado: 15
  },
  {
    nombre: 's03_asesorias',
    archivo: 'asesorias.ejson',
    etiqueta: 'Asesorias',
    patronId: /^ASE-\d{3}$/,
    conteoEsperado: 30
  }
];

/* ------------------------------------------------------------- utilidades */
const linea = (titulo) => {
  print('');
  print('--- ' + titulo + ' ' + '-'.repeat(Math.max(0, 66 - titulo.length)));
};

const errores = [];
const advertencias = [];
const ok = [];

const registrarError = (mensaje) => { errores.push(mensaje); print('  [ERROR]  ' + mensaje); };
const registrarAviso = (mensaje) => { advertencias.push(mensaje); print('  [AVISO]  ' + mensaje); };
const registrarOk = (mensaje) => { ok.push(mensaje); print('  [OK]     ' + mensaje); };

const resumen = (lista) => (lista.length === 0 ? '(sin elementos)' : lista.join(', '));

/* ------------------------------------------------- 0. control de seguridad */
linea('0. Control de seguridad del entorno');

if (db.getName() !== BASE_DATOS) {
  print('  [ERROR]  La sesion esta conectada a "' + db.getName() + '" y el laboratorio exige "' + BASE_DATOS + '".');
  print('            Conectese con: mongodb://127.0.0.1:27018/' + BASE_DATOS);
  quit(1);
}
registrarOk('Base de trabajo: ' + db.getName());

const nombresIndiceados = db.getCollectionNames();
const coleccionesPermitidas = nombresIndiceados.filter((n) => n.startsWith(PREFIJO_PERMITIDO));
registrarOk('Colecciones presentes con prefijo ' + PREFIJO_PERMITIDO + ': ' + (coleccionesPermitidas.length ? resumen(coleccionesPermitidas) : '(ninguna todavia)'));

if (MODO_SIMULACION) {
  registrarAviso('Modo simulacion activo (E03_DRY_RUN=1): se validara pero no se escribira nada.');
}

/* --------------------------------------- 1. lectura y validacion del seed */
linea('1. Lectura y validacion de los archivos .ejson');

const semillas = {};
const idsPorColeccion = {};

for (const cfg of COLECCIONES) {
  const archivo = path.join(DIR_DATOS, cfg.archivo);
  if (!fs.existsSync(archivo)) {
    registrarError('No existe el archivo de semilla: ' + archivo);
    continue;
  }
  let documentos;
  try {
    documentos = EJSON.parse(fs.readFileSync(archivo, 'utf8'));
  } catch (e) {
    registrarError('El archivo ' + cfg.archivo + ' no es EJSON valido: ' + e.message);
    continue;
  }
  if (!Array.isArray(documentos)) {
    registrarError(cfg.archivo + ' debe contener un arreglo de documentos.');
    continue;
  }
  if (documentos.length !== cfg.conteoEsperado) {
    registrarError(cfg.archivo + ' contiene ' + documentos.length + ' documentos y se esperaban ' + cfg.conteoEsperado + '.');
    continue;
  }

  const vistos = new Set();
  let problemas = 0;
  for (const doc of documentos) {
    if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
      registrarError(cfg.archivo + ' contiene un elemento que no es un documento.');
      problemas++;
      continue;
    }
    if (typeof doc._id !== 'string' || !cfg.patronId.test(doc._id)) {
      registrarError(cfg.archivo + ' tiene un _id invalido: ' + JSON.stringify(doc._id) + ' (patron esperado ' + cfg.patronId + ').');
      problemas++;
      continue;
    }
    if (vistos.has(doc._id)) {
      registrarError(cfg.archivo + ' repite el _id ' + doc._id + '.');
      problemas++;
      continue;
    }
    vistos.add(doc._id);
    if (doc.dataset_id !== DATASET_ID) {
      registrarError(cfg.archivo + ' / ' + doc._id + ' tiene dataset_id "' + doc.dataset_id + '" y se esperaba "' + DATASET_ID + '".');
      problemas++;
    }
    if (doc.esquema_version !== ESQUEMA_VERSION) {
      registrarError(cfg.archivo + ' / ' + doc._id + ' tiene esquema_version "' + doc.esquema_version + '" y se esperaba "' + ESQUEMA_VERSION + '".');
      problemas++;
    }
    for (const campoProhibido of ['password', 'contrasena', 'secret', 'token']) {
      if (Object.prototype.hasOwnProperty.call(doc, campoProhibido)) {
        registrarError(cfg.archivo + ' / ' + doc._id + ' contiene el campo sensible "' + campoProhibido + '".');
        problemas++;
      }
    }
  }
  if (problemas > 0) {
    continue;
  }

  // Las fechas deben seguir siendo Date de BSON (no cadenas).
  let fechasComoCadena = 0;
  for (const doc of documentos) {
    for (const campo of ['fecha_creacion', 'fecha_registro', 'fecha_programada', 'fecha_realizacion']) {
      if (doc[campo] !== undefined && doc[campo] !== null && !(doc[campo] instanceof Date)) {
        fechasComoCadena++;
      }
    }
  }
  if (fechasComoCadena > 0) {
    registrarError(cfg.archivo + ' tiene ' + fechasComoCadena + ' campo(s) de fecha que no son Date de BSON.');
    continue;
  }

  semillas[cfg.nombre] = documentos;
  idsPorColeccion[cfg.nombre] = Array.from(vistos);
  registrarOk(cfg.archivo + ' -> ' + documentos.length + ' documentos validos (EJSON con Date preservado).');
}

/* --------------------------------------------- 2. integridad referencial */
linea('2. Integridad referencial de la semilla');

if (semillas['s03_emprendedores'] && semillas['s03_iniciativas'] && semillas['s03_asesorias']) {
  const idsEmprendedores = new Set(idsPorColeccion['s03_emprendedores']);
  const idsIniciativas = new Set(idsPorColeccion['s03_iniciativas']);
  let huerfanas = 0;

  for (const ini of semillas['s03_iniciativas']) {
    if (!idsEmprendedores.has(ini.emprendedor_id)) {
      registrarError('La iniciativa ' + ini._id + ' apunta a un emprendedor inexistente: ' + ini.emprendedor_id);
      huerfanas++;
    }
  }
  for (const ase of semillas['s03_asesorias']) {
    if (!idsIniciativas.has(ase.iniciativa_id)) {
      registrarError('La asesoria ' + ase._id + ' apunta a una iniciativa inexistente: ' + ase.iniciativa_id);
      huerfanas++;
    }
    if (!idsEmprendedores.has(ase.emprendedor_id)) {
      registrarError('La asesoria ' + ase._id + ' apunta a un emprendedor inexistente: ' + ase.emprendedor_id);
      huerfanas++;
    }
  }
  if (huerfanas === 0) {
    registrarOk('Todas las referencias cruzada (emprendedor <-> iniciativa <-> asesoria) resuelven.');
  }
} else {
  registrarAviso('No se pudo validar la integridad referencial: falta alguna semilla valida.');
}

/* --------------------------------------------- 3. deteccion de datos ajenos */
linea('3. Estado previo de las colecciones destino');

const previas = {};
for (const cfg of COLECCIONES) {
  const col = db.getCollection(cfg.nombre);
  const total = col.countDocuments({});
  const deLaSemilla = idsPorColeccion[cfg.nombre]
    ? col.countDocuments({ _id: { $in: idsPorColeccion[cfg.nombre] } })
    : 0;
  const conDataset = col.countDocuments({ dataset_id: DATASET_ID });
  const ajenos = total - conDataset;
  previas[cfg.nombre] = { total, deLaSemilla, conDataset, ajenos };

  print('  ' + cfg.nombre.padEnd(18) + ' total=' + String(total).padStart(3) +
        '  semilla(S03_UE_V1)=' + String(conDataset).padStart(3) +
        '  ajenos=' + String(ajenos).padStart(3));
  if (ajenos > 0) {
    registrarAviso(cfg.nombre + ' tiene ' + ajenos + ' documento(s) de otro origen: no se tocaran.');
  }
}

/* -------------------------------------------------------- 4. carga segura */
linea('4. Carga de la semilla');

if (errores.length > 0) {
  print('');
  print('Se aborta la carga: hay ' + errores.length + ' error(es) de validacion.');
  errores.forEach((e) => print('  - ' + e));
  quit(1);
}

const TIEMPO = new Date().toISOString();
for (const cfg of COLECCIONES) {
  const documentos = semillas[cfg.nombre];
  const col = db.getCollection(cfg.nombre);
  const ids = idsPorColeccion[cfg.nombre];

  if (MODO_SIMULACION) {
    print('  [SIMULA] ' + cfg.nombre + ': se habrian cargado ' + documentos.length + ' documentos.');
    continue;
  }

  // 4.1 Borra SOLO los documentos que pertenecen a esta semilla.
  const borrados = col.deleteMany({ _id: { $in: ids }, dataset_id: DATASET_ID }).deletedCount;
  // 4.2 Inserta la semilla completa.
  const resInsert = col.insertMany(documentos, { ordered: true });
  const insertados = Object.keys(resInsert.insertedIds || {}).length;

  registrarOk(cfg.nombre + ': ' + borrados + ' documento(s) de la semilla reemplazados, ' +
             insertados + ' insertados (total ' + col.countDocuments({}) + ').');
}

/* ------------------------------------------------------------ 5. indices */
linea('5. Indices de consulta');

if (!MODO_SIMULACION) {
  const indices = {
    s03_emprendedores: [
      { key: { sector: 1 }, name: 'ix_sector' },
      { key: { departamento: 1 }, name: 'ix_departamento' },
      { key: { dataset_id: 1 }, name: 'ix_dataset_id' }
    ],
    s03_iniciativas: [
      { key: { sector: 1, etapa: 1 }, name: 'ix_sector_etapa' },
      { key: { emprendedor_id: 1 }, name: 'ix_emprendedor_id' },
      { key: { estado: 1 }, name: 'ix_estado' },
      { key: { dataset_id: 1 }, name: 'ix_dataset_id' }
    ],
    s03_asesorias: [
      { key: { tipo: 1, estado: 1 }, name: 'ix_tipo_estado' },
      { key: { iniciativa_id: 1 }, name: 'ix_iniciativa_id' },
      { key: { fecha_realizacion: 1 }, name: 'ix_fecha_realizacion' },
      { key: { dataset_id: 1 }, name: 'ix_dataset_id' }
    ]
  };

  for (const cfg of COLECCIONES) {
    const col = db.getCollection(cfg.nombre);
    for (const idx of indices[cfg.nombre]) {
      try {
        col.createIndex(idx.key, { name: idx.name });
      } catch (e) {
        registrarAviso('No se pudo crear el indice ' + idx.name + ' en ' + cfg.nombre + ': ' + e.message);
      }
    }
    print('  ' + cfg.nombre + ': ' + col.getIndexes().length + ' indice(s) -> ' +
          col.getIndexes().map((i) => i.name).join(', '));
  }
} else {
  print('  [SIMULA] No se crean indices en modo simulacion.');
}

/* --------------------------------------------------------- 6. verificacion */
linea('6. Verificacion posterior a la carga');

if (!MODO_SIMULACION) {
  for (const cfg of COLECCIONES) {
    const col = db.getCollection(cfg.nombre);
    const total = col.countDocuments({});
    const deLaSemilla = col.countDocuments({ dataset_id: DATASET_ID });
    if (total === cfg.conteoEsperado && deLaSemilla === cfg.conteoEsperado) {
      registrarOk(cfg.nombre + ': ' + total + '/' + cfg.conteoEsperado + ' documentos, todos con dataset_id ' + DATASET_ID + '.');
    } else {
      registrarError(cfg.nombre + ': ' + total + ' documentos (esperados ' + cfg.conteoEsperado +
                     '), ' + deLaSemilla + ' con dataset_id ' + DATASET_ID + '.');
    }
  }

  // Muestra de lectura: el tipo Date debe seguir siendo Date.
  const muestra = db.getCollection('s03_iniciativas').findOne({ _id: 'INI-001' });
  if (muestra && muestra.fecha_creacion instanceof Date) {
    registrarOk('Muestra INI-001: fecha_creacion=' + muestra.fecha_creacion.toISOString() +
                ' (Date de BSON preservado por EJSON.parse).');
  } else {
    registrarError('Muestra INI-001: la fecha_creacion no llego como Date de BSON.');
  }
} else {
  print('  [SIMULA] No se verifica el contenido final en modo simulacion.');
}

/* ------------------------------------------------------------ 7. resumen */
linea('7. Resumen de la carga');
print('  Base de datos : ' + db.getName());
print('  Dataset       : ' + DATASET_ID + '  (esquema ' + ESQUEMA_VERSION + ')');
print('  Modo          : ' + (MODO_SIMULACION ? 'SIMULACION (sin escrituras)' : 'REAL'));
print('  Fecha         : ' + TIEMPO);
print('  OK            : ' + ok.length);
print('  AVISOS        : ' + advertencias.length);
print('  ERRORES       : ' + errores.length);

if (errores.length > 0) {
  print('');
  print('  Detalle de errores:');
  errores.forEach((e) => print('   - ' + e));
  quit(1);
}

print('');
print('  Carga completada correctamente.');
print('  Siguiente paso: mongosh ... scripts/02_demo_crud.js');
quit(0);
