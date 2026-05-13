export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  css: ['../assets/css/main.css'],
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/icon',
  ],
  vite: {
    optimizeDeps: {
      include: ['sweetalert2'],
    },
  },
})
