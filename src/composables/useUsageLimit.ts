import { ref, computed } from 'vue'
import { useAuth } from './useAuth'
import { useSubscription } from './useSubscription'

/**
 * ระบบจำกัดการใช้งาน AI Prediction
 * - Free users: 30 ครั้ง/วัน
 * - VIP users: ไม่จำกัด
 */

const STORAGE_KEY = 'ai_predict_usage'
const FREE_DAILY_LIMIT = 30

interface UsageRecord {
  date: string // YYYY-MM-DD
  count: number
}

export const useUsageLimit = () => {
  const { user } = useAuth()
  const { isVIP } = useSubscription()

  const usageData = ref<UsageRecord | null>(null)
  const loading = ref(false)

  // โหลดข้อมูลการใช้งานจาก localStorage
  const loadUsage = () => {
    const today = new Date().toISOString().split('T')[0]
    const stored = localStorage.getItem(STORAGE_KEY)

    if (stored) {
      const data: UsageRecord = JSON.parse(stored)

      // ถ้าเป็นวันใหม่ ให้ reset
      if (data.date !== today) {
        usageData.value = { date: today, count: 0 }
        saveUsage()
      } else {
        usageData.value = data
      }
    } else {
      usageData.value = { date: today, count: 0 }
      saveUsage()
    }
  }

  // บันทึกข้อมูลการใช้งาน
  const saveUsage = () => {
    if (usageData.value) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(usageData.value))
    }
  }

  // จำนวนครั้งที่เหลือ
  const remainingUses = computed(() => {
    if (isVIP.value) return Infinity
    if (!usageData.value) return FREE_DAILY_LIMIT
    return Math.max(0, FREE_DAILY_LIMIT - usageData.value.count)
  })

  // เช็คว่ายังใช้งานได้หรือไม่
  const canUse = computed(() => {
    if (isVIP.value) return true
    return remainingUses.value > 0
  })

  // เปอร์เซ็นต์การใช้งาน (สำหรับ progress bar)
  const usagePercentage = computed(() => {
    if (isVIP.value) return 0
    if (!usageData.value) return 0
    return Math.min(100, (usageData.value.count / FREE_DAILY_LIMIT) * 100)
  })

  // ข้อความแสดงสถานะ
  const usageText = computed(() => {
    if (isVIP.value) return '♾️ ไม่จำกัด'
    if (!usageData.value) return `0/${FREE_DAILY_LIMIT}`
    return `${usageData.value.count}/${FREE_DAILY_LIMIT}`
  })

  // ใช้งาน 1 ครั้ง
  const useOnce = async (): Promise<boolean> => {
    // VIP ใช้ได้เสมอ
    if (isVIP.value) return true

    // โหลดข้อมูลล่าสุด
    loadUsage()

    // เช็คว่ายังใช้งานได้หรือไม่
    if (!canUse.value) {
      return false
    }

    // เพิ่มจำนวนการใช้งาน
    if (usageData.value) {
      usageData.value.count++
      saveUsage()
    }

    return true
  }

  // Reset การใช้งาน (สำหรับ admin)
  const resetUsage = () => {
    const today = new Date().toISOString().split('T')[0]
    usageData.value = { date: today, count: 0 }
    saveUsage()
  }

  // เวลาที่จะ reset (เที่ยงคืน)
  const resetTime = computed(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    return tomorrow
  })

  // เวลาที่เหลือจนกว่าจะ reset
  const timeUntilReset = computed(() => {
    const now = new Date()
    const diff = resetTime.value.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours} ชั่วโมง ${minutes} นาที`
  })

  // โหลดข้อมูลเมื่อเริ่มใช้งาน
  loadUsage()

  return {
    usageData,
    loading,
    remainingUses,
    canUse,
    usagePercentage,
    usageText,
    useOnce,
    resetUsage,
    timeUntilReset,
    isVIP
  }
}
