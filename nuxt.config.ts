// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss','@nuxt/eslint','@nuxtjs/sitemap',],
  css: ['~/assets/css/main.css'],

  // SEO และ Meta Tags
  app: {
    head: {
      title: 'VIP Lao Insight - ทำนายหวย วิเคราะห์หวยลาว หวยรัฐบาล',
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
        { name: 'author', content: 'VIP Lao Insight' },
        { name: 'robots', content: 'index, follow' },
        // Open Graph / Facebook
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'VIP Lao Insight' },
        { property: 'og:title', content: 'VIP Lao Insight - ทำนายหวย วิเคราะห์หวยลาว หวยรัฐบาล' },
        {
          property: 'og:description',
          content: 'ระบบทำนายและวิเคราะห์หวยอัจฉริยะ เลขเด่น เลข 2 ตัว 3 ตัว ทำนายฝัน พร้อมสถิติเลขที่ถูกรางวัลจริง'
        },
        { property: 'og:locale', content: 'th_TH' },
        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'VIP Lao Insight - ทำนายหวย วิเคราะห์หวยลาว' },
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
      ],
    },
  },

  // ใช้ SSR mode สำหรับ server API endpoints
  // Pages จะ render เป็น SPA ตาม routeRules
  ssr: true,

  // ตั้งค่า route rules: pages เป็น client-side (SPA), API endpoints เป็น server-side
  routeRules: {
    // API endpoints ทำงานบน server
    '/api/**': { cors: true },
    // Pages ทั้งหมด render แบบ client-side (SPA)
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
})
