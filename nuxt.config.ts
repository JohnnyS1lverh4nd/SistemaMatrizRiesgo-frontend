// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  // Aplicación interna detrás de login: se renderiza solo en el navegador.
  // La sesión Sanctum vive en cookies de la API, que el servidor de Nuxt no recibe.
  ssr: false,
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  icon: {
    // Iconos empaquetados en la aplicación (colección @iconify-json/lucide):
    // el navegador no consulta la API pública de Iconify, lo que importa en
    // la red interna del DRO.
    provider: 'none',
    fallbackToApi: false,
    clientBundle: {
      scan: true,
    },
  },
  runtimeConfig: {
    public: {
      apiBase: '',
    },
  },
})
