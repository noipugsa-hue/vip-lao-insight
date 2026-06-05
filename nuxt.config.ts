// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss','@nuxt/eslint','@nuxtjs/sitemap','@vite-pwa/nuxt',],
  css: ['~/assets/css/main.css'],

  // SEO และ Meta Tags
  app: {
    head: {
      title: 'Numora Lotto AI - ทำนายหวย วิเคราะห์หวยลาว หวยรัฐบาล',
      htmlAttrs: {
        lang: 'th',
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'ระบบทำนายและวิเคราะห์หวยอัจฉริยะ เลขเด่น เลข 2 ตัว 3 ตัว ทำนายฝัน สูตรหวย พร้อมสถิติเลขที่ถูกรางวัลจริง วิเคราะห์หวยลาว หวยรัฐบาล หวยฮานอย'
        },
        {
          name: 'keywords',
          content: 'ทำนายหวย, เลขเด่น, หวยลาว, หวยรัฐบาล, หวยฮานอย, วิเคราะห์หวย, เลข 2 ตัว, เลข 3 ตัว, ทำนายฝัน, สูตรหวย, ตรวจหวย, ผลหวย, หวยออนไลน์'
        },
        { name: 'author', content: 'Numora Lotto AI' },
        { name: 'robots', content: 'index, follow' },
        // Open Graph / Facebook
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Numora Lotto AI' },
        { property: 'og:title', content: 'Numora Lotto AI - ทำนายหวย วิเคราะห์หวยลาว หวยรัฐบาล' },
        {
          property: 'og:description',
          content: 'ระบบทำนายและวิเคราะห์หวยอัจฉริยะ เลขเด่น เลข 2 ตัว 3 ตัว ทำนายฝัน พร้อมสถิติเลขที่ถูกรางวัลจริง'
        },
        { property: 'og:locale', content: 'th_TH' },
        { property: 'og:url', content: 'https://vip-lao-insight.vercel.app' },
        { property: 'og:image', content: 'https://vip-lao-insight.vercel.app/og-image.svg' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: 'Numora Lotto AI - ทำนายหวยด้วย AI · วิเคราะห์แม่นยำ' },
        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: 'https://vip-lao-insight.vercel.app/og-image.svg' },
        { name: 'twitter:title', content: 'Numora Lotto AI - ทำนายหวย วิเคราะห์หวยลาว' },
        {
          name: 'twitter:description',
          content: 'ระบบทำนายและวิเคราะห์หวยอัจฉริยะ เลขเด่น เลข 2 ตัว 3 ตัว'
        },
        // Mobile
        { name: 'theme-color', content: '#9333ea' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'canonical', href: 'https://vip-lao-insight.vercel.app' },
        { rel: 'manifest', href: '/manifest.json' },
        { rel: 'apple-touch-icon', href: '/icon-192x192.png' },
      ],
    },
  },

  // ใช้ SSR mode สำหรับ server API endpoints
  // Pages จะ render เป็น SPA ตาม routeRules
  ssr: true,

  // ตั้งค่า route rules: landing page เป็น SSR (SEO), pages อื่นเป็น client-side (SPA)
  routeRules: {
    // API endpoints ทำงานบน server
    '/api/**': { cors: true },
    // Landing page render แบบ SSR สำหรับ SEO
    '/': { ssr: true },
    // Pages อื่นๆ render แบบ client-side (SPA)
    '/**': { ssr: false },
  },

  // ตั้งค่า Nitro สำหรับ Vercel
  nitro: {
    preset: 'vercel',
  },

  srcDir: 'src/',
  components: [
    {
      path: '~/components',
      pathPrefix: false,
      extensions: ['vue'],
    },
  ],
  eslint: {
    config: {
      stylistic: true,
    },
  },

  // Sitemap configuration
  sitemap: {
    hostname: 'https://vip-lao-insight.vercel.app',
    gzip: true,
    routes: [
      '/',
      '/home',
      '/login',
      '/lottery-history',
      '/check-prize',
      '/my-numbers',
      '/statistics',
      '/referral',
      '/formula',
      '/manual',
      '/two-digit',
      '/three-digit',
      '/dream',
      '/win5',
      '/range',
      '/pricing',
      '/payment',
      '/subscription',
      '/winning-numbers',
    ],
    exclude: [
      '/admin/**',
      '/stats',
    ],
  },

  // PWA configuration
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Numora Lotto AI - ทำนายหวย วิเคราะห์หวยลาว',
      short_name: 'Numora Lotto',
      description: 'ระบบทำนายและวิเคราะห์หวยอัจฉริยะ เลขเด่น เลข 2 ตัว 3 ตัว ทำนายฝัน',
      theme_color: '#9333ea',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: '/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable',
        },
        {
          src: '/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB (เพิ่มจาก default 2 MB)
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'gstatic-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          urlPattern: /^https:\/\/.*\.firebaseio\.com\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'firebase-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
            },
          },
        },
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images-cache',
            expiration: {
              maxEntries: 60,
              maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
            },
          },
        },
      ],
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600, // Check for updates every hour
    },
    devOptions: {
      enabled: true,
      type: 'module',
    },
  },
})
