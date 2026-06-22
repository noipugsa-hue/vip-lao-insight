/**
 * useDarkMode
 * Composable สำหรับจัดการ Dark Mode พร้อมฟีเจอร์ขั้นสูง
 * - Auto dark mode ตามเวลา (6PM-6AM)
 * - AMOLED black theme
 * - Custom accent colors
 */

import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'vip-lao-dark-mode'
const STORAGE_KEY_AUTO = 'vip-lao-dark-mode-auto'
const STORAGE_KEY_AMOLED = 'vip-lao-dark-mode-amoled'
const STORAGE_KEY_ACCENT = 'vip-lao-dark-mode-accent'
const STORAGE_KEY_AUTO_START = 'vip-lao-dark-mode-auto-start'
const STORAGE_KEY_AUTO_END = 'vip-lao-dark-mode-auto-end'

// Available accent colors
export const accentColors = [
  { id: 'purple', name: 'ม่วง', class: 'accent-purple', hex: '#9333ea' },
  { id: 'blue', name: 'น้ำเงิน', class: 'accent-blue', hex: '#3b82f6' },
  { id: 'green', name: 'เขียว', class: 'accent-green', hex: '#10b981' },
  { id: 'pink', name: 'ชมพู', class: 'accent-pink', hex: '#ec4899' },
  { id: 'orange', name: 'ส้ม', class: 'accent-orange', hex: '#f97316' },
  { id: 'red', name: 'แดง', class: 'accent-red', hex: '#ef4444' },
  { id: 'yellow', name: 'เหลือง', class: 'accent-yellow', hex: '#eab308' },
  { id: 'cyan', name: 'ฟ้า', class: 'accent-cyan', hex: '#06b6d4' },
]

// สร้าง state แบบ global เพื่อให้ทุก component ใช้ร่วมกัน
const isDark = ref(false)
const isAutoMode = ref(false)
const isAmoledMode = ref(false)
const accentColor = ref(accentColors[0].id) // default: purple
const autoStartHour = ref(18) // 6PM
const autoEndHour = ref(6) // 6AM

let autoModeInterval: NodeJS.Timeout | null = null

// Initialize ทันทีตอน import
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem(STORAGE_KEY)
  const savedAuto = localStorage.getItem(STORAGE_KEY_AUTO)
  const savedAmoled = localStorage.getItem(STORAGE_KEY_AMOLED)
  const savedAccent = localStorage.getItem(STORAGE_KEY_ACCENT)
  const savedAutoStart = localStorage.getItem(STORAGE_KEY_AUTO_START)
  const savedAutoEnd = localStorage.getItem(STORAGE_KEY_AUTO_END)

  // Load settings
  isAutoMode.value = savedAuto === 'true'
  isAmoledMode.value = savedAmoled === 'true'
  if (savedAccent && accentColors.find(c => c.id === savedAccent)) {
    accentColor.value = savedAccent
  }
  if (savedAutoStart) {
    autoStartHour.value = parseInt(savedAutoStart, 10)
  }
  if (savedAutoEnd) {
    autoEndHour.value = parseInt(savedAutoEnd, 10)
  }

  // Check auto mode
  if (isAutoMode.value) {
    const shouldBeDark = checkAutoMode()
    isDark.value = shouldBeDark
  } else if (saved !== null) {
    isDark.value = saved === 'true'
  } else {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  // Apply ทันที
  applyTheme()
}

/**
 * Check if current time is within auto dark mode range
 */
function checkAutoMode(): boolean {
  const now = new Date()
  const currentHour = now.getHours()

  // Handle overnight period (e.g., 18:00 - 06:00)
  if (autoStartHour.value > autoEndHour.value) {
    return currentHour >= autoStartHour.value || currentHour < autoEndHour.value
  }
  // Handle same-day period (e.g., 09:00 - 17:00)
  return currentHour >= autoStartHour.value && currentHour < autoEndHour.value
}

/**
 * Apply theme to document
 */
function applyTheme() {
  if (typeof document === 'undefined') return

  // Apply dark mode
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }

  // Apply AMOLED mode
  if (isAmoledMode.value && isDark.value) {
    document.documentElement.classList.add('amoled')
  } else {
    document.documentElement.classList.remove('amoled')
  }

  // Apply accent color
  document.documentElement.setAttribute('data-accent', accentColor.value)
}

/**
 * Start auto mode interval check
 */
function startAutoModeInterval() {
  if (autoModeInterval) {
    clearInterval(autoModeInterval)
  }

  // Check every minute
  autoModeInterval = setInterval(() => {
    if (isAutoMode.value) {
      const shouldBeDark = checkAutoMode()
      if (isDark.value !== shouldBeDark) {
        isDark.value = shouldBeDark
        applyTheme()
      }
    }
  }, 60000) // 60 seconds
}

/**
 * Stop auto mode interval
 */
function stopAutoModeInterval() {
  if (autoModeInterval) {
    clearInterval(autoModeInterval)
    autoModeInterval = null
  }
}

export const useDarkMode = () => {
  /**
   * Apply dark mode class ให้กับ html element
   */
  const applyDarkMode = () => {
    applyTheme()
  }

  /**
   * สลับ dark mode
   */
  const toggleDarkMode = () => {
    // ถ้าเปิด auto mode อยู่ ให้ปิดก่อน
    if (isAutoMode.value) {
      isAutoMode.value = false
      stopAutoModeInterval()
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_AUTO, 'false')
      }
    }

    isDark.value = !isDark.value
    applyTheme()

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
    applyTheme()

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'true')
    }
  }

  /**
   * ปิด dark mode
   */
  const disableDarkMode = () => {
    isDark.value = false
    applyTheme()

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'false')
    }
  }

  /**
   * เปิด/ปิด auto dark mode
   */
  const toggleAutoMode = () => {
    isAutoMode.value = !isAutoMode.value

    if (isAutoMode.value) {
      // เมื่อเปิด auto mode ให้ check ทันที
      isDark.value = checkAutoMode()
      startAutoModeInterval()
    } else {
      stopAutoModeInterval()
    }

    applyTheme()

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_AUTO, String(isAutoMode.value))
      localStorage.setItem(STORAGE_KEY, String(isDark.value))
    }
  }

  /**
   * ตั้งเวลา auto mode
   */
  const setAutoModeSchedule = (startHour: number, endHour: number) => {
    if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
      console.error('Invalid hour range (0-23)')
      return false
    }

    autoStartHour.value = startHour
    autoEndHour.value = endHour

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_AUTO_START, String(startHour))
      localStorage.setItem(STORAGE_KEY_AUTO_END, String(endHour))
    }

    // ถ้า auto mode เปิดอยู่ ให้ check ใหม่
    if (isAutoMode.value) {
      isDark.value = checkAutoMode()
      applyTheme()
    }

    return true
  }

  /**
   * เปิด/ปิด AMOLED mode
   */
  const toggleAmoledMode = () => {
    isAmoledMode.value = !isAmoledMode.value
    applyTheme()

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_AMOLED, String(isAmoledMode.value))
    }
  }

  /**
   * เปลี่ยน accent color
   */
  const setAccentColor = (colorId: string) => {
    const color = accentColors.find(c => c.id === colorId)
    if (!color) {
      console.error('Invalid accent color:', colorId)
      return false
    }

    accentColor.value = colorId
    applyTheme()

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_ACCENT, colorId)
    }

    return true
  }

  /**
   * Get current accent color object
   */
  const currentAccentColor = computed(() => {
    return accentColors.find(c => c.id === accentColor.value) || accentColors[0]
  })

  /**
   * Get auto mode status text
   */
  const autoModeStatus = computed(() => {
    if (!isAutoMode.value) return 'ปิด'

    const start = autoStartHour.value.toString().padStart(2, '0') + ':00'
    const end = autoEndHour.value.toString().padStart(2, '0') + ':00'
    const isCurrentlyDark = checkAutoMode()

    return `${start} - ${end} ${isCurrentlyDark ? '(เปิดอยู่)' : '(ปิดอยู่)'}`
  })

  // Start auto mode interval if enabled
  if (isAutoMode.value && typeof window !== 'undefined') {
    startAutoModeInterval()
  }

  return {
    // State
    isDark,
    isAutoMode,
    isAmoledMode,
    accentColor,
    autoStartHour,
    autoEndHour,

    // Computed
    currentAccentColor,
    autoModeStatus,

    // Basic methods
    toggleDarkMode,
    enableDarkMode,
    disableDarkMode,
    applyDarkMode,

    // Advanced methods
    toggleAutoMode,
    setAutoModeSchedule,
    toggleAmoledMode,
    setAccentColor,

    // Constants
    accentColors,
  }
}
