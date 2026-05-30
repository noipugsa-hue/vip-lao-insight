import { ref } from 'vue'

/**
 * ข้อมูลผลหวยรัฐบาลจาก glo.or.th
 */
export interface GovernmentLotteryResult {
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
  const results = ref<GovernmentLotteryResult[]>([])
  const currentResult = ref<GovernmentLotteryResult | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * บันทึกงวดหวยลง Firestore
   */
  const saveResultToFirestore = async (result: GovernmentLotteryResult) => {
    if (import.meta.client) {
      try {
        const { $db } = useNuxtApp()
        const { collection, doc, setDoc } = await import('firebase/firestore')

        // ใช้ period เป็น document ID
        const docRef = doc(collection($db, 'governmentLottery'), result.period)
        await setDoc(docRef, {
          ...result,
          createdAt: new Date().toISOString()
        })

        console.log('Saved lottery result to Firestore:', result.period)
      } catch (err) {
        console.error('Error saving to Firestore:', err)
      }
    }
  }

  /**
   * ดึงรายการงวดย้อนหลังจาก Firestore
   * Note: ไม่บังคับต้องมีข้อมูลจาก Firestore - ถ้าล้มเหลวจะใช้ API แทน
   */
  const fetchResultsFromFirestore = async (limit: number = 10) => {
    if (import.meta.client) {
      try {
        const { $db } = useNuxtApp()
        const { collection, getDocs } = await import('firebase/firestore')

        // ใช้ getDocs แบบง่าย ไม่ใช้ orderBy เพื่อหลีกเลี่ยง permission issue
        const collectionRef = collection($db, 'governmentLottery')
        const querySnapshot = await getDocs(collectionRef)

        const savedResults: GovernmentLotteryResult[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          savedResults.push({
            date: data.date,
            period: data.period,
            first: data.first,
            firstNear: data.firstNear || [],
            second: data.second || [],
            third: data.third || [],
            fourth: data.fourth || [],
            fifth: data.fifth || [],
            runningNumberFront: data.runningNumberFront || [],
            runningNumberBack: data.runningNumberBack || [],
            runningNumberBack2: data.runningNumberBack2 || []
          })
        })

        // เรียงลำดับใน client-side
        savedResults.sort((a, b) => b.period.localeCompare(a.period))

        // จำกัดจำนวน
        const limitedResults = savedResults.slice(0, limit)

        if (limitedResults.length > 0) {
          console.log(`✅ Loaded ${limitedResults.length} results from Firestore`)
        }

        return limitedResults
      } catch (err: any) {
        // Silent fail - ใช้ API fallback
        // ไม่แสดง warning เพื่อไม่รบกวนผู้ใช้
        return []
      }
    }
    return []
  }

  /**
   * ดึงผลหวยงวดล่าสุด
   */
  const fetchLatestResult = async () => {
    try {
      loading.value = true
      error.value = null

      console.log('🔄 Fetching latest lottery result from /api/lottery/glo')
      const response = await fetch('/api/lottery/glo')

      if (!response.ok) {
        console.error('❌ API response not ok:', response.status, response.statusText)
        error.value = `API Error: ${response.status}`
        return null
      }

      const data = await response.json()
      console.log('📦 API Response:', data)

      if (data.success && data.data) {
        console.log('✅ Latest result fetched successfully:', data.data.period)
        currentResult.value = data.data

        // บันทึกลง Firestore
        await saveResultToFirestore(data.data)

        return data.data
      } else {
        console.warn('⚠️ API returned success:false or no data:', data)
        error.value = data.error || data.message || 'ไม่สามารถดึงข้อมูลได้'
        return null
      }
    } catch (err: any) {
      error.value = err.message || 'เกิดข้อผิดพลาด'
      console.error('❌ Error fetching latest result:', err)
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
   * ดึงผลหวยหลายงวด (รวมงวดล่าสุด + ย้อนหลังจาก Firestore)
   */
  const fetchMultipleResults = async (count: number = 10) => {
    try {
      loading.value = true
      error.value = null
      results.value = []

      console.log(`📋 Fetching multiple results (count: ${count})`)

      // ดึงงวดล่าสุดจาก API
      const latest = await fetchLatestResult()
      console.log('📊 Latest result:', latest ? `Period ${latest.period}` : 'null')

      // ดึงงวดย้อนหลังจาก Firestore
      const savedResults = await fetchResultsFromFirestore(count)
      console.log(`💾 Firestore results count: ${savedResults.length}`)

      // รวมผลลัพธ์ (ไม่ซ้ำกัน)
      const allResults: GovernmentLotteryResult[] = []
      const periodSet = new Set<string>()

      // เพิ่มงวดล่าสุดก่อน
      if (latest) {
        allResults.push(latest)
        periodSet.add(latest.period)
      }

      // เพิ่มงวดย้อนหลัง (ไม่ซ้ำ)
      for (const result of savedResults) {
        if (!periodSet.has(result.period)) {
          allResults.push(result)
          periodSet.add(result.period)
        }
      }

      console.log(`✅ Total unique results: ${allResults.length}`)
      results.value = allResults

      if (allResults.length === 0) {
        error.value = 'ไม่พบข้อมูลหวย - กรุณาลองใหม่อีกครั้ง'
        console.warn('⚠️ No results found!')
      }

      return allResults

    } catch (err: any) {
      error.value = err.message || 'เกิดข้อผิดพลาด'
      console.error('❌ Error fetching multiple results:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * ตรวจสอบว่าเลขถูกรางวัลหรือไม่
   */
  const checkNumber = (number: string, result: GovernmentLotteryResult) => {
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
    fetchResultsFromFirestore,
    saveResultToFirestore,
    checkNumber
  }
}
