/* =====================================================================
 * E03 - Bases de Datos NoSQL (Semana 3)
 * 04_verificar_base.js
 * ---------------------------------------------------------------------
 * Verificacion integral de la base del laboratorio. Cada control devuelve
 * OK, AVISO o ERROR:
 *
 *   OK    -> el control se cumple;
 *   AVISO -> el control se cumple con una salvedad que el aprendiz debe
 *            revisar (por ejemplo, hay datos ajenos en la coleccion);
 *   ERROR -> el control NO se cumple y hay que corregirlo.
 *
 * El script no modifica ningun dato: solo lee y compara.
 *
 * Genera: resultados/informe_pruebas.md
 *
 * Uso:
 *   mongosh "mongodb://127.0.0.1:27018/emprendimiento_sena_lab" \
 *     --username aprendiz_nosql --password <PASSWORD> \
 *     --authenticationDatabase emprendimiento_sena_lab \
 *     scripts/04_verificar_base.js
 * ===================================================================== */

const fs = require('fs');
const path = require('path');

/* --------------------------------------------------------- configuracion */
const RAIZ = path.resolve(__dirname, '..');
const DIR_DATOS = path.join(RAIZ, 'data');
const DIR_RESULTADOS = path.join(RAIZ, 'resultados');
const DIR_DOCS = path.join(RAIZ, 'docs');

const BASE_DATOS = 'emprendimiento_sena_lab';
const DATASET_ID = 'S03_UE_V1';
const ESQUEMA_VERSION = '1.1';
const DATASET_TMP = 'S03_UE_V1_TMP';

const EMPR = 's03_emprendedores';
const INI = 's03_iniciativas';
const ASE = 's03_asesorias';

const DOMINIOS = {
  sector: ['tecnologia', 'alimentos', 'economia_circular', 'turismo'],
  etapa: ['idea', 'validacion', 'puesta_en_marcha', 'escalamiento'],
  estadoIniciativa: ['activa', 'archivada'],
  estadoAsesoria: ['programada', 'realizada', 'cancelada', 'reprogramada'],
  modalidad: ['virtual', 'presencial', 'telefonica'],
  tipoAsesoria: ['capacitacion', 'mentoria', 'diagnostico', 'legal', 'mercadeo', 'financiacion', 'acompanamiento_tecnico'],
  nivelMadurez: ['idea', 'prototipo', 'validacion', 'escala'],
  tipoDocumento: ['CC', 'CE']
};

const sello = new Date().toISOString();
const linea = (titulo) => {
  print('');
  print('--- ' + titulo + ' ' + '-'.repeat(Math.max(0, 66 - titulo.length)));
};

const verificaciones = [];
const registrar = (estado, codigo, descripcion, detalle) => {
  verificaciones.push({ estado: estado, codigo: codigo, descripcion: descripcion, detalle: detalle || '' });
  print('  [' + estado.padEnd(5) + '] ' + codigo.padEnd(18) + descripcion + (detalle ? '  -> ' + detalle : ''));
};

const contar = (estado) => verificaciones.filter((v) => v.estado === estado).length;

/* ------------------------------------------------------------- entorno */
linea('0. Entorno verificado');
if (db.getName() !== BASE_DATOS) {
  print('  [ERROR] La sesion esta conectada a "' + db.getName() + '" y el laboratorio exige "' + BASE_DATOS + '".');
  quit(1);
}
print('  Servidor      : ' + db.version());
print('  Base de datos : ' + db.getName());
print('  Colecciones   : ' + db.getCollectionNames().join(', '));
print('  Fecha         : ' + sello);

const colEmpr = db.getCollection(EMPR);
const colIni = db.getCollection(INI);
const colAse = db.getCollection(ASE);

/* -------------------------------------------------- 1. existencia y conteo */
linea('1. Colecciones, volumen y dataset');

const CONTEOS = [
  { col: EMPR, esperado: 10, etiqueta: 'emprendedores' },
  { col: INI, esperado: 15, etiqueta: 'iniciativas' },
  { col: ASE, esperado: 30, etiqueta: 'asesorias' }
];

for (const c of CONTEOS) {
  const col = db.getCollection(c.col);
  const total = col.countDocuments({});
  const deLaSemilla = col.countDocuments({ dataset_id: DATASET_ID });
  const otros = total - deLaSemilla;

  if (total === c.esperado && deLaSemilla === c.esperado) {
    registrar('OK', 'V-01.' + c.etiqueta, 'Coleccion ' + c.col + ' con ' + c.esperado + ' documentos del dataset ' + DATASET_ID,
      'total=' + total + ', con dataset_id=' + deLaSemilla);
  } else if (total === c.esperado && deLaSemilla < c.esperado) {
    registrar('AVISO', 'V-01.' + c.etiqueta, 'Coleccion ' + c.col + ' con el volumen correcto pero no todos los documentos son del dataset ' + DATASET_ID,
      'total=' + total + ', con dataset_id=' + deLaSemilla + ', ajenos=' + otros);
  } else {
    registrar('ERROR', 'V-01.' + c.etiqueta, 'Volumen inesperado en ' + c.col, 'total=' + total + ' (esperado ' + c.esperado + ')');
  }

  const ajenos = col.find({ dataset_id: { $ne: DATASET_ID } }, { _id: 1 }).toArray();
  if (ajenos.length > 0) {
    registrar('AVISO', 'V-02.' + c.etiqueta, 'Hay ' + ajenos.length + ' documento(s) ajenos a ' + DATASET_ID + ' en ' + c.col + ' (no se tocaron)',
      ajenos.map((d) => d._id).join(', '));
  } else {
    registrar('OK', 'V-02.' + c.etiqueta, 'No hay documentos ajenos al dataset en ' + c.col, '0 registros');
  }
}

const esquemas = db.getCollection(INI).distinct('esquema_version');
if (esquemas.length === 1 && esquemas[0] === ESQUEMA_VERSION) {
  registrar('OK', 'V-03', 'Todas las iniciativas declaran esquema_version ' + ESQUEMA_VERSION, esquemas.join(', '));
} else {
  registrar('AVISO', 'V-03', 'Valores de esquema_version distintos de ' + ESQUEMA_VERSION + ' en s03_iniciativas', esquemas.join(', '));
}

/* --------------------------------------------- 2. residuos de la demo CRUD */
linea('2. Residuos temporales y conservacion de la semilla');

let residuos = 0;
for (const c of CONTEOS) {
  const col = db.getCollection(c.col);
  const temp = col.countDocuments({ dataset_id: DATASET_TMP });
  const otrosTmp = col.countDocuments({ _id: { $regex: '^TMP-E03-' } });
  residuos += temp + otrosTmp;
}
if (residuos === 0) {
  registrar('OK', 'V-04', 'No quedan documentos temporales de la demostracion CRUD', 'dataset ' + DATASET_TMP + ': 0 en las tres colecciones');
} else {
  registrar('ERROR', 'V-04', 'Hay ' + residuos + ' documento(s) temporales sin limpiar', 'ejecute de nuevo scripts/02_demo_crud.js');
}

/* --------------------------------------------- 3. integridad referencial */
linea('3. Integridad referencial');

const idsEmpr = new Set(colEmpr.distinct('_id'));
const idsIni = new Set(colIni.distinct('_id'));
let huerfanasIni = [];
let huerfanasAse = [];

for (const i of colIni.find({}, { _id: 1, emprendedor_id: 1 }).toArray()) {
  if (!idsEmpr.has(i.emprendedor_id)) { huerfanasIni.push(i._id + ' -> ' + i.emprendedor_id); }
}
for (const a of colAse.find({}, { _id: 1, iniciativa_id: 1, emprendedor_id: 1 }).toArray()) {
  if (!idsIni.has(a.iniciativa_id)) { huerfanasAse.push(a._id + ' -> iniciativa ' + a.iniciativa_id); }
  if (!idsEmpr.has(a.emprendedor_id)) { huerfanasAse.push(a._id + ' -> emprendedor ' + a.emprendedor_id); }
}

if (huerfanasIni.length === 0) {
  registrar('OK', 'V-05', 'Toda iniciativa referencia a un emprendedor existente', idsIni.size + ' iniciativas verificadas');
} else {
  registrar('ERROR', 'V-05', 'Iniciativas con referencia rota hacia el emprendedor', huerfanasIni.join(', '));
}
if (huerfanasAse.length === 0) {
  registrar('OK', 'V-06', 'Toda asesoria referencia a una iniciativa y a un emprendedor existentes', colAse.countDocuments({}) + ' asesorias verificadas');
} else {
  registrar('ERROR', 'V-06', 'Asesorias con referencia rota', huerfanasAse.join(', '));
}

/* --------------------------- 4. coherencia del sector historico de la asesoria */
linea('4. Coherencia del sector historico (asesoria vs historial de la iniciativa)');

const cacheIni = {};
const cargarIniciativa = (id) => {
  if (!cacheIni[id]) {
    const doc = colIni.findOne({ _id: id });
    cacheIni[id] = doc ? doc : null;
  }
  return cacheIni[id];
};

let incoherentes = [];
let sinHistorial = [];
for (const a of colAse.find({}, { _id: 1, iniciativa_id: 1, sector: 1, fecha_realizacion: 1, fecha_programada: 1 }).toArray()) {
  const ini = cargarIniciativa(a.iniciativa_id);
  if (!ini || !ini.historial_estados || ini.historial_estados.length === 0) {
    sinHistorial.push(a._id);
    continue;
  }
  const referencia = (a.fecha_realizacion instanceof Date) ? a.fecha_realizacion : a.fecha_programada;
  const previos = ini.historial_estados
    .filter((h) => h.fecha instanceof Date && h.fecha.getTime() <= referencia.getTime())
    .sort((x, y) => x.fecha.getTime() - y.fecha.getTime());
  const esperado = previos.length ? previos[previos.length - 1].sector : ini.sector;
  if (a.sector !== esperado) {
    incoherentes.push(a._id + ' (guarda "' + a.sector + '", el historial indica "' + esperado + '")');
  }
}
if (incoherentes.length === 0 && sinHistorial.length === 0) {
  registrar('OK', 'V-07', 'El sector guardado en cada asesoria coincide con el sector de la iniciativa en la fecha del evento',
    colAse.countDocuments({}) + ' asesorias contrastadas con historial_estados');
} else if (incoherentes.length > 0) {
  registrar('ERROR', 'V-07', 'Asesorias cuyo sector historico no cuadra con el historial de la iniciativa', incoherentes.join('; '));
} else {
  registrar('AVISO', 'V-07', 'Hay asesorias sin historial de estados con el cual contrastar', sinHistorial.join(', '));
}

/* --------------------------------------------- 5. campos obligatorios */
linea('5. Campos obligatorios por documento');

const REGLAS = [
  { col: colEmpr, etiqueta: 'emprendedores', campos: ['_id', 'dataset_id', 'esquema_version', 'tipo_documento', 'numero_documento', 'nombres', 'apellidos', 'email', 'sector', 'departamento', 'municipio', 'fecha_registro', 'nivel_madurez', 'activo', 'etiquetas'] },
  { col: colIni, etiqueta: 'iniciativas', campos: ['_id', 'dataset_id', 'esquema_version', 'emprendedor_id', 'nombre', 'sector', 'etapa', 'estado', 'activo', 'plataformas', 'fecha_creacion', 'presupuesto', 'diagnosticos', 'historial_estados'] },
  { col: colAse, etiqueta: 'asesorias', campos: ['_id', 'dataset_id', 'esquema_version', 'iniciativa_id', 'emprendedor_id', 'sector', 'tipo', 'estado', 'modalidad', 'fecha_programada', 'duracion_minutos', 'asesor'] }
];

for (const r of REGLAS) {
  const faltantes = [];
  for (const d of r.col.find({ dataset_id: DATASET_ID }).toArray()) {
    for (const campo of r.campos) {
      if (!Object.prototype.hasOwnProperty.call(d, campo)) {
        faltantes.push(d._id + '.' + campo);
      }
    }
  }
  if (faltantes.length === 0) {
    registrar('OK', 'V-08.' + r.etiqueta, 'Todos los documentos de ' + r.etiqueta + ' tienen los campos obligatorios', r.campos.length + ' campos verificados');
  } else {
    registrar('ERROR', 'V-08.' + r.etiqueta, 'Campos obligatorios ausentes', faltantes.join(', '));
  }
}

/* --------------------------------------------- 6. dominios de valores */
linea('6. Dominios de valores (listas controladas)');

const fueraDeDominio = [];
const revisarDominio = (coleccion, etiqueta, campo, permitidos) => {
  for (const d of coleccion.find({}, { _id: 1 }).toArray()) {
    const doc = coleccion.findOne({ _id: d._id });
    const valor = doc[campo];
    if (valor !== undefined && valor !== null && !permitidos.includes(valor)) {
      fueraDeDominio.push(etiqueta + ' ' + d._id + '.' + campo + '="' + valor + '"');
    }
  }
};

revisarDominio(colEmpr, 'emprendedores', 'sector', DOMINIOS.sector);
revisarDominio(colEmpr, 'emprendedores', 'nivel_madurez', DOMINIOS.nivelMadurez);
revisarDominio(colEmpr, 'emprendedores', 'tipo_documento', DOMINIOS.tipoDocumento);
revisarDominio(colIni, 'iniciativas', 'sector', DOMINIOS.sector);
revisarDominio(colIni, 'iniciativas', 'etapa', DOMINIOS.etapa);
revisarDominio(colIni, 'iniciativas', 'estado', DOMINIOS.estadoIniciativa);
revisarDominio(colAse, 'asesorias', 'sector', DOMINIOS.sector);
revisarDominio(colAse, 'asesorias', 'tipo', DOMINIOS.tipoAsesoria);
revisarDominio(colAse, 'asesorias', 'estado', DOMINIOS.estadoAsesoria);
revisarDominio(colAse, 'asesorias', 'modalidad', DOMINIOS.modalidad);

if (fueraDeDominio.length === 0) {
  registrar('OK', 'V-09', 'Todos los valores controlados (sector, etapa, estado, modalidad, tipo, nivel de madurez) pertenecen a sus listas',
    '10 listas controladas, 55 documentos revisados');
} else {
  registrar('ERROR', 'V-09', 'Valores fuera de las listas controladas', fueraDeDominio.join(', '));
}

/* --------------------------------------------- 7. reglas de fecha_realizacion */
linea('7. Reglas de estado y de fecha_realizacion en las asesorias');

let erroresFecha = [];
for (const a of colAse.find({}, { _id: 1, estado: 1, fecha_realizacion: 1 }).toArray()) {
  const presente = Object.prototype.hasOwnProperty.call(a, 'fecha_realizacion');
  if (a.estado === 'realizada') {
    if (!presente || !(a.fecha_realizacion instanceof Date)) {
      erroresFecha.push(a._id + ' (realizada sin fecha de Date)');
    }
  } else if (a.estado === 'programada' || a.estado === 'reprogramada') {
    if (!presente || a.fecha_realizacion !== null) {
      erroresFecha.push(a._id + ' (' + a.estado + ' con fecha_realizacion distinto de null)');
    }
  } else if (a.estado === 'cancelada') {
    if (presente) {
      erroresFecha.push(a._id + ' (cancelada con el campo fecha_realizacion presente)');
    }
  }
}
if (erroresFecha.length === 0) {
  registrar('OK', 'V-10', 'fecha_realizacion cumple la regla: Date en "realizada", null en "programada"/"reprogramada" y ausente en "cancelada"',
    colAse.countDocuments({}) + ' asesorias revisadas');
} else {
  registrar('ERROR', 'V-10', 'Incumplimiento de la regla de fecha_realizacion', erroresFecha.join(', '));
}

const distribucion = colAse.aggregate([{ $group: { _id: '$estado', n: { $sum: 1 } } }, { $sort: { _id: 1 } }]).toArray();
const mapaDistribucion = {};
for (const d of distribucion) { mapaDistribucion[d._id] = d.n; }
const distribucionEsperada = { realizada: 19, programada: 8, cancelada: 2, reprogramada: 1 };
let distribucionOk = true;
for (const k of Object.keys(distribucionEsperada)) {
  if (mapaDistribucion[k] !== distribucionEsperada[k]) { distribucionOk = false; }
}
if (distribucionOk) {
  registrar('OK', 'V-11', 'La distribucion por estado de las asesorias es la esperada (19 realizada, 8 programada, 2 cancelada, 1 reprogramada)',
    Object.keys(mapaDistribucion).sort().map((k) => k + '=' + mapaDistribucion[k]).join(', '));
} else {
  registrar('AVISO', 'V-11', 'La distribucion por estado difiere de la esperada',
    Object.keys(mapaDistribucion).sort().map((k) => k + '=' + mapaDistribucion[k]).join(', '));
}

/* --------------------------------------------- 8. coherencia estado/activo */
linea('8. Coherencia entre estado y activo en las iniciativas');

let incoherentesActivo = [];
for (const i of colIni.find({}, { _id: 1, estado: 1, activo: 1 }).toArray()) {
  const esperadoActivo = (i.estado === 'activa');
  if (i.activo !== esperadoActivo) {
    incoherentesActivo.push(i._id + ' (estado=' + i.estado + ', activo=' + i.activo + ')');
  }
}
if (incoherentesActivo.length === 0) {
  registrar('OK', 'V-12', 'El campo activo es coherente con el estado en todas las iniciativas',
    colIni.countDocuments({}) + ' iniciativas: activa=true, archivada=false');
} else {
  registrar('ERROR', 'V-12', 'Incoherencia entre estado y activo', incoherentesActivo.join(', '));
}

/* --------------------------------------------- 9. null frente a ausente */
linea('9. Separacion entre null y campo ausente');

const cubos = (coleccion, campo) => ({
  valor: coleccion.countDocuments({ [campo]: { $exists: true, $ne: null } }),
  nulo: coleccion.countDocuments({ [campo]: { $type: 'null' } }),
  ausente: coleccion.countDocuments({ [campo]: { $exists: false } })
});

const cuboCanalEmpr = cubos(colEmpr, 'canal_preferido');
const cuboMentor = cubos(colIni, 'mentor');
const cuboCanalAse = cubos(colAse, 'canal_contacto');

const esperadoCanalEmpr = { valor: 5, nulo: 3, ausente: 2 };
const esperadoMentor = { valor: 6, nulo: 5, ausente: 4 };
const esperadoCanalAse = { valor: 22, nulo: 5, ausente: 3 };

const compararCubo = (nombre, actual, esperado) => {
  const ok = actual.valor === esperado.valor && actual.nulo === esperado.nulo && actual.ausente === esperado.ausente;
  registrar(ok ? 'OK' : 'AVISO', 'V-13.' + nombre,
    'Cubo de "' + nombre + '" (valor / null / ausente)',
    actual.valor + ' / ' + actual.nulo + ' / ' + actual.ausente +
    (ok ? '' : '  (esperado ' + esperado.valor + ' / ' + esperado.nulo + ' / ' + esperado.ausente + ')'));
};
compararCubo('canal_preferido (emprendedores)', cuboCanalEmpr, esperadoCanalEmpr);
compararCubo('mentor (iniciativas)', cuboMentor, esperadoMentor);
compararCubo('canal_contacto (asesorias)', cuboCanalAse, esperadoCanalAse);

/* --------------------------------------------- 10. reto de transferencia */
linea('10. Reto de transferencia (septiembre 2026 y sector historico)');

const INICIO = new Date('2026-09-01T00:00:00.000Z');
const FIN = new Date('2026-09-30T23:59:59.999Z');
const sept = colAse.find(
  { dataset_id: DATASET_ID, estado: 'realizada', fecha_realizacion: { $gte: INICIO, $lte: FIN } },
  { _id: 1, iniciativa_id: 1, sector: 1 }
).toArray();

const diferencias = [];
for (const a of sept) {
  const ini = cargarIniciativa(a.iniciativa_id);
  if (ini && ini.sector !== a.sector) {
    diferencias.push(a._id + ' (' + a.sector + ' vs ' + ini.sector + ')');
  }
}

if (sept.length === 14) {
  registrar('OK', 'V-14', 'Las asesorias realizadas en septiembre de 2026 son 14', sept.map((a) => a._id).join(', '));
} else {
  registrar('ERROR', 'V-14', 'El numero de asesorias realizadas en septiembre de 2026 no es 14', 'obtenidas: ' + sept.length);
}
if (diferencias.length === 1 && diferencias[0].indexOf('ASE-001') === 0) {
  registrar('OK', 'V-15', 'Solo ASE-001 tiene sector historico distinto del sector actual de su iniciativa (alimentos vs economia_circular)',
    diferencias.join(', '));
} else {
  registrar('AVISO', 'V-15', 'Las diferencias de sector historico no son las esperadas', diferencias.join(', ') || '(ninguna)');
}

/* ------------------------------------- 11. reglas del caso de la guia E01 */
linea('11. Reglas del caso (guia E01): franja de asesores y codigos ficticios');

/* Regla: "No programar dos asesorias para el mismo asesor en la misma
   franja definida para el laboratorio". Aqui la franja es el dia UTC. */
const franjas = {};
for (const a of colAse.find({}, { _id: 1, asesor_id: 1, fecha_programada: 1, fecha_realizacion: 1 }).toArray()) {
  const eventos = [];
  if (a.fecha_programada instanceof Date) { eventos.push(a.fecha_programada.toISOString().slice(0, 10)); }
  if (a.fecha_realizacion instanceof Date) { eventos.push(a.fecha_realizacion.toISOString().slice(0, 10)); }
  for (const dia of eventos) {
    const clave = a.asesor_id + ' @ ' + dia;
    if (!franjas[clave]) { franjas[clave] = []; }
    franjas[clave].push(a._id);
  }
}
const choques = Object.keys(franjas).filter((k) => franjas[k].length > 1);
if (choques.length === 0) {
  registrar('OK', 'V-20', 'No hay dos asesorias del mismo asesor en la misma franja (dia UTC de programacion o realizacion)',
    new Set(colAse.find({}, { asesor_id: 1 }).toArray().map((a) => a.asesor_id)).size + ' asesores, 0 choques');
} else {
  registrar('ERROR', 'V-20', 'Hay assessorías del mismo asesor en la misma franja', choques.map((k) => k + ' -> ' + franjas[k].join('/')).join('; '));
}

/* Codigos ficticios del asesor: deben existir y ser coherentes con el nombre. */
const incoherentesCodigo = [];
for (const a of colAse.find({}, { _id: 1, asesor: 1, asesor_id: 1 }).toArray()) {
  if (!a.asesor_id || !/^ADV-\d{2}$/.test(a.asesor_id)) { incoherentesCodigo.push(a._id + ' sin codigo valido'); }
}
const pares = {};
for (const a of colAse.find({}, { _id: 1, asesor: 1, asesor_id: 1 }).toArray()) {
  pares[a.asesor_id] = a.asesor;
}
const nombres = new Set(Object.values(pares));
if (incoherentesCodigo.length === 0 && nombres.size === Object.keys(pares).length) {
  registrar('OK', 'V-21', 'Cada asesoria registra el codigo ficticio del asesor (ADV-xx) y cada codigo corresponde a un solo asesor',
    Object.keys(pares).length + ' codigos: ' + Object.keys(pares).sort().join(', '));
} else {
  registrar('ERROR', 'V-21', 'Problema en los codigos ficticios de asesor',
    (incoherentesCodigo.length ? incoherentesCodigo.join(', ') + '; ' : '') + 'codigos con mas de un nombre: ' + (nombres.size !== Object.keys(pares).length ? 'si' : 'no'));
}

/* --------------------------------------------- 12. indices */
linea('12. Indices de consulta');

const indicesEsperados = {
  [EMPR]: ['ix_sector', 'ix_departamento', 'ix_dataset_id'],
  [INI]: ['ix_sector_etapa', 'ix_emprendedor_id', 'ix_estado', 'ix_dataset_id'],
  [ASE]: ['ix_tipo_estado', 'ix_iniciativa_id', 'ix_fecha_realizacion', 'ix_dataset_id']
};
for (const nombre of Object.keys(indicesEsperados)) {
  const nombres = db.getCollection(nombre).getIndexes().map((i) => i.name);
  const faltan = indicesEsperados[nombre].filter((n) => !nombres.includes(n));
  if (faltan.length === 0) {
    registrar('OK', 'V-16.' + nombre, 'Indices de consulta presentes en ' + nombre, nombres.join(', '));
  } else {
    registrar('AVISO', 'V-16.' + nombre, 'Faltan indices en ' + nombre + ': ' + faltan.join(', '), 'ejecute scripts/01_cargar_semilla.js');
  }
}

/* --------------------------------------------- 12. semilla en disco vs base */
linea('13. La semilla en disco coincide con lo cargado en la base');

const ARCHIVOS = [
  { archivo: 'emprendedores.ejson', coleccion: EMPR, patron: /^EMP-\d{3}$/ },
  { archivo: 'iniciativas.ejson', coleccion: INI, patron: /^INI-\d{3}$/ },
  { archivo: 'asesorias.ejson', coleccion: ASE, patron: /^ASE-\d{3}$/ }
];
for (const a of ARCHIVOS) {
  const ruta = path.join(DIR_DATOS, a.archivo);
  let docs = [];
  let errorLectura = '';
  try {
    docs = EJSON.parse(fs.readFileSync(ruta, 'utf8'));
  } catch (e) {
    errorLectura = e.message;
  }
  if (errorLectura) {
    registrar('ERROR', 'V-17.' + a.archivo, 'No se pudo leer o interpretar ' + a.archivo, errorLectura);
    continue;
  }
  const idsSemilla = docs.map((d) => d._id).sort();
  const idsBase = db.getCollection(a.coleccion).find({ dataset_id: DATASET_ID }, { _id: 1 }).toArray().map((d) => d._id).sort();
  const faltan = idsSemilla.filter((id) => !idsBase.includes(id));
  const sobran = idsBase.filter((id) => !idsSemilla.includes(id));
  if (faltan.length === 0 && sobran.length === 0) {
    registrar('OK', 'V-17.' + a.archivo, 'Los ' + idsSemilla.length + ' identificadores del archivo coinciden con los de ' + a.coleccion,
      'EJSON valido y Dates preservados');
  } else {
    registrar('ERROR', 'V-17.' + a.archivo, 'La semilla en disco y la base no coinciden',
      'faltan en la base: ' + (faltan.join(', ') || '-') + '; sobran: ' + (sobran.join(', ') || '-'));
  }
}

/* --------------------------------------------- 13. sin secretos en el entregable */
linea('14. El entregable no contiene contrasenas ni secretos');

const archivoPassword = path.join(RAIZ, '.lab', 'mongodb', 'password.txt');
let secretos = [];
if (fs.existsSync(archivoPassword)) {
  const password = fs.readFileSync(archivoPassword, 'utf8').trim();
  if (password.length >= 8) {
    const extensiones = ['.js', '.md', '.ejson', '.json', '.ps1', '.txt'];
    const recorrer = (dir) => {
      for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entrada.name === '.lab' || entrada.name === 'node_modules' || entrada.name === '.git') { continue; }
        const completa = path.join(dir, entrada.name);
        if (entrada.isDirectory()) { recorrer(completa); continue; }
        if (!extensiones.includes(path.extname(entrada.name).toLowerCase())) { continue; }
        try {
          const texto = fs.readFileSync(completa, 'utf8');
          if (texto.indexOf(password) !== -1) { secretos.push(path.relative(RAIZ, completa)); }
        } catch (e) { /* archivo no legible: se ignora */ }
      }
    };
    recorrer(RAIZ);
  }
}
if (secretos.length === 0) {
  registrar('OK', 'V-18', 'Ningun archivo del entregable contiene la contrasena de practica', 'carpeta .lab excluida por estar en .gitignore');
} else {
  registrar('ERROR', 'V-18', 'La contrasena de practica aparece en archivos del entregable', secretos.join(', '));
}

/* --------------------------------------------- 14. archivos de resultados */
linea('15. Entregables de resultados y documentacion');

const ENTREGABLES = [
  { ruta: path.join(DIR_RESULTADOS, 'resultados_crud.md'), descripcion: 'resultados/resultados_crud.md' },
  { ruta: path.join(DIR_RESULTADOS, 'resultados_consultas.md'), descripcion: 'resultados/resultados_consultas.md' },
  { ruta: path.join(DIR_DOCS, 'diccionario_datos_v1.1.md'), descripcion: 'docs/diccionario_datos_v1.1.md' },
  { ruta: path.join(DIR_DOCS, 'matriz_consultas_C01_C10.md'), descripcion: 'docs/matriz_consultas_C01_C10.md' },
  { ruta: path.join(DIR_DOCS, 'registro_operaciones_crud.md'), descripcion: 'docs/registro_operaciones_crud.md' },
  { ruta: path.join(DIR_DOCS, 'bitacora_errores.md'), descripcion: 'docs/bitacora_errores.md' },
  { ruta: path.join(DIR_DOCS, 'revision_cruzada.md'), descripcion: 'docs/revision_cruzada.md' },
  { ruta: path.join(DIR_DOCS, 'actividades_A1_A6.md'), descripcion: 'docs/actividades_A1_A6.md' },
  { ruta: path.join(DIR_DOCS, 'sustentacion.md'), descripcion: 'docs/sustentacion.md' }
];
const faltantesEntregables = [];
for (const e of ENTREGABLES) {
  if (fs.existsSync(e.ruta) && fs.statSync(e.ruta).size > 0) {
    registrar('OK', 'V-19', 'Entregable presente y con contenido: ' + e.descripcion, fs.statSync(e.ruta).size + ' bytes');
  } else {
    faltantesEntregables.push(e.descripcion);
    registrar('AVISO', 'V-19', 'Entregable pendiente o vacio: ' + e.descripcion, 'se genera al cerrar la guia');
  }
}

/* --------------------------------------------- 15. resumen */
linea('16. Resumen de la verificacion');
print('  Verificaciones : ' + verificaciones.length);
print('  OK             : ' + contar('OK'));
print('  AVISOS         : ' + contar('AVISO'));
print('  ERRORES        : ' + contar('ERROR'));

/* --------------------------------------------- 16. archivo de resultados */
if (!fs.existsSync(DIR_RESULTADOS)) {
  fs.mkdirSync(DIR_RESULTADOS, { recursive: true });
}
const destino = path.join(DIR_RESULTADOS, 'informe_pruebas.md');

const md = [];
md.push('# Informe de pruebas E03 - Bases de Datos NoSQL (Semana 3)');
md.push('');
md.push('> Archivo generado automaticamente por `scripts/04_verificar_base.js` sobre la base real del laboratorio.');
md.push('> Cada control se marca como **OK**, **AVISO** o **ERROR**; los AVISOS no impiden la entrega, los ERRORES si.');
md.push('');
md.push('| Dato | Valor |');
md.push('| --- | --- |');
md.push('| Servidor MongoDB | ' + db.version() + ' |');
md.push('| Base de datos | `' + db.getName() + '` |');
md.push('| Dataset | `' + DATASET_ID + '` (esquema `' + ESQUEMA_VERSION + '`) |');
md.push('| Colecciones | `' + EMPR + '`, `' + INI + '`, `' + ASE + '` |');
md.push('| Fecha de ejecucion | ' + sello + ' |');
md.push('| Controles ejecutados | ' + verificaciones.length + ' |');
md.push('| OK | ' + contar('OK') + ' |');
md.push('| AVISO | ' + contar('AVISO') + ' |');
md.push('| ERROR | ' + contar('ERROR') + ' |');
md.push('');
md.push('## Resultado de cada control');
md.push('');
md.push('| Control | Estado | Descripcion | Detalle |');
md.push('| --- | --- | --- | --- |');
for (const v of verificaciones) {
  md.push('| ' + v.codigo + ' | ' + v.estado + ' | ' + v.descripcion + ' | ' + (v.detalle || '-') + ' |');
}
md.push('');
md.push('## Como se ejecuto la suite');
md.push('');
md.push('```');
md.push('powershell -ExecutionPolicy Bypass -File scripts\\00_preparar_lab_mongodb.ps1');
md.push('mongosh "mongodb://127.0.0.1:27018/emprendimiento_sena_lab" --username aprendiz_nosql --password <PASSWORD> --authenticationDatabase emprendimiento_sena_lab scripts/01_cargar_semilla.js');
md.push('mongosh "mongodb://127.0.0.1:27018/emprendimiento_sena_lab" --username aprendiz_nosql --password <PASSWORD> --authenticationDatabase emprendimiento_sena_lab scripts/02_demo_crud.js');
md.push('mongosh "mongodb://127.0.0.1:27018/emprendimiento_sena_lab" --username aprendiz_nosql --password <PASSWORD> --authenticationDatabase emprendimiento_sena_lab scripts/03_consultas_aprendiz.js');
md.push('mongosh "mongodb://127.0.0.1:27018/emprendimiento_sena_lab" --username aprendiz_nosql --password <PASSWORD> --authenticationDatabase entrepreneurship_sena_lab scripts/04_verificar_base.js');
md.push('```');
md.push('');
md.push('## Resultado global');
md.push('');
if (contar('ERROR') === 0) {
  md.push('**La base cumple los ' + contar('OK') + ' controles ejecutados' + (contar('AVISO') > 0 ? ', con ' + contar('AVISO') + ' aviso(s) que el aprendiz debe revisar.' : ' sin observaciones pendientes.') + '**');
} else {
  md.push('**Hay ' + contar('ERROR') + ' control(es) en estado ERROR: la base todavia no cumple el laboratorio.**');
}
md.push('');
md.push('| Que falta por hacer a mano | Por que no lo hace el script |');
md.push('| --- | --- |');
md.push('| Recorrer en Compass las colecciones `s03_*` y comparar con los resultados | Requiere la interfaz grafica del instructor |');
md.push('| Redactar la conclusion de cada actividad A1 - A6 | Es una entrega del aprendiz, no una comprobacion automatica |');
md.push('| Sustentar el reto de transferencia en la reunion | Requiere la defensa oral del aprendiz |');
md.push('');

fs.writeFileSync(destino, md.join('\n'), 'utf8');
print('  [OK]     Informe escrito en ' + destino);

print('');
if (contar('ERROR') > 0) {
  print('  La verificacion termino con ' + contar('ERROR') + ' ERROR(es):');
  verificaciones.filter((v) => v.estado === 'ERROR').forEach((v) => print('   - ' + v.codigo + ': ' + v.descripcion));
  quit(1);
}
print('  Verificacion superada: ' + contar('OK') + ' OK, ' + contar('AVISO') + ' AVISO, 0 ERROR.');
quit(0);
