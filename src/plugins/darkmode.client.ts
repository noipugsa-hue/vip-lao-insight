/**
 * Dark Mode Plugin
 * Initialize dark mode ทันทีที่ app start
 */

export default defineNuxtPlugin(() => {
  // โหลดการตั้งค่าจาก localStorage
  if (typeof window !== 'undefined') {
    const STORAGE_KEY = 'vip-lao-dark-mode'
    const saved = localStorage.getItem(STORAGE_KEY)

    let isDark = false

    if (saved !== null) {
      // ใช้ค่าที่บันทึกไว้
      isDark = saved === 'true'
    } else {
      // ใช้ค่าจาก system preference
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    }

    // Apply dark mode class ทันที
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
})
