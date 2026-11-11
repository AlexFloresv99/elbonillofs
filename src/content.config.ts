import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'zod';

// Nota: los `loader` locales (glob sobre JSON/Markdown) son un sustituto
// temporal. Cuando se conecte el CMS headless (Strapi/Sanity), estos
// `loader` se sustituirán por uno que consuma la API externa, manteniendo
// los mismos `schema` para no romper el resto del sitio.

const jugadores = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/jugadores' }),
  schema: z.object({
    nombre: z.string(),
    apellidos: z.string(),
    dorsal: z.number().int().min(0).max(99),
    posicion: z.enum(['Portero', 'Cierre', 'Ala', 'Pívot', 'Entrenador']),
    categoria: z.string(),
    foto: z.string().optional(),
    estadisticas: z
      .object({
        partidosJugados: z.number().int().default(0),
        goles: z.number().int().default(0),
        tarjetasAmarillas: z.number().int().default(0),
        tarjetasRojas: z.number().int().default(0),
      })
      .optional(),
  }),
});

const partidos = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/partidos' }),
  schema: z.object({
    equipoLocal: z.string(),
    equipoVisitante: z.string(),
    fecha: z.coerce.date(),
    // La federación publica la hora unos días antes. Mientras tanto, `fecha`
    // solo indica el día de la jornada y la hora no debe mostrarse.
    horaPorConfirmar: z.boolean().default(false),
    ubicacion: z.string(),
    categoria: z.string(),
    competicion: z.string().optional(),
    jornada: z.number().int().optional(),
    resultado: z
      .object({
        golesLocal: z.number().int(),
        golesVisitante: z.number().int(),
      })
      .optional(),
    finalizado: z.boolean().default(false),
  }),
});

const noticias = defineCollection({
  loader: glob({ pattern: '**/*.{json,md}', base: './src/content/noticias' }),
  schema: z.object({
    titulo: z.string(),
    resumen: z.string(),
    fechaPublicacion: z.coerce.date(),
    autor: z.string().optional(),
    imagenPortada: z.string().optional(),
  }),
});

const patrocinadores = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/patrocinadores' }),
  schema: z.object({
    nombre: z.string(),
    logo: z.string(),
    url: z.url().optional(),
    nivel: z.enum(['Main Sponsor', 'Colaborador', 'Proveedor Oficial']),
  }),
});

const balance = z.object({
  jugados: z.number().int().min(0),
  ganados: z.number().int().min(0),
  empatados: z.number().int().min(0),
  perdidos: z.number().int().min(0),
});

// Una entrada por competición: la tabla tal y como queda tras `jornada`.
const clasificacion = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/clasificacion' }),
  schema: z.object({
    competicion: z.string(),
    temporada: z.string(),
    jornada: z.number().int(),
    fechaJornada: z.coerce.date(),
    fuente: z.url().optional(),
    equipos: z.array(
      z.object({
        posicion: z.number().int().min(1),
        equipo: z.string(),
        puntos: z.number().int(),
        casa: balance,
        fuera: balance,
        golesFavor: z.number().int().min(0),
        golesContra: z.number().int().min(0),
        // Últimos resultados en el orden en que los publica la federación.
        ultimos: z.array(z.enum(['G', 'E', 'P'])).default([]),
        puntosSancion: z.number().int().default(0),
      })
    ),
  }),
});

export const collections = { jugadores, partidos, noticias, patrocinadores, clasificacion };
