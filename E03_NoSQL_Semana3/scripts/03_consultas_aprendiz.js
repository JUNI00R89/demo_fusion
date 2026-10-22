/* =====================================================================
 * E03 - Bases de Datos NoSQL (Semana 3)
 * 03_consultas_aprendiz.js
 * ---------------------------------------------------------------------
 * Consultas de lectura C01 - C10 sobre la semilla S03_UE_V1 y reto de
 * transferencia. Todas las operaciones son de SOLO LECTURA: al final se
 * comparan los conteos de las tres colecciones antes y despues para
 * demostrar que el script no escribio nada.
 *
 * Cada consulta se ejecuta, se muestra con su filtro y su resultado
 * real, y se compara con el valor esperado de la matriz
 * (docs/matriz_consultas_C01_C10.md) para detectar discrepancias.
 *
 * Genera: resultados/resultados_consultas.md
 *
 * Uso:
 *   mongosh "mongodb://127.0.0.1:27018/emprendimiento_sena_lab" \
 *     --username aprendiz_nosql --password <PASSWORD> \
 *     --authenticationDatabase emprendimiento_sena_lab \
 *     scripts/03_consultas_aprendiz.js
 * ===================================================================== */

const fs = require('fs');
const path = require('path');

/* --------------------------------------------------------- configuracion */
const RAIZ = path.resolve(__dirname, '..');
const DIR_RESULTADOS = path.join(RAIZ, 'resultados');

const BASE_DATOS = 'emprendimiento_sena_lab';
const DATASET_ID = 'S03_UE_V1';

const EMPR = 's03_emprendedores';
const INI = 's03_iniciativas';
const ASE = 's03_asesorias';

const sello = new Date().toISOString();
const linea = (titulo) => {
  print('');
  print('--- ' + titulo + ' ' + '-'.repeat(Math.max(0, 66 - titulo.length)));
};

const resultados = [];
const discrepancias = [];

/* ------------------------------------------------------------- consultas */
const consultas = [
  {
    id: 'C01',
    titulo: 'Iniciativas del sector tecnologia en etapa puesta_en_marcha',
    pregunta: 'Que iniciativas estan en el sector tecnologia y ya entraron en puesta en marcha?',
    coleccion: INI,
    filtro: { dataset_id: DATASET_ID, sector: 'tecnologia', etapa: 'puesta_en_marcha' },
    proyeccion: { _id: 1, nombre: 1, sector: 1, etapa: 1, presupuesto: 1 },
    orden: { _id: 1 },
    esperado: 3,
    idsEsperados: ['INI-002', 'INI-006', 'INI-013'],
    aprendizaje: 'Dos campos de igualdad combined en un mismo documento (sector + etapa) y uso del indice ix_sector_etapa.'
  },
  {
    id: 'C02',
    titulo: 'Iniciativas activas que tienen plataforma web',
    pregunta: 'Cuales iniciativas activas puedo contactar por el canal web?',
    coleccion: INI,
    filtro: { dataset_id: DATASET_ID, estado: 'activa', plataformas: 'web' },
    proyeccion: { _id: 1, nombre: 1, estado: 1, plataformas: 1, sector: 1 },
    orden: { _id: 1 },
    esperado: 10,
    idsEsperados: ['INI-001', 'INI-002', 'INI-004', 'INI-005', 'INI-006', 'INI-010', 'INI-011', 'INI-012', 'INI-013', 'INI-015'],
    aprendizaje: 'Coincidencia de un valor dentro de un arreglo (plataformas: "web") sin usar $elemMatch: aqui basta porque solo se busca un valor.'
  },
  {
    id: 'C03',
    titulo: 'Iniciativas que pertenecen al emprendedor EMP-001',
    pregunta: 'Que iniciativas tiene el emprendedor EMP-001?',
    coleccion: INI,
    filtro: { dataset_id: DATASET_ID, emprendedor_id: 'EMP-001' },
    proyeccion: { _id: 1, nombre: 1, emprendedor_id: 1, sector: 1, etapa: 1, estado: 1 },
    orden: { _id: 1 },
    esperado: 2,
    idsEsperados: ['INI-001', 'INI-006'],
    aprendizaje: 'Referencia entre colecciones resuelta de forma manual (sin $lookup): se lee la iniciativa y luego se busca el emprendedor por su _id.'
  },
  {
    id: 'C04',
    titulo: 'Asesorias de tipo mentoria',
    pregunta: 'Que asesorias de mentoria se registraron en el trimestre?',
    coleccion: ASE,
    filtro: { dataset_id: DATASET_ID, tipo: 'mentoria' },
    proyeccion: { _id: 1, tipo: 1, estado: 1, modalidad: 1, iniciativa_id: 1, sector: 1 },
    orden: { _id: 1 },
    esperado: 6,
    idsEsperados: ['ASE-002', 'ASE-008', 'ASE-011', 'ASE-014', 'ASE-018', 'ASE-028'],
    aprendizaje: 'Filtro por tipo sobre la coleccion de asesorias, con el indice ix_tipo_estado.'
  },
  {
    id: 'C05',
    titulo: 'Historial de estados de una iniciativa (array embebido)',
    pregunta: 'Como evoluciono la iniciativa INI-001 y en que sector estaba cada etapa?',
    coleccion: INI,
    filtro: { _id: 'INI-001' },
    proyeccion: { _id: 1, nombre: 1, historial_estados: 1 },
    orden: {},
    esperado: 4,
    idsEsperados: ['2026-01-20', '2026-04-10', '2026-07-02', '2026-09-30'],
    aprendizaje: 'Los arreglos embebidos se leen enteros con una sola lectura; ademas cada entrada guarda el sector de ese momento (historia del documento).'
  },
  {
    id: 'C06',
    titulo: 'Asesorias de tipo capacitacion',
    pregunta: 'Cuantas asesorias de capacitacion se impartieron y en que modalidades?',
    coleccion: ASE,
    filtro: { dataset_id: DATASET_ID, tipo: 'capacitacion' },
    proyeccion: { _id: 1, tipo: 1, estado: 1, modalidad: 1, duracion_minutos: 1, costo: 1 },
    orden: { _id: 1 },
    esperado: 11,
    idsEsperados: ['ASE-001', 'ASE-003', 'ASE-007', 'ASE-012', 'ASE-013', 'ASE-016', 'ASE-019', 'ASE-022', 'ASE-025', 'ASE-026', 'ASE-030'],
    aprendizaje: 'Segundo tipo de asesoria: sirve para comparar volumenes entre tipos sin escribir una sola linea de agregacion.'
  }
];

/* ------------------------------------------------- 0. control de lectura */
linea('0. Control de entorno y de solo lectura');

if (db.getName() !== BASE_DATOS) {
  print('  [ERROR] La sesion esta conectada a "' + db.getName() + '" y el laboratorio exige "' + BASE_DATOS + '".');
  quit(1);
}
print('  Base de trabajo : ' + db.getName());
print('  Fecha           : ' + sello);

const conteosAntes = {};
for (const c of [EMPR, INI, ASE]) {
  conteosAntes[c] = db.getCollection(c).countDocuments({});
  print('  ' + c.padEnd(18) + ' documentos al inicio: ' + conteosAntes[c]);
}

/* --------------------------------------------------------- 1. C01 - C06 */
for (const def of consultas) {
  linea(def.id + ' - ' + def.titulo);
  print('  Pregunta     : ' + def.pregunta);
  print('  Coleccion    : ' + def.coleccion);
  print('  Filtro       : ' + EJSON.stringify(def.filtro));

  const docs = db.getCollection(def.coleccion).find(def.filtro, def.proyeccion).sort(def.orden).toArray();
  const ids = docs.map((d) => d._id);
  // En C05 la unidad de resultado es cada entrada del arreglo historial_estados.
  const idsComparacion = def.id === 'C05'
    ? (docs[0] && docs[0].historial_estados
        ? docs[0].historial_estados.map((h) => h.fecha.toISOString().slice(0, 10))
        : [])
    : ids;

  let conteoMostrado = docs.length;
  if (def.id === 'C05') {
    const ini = docs[0];
    conteoMostrado = ini && ini.historial_estados ? ini.historial_estados.length : 0;
    print('  Entradas del historial: ' + conteoMostrado);
    if (ini && ini.historial_estados) {
      for (const h of ini.historial_estados) {
        print('    - ' + h.fecha.toISOString().slice(0, 10) + '  etapa=' + String(h.etapa).padEnd(18) +
              ' sector=' + String(h.sector).padEnd(20) + ' | ' + h.nota);
      }
    }
  } else {
    print('  Resultado (' + conteoMostrado + ' documento(s)):');
    for (const d of docs) {
      const resto = Object.assign({}, d);
      delete resto._id;
      print('    ' + d._id + '  ' + EJSON.stringify(resto));
    }
  }

  const coincide = conteoMostrado === def.esperado;
  const idsOk = def.idsEsperados
    ? JSON.stringify(idsComparacion) === JSON.stringify(def.idsEsperados)
    : true;
  print('  Esperado     : ' + def.esperado + '  ->  ' + (coincide ? 'COINCIDE' : 'DISCREPANCIA'));
  if (!coincide) {
    discrepancias.push(def.id + ': se esperaban ' + def.esperado + ' y se obtuvieron ' + conteoMostrado + '.');
  }
  if (!idsOk) {
    discrepancias.push(def.id + ': los identificadores no coinciden con los esperados.');
    print('  ids esperados: ' + def.idsEsperados.join(', '));
    print('  ids obtenidos : ' + idsComparacion.join(', '));
  }
  print('  Aprendizaje  : ' + def.aprendizaje);

  resultados.push({
    id: def.id,
    titulo: def.titulo,
    pregunta: def.pregunta,
    coleccion: def.coleccion,
    filtro: def.filtro,
    conteo: conteoMostrado,
    esperado: def.esperado,
    ids: idsComparacion,
    coincide: coincide && idsOk,
    aprendizaje: def.aprendizaje,
    detalle: docs
  });
}

/* ------------------------------------------------- 2. C07 y C08 (null vs ausente) */
linea('C07 - Agrupacion de emprendedores por canal_preferido (valor / null / ausente)');

const agruparPorCampo = (coleccion, campo) => {
  const col = db.getCollection(coleccion);
  return {
    conValor: col.countDocuments({ [campo]: { $exists: true, $ne: null } }),
    conNull: col.countDocuments({ [campo]: { $type: 'null' } }),
    ausente: col.countDocuments({ [campo]: { $exists: false } })
  };
};

const c07 = agruparPorCampo(EMPR, 'canal_preferido');
print('  channel_preferido con valor : ' + c07.conValor + '  (esperado 5)');
print('  canal_preferido en null      : ' + c07.conNull + '  (esperado 3)');
print('  canal_preferido ausente      : ' + c07.ausente + '  (esperado 2)');
print('  Nota: {campo: null} tambien trae los ausentes; por eso se usa $type: "null" y $exists: false.');
const c07ok = c07.conValor === 5 && c07.conNull === 3 && c07.ausente === 2;
if (!c07ok) { discrepancias.push('C07: los conteos de canal_preferido no son los esperados.'); }
resultados.push({
  id: 'C07',
  titulo: 'Emprendedores agrupados por canal_preferido (valor / null / ausente)',
  pregunta: 'Cuantos emprendedores tienen canal preferido, cuantos lo tienen en null y cuantos no lo tienen?',
  coleccion: EMPR,
  filtro: '{ campo: { $exists: true, $ne: null } } | { campo: { $type: "null" } } | { campo: { $exists: false } }',
  conteo: c07.conValor + '/' + c07.conNull + '/' + c07.ausente,
  esperado: '5 / 3 / 2',
  ids: [],
  coincide: c07ok,
  aprendizaje: 'Distinguir "sin dato" (campo ausente) de "dato vacio" (null). MongoDB los trata diferente y por eso hay que consultarlos por separado.',
  detalle: []
});

linea('C08 - Agrupacion de iniciativas por mentor (valor / null / ausente)');
const c08 = agruparPorCampo(INI, 'mentor');
print('  mentor con valor : ' + c08.conValor + '  (esperado 6)');
print('  mentor en null   : ' + c08.conNull + '  (esperado 5)');
print('  mentor ausente   : ' + c08.ausente + '  (esperado 4)');
const c08ok = c08.conValor === 6 && c08.conNull === 5 && c08.ausente === 4;
if (!c08ok) { discrepancias.push('C08: los conteos de mentor no son los esperados.'); }
resultados.push({
  id: 'C08',
  titulo: 'Iniciativas agrupadas por mentor (valor / null / ausente)',
  pregunta: 'Cuantas iniciativas tienen mentor asignado, cuantas lo tienen en null y cuantas no lo tienen?',
  coleccion: INI,
  filtro: '{ mentor: { $exists: true, $ne: null } } | { mentor: { $type: "null" } } | { mentor: { $exists: false } }',
  conteo: c08.conValor + '/' + c08.conNull + '/' + c08.ausente,
  esperado: '6 / 5 / 4',
  ids: [],
  coincide: c08ok,
  aprendizaje: 'El mismo patron aplicado a un arreglo de documentos: primero se responde la pregunta y despues se decide si el campo es null o no existe.',
  detalle: []
});

/* ------------------------------------------- 3. C09 ($elemMatch vs notacion) */
linea('C09 - $elemMatch frente a la notacion con punto (trampa de los arreglos)');

const filtroElemMatch = { dataset_id: DATASET_ID, diagnosticos: { $elemMatch: { tipo: 'mercado', puntaje: { $gte: 80 } } } };
const filtroPunto = { dataset_id: DATASET_ID, 'diagnosticos.tipo': 'mercado', 'diagnosticos.puntaje': { $gte: 80 } };

const conElemMatch = db.getCollection(INI).find(filtroElemMatch, { _id: 1, nombre: 1 }).sort({ _id: 1 }).toArray();
const conPunto = db.getCollection(INI).find(filtroPunto, { _id: 1, nombre: 1 }).sort({ _id: 1 }).toArray();

print('  Filtro correcto con $elemMatch :');
print('    ' + EJSON.stringify(filtroElemMatch));
print('    -> ' + conElemMatch.length + ' iniciativa(s): ' + conElemMatch.map((d) => d._id).join(', '));
print('  Filtro ingenuo con notacion de punto:');
print('    ' + EJSON.stringify(filtroPunto));
print('    -> ' + conPunto.length + ' iniciativa(s): ' + conPunto.map((d) => d._id).join(', '));

const idsElemMatch = conElemMatch.map((d) => d._id);
const falsosPositivos = conPunto.filter((d) => !idsElemMatch.includes(d._id)).map((d) => d._id);
print('  Falsos positivos de la notacion ingenua: ' + (falsosPositivos.length ? falsosPositivos.join(', ') : '(ninguno)'));
print('  Motivo: con notacion de punto cada condicion se cumple en un elemento DISTINTO del arreglo.');
print('  Por ejemplo INI-001 tiene un diagnostico de tipo "mercado" (72) y otro de "operativo" (85):');
print('  la notacion ingenua junta ambos y lo incluye, aunque ningun diagnostico de mercado llega a 80.');

const c09ok = conElemMatch.length === 6 && conPunto.length === 12 && falsosPositivos.length === 6;
if (!c09ok) { discrepancias.push('C09: los conteos de $elemMatch (6) y de la notacion ingenua (12) no son los esperados.'); }
resultados.push({
  id: 'C09',
  titulo: 'Iniciativas con diagnostico de mercado y puntaje >= 80 ($elemMatch vs notacion de punto)',
  pregunta: 'Cuales iniciativas tienen un diagnostico de mercado con puntaje de al menos 80?',
  coleccion: INI,
  filtro: 'diagnosticos: { $elemMatch: { tipo: "mercado", puntaje: { $gte: 80 } } }',
  conteo: conElemMatch.length + ' correctas / ' + conPunto.length + ' con la notacion ingenua',
  esperado: '6 / 12',
  ids: idsElemMatch,
  coincide: c09ok,
  aprendizaje: 'En arreglos de subdocumentos, $elemMatch exige que TODAS las condiciones se cumplan en el MISMO elemento. La notacion con punto puede combinarlas entre elementos distintos.',
  detalle: []
});

/* ------------------------------------------------------- 4. C10 paginacion */
linea('C10 - Paginacion de iniciativas (orden estable sector + _id, 5 por pagina)');

const TAM_PAGINA = 5;
const totalIniciativas = db.getCollection(INI).countDocuments({ dataset_id: DATASET_ID });
const totalPaginas = Math.ceil(totalIniciativas / TAM_PAGINA);
const paginas = [];
for (let p = 0; p < totalPaginas; p++) {
  const docs = db.getCollection(INI)
    .find({ dataset_id: DATASET_ID }, { _id: 1, nombre: 1, sector: 1 })
    .sort({ sector: 1, _id: 1 })
    .skip(p * TAM_PAGINA)
    .limit(TAM_PAGINA)
    .toArray();
  paginas.push(docs);
  print('  Pagina ' + (p + 1) + ' (skip=' + (p * TAM_PAGINA) + ', limit=' + TAM_PAGINA + '): ' +
        (docs.length ? docs.map((d) => d._id + '/' + d.sector).join(', ') : '(vacia)'));
}
const paginaExtra = db.getCollection(INI)
  .find({ dataset_id: DATASET_ID }, { _id: 1 })
  .sort({ sector: 1, _id: 1 })
  .skip(totalPaginas * TAM_PAGINA)
  .limit(TAM_PAGINA)
  .toArray();
print('  Pagina ' + (totalPaginas + 1) + ' (fuera de rango): ' +
      (paginaExtra.length ? paginaExtra.map((d) => d._id).join(', ') : '(vacia)'));
print('  Total de iniciativas: ' + totalIniciativas + ' en ' + totalPaginas + ' paginas de ' + TAM_PAGINA + '.');

const esperadoPaginas = [
  ['INI-007', 'INI-012', 'INI-001', 'INI-003', 'INI-005'],
  ['INI-009', 'INI-011', 'INI-015', 'INI-002', 'INI-006'],
  ['INI-008', 'INI-013', 'INI-004', 'INI-010', 'INI-014']
];
const paginasOk = paginas.length === 3 && paginas.every((p, i) => JSON.stringify(p.map((d) => d._id)) === JSON.stringify(esperadoPaginas[i]));
if (!paginasOk) { discrepancias.push('C10: el contenido de las paginas no coincide con el esperado.'); }
resultados.push({
  id: 'C10',
  titulo: 'Paginacion de iniciativas por sector y _id (5 por pagina)',
  pregunta: 'Como recorro las iniciativas ordenadas por sector sin traerlas todas de una vez?',
  coleccion: INI,
  filtro: '{ dataset_id: "S03_UE_V1" } + .sort({ sector: 1, _id: 1 }) + .skip(n*5) + .limit(5)',
  conteo: totalPaginas + ' paginas de ' + TAM_PAGINA + ' (' + totalIniciativas + ' documentos)',
  esperado: '3 paginas (5 + 5 + 5)',
  ids: paginas.map((p) => p.map((d) => d._id).join(' | ')),
  coincide: paginasOk,
  aprendizaje: 'sort + skip + limit es la paginacion clasica. Ordenar por {sector: 1, _id: 1} garantiza un orden estable entre paginas, porque el _id nunca se repite.',
  detalle: []
});

/* ------------------------------------------- 5. consulta de continuidad E01 */
linea('Q04-E01 (continuidad con la guia de la Semana 1) - Asesorias pendientes por rango de fechas y modalidad');

const INICIO_OCT = new Date('2026-10-01T00:00:00.000Z');
const FIN_NOV = new Date('2026-11-30T23:59:59.999Z');
const pendientes = db.getCollection(ASE).find(
  { dataset_id: DATASET_ID, estado: { $in: ['programada', 'reprogramada'] }, fecha_programada: { $gte: INICIO_OCT, $lte: FIN_NOV } },
  { _id: 1, estado: 1, modalidad: 1, fecha_programada: 1, iniciativa_id: 1 }
).sort({ fecha_programada: 1, _id: 1 }).toArray();

const porModalidad = {};
for (const p of pendientes) {
  porModalidad[p.modalidad] = (porModalidad[p.modalidad] || 0) + 1;
}
print('  Filtro: { estado: { $in: ["programada", "reprogramada"] }, fecha_programada: { $gte: <2026-10-01>, $lte: <2026-11-30> } }');
print('  Asesorias pendientes: ' + pendientes.length + ' (esperado 9)');
for (const p of pendientes) {
  print('    ' + p._id + '  ' + p.fecha_programada.toISOString().slice(0, 10) + '  ' +
        String(p.modalidad).padEnd(11) + ' estado=' + p.estado + '  iniciativa=' + p.iniciativa_id);
}
print('  Conteo por modalidad (recorrido en JavaScript, sin $group): ' +
      Object.keys(porModalidad).sort().map((k) => k + '=' + porModalidad[k]).join(', '));

const q04ok = pendientes.length === 9 && porModalidad.virtual === 5 && porModalidad.presencial === 3 && porModalidad.telefonica === 1;
if (!q04ok) { discrepancias.push('Q04-E01: el conteo de asesorias pendientes no coincide con el esperado.'); }
resultados.push({
  id: 'Q04-E01',
  titulo: 'Asesorias pendientes por rango de fechas y modalidad (continuidad con la guia de la Semana 1)',
  pregunta: 'Que asesorias siguen pendientes entre el 1 de octubre y el 30 de noviembre y en que modalidad se haran?',
  coleccion: ASE,
  filtro: '{ estado: { $in: ["programada", "reprogramada"] }, fecha_programada: { $gte: IS(2026-10-01), $lte: IS(2026-11-30) } }',
  conteo: pendientes.length + ' pendientes (' + Object.keys(porModalidad).sort().map((k) => k + '=' + porModalidad[k]).join(', ') + ')',
  esperado: '9 pendientes (virtual=5, presencial=3, telefonica=1)',
  ids: pendientes.map((p) => p._id),
  coincide: q04ok,
  aprendizaje: 'Misma necesidad que la consulta Q04 de la Semana 1 (asesorias programadas pendientes por rango de fechas y modalidad), resuelta aqui sobre el dataset de la Semana 3.',
  detalle: []
});

/* ------------------------------------------- 6. reto de transferencia */
linea('RETO DE TRANSFERENCIA - Asesorias de septiembre 2026 y sector historico');

const INICIO_SEPT = new Date('2026-09-01T00:00:00.000Z');
const FIN_SEPT = new Date('2026-09-30T23:59:59.999Z');

const asesSeptiembre = db.getCollection(ASE).find(
  { dataset_id: DATASET_ID, estado: 'realizada', fecha_realizacion: { $gte: INICIO_SEPT, $lte: FIN_SEPT } },
  { _id: 1, iniciativa_id: 1, sector: 1, tipo: 1, modalidad: 1, fecha_realizacion: 1, fecha_programada: 1 }
).sort({ fecha_realizacion: 1, _id: 1 }).toArray();

print('  Filtro: { estado: "realizada", fecha_realizacion: { $gte: <2026-09-01>, $lte: <2026-09-30> } }');
print('  Asesorias realizadas en septiembre 2026: ' + asesSeptiembre.length + ' (esperado 14)');
for (const a of asesSeptiembre) {
  print('    ' + a._id + '  ' + a.fecha_realizacion.toISOString().slice(0, 10) +
        '  iniciativa=' + a.iniciativa_id + '  sector historico=' + a.sector);
}

// Cruce manual: sector historico de la asesoria vs sector actual de la iniciativa.
const CacheIniciativas = {};
const sectorActual = (idIniciativa) => {
  if (CacheIniciativas[idIniciativa] === undefined) {
    const doc = db.getCollection(INI).findOne({ _id: idIniciativa }, { sector: 1 });
    CacheIniciativas[idIniciativa] = doc ? doc.sector : '(iniciativa inexistente)';
  }
  return CacheIniciativas[idIniciativa];
};

const diferencias = [];
for (const a of asesSeptiembre) {
  const actual = sectorActual(a.iniciativa_id);
  if (actual !== a.sector) {
    diferencias.push({ asesoria: a._id, iniciativa: a.iniciativa_id, historico: a.sector, actual: actual });
  }
}

print('');
print('  Cruce con la coleccion de iniciativas (sin $lookup y sin $group):');
print('  Asesorias de septiembre cuyo sector historico NO coincide con el sector actual de la iniciativa: ' +
      diferencias.length + ' (esperado 1)');
for (const d of diferencias) {
  print('    ' + d.asesoria + ' -> ' + d.iniciativa + ' : sector historico="' + d.historico +
        '" vs sector actual="' + d.actual + '"');
}

const ini001 = db.getCollection(INI).findOne({ _id: 'INI-001' });
print('');
print('  Explicacion (historial_estados de INI-001):');
for (const h of ini001.historial_estados) {
  print('    ' + h.fecha.toISOString().slice(0, 10) + '  etapa=' + String(h.etapa).padEnd(18) +
        ' sector=' + String(h.sector).padEnd(20) + ' | ' + h.nota);
}
print('  INI-001 cambio de sector (alimentos -> economia_circular) el 2026-09-30;');
print('  ASE-001 se realizo el 2026-09-10, por eso guarda el sector historico "alimentos".');

const retoOk = asesSeptiembre.length === 14 && diferencias.length === 1 &&
               diferencias[0].asesoria === 'ASE-001' && diferencias[0].historico === 'alimentos' &&
               diferencias[0].actual === 'economia_circular';
if (!retoOk) { discrepancias.push('RETO: el resultado del reto de transferencia no es el esperado (14 asesorias, 1 diferencia ASE-001).'); }

resultados.push({
  id: 'RETO',
  titulo: 'Asesorias realizadas en septiembre 2026 y sector historico vs sector actual',
  pregunta: 'Cuantas asesorias se realizaron en septiembre de 2026 y en cuantas el sector guardado en la asesoria difiere del sector actual de la iniciativa?',
  coleccion: ASE + ' + ' + INI,
  filtro: '{ estado: "realizada", fecha_realizacion: { $gte: IS(2026-09-01), $lte: IS(2026-09-30) } }',
  conteo: asesSeptiembre.length + ' asesorias / ' + diferencias.length + ' diferencia(s) de sector',
  esperado: '14 asesorias / 1 diferencia (ASE-001: alimentos vs economia_circular)',
  ids: asesSeptiembre.map((a) => a._id),
  coincide: retoOk,
  aprendizaje: 'La asesoria guarda el sector como foto del momento en que ocurrio. Si hoy se lee el sector de la iniciativa se obtiene el valor actual y se pierde la historia: por eso el snapshot vive en el documento de la asesoria.',
  detalle: []
});

/* -------------------------------------- 7. comprobacion de solo lectura */
linea('7. Comprobacion de solo lectura');

let lecturaOk = true;
for (const c of [EMPR, INI, ASE]) {
  const ahora = db.getCollection(c).countDocuments({});
  const igual = ahora === conteosAntes[c];
  if (!igual) { lecturaOk = false; }
  print('  ' + c.padEnd(18) + ' antes=' + conteosAntes[c] + '  despues=' + ahora + '  ' + (igual ? '(sin cambios)' : '(CAMBIO DETECTADO)'));
}
if (!lecturaOk) { discrepancias.push('El script de consultas modifico alguna coleccion.'); }

const proyectos = db.getCollection(INI).countDocuments({});
print('  Documentos leidos en total (s03_iniciativas): ' + proyectos);

/* --------------------------------------------- 8. archivo de resultados */
linea('8. Archivo de resultado');

if (!fs.existsSync(DIR_RESULTADOS)) {
  fs.mkdirSync(DIR_RESULTADOS, { recursive: true });
}
const destino = path.join(DIR_RESULTADOS, 'resultados_consultas.md');

const md = [];
md.push('# Resultados de las consultas C01 - C10 y del reto de transferencia (E03 - Semana 3)');
md.push('');
md.push('> Archivo generado automaticamente por `scripts/03_consultas_aprendiz.js` sobre la base real del laboratorio.');
md.push('> Todas las consultas son de solo lectura: los conteos de las tres colecciones se comparan antes y despues.');
md.push('');
md.push('| Dato | Valor |');
md.push('| --- | --- |');
md.push('| Base de datos | `' + BASE_DATOS + '` |');
md.push('| Dataset | `' + DATASET_ID + '` |');
md.push('| Fecha de ejecucion | ' + sello + ' |');
md.push('| Consultas ejecutadas | ' + resultados.length + ' |');
md.push('| Discrepancias | ' + discrepancias.length + ' |');
md.push('| Modificacion de datos | ' + (lecturaOk ? 'ninguna (solo lectura)' : 'DETECTADA') + ' |');
md.push('');
md.push('## Cuadro de resultados');
md.push('');
md.push('| Id | Consulta | Resultado | Esperado | Estado |');
md.push('| --- | --- | ---: | ---: | --- |');
for (const r of resultados) {
  md.push('| ' + r.id + ' | ' + r.titulo + ' | ' + r.conteo + ' | ' + r.esperado + ' | ' + (r.coincide ? 'COINCIDE' : 'DISCREPANCIA') + ' |');
}
md.push('');
md.push('## Detalle de cada consulta');
for (const r of resultados) {
  md.push('');
  md.push('### ' + r.id + ' - ' + r.titulo);
  md.push('');
  md.push('- **Pregunta:** ' + r.pregunta);
  md.push('- **Coleccion:** `' + r.coleccion + '`');
  md.push('- **Filtro:** `' + r.filtro + '`');
  md.push('- **Resultado real:** ' + r.conteo);
  md.push('- **Valor esperado:** ' + r.esperado);
  md.push('- **Estado:** ' + (r.coincide ? 'COINCIDE' : 'DISCREPANCIA'));
  if (r.ids && r.ids.length) {
    md.push('- **Identificadores devueltos:** ' + (Array.isArray(r.ids[0]) ? r.ids.map((x) => x.join(' | ')).join(' / ') : r.ids.join(', ')));
  }
  md.push('- **Aprendizaje:** ' + r.aprendizaje);
  if (r.detalle && r.detalle.length) {
    md.push('');
    md.push('```');
    for (const d of r.detalle) {
      md.push(EJSON.stringify(d, null, 2));
    }
    md.push('```');
  }
}
md.push('');
md.push('## Reto de transferencia');
md.push('');
md.push('1. **asesorias realizadas en septiembre de 2026:** ' + asesSeptiembre.length);
md.push('2. **asesorias cuyo sector historico difiere del sector actual de la iniciativa:** ' + diferencias.length);
md.push('');
if (diferencias.length) {
  md.push('| Asesoria | Iniciativa | Sector historico (guardado en la asesoria) | Sector actual (de la iniciativa) |');
  md.push('| --- | --- | --- | --- |');
  for (const d of diferencias) {
    md.push('| ' + d.asesoria + ' | ' + d.iniciativa + ' | ' + d.historico + ' | ' + d.actual + ' |');
  }
  md.push('');
}
md.push('El cruce se resolvio con dos consultas de lectura y un recorrido en JavaScript:');
md.push('sin `$group`, sin `$lookup` y sin `$unwind`, que son las agregaciones reservadas para la semana siguiente.');
md.push('');
md.push('## Comprobacion de solo lectura');
md.push('');
md.push('| Coleccion | Documentos antes | Documentos despues |');
md.push('| --- | ---: | ---: |');
for (const c of [EMPR, INI, ASE]) {
  md.push('| `' + c + '` | ' + conteosAntes[c] + ' | ' + db.getCollection(c).countDocuments({}) + ' |');
}
md.push('');

if (discrepancias.length) {
  md.push('## Discrepancias detectadas');
  md.push('');
  for (const d of discrepancias) { md.push('- ' + d); }
  md.push('');
}

fs.writeFileSync(destino, md.join('\n'), 'utf8');
print('  [OK]    Resultados escritos en ' + destino);

print('');
if (discrepancias.length > 0) {
  print('  Se detectaron ' + discrepancias.length + ' discrepancia(s):');
  discrepancias.forEach((d) => print('   - ' + d));
  quit(1);
}
print('  Todas las consultas coinciden con los valores esperados de la matriz C01 - C10.');
quit(0);
