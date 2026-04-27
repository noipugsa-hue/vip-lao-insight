export default {
  darkMode: 'class', // เปิดใช้งาน dark mode ด้วย class
  content: [
    './app.vue',
    './pages/**/*.{vue,js,ts}',
    './components/**/*.{vue,js,ts}',
    './composables/**/*.{js,ts}'
  ],
  theme: {
    extend: {
      colors: {
        vipGreen: '#0f5132',
        vipGold: '#d4af37'
      }
    }
  },
  plugins: []
}