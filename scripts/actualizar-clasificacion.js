#!/usr/bin/env node
// Descarga la clasificación publicada por la FFCM (ffcm.es) y actualiza los
// ficheros de src/content/clasificacion/*.json con los datos de la jornada
// indicada (o de la misma jornada ya guardada, si no se indica ninguna).
//
// Uso:
//   node scripts/actualizar-clasificacion.js            # refresca la jornada guardada en cada fichero
//   node scripts/actualizar-clasificacion.js 5          # descarga la jornada 5 para todos los ficheros
//   node scripts/actualizar-clasificacion.js --auto     # usa la última jornada ya disputada según src/content/partidos (para CI; incluye jornadas de descanso)
//
// La URL de origen (cod_primaria/codcompeticion/codgrupo) se lee del campo
// "fuente" que ya guarda cada fichero de clasificación.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CLASIFICACION_DIR = join(ROOT, 'src/content/clasificacion');
const PARTIDOS_DIR = join(ROOT, 'src/content/partidos');

// Nombres "bonitos" ya usados en el sitio para los equipos de esta
// competición. La FFCM los publica en mayúsculas y sin acentos; cuando
// aparezca un equipo nuevo (ascenso/descenso) no estará aquí y el script
// generará un nombre aproximado avisando para que se revise a mano.
const NOMBRES_EQUIPO = {
  'FUTBOL SALA QUINTANAR DEL REY': 'Fútbol Sala Quintanar del Rey',
  'C.D. EL PEDERNOSO': 'C.D. El Pedernoso',
  'EL BONILLO F.S.': 'El Bonillo F.S.',
  'ALMANTOUR RADO PAKOLO F.S': 'Almantour Rado Pakolo F.S.',
  'C.D. QUINTANAR F.S. BIOPASTIS': 'C.D. Quintanar F.S. Biopastis',
  'C.D. PEÑAS DE SAN PEDRO': 'C.D. Peñas de San Pedro',
  'C.D. TEATINOS F.S.': 'C.D. Teatinos F.S.',
  'BALNEARIO DE BENITO VILLANUEVA FUTSAL': 'Balneario de Benito Villanueva Futsal',
  'BALAZOTE F.S.': 'Balazote F.S.',
  'UNION DEPORTIVA ALBACETE FUTSAL "B"': 'U.D. Albacete Futsal "B"',
  'TOBARRA F.S.': 'Tobarra F.S.',
  'C.D. LEZUZA': 'C.D. Lezuza',
  'C.D. FUTSAL ALMORADIEL': 'C.D. Futsal Almoradiel',
};

const TITULO_RESULTADO = { Ganado: 'G', Empatado: 'E', Perdido: 'P' };
const MINUSCULAS = new Set(['de', 'del', 'la', 'los', 'las', 'y']);

function formatearNombreEquipo(nombreCrudo) {
  const clave = nombreCrudo.trim().replace(/\s+/g, ' ');
  const conocido = NOMBRES_EQUIPO[clave.toUpperCase()];
  if (conocido) return conocido;

  console.warn(`  ! Equipo no reconocido, revisa el nombre a mano: "${clave}"`);
  return clave
    .split(' ')
    .map((palabra, i) => {
      if (/^[A-Z]\.([A-Z]\.)+$/.test(palabra)) return palabra; // C.D. / F.S. / U.D.
      if (/^".+"$/.test(palabra)) return palabra; // "B"
      const minuscula = palabra.toLowerCase();
      if (i > 0 && MINUSCULAS.has(minuscula)) return minuscula;
      return minuscula.charAt(0).toUpperCase() + minuscula.slice(1);
    })
    .join(' ');
}

function limpiarTexto(html) {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

async function descargarHtml(url) {
  const cabeceras = { 'User-Agent': 'Mozilla/5.0' };
  const timeout = AbortSignal.timeout(30_000);
  // La FFCM exige una sesión: la primera petición responde 302 y fija la
  // cookie JSESSIONID; con esa cookie la segunda petición ya sirve el HTML.
  const primera = await fetch(url, { headers: cabeceras, redirect: 'manual', signal: timeout });
  const cookies = primera.headers.getSetCookie();
  if (cookies.length === 0) {
    throw new Error(`No se ha recibido cookie de sesión (status ${primera.status}) para ${url}`);
  }
  const cookieHeader = cookies.map((c) => c.split(';')[0]).join('; ');
  const segunda = await fetch(url, { headers: { ...cabeceras, Cookie: cookieHeader }, signal: timeout });
  if (!segunda.ok) {
    throw new Error(`HTTP ${segunda.status} al descargar ${url}`);
  }
  const buffer = await segunda.arrayBuffer();
  return Buffer.from(buffer).toString('latin1'); // la FFCM sirve ISO-8859-15
}

function parsearClasificacion(html) {
  const inicioTabla = html.indexOf('<table');
  const finTabla = html.indexOf('</table>', inicioTabla);
  if (inicioTabla === -1 || finTabla === -1) {
    throw new Error('No se ha encontrado la tabla de clasificación en el HTML descargado');
  }
  const tabla = html.slice(inicioTabla, finTabla);

  const equipos = [];
  const filaRe = /<tr>([\s\S]*?)<\/tr>/g;
  let fila;
  while ((fila = filaRe.exec(tabla))) {
    const contenidoFila = fila[1];
    if (!contenidoFila.includes('NFG_VisCompeticiones_Grupo')) continue; // cabeceras, no filas de equipo

    const tds = [...contenidoFila.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
    if (tds.length < 17) {
      console.warn('  ! Fila con estructura inesperada, se omite:', limpiarTexto(contenidoFila).slice(0, 80));
      continue;
    }

    const num = (i) => Number(limpiarTexto(tds[i]));
    const ultimos = [...tds[15].matchAll(/title=(\w+)/g)].map((m) => TITULO_RESULTADO[m[1]] ?? m[1][0]);

    equipos.push({
      posicion: num(1),
      equipo: formatearNombreEquipo(limpiarTexto(tds[2])),
      puntos: num(4),
      casa: { jugados: num(5), ganados: num(6), empatados: num(7), perdidos: num(8) },
      fuera: { jugados: num(9), ganados: num(10), empatados: num(11), perdidos: num(12) },
      golesFavor: num(13),
      golesContra: num(14),
      ultimos,
      puntosSancion: num(16),
    });
  }

  if (equipos.length === 0) {
    throw new Error('La tabla se ha encontrado pero no se ha podido extraer ningún equipo');
  }
  return equipos;
}

const DIA_MS = 24 * 60 * 60 * 1000;
const aISO = (ms) => new Date(ms).toISOString().slice(0, 10);

// Mapa jornada -> fecha (YYYY-MM-DD) de la competición, a partir de los
// partidos de El Bonillo. Somos un grupo impar y cada semana descansa un
// equipo: las jornadas en las que descansamos no tienen fichero en
// src/content/partidos, así que se estiman como una semana después de la
// jornada anterior conocida (las jornadas son semanales).
function fechasJornadas(competicion) {
  const conocidas = new Map();
  for (const nombreFichero of readdirSync(PARTIDOS_DIR)) {
    const partido = JSON.parse(readFileSync(join(PARTIDOS_DIR, nombreFichero), 'utf8'));
    if (partido.competicion !== competicion || !partido.jornada) continue;
    const fecha = partido.fecha.slice(0, 10);
    const previa = conocidas.get(partido.jornada);
    if (!previa || fecha < previa) conocidas.set(partido.jornada, fecha);
  }

  const numeros = [...conocidas.keys()];
  const fechas = new Map();
  if (numeros.length === 0) return fechas;
  const max = Math.max(...numeros);
  let anterior = null;
  for (let j = Math.min(...numeros); j <= max; j++) {
    if (conocidas.has(j)) {
      anterior = conocidas.get(j);
    } else if (anterior) {
      anterior = aISO(Date.parse(anterior) + 7 * DIA_MS); // jornada de descanso
    }
    fechas.set(j, anterior);
  }
  return fechas;
}

// Última jornada de la competición cuya fecha es anterior a hoy, incluidas
// las jornadas en las que El Bonillo descansa. Null si no hay ninguna.
function ultimaJornadaDisputada(competicion) {
  const hoy = new Date().toISOString().slice(0, 10);
  let ultima = null;
  for (const [jornada, fecha] of fechasJornadas(competicion)) {
    if (fecha < hoy && (ultima === null || jornada > ultima)) ultima = jornada;
  }
  return ultima;
}

async function actualizarFichero(nombreFichero, jornadaSolicitada, auto) {
  const ruta = join(CLASIFICACION_DIR, nombreFichero);
  const actual = JSON.parse(readFileSync(ruta, 'utf8'));

  const urlFuente = new URL(actual.fuente);
  const jornada =
    jornadaSolicitada ?? (auto ? ultimaJornadaDisputada(actual.competicion) : null) ?? actual.jornada;
  urlFuente.searchParams.set('codjornada', String(jornada));

  console.log(`\n${nombreFichero}: descargando jornada ${jornada} de ${actual.competicion}...`);
  const html = await descargarHtml(urlFuente.toString());
  const equipos = parsearClasificacion(html);

  let fechaJornada = fechasJornadas(actual.competicion).get(jornada);
  if (!fechaJornada) {
    fechaJornada = new Date().toISOString().slice(0, 10);
    console.warn(`  ! No se ha podido determinar la fecha de la jornada ${jornada} desde src/content/partidos; se usa la fecha de hoy (${fechaJornada}).`);
  }

  const actualizado = {
    competicion: actual.competicion,
    temporada: actual.temporada,
    jornada,
    fechaJornada,
    fuente: urlFuente.toString(),
    equipos,
  };

  writeFileSync(ruta, JSON.stringify(actualizado, null, 2) + '\n');

  const bonillo = equipos.find((e) => e.equipo === 'El Bonillo F.S.');
  console.log(`  ✓ ${equipos.length} equipos guardados.` + (bonillo ? ` El Bonillo F.S. -> posición ${bonillo.posicion}, ${bonillo.puntos} pts.` : ''));
}

async function main() {
  const args = process.argv.slice(2);
  const auto = args.includes('--auto');
  const jornadaArg = args.find((a) => !a.startsWith('--'));
  const jornadaSolicitada = jornadaArg ? Number(jornadaArg) : null;
  if (jornadaArg && !Number.isInteger(jornadaSolicitada)) {
    console.error(`Jornada inválida: "${jornadaArg}"`);
    process.exit(1);
  }

  const ficheros = readdirSync(CLASIFICACION_DIR).filter((f) => f.endsWith('.json'));
  for (const fichero of ficheros) {
    try {
      await actualizarFichero(fichero, jornadaSolicitada, auto);
    } catch (err) {
      console.error(`  ✗ Error actualizando ${fichero}: ${err.message}`);
      process.exitCode = 1;
    }
  }
}

main();
