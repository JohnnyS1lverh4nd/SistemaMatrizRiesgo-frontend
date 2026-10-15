# Imagen del servidor web: la SPA de Nuxt generada como archivos estáticos,
# servida por Nginx. La configuración de Nginx (rutas a la API, HTTPS) la monta
# compose.yaml desde el repositorio de la API.
#
#   docker build -t smr-web .

# --- Etapa 1: generar los archivos estáticos -------------------------------------
FROM node:24-bookworm-slim AS build

WORKDIR /app
COPY package.json package-lock.json ./
# Sin scripts de instalación: "nuxt generate" prepara el proyecto por su cuenta.
RUN npm ci --ignore-scripts --no-audit --no-fund

COPY . .
# Mismo dominio que la API: rutas relativas ("/api/...").
ENV NUXT_PUBLIC_API_BASE=""
RUN npm run generate

# --- Etapa 2: solo Nginx y los archivos generados ---------------------------------
FROM nginx:1.28-alpine

RUN rm -f /etc/nginx/conf.d/default.conf
COPY --from=build /app/.output/public /usr/share/nginx/html
