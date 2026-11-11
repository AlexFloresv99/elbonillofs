import type { CollectionEntry } from 'astro:content';

export type Partido = CollectionEntry<'partidos'>;

export const NOMBRE_CLUB = 'El Bonillo F.S.';
const ZONA = 'Europe/Madrid';

export const esLocal = (p: Partido) => p.data.equipoLocal === NOMBRE_CLUB;

export const rival = (p: Partido) =>
  esLocal(p) ? p.data.equipoVisitante : p.data.equipoLocal;

export const ordenarPorFecha = (partidos: Partido[]) =>
  [...partidos].sort((a, b) => a.data.fecha.valueOf() - b.data.fecha.valueOf());

export const proximoPartido = (partidos: Partido[]) =>
  ordenarPorFecha(partidos).find((p) => !p.data.finalizado);

const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('es-ES', { timeZone: ZONA, ...opts });

export const formatoFecha = {
  dia: (d: Date) => fmt({ day: 'numeric' }).format(d),
  mes: (d: Date) => fmt({ month: 'short' }).format(d).replace('.', ''),
  diaSemana: (d: Date) => fmt({ weekday: 'long' }).format(d),
  larga: (d: Date) => fmt({ weekday: 'long', day: 'numeric', month: 'long' }).format(d),
  hora: (d: Date) => fmt({ hour: '2-digit', minute: '2-digit' }).format(d),
};
