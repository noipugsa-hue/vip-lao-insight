/**
 * useDarkMode
 * Composable สำหรับจัดการ Dark Mode
 */

import { ref, watch } from 'vue'

const STORAGE_KEY = 'vip-lao-dark-mode'

// สร้าง state แบบ global เพื่อให้ทุก component ใช้ร่วมกัน
const isDark = ref(false)

// Initialize ทันทีตอน import
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved !== null) {
    isDark.value = saved === 'true'
  } else {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  // Apply ทันที
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  }
}

export const useDarkMode = () => {
  /**
   * Apply dark mode class ให้กับ html element
   */
  const applyDarkMode = () => {
    if (typeof document === 'undefined') return

    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  /**
   * สลับ dark mode
   */
  const toggleDarkMode = () => {
    isDark.value = !isDark.value
    applyDarkMode()

    // บันทึกลง localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(isDark.value))
    }
  }

  /**
   * เปิด dark mode
   */
  const enableDarkMode = () => {
    isDark.value = true
    applyDarkMode()

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'true')
    }
  }

  /**
   * ปิด dark mode
   */
  const disableDarkMode = () => {
    isDark.value = false
    applyDarkMode()

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'false')
    }
  }

  return {
    isDark,
    toggleDarkMode,
    enableDarkMode,
    disableDarkMode,
  }
}
