# Club Deportivo El Bonillo Fútbol Sala — Web Oficial

Sitio web oficial del club, construido con [Astro](https://astro.build/) y [Tailwind CSS](https://tailwindcss.com/). Ver [`AGENTS.md`](./AGENTS.md) para el contexto completo del proyecto.

## 🚀 Estructura del proyecto

```text
/
├── public/
├── src/
│   ├── components/
│   │   ├── ui/          # Componentes genéricos (botones, tarjetas, modales)
│   │   └── football/    # Componentes de dominio (partidos, jugadores)
│   ├── content/          # Colecciones de contenido (jugadores, partidos, noticias, patrocinadores)
│   ├── layouts/          # Layouts principales (Header, Footer, Meta SEO)
│   ├── styles/            # Estilos globales y tema de Tailwind
│   └── pages/             # Rutas del sitio
└── package.json
```

Las colecciones en `src/content/` usan un `loader` local (JSON) como sustituto temporal hasta que se conecte el CMS headless (Strapi o Sanity).

## 🧞 Comandos

Todos los comandos se ejecutan desde la raíz del proyecto:

| Comando             | Acción                                           |
| :------------------ | :------------------------------------------------ |
| `npm install`        | Instala las dependencias                          |
| `npm run dev`         | Inicia el servidor de desarrollo en `localhost:4321` |
| `npm run build`       | Compila el sitio de producción en `./dist/`        |
| `npm run preview`     | Previsualiza el build localmente                   |
| `npm run astro ...`   | Ejecuta comandos de la CLI de Astro (`astro check`, etc.) |

## Requisitos

* Node.js ≥22.23.4 (ver `.nvmrc` / `Dockerfile`, fijado en v24.22.1).
* Si usas [nvm](https://github.com/nvm-sh/nvm), ejecuta `nvm use` en la raíz del proyecto para activar la versión correcta automáticamente.
