// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  // Aplicación interna detrás de login: se renderiza solo en el navegador.
  // La sesión Sanctum vive en cookies de la API, que el servidor de Nuxt no recibe.
  ssr: false,
  runtimeConfig: {
    public: {
      apiBase: '',
    },
  },
})
