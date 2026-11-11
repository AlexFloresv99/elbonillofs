FROM node:24.22.1-slim

# Crear usuario no privilegiado para seguridad
RUN useradd -m -u 1001 claude

# Instalación de dependencias del sistema requeridas
RUN apt-get update && apt-get install -y \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instalación global de Claude Code
RUN npm install -g @anthropic-ai/claude-code

# Directorio de trabajo
WORKDIR /workspace

# Exponer el puerto por defecto de desarrollo de Astro (4321)
EXPOSE 4321

# Cambiar a usuario claude
USER claude

# Comando principal
ENTRYPOINT ["claude"]