# Contexto del Proyecto: Sitio Web Oficial del Club Deportivo El Bonillo Fútbol Sala

## 1. Descripción General
Este repositorio contiene el código fuente para la página web oficial del club. El objetivo es ofrecer un sitio web ultrarrápido, moderno, accesible y optimizado para SEO, orientado a socios, aficionados, jugadores y patrocinadores. Se trata de un club deportivo de un pueblo de Castilla La Mancha llamado El Bonillo. Nuestros colores coorporativos son el morado y el amarillo, por lo que la web tiene que tender hacia esa gama de colores. 

## 2. Stack Tecnológico
* **Framework Web:** [Astro](https://astro.build/) (Renderizado estático/SSG con islas interactivas cuando sea necesario).
* **Estilos:** [Tailwind CSS](https://tailwindcss.com/) (Enfoque utility-first, diseño adaptativo y responsive).
* **Gestor de Contenido (CMS Headless):** Conexión posterior mediante API con **Strapi** o **Sanity** (por definir).
* **Entorno:** Node.js (v24.x+).

## 3. Módulos Clave a Desarrollar

1. **Calendario y Resultados:**
   * Lista de próximos partidos con horarios y ubicaciones.
   * Marcadores de partidos finalizados y tabla de clasificación actualizada.
2. **Plantilla y Fichas de Jugadores:**
   * Listado del cuerpo técnico y plantilla por categorías/posiciones.
   * Tarjetas o páginas de perfil para cada jugador con foto y estadísticas.
3. **Noticias y Crónicas:**
   * Sección de actualidad, comunicados oficiales y resúmenes de las jornadas.
4. **Patrocinadores y Sponsors:**
   * Mapeo de banners y marcas colaboradoras clasificadas por nivel (Main Sponsor, Colaborador, etc.).
5. **Inscripciones y Contacto:**
   * Formularios de captación para nuevos jugadores, socias/os y contacto general.

## 4. Guías de Estilo y Código para la IA

* **Componentes Astro:** Priorizar componentes puros de `.astro`. Utilizar componentes del cliente (React/Svelte/Vue) únicamente si se requiere interactividad compleja en el navegador (`client:load`, `client:visible`).
* **Estilos con Tailwind:** Usar clases utilitarias directamente en el marcado HTML/Astro. Mantener coherencia con la paleta de colores institucional del club.
* **Arquitectura de Componentes:**
  * `src/components/ui/`: Componentes genéricos de interfaz (botones, tarjetas, modales).
  * `src/components/football/`: Componentes específicos del dominio (marcadores, listas de jugadores, tablas).
  * `src/layouts/`: Layouts principales (Header, Footer, Meta etiquetas SEO).
  * `src/pages/`: Rutas del sitio.
* **Preparación para CMS:** Diseñar las estructuras de datos e interfaces de TypeScript pensando en que los datos vendrán de una API externa (Strapi/Sanity) a través de colecciones de Astro (`src/content/config.ts`).