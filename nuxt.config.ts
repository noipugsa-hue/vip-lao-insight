// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss','@nuxt/eslint',],
  css: ['~/assets/css/main.css'],

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
})
