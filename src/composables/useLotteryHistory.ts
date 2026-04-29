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
   * @param date วันที่ในรูปแบบ DD/MM/YYYY เช่น 16/04/2025
   */
  const fetchResultByDate = async (date: string) => {
    try {
      loading.value = true
      error.value = null

      const response = await fetch(`/api/lottery/glo?date=${encodeURIComponent(date)}`)
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
   * ดึงผลหวยย้อนหลังหลายงวด
   * @param count จำนวนงวดที่ต้องการดึง (default: 10)
   */
  const fetchMultipleResults = async (count: number = 10) => {
    try {
      loading.value = true
      error.value = null
      results.value = []

      // วันนี้
      const today = new Date()
      const fetchedResults: LotteryResult[] = []

      // ดึงงวดล่าสุดก่อน
      const latest = await fetchLatestResult()
      if (latest) {
        fetchedResults.push(latest)
      }

      // หวยออกวันที่ 1 และ 16 ของทุกเดือน
      // ดึงย้อนหลังตามจำนวนที่ต้องการ
      let currentDate = new Date(today)
      let fetched = fetchedResults.length

      while (fetched < count && currentDate.getFullYear() > 2020) {
        // ถ้าวันนี้เกิน 16 ให้ลองวันที่ 16
        // ถ้าวันนี้ระหว่าง 2-16 ให้ลองวันที่ 1
        // ถ้าวันนี้วันที่ 1 ให้ลองวันที่ 16 เดือนก่อน
        const day = currentDate.getDate()

        let checkDate: Date
        if (day >= 16) {
          checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 16)
        } else if (day >= 1) {
          checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        } else {
          // ถอยไปเดือนก่อน วันที่ 16
          checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 16)
        }

        const dateStr = `${String(checkDate.getDate()).padStart(2, '0')}/${String(checkDate.getMonth() + 1).padStart(2, '0')}/${checkDate.getFullYear()}`

        // เช็คว่าได้ดึงวันนี้ไปแล้วหรือยัง
        const alreadyFetched = fetchedResults.find(r => r.date === dateStr)
        if (!alreadyFetched) {
          const result = await fetchResultByDate(dateStr)
          if (result) {
            fetchedResults.push(result)
            fetched++
          }
        }

        // ถอยหลังไปงวดก่อนหน้า
        if (checkDate.getDate() === 16) {
          currentDate = new Date(checkDate.getFullYear(), checkDate.getMonth(), 1)
        } else {
          currentDate = new Date(checkDate.getFullYear(), checkDate.getMonth() - 1, 16)
        }

        // เพิ่ม delay เล็กน้อยเพื่อไม่ให้โหลด API มากเกินไป
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      results.value = fetchedResults
      return fetchedResults

    } catch (err: any) {
      error.value = err.message || 'เกิดข้อผิดพลาด'
      console.error('Error fetching multiple results:', err)
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
