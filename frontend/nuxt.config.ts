export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  css: ['../assets/css/main.css'],
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/icon',
  ],
  components: [
    { path: '~/components/ui', pathPrefix: false },
    { path: '~/components/domain', pathPrefix: false },
  ],
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000',
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'es' },
      title: 'PIA-IA · Cartilla Digital de Vacunación',
      titleTemplate: (title?: string) =>
        title && title.length > 0 && title !== 'PIA-IA · Cartilla Digital de Vacunación'
          ? `${title} · PIA-IA`
          : 'PIA-IA · Cartilla Digital de Vacunación',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        {
          name: 'description',
          content:
            'Cartilla nacional digital de vacunación. Consulta, gestiona y comparte tu historial con la Secretaría de Salud.',
        },
        { name: 'theme-color', content: '#0E5037' },
        { name: 'color-scheme', content: 'light' },
        { property: 'og:title', content: 'PIA-IA · Cartilla Digital de Vacunación' },
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'es_MX' },
        {
          property: 'og:description',
          content:
            'Consulta y gestiona tu cartilla de vacunación oficial. Acceso ciudadano y panel administrativo de salud.',
        },
      ],
      link: [
        { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/pia-favicon.png' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/pia-favicon.png' },
        { rel: 'shortcut icon', href: '/pia-favicon.png' },
        { rel: 'apple-touch-icon', href: '/pia-favicon.png' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
      ],
    },
  },
  vite: {
    optimizeDeps: {
      include: ['sweetalert2'],
    },
  },
})
