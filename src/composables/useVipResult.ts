// ~/composables/useVipResult.ts
import { ref } from 'vue'

const STORAGE_KEY = 'vip_result'

// Reactive state ของเลข VIP
const hotNumbers = ref<string[]>([])
const twoDigits = ref<string[]>([])
const threeDigits = ref<string[]>([])
const calculatedAt = ref<string | null>(null)
const lotteryType = ref<string | null>(null)

export const useVipResult = () => {
  /**
   * setResult
   * อัปเดตเลข VIP และเวลาคำนวณล่าสุด
   */
  const setResult = (hot: string[], two: string[], three: string[], lottery?: string) => {
    hotNumbers.value = hot
    twoDigits.value = two
    threeDigits.value = three
    lotteryType.value = lottery || null
    calculatedAt.value = new Date().toLocaleString('th-TH', {
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })

    // เก็บลง localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      hot,
      two,
      three,
      lotteryType: lottery || null,
      calculatedAt: calculatedAt.value
    }))
  }

  /**
   * loadResult
   * โหลดเลข VIP จาก localStorage (กรองตามประเภทหวย)
   */
  const loadResult = (lottery?: string) => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        // ถ้าระบุประเภทหวย ให้ตรวจสอบว่าตรงกันไหม
        if (lottery && data.lotteryType !== lottery) {
          // ถ้าไม่ตรงกัน ให้ล้างข้อมูล
          clearResult()
          return
        }
        hotNumbers.value = data.hot || []
        twoDigits.value = data.two || []
        threeDigits.value = data.three || []
        lotteryType.value = data.lotteryType || null
        calculatedAt.value = data.calculatedAt || null
      } catch (e) {
        console.error('Failed to load VIP result', e)
      }
    }
  }

  /**
   * clearResult
   * ล้างเลข VIP ทั้งหมด
   */
  const clearResult = () => {
    hotNumbers.value = []
    twoDigits.value = []
    threeDigits.value = []
    lotteryType.value = null
    calculatedAt.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    hotNumbers,
    twoDigits,
    threeDigits,
    lotteryType,
    calculatedAt,
    setResult,
    loadResult,
    clearResult,
  }
}