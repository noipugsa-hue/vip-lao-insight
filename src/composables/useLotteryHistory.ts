import { ref } from 'vue'

/**
 * ข้อมูลผลหวยรัฐบาลจาก glo.or.th
 */
export interface LotteryResult {
  date: string // วันที่ออกรางวัล
  period: string // งวดที่
  first: string // รางวัลที่ 1 (6 หลัก)
  firstNear: string[] // รางวัลใกล้เคียงรางวัลที่ 1
  second: string[] // รางวัลที่ 2
  third: string[] // รางวัลที่ 3
  fourth: string[] // รางวัลที่ 4
  fifth: string[] // รางวัลที่ 5
  runningNumberFront: string[] // เลขหน้า 3 ตัว
  runningNumberBack: string[] // เลขท้าย 3 ตัว
  runningNumberBack2: string[] // เลขท้าย 2 ตัว
}

export const useLotteryHistory = () => {
  const results = ref<LotteryResult[]>([])
  const currentResult = ref<LotteryResult | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * ดึงผลหวยงวดล่าสุด
   */
  const fetchLatestResult = async () => {
    try {
      loading.value = true
      error.value = null

      const response = await fetch('/api/lottery/glo')
      const data = await response.json()

      if (data.success && data.data) {
        currentResult.value = data.data
        return data.data
      } else {
        error.value = data.error || 'ไม่สามารถดึงข้อมูลได้'
        return null
      }
    } catch (err: any) {
      error.value = err.message || 'เกิดข้อผิดพลาด'
      console.error('Error fetching latest result:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * ดึงผลหวยตามวันที่
   * @param id ID ในรูปแบบ DDMMYYYY เช่น 16042569 (16/04/2569 พ.ศ.)
   */
  const fetchResultByDate = async (id: string) => {
    try {
      loading.value = true
      error.value = null

      const response = await fetch(`/api/lottery/glo?id=${encodeURIComponent(id)}`)
      const data = await response.json()

      if (data.success && data.data) {
        return data.data
      } else {
        error.value = data.error || 'ไม่พบข้อมูลหวยงวดนี้'
        return null
      }
    } catch (err: any) {
      error.value = err.message || 'เกิดข้อผิดพลาด'
      console.error('Error fetching result by date:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * ดึงผลหวยล่าสุด (Rayriffy API รองรับแค่งวดล่าสุด)
   * @param count ไม่ใช้แล้ว - เก็บไว้เพื่อความเข้ากันได้
   */
  const fetchMultipleResults = async (count: number = 10) => {
    try {
      loading.value = true
      error.value = null
      results.value = []

      // ดึงงวดล่าสุด (API รองรับแค่ latest เท่านั้น)
      const latest = await fetchLatestResult()
      if (latest) {
        results.value = [latest]
        return [latest]
      }

      return []

    } catch (err: any) {
      error.value = err.message || 'เกิดข้อผิดพลาด'
      console.error('Error fetching results:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * ตรวจสอบว่าเลขถูกรางวัลหรือไม่
   */
  const checkNumber = (number: string, result: LotteryResult) => {
    const prizes: { name: string, amount: number }[] = []

    // รางวัลที่ 1
    if (result.first === number) {
      prizes.push({ name: 'รางวัลที่ 1', amount: 6000000 })
    }

    // รางวัลใกล้เคียงรางวัลที่ 1
    if (result.firstNear.includes(number)) {
      prizes.push({ name: 'รางวัลใกล้เคียงรางวัลที่ 1', amount: 100000 })
    }

    // รางวัลที่ 2
    if (result.second.includes(number)) {
      prizes.push({ name: 'รางวัลที่ 2', amount: 200000 })
    }

    // รางวัลที่ 3
    if (result.third.includes(number)) {
      prizes.push({ name: 'รางวัลที่ 3', amount: 80000 })
    }

    // รางวัลที่ 4
    if (result.fourth.includes(number)) {
      prizes.push({ name: 'รางวัลที่ 4', amount: 40000 })
    }

    // รางวัลที่ 5
    if (result.fifth.includes(number)) {
      prizes.push({ name: 'รางวัลที่ 5', amount: 20000 })
    }

    // เลขหน้า 3 ตัว
    const front3 = number.substring(0, 3)
    if (result.runningNumberFront.includes(front3)) {
      prizes.push({ name: 'เลขหน้า 3 ตัว', amount: 4000 })
    }

    // เลขท้าย 3 ตัว
    const back3 = number.substring(number.length - 3)
    if (result.runningNumberBack.includes(back3)) {
      prizes.push({ name: 'เลขท้าย 3 ตัว', amount: 4000 })
    }

    // เลขท้าย 2 ตัว
    const back2 = number.substring(number.length - 2)
    if (result.runningNumberBack2.includes(back2)) {
      prizes.push({ name: 'เลขท้าย 2 ตัว', amount: 2000 })
    }

    return prizes
  }

  return {
    results,
    currentResult,
    loading,
    error,
    fetchLatestResult,
    fetchResultByDate,
    fetchMultipleResults,
    checkNumber
  }
}
